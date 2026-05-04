import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { parkingService } from '../../services/parkingService';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const SORT_OPTIONS = [
  { key: 'distance', label: 'Distance', icon: 'navigate' },
  { key: 'price', label: 'Prix', icon: 'cash' },
  { key: 'rating', label: 'Note', icon: 'star' },
  { key: 'availability', label: 'Places', icon: 'car' },
];

const ParkingScreen = ({ navigation }) => {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const searchTimeout = useRef(null);
  const [viewMode, setViewMode] = useState('map');
  const [parkings, setParkings] = useState([]);
  const [featuredParkings, setFeaturedParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [userLocation, setUserLocation] = useState({
    latitude: 34.0084,
    longitude: -6.8539,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Normaliser les données parking de l'API
  const normalizeParking = useCallback((p) => ({
    id: p._id,
    name: p.name,
    address: typeof p.address === 'object' ? [p.address?.street, p.address?.city].filter(Boolean).join(', ') : (p.address || ''),
    latitude: p.location?.coordinates?.[1] || 0,
    longitude: p.location?.coordinates?.[0] || 0,
    totalSpots: p.availability?.total || p.capacity || 0,
    availableSpots: p.availability?.available ?? p.availableSpots ?? 0,
    pricePerHour: p.pricing?.hourly || p.pricePerHour || 0,
    distance: p.distance || null,
    rating: p.statistics?.averageRating || p.rating || 0,
    isOpen: p.isOpen !== undefined ? p.isOpen : true,
    isFeatured: p.isFeatured || false,
    spotTypes: p.spotTypes || [],
    city: p.city,
    _raw: p,
  }), []);

  const loadParkings = useCallback(async (coords) => {
    try {
      const [parkingsRes, featuredRes] = await Promise.allSettled([
        parkingService.getParkings({
          city: user?.preferences?.defaultCity || 'rabat',
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          sortBy,
          limit: 20,
        }),
        parkingService.getFeaturedParkings(),
      ]);

      if (parkingsRes.status === 'fulfilled' && parkingsRes.value.success) {
        const raw = parkingsRes.value.data?.data || [];
        setParkings(raw.map(normalizeParking));
      }
      if (featuredRes.status === 'fulfilled' && featuredRes.value.success) {
        const raw = featuredRes.value.data?.data || [];
        setFeaturedParkings(raw.map(normalizeParking));
      }
    } catch (error) {
      console.log('Erreur chargement parkings:', error);
    } finally {
      setLoading(false);
    }
  }, [user, sortBy, normalizeParking]);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    loadParkings(userLocation);
  }, [sortBy]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        loadParkings(userLocation);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        ...userLocation,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      loadParkings(coords);
    } catch (error) {
      console.log('Erreur localisation:', error);
      loadParkings(userLocation);
    }
  };

  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await parkingService.searchParkings(text);
          if (res.success) {
            setParkings((res.data?.data || []).map(normalizeParking));
          }
        } catch (e) {
          console.log('Erreur recherche:', e);
        }
      }, 500);
    } else if (text.length === 0) {
      loadParkings(userLocation);
    }
  }, [userLocation, normalizeParking, loadParkings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParkings(userLocation);
    setRefreshing(false);
  };

  const getAvailabilityColor = (available, total) => {
    const ratio = available / total;
    if (ratio > 0.3) return COLORS.parkingFree;
    if (ratio > 0.1) return COLORS.parkingReserved;
    return COLORS.parkingOccupied;
  };

  const handleParkingPress = (parking) => {
    setSelectedParking(parking);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: parking.latitude,
        longitude: parking.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleNavigateToParking = (parking) => {
    navigation.navigate('ParkingDetail', { parkingId: parking.id, parking: parking._raw || parking });
  };

  const filteredParkings = searchQuery.length > 0
    ? parkings.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : parkings;

  const formatDistance = (meters) => {
    if (!meters) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderParkingMarker = (parking) => (
    <Marker
      key={parking.id}
      coordinate={{
        latitude: parking.latitude,
        longitude: parking.longitude,
      }}
      onPress={() => handleParkingPress(parking)}
    >
      <View style={[
        styles.markerContainer,
        selectedParking?.id === parking.id && styles.markerSelected
      ]}>
        <View style={[
          styles.markerDot,
          { backgroundColor: getAvailabilityColor(parking.availableSpots, parking.totalSpots) }
        ]} />
        <Text style={styles.markerText}>{parking.availableSpots}</Text>
      </View>
    </Marker>
  );

  const renderParkingCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.parkingCard,
        selectedParking?.id === item.id && styles.parkingCardSelected
      ]}
      onPress={() => handleParkingPress(item)}
    >
      <View style={styles.parkingCardHeader}>
        <View style={styles.parkingInfo}>
          <Text style={styles.parkingName}>{item.name}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray} />
            <Text style={styles.parkingAddress}>{item.address}</Text>
          </View>
        </View>
        <View style={[
          styles.availabilityBadge,
          { backgroundColor: getAvailabilityColor(item.availableSpots, item.totalSpots) + '20' }
        ]}>
          <Text style={[
            styles.availabilityText,
            { color: getAvailabilityColor(item.availableSpots, item.totalSpots) }
          ]}>
            {item.availableSpots} places
          </Text>
        </View>
      </View>

      <View style={styles.parkingCardFooter}>
        <View style={styles.parkingStats}>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={16} color={COLORS.gray} />
            <Text style={styles.statText}>{item.pricePerHour} DH/h</Text>
          </View>
          {item.distance ? (
            <View style={styles.statItem}>
              <Ionicons name="walk-outline" size={16} color={COLORS.gray} />
              <Text style={styles.statText}>{formatDistance(item.distance)}</Text>
            </View>
          ) : null}
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color={COLORS.warning} />
            <Text style={styles.statText}>{item.rating}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.reserveButton,
            item.availableSpots === 0 && styles.reserveButtonDisabled
          ]}
          onPress={() => handleNavigateToParking(item)}
          disabled={item.availableSpots === 0}
        >
          <Text style={[
            styles.reserveButtonText,
            item.availableSpots === 0 && styles.reserveButtonTextDisabled
          ]}>
            {item.availableSpots === 0 ? 'Complet' : 'Réserver'}
          </Text>
          {item.availableSpots > 0 && (
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Parkings</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons 
              name="map" 
              size={20} 
              color={viewMode === 'map' ? COLORS.white : COLORS.gray} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={viewMode === 'list' ? COLORS.white : COLORS.gray} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un parking..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); loadParkings(userLocation); }}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
        {/* Sort Options */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.sortChip, sortBy === option.key && styles.sortChipActive]}
              onPress={() => setSortBy(option.key)}
            >
              <Ionicons 
                name={option.icon} 
                size={14} 
                color={sortBy === option.key ? COLORS.white : COLORS.gray} 
              />
              <Text style={[styles.sortChipText, sortBy === option.key && styles.sortChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Recherche de parkings...</Text>
        </View>
      ) : viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={userLocation}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {filteredParkings.map(renderParkingMarker)}
          </MapView>

          {/* Location Button */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => {
              mapRef.current?.animateToRegion(userLocation, 500);
            }}
          >
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Bottom Sheet with parking list */}
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>
              {filteredParkings.length} parkings trouvés
            </Text>
            <FlatList
              data={filteredParkings}
              renderItem={renderParkingCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredParkings}
          renderItem={renderParkingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>Aucun parking trouvé</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  title: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusMd,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusSm,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  searchContainer: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md,
    height: 48,
    ...SHADOWS.light,
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZES.sm,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  sortRow: {
    flexDirection: 'row',
    marginTop: SIZES.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    marginRight: SIZES.xs,
    ...SHADOWS.light,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: SIZES.fontXs,
    color: COLORS.gray,
    marginLeft: 4,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: SIZES.xxl * 2,
  },
  emptyText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  markerSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  markerText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  locationButton: {
    position: 'absolute',
    right: SIZES.lg,
    top: SIZES.lg,
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.lg,
    ...SHADOWS.dark,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.grayLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SIZES.md,
  },
  bottomSheetTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
  },
  horizontalList: {
    paddingHorizontal: SIZES.lg,
  },
  listContainer: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  parkingCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginRight: SIZES.md,
    marginBottom: SIZES.md,
    width: width * 0.8,
    ...SHADOWS.light,
  },
  parkingCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  parkingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  parkingInfo: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  parkingName: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  parkingAddress: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  availabilityBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSm,
    alignSelf: 'flex-start',
  },
  availabilityText: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
  },
  parkingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parkingStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  statText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
  },
  reserveButtonDisabled: {
    backgroundColor: COLORS.grayLight,
  },
  reserveButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    marginRight: 4,
  },
  reserveButtonTextDisabled: {
    color: COLORS.gray,
  },
});

export default ParkingScreen;

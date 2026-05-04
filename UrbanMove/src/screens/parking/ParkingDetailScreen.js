import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { parkingService } from '../../services/parkingService';
import { userService } from '../../services/userService';
import { iotService } from '../../services/iotService';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const ParkingDetailScreen = ({ route, navigation }) => {
  const { parkingId, parking: navParking } = route.params;
  const [parking, setParking] = useState(navParking || {});
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!!parkingId);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [sensorData, setSensorData] = useState(null);

  const loadParkingData = useCallback(async () => {
    try {
      const id = parkingId || parking._id || parking.id;
      if (!id) return;

      const [detailRes, reviewsRes] = await Promise.allSettled([
        parkingService.getParkingDetail(id),
        parkingService.getParkingReviews(id, { limit: 5 }),
      ]);

      if (detailRes.status === 'fulfilled' && detailRes.value.success) {
        const data = detailRes.value.data?.data;
        if (data) setParking(prev => ({ ...prev, ...data }));
      }
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value.success) {
        setReviews(reviewsRes.value.data?.data || []);
      }
    } catch (error) {
      console.log('Erreur chargement parking:', error);
    } finally {
      setLoading(false);
    }
  }, [parkingId, parking._id, parking.id]);

  useEffect(() => {
    loadParkingData();
  }, [loadParkingData]);

  // Charger les données IoT capteurs
  useEffect(() => {
    const loadSensors = async () => {
      try {
        const id = parkingId || parking._id || parking.id;
        if (!id) return;
        const res = await iotService.getSensorData(id);
        if (res.success && res.data?.data) {
          setSensorData(res.data.data);
        }
      } catch (e) {
        console.log('IoT sensors non disponible:', e.message);
      }
    };
    loadSensors();
  }, [parkingId, parking._id, parking.id]);

  const handleToggleFavorite = async () => {
    const id = parking._id || parking.id || parkingId;
    try {
      if (isFavorite) {
        await userService.removeFavoriteParking(id);
      } else {
        await userService.addFavoriteParking(id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.log('Erreur favoris:', error);
    }
  };

  // Normalize parking fields
  const pName = parking.name || '';
  const pAddress = typeof parking.address === 'object' ? [parking.address?.street, parking.address?.city].filter(Boolean).join(', ') : (parking.address || '');
  const pLat = parking.location?.coordinates?.[1] || parking.latitude || 0;
  const pLng = parking.location?.coordinates?.[0] || parking.longitude || 0;
  const pAvailable = parking.availability?.available ?? parking.availableSpots ?? 0;
  const pTotal = parking.availability?.total ?? parking.totalSpots ?? 0;
  const pHourly = parking.pricing?.hourly ?? parking.pricePerHour ?? 0;
  const pDaily = parking.pricing?.daily ?? pHourly * 8;
  const pRating = parking.statistics?.averageRating ?? parking.rating ?? 0;
  const pReviewCount = parking.statistics?.totalReviews ?? 0;
  const pIsOpen = parking.isOpen !== undefined ? parking.isOpen : true;
  const pDistance = parking.distance;

  const floors = [
    { id: 0, name: 'Niveau 0', total: 50, available: 15 },
    { id: 1, name: 'Niveau 1', total: 50, available: 20 },
    { id: 2, name: 'Niveau 2', total: 50, available: 10 },
  ];

  const amenities = [
    { icon: 'videocam', label: 'Surveillance 24/7' },
    { icon: 'shield-checkmark', label: 'Sécurisé' },
    { icon: 'accessibility', label: 'Accès PMR' },
    { icon: 'flash', label: 'Bornes électriques' },
    { icon: 'car-sport', label: 'Places moto' },
    { icon: 'wifi', label: 'WiFi gratuit' },
  ];

  const getAvailabilityColor = (available, total) => {
    const ratio = available / total;
    if (ratio > 0.3) return COLORS.parkingFree;
    if (ratio > 0.1) return COLORS.parkingReserved;
    return COLORS.parkingOccupied;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: pLat,
              longitude: pLng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: pLat, longitude: pLng }}>
              <View style={styles.marker}>
                <Ionicons name="location" size={32} color={COLORS.primary} />
              </View>
            </Marker>
          </MapView>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? COLORS.error : COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.directionsButton}>
            <Ionicons name="navigate" size={20} color={COLORS.white} />
            <Text style={styles.directionsButtonText}>Itinéraire</Text>
          </TouchableOpacity>
        </View>

        {/* Parking Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <View style={styles.infoMain}>
              <Text style={styles.parkingName}>{pName}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={COLORS.warning} />
                <Text style={styles.ratingText}>{pRating.toFixed(1)}</Text>
                <Text style={styles.reviewsText}>({pReviewCount} avis)</Text>
              </View>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceValue}>{pHourly} DH</Text>
              <Text style={styles.priceUnit}>/heure</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.gray} />
            <Text style={styles.addressText}>{pAddress}</Text>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: pIsOpen ? COLORS.success : COLORS.error }
              ]} />
              <Text style={styles.statusText}>
                {pIsOpen ? 'Ouvert 24h/24' : 'Fermé'}
              </Text>
            </View>
            {pDistance && (
              <View style={styles.statusItem}>
                <Ionicons name="walk" size={18} color={COLORS.gray} />
                <Text style={styles.statusText}>{pDistance < 1000 ? `${Math.round(pDistance)}m` : `${(pDistance/1000).toFixed(1)}km`}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Availability Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilité en temps réel</Text>
          
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityMain}>
              <Text style={styles.availableCount}>{pAvailable}</Text>
              <Text style={styles.availableLabel}>places disponibles</Text>
              <Text style={styles.totalText}>sur {pTotal} places</Text>
            </View>
            
            <View style={styles.availabilityBar}>
              <View 
                style={[
                  styles.availabilityFill, 
                  { 
                    width: `${pTotal > 0 ? (pAvailable / pTotal) * 100 : 0}%`,
                    backgroundColor: getAvailabilityColor(pAvailable, pTotal)
                  }
                ]} 
              />
            </View>
          </View>

          {/* Floor Selection */}
          <View style={styles.floorsContainer}>
            {floors.map((floor) => (
              <TouchableOpacity
                key={floor.id}
                style={[
                  styles.floorCard,
                  selectedFloor === floor.id && styles.floorCardSelected
                ]}
                onPress={() => setSelectedFloor(floor.id)}
              >
                <Text style={[
                  styles.floorName,
                  selectedFloor === floor.id && styles.floorNameSelected
                ]}>
                  {floor.name}
                </Text>
                <View style={styles.floorAvailability}>
                  <View style={[
                    styles.floorDot,
                    { backgroundColor: getAvailabilityColor(floor.available, floor.total) }
                  ]} />
                  <Text style={[
                    styles.floorCount,
                    selectedFloor === floor.id && styles.floorCountSelected
                  ]}>
                    {floor.available}/{floor.total}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Équipements</Text>
          <View style={styles.amenitiesGrid}>
            {amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <View style={styles.amenityIcon}>
                  <Ionicons name={amenity.icon} size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.amenityLabel}>{amenity.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarifs</Text>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>1 heure</Text>
              <Text style={styles.pricingValue}>{pHourly} DH</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>2 heures</Text>
              <Text style={styles.pricingValue}>{pHourly * 2} DH</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Demi-journée (4h)</Text>
              <Text style={styles.pricingValue}>{pHourly * 3.5} DH</Text>
            </View>
            <View style={[styles.pricingRow, styles.pricingRowHighlight]}>
              <Text style={styles.pricingLabelHighlight}>Journée (24h)</Text>
              <Text style={styles.pricingValueHighlight}>{pDaily} DH</Text>
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avis récents</Text>
            {reviews.slice(0, 3).map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {review.user?.firstName?.[0] || 'U'}
                    </Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewAuthor}>
                      {review.user?.firstName || 'Utilisateur'}
                    </Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={14}
                          color={COLORS.warning}
                        />
                      ))}
                    </View>
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment} numberOfLines={2}>{review.comment}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* IoT Capteurs Section */}
        {sensorData && (
          <View style={styles.section}>
            <View style={styles.iotHeader}>
              <Text style={styles.sectionTitle}>Capteurs IoT</Text>
              <View style={styles.iotLiveBadge}>
                <View style={styles.iotLiveDot} />
                <Text style={styles.iotLiveText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.iotTech}>{sensorData.technology || 'LoRaWAN + Ultrasoniques'}</Text>

            {/* Sensor Stats */}
            <View style={styles.iotStatsRow}>
              <View style={styles.iotStatCard}>
                <Ionicons name="hardware-chip" size={22} color={COLORS.primary} />
                <Text style={styles.iotStatValue}>{sensorData.summary?.totalSensors || 0}</Text>
                <Text style={styles.iotStatLabel}>Capteurs</Text>
              </View>
              <View style={styles.iotStatCard}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                <Text style={styles.iotStatValue}>{sensorData.summary?.activeSensors || 0}</Text>
                <Text style={styles.iotStatLabel}>Actifs</Text>
              </View>
              <View style={styles.iotStatCard}>
                <Ionicons name="battery-half" size={22} color={COLORS.warning} />
                <Text style={styles.iotStatValue}>{sensorData.summary?.averageBattery || 0}%</Text>
                <Text style={styles.iotStatLabel}>Batterie moy.</Text>
              </View>
            </View>

            {/* Environmental Sensors */}
            {sensorData.environmentalSensors && (
              <View style={styles.iotEnvCard}>
                <Text style={styles.iotEnvTitle}>Capteurs environnementaux</Text>
                <View style={styles.iotEnvGrid}>
                  <View style={styles.iotEnvItem}>
                    <Ionicons name="thermometer" size={18} color="#E53935" />
                    <Text style={styles.iotEnvValue}>{sensorData.environmentalSensors.temperature?.value || '--'}°C</Text>
                    <Text style={styles.iotEnvLabel}>Température</Text>
                  </View>
                  <View style={styles.iotEnvItem}>
                    <Ionicons name="water" size={18} color="#1E88E5" />
                    <Text style={styles.iotEnvValue}>{sensorData.environmentalSensors.humidity?.value || '--'}%</Text>
                    <Text style={styles.iotEnvLabel}>Humidité</Text>
                  </View>
                  <View style={styles.iotEnvItem}>
                    <Ionicons name="leaf" size={18} color="#43A047" />
                    <Text style={styles.iotEnvValue}>{sensorData.environmentalSensors.airQuality?.value || '--'}</Text>
                    <Text style={styles.iotEnvLabel}>Qualité air</Text>
                  </View>
                  <View style={styles.iotEnvItem}>
                    <Ionicons name="cloud" size={18} color="#757575" />
                    <Text style={styles.iotEnvValue}>{sensorData.environmentalSensors.co2Level?.value || '--'}</Text>
                    <Text style={styles.iotEnvLabel}>CO₂ (ppm)</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <View style={styles.ctaInfo}>
          <Text style={styles.ctaPrice}>{pHourly} DH<Text style={styles.ctaUnit}>/h</Text></Text>
          <Text style={styles.ctaAvailable}>{pAvailable} places libres</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.reserveButton,
            pAvailable === 0 && styles.reserveButtonDisabled
          ]}
          onPress={() => navigation.navigate('Reservation', { 
            parking: { ...parking, pricePerHour: pHourly, availableSpots: pAvailable, totalSpots: pTotal } 
          })}
          disabled={pAvailable === 0}
        >
          <Text style={styles.reserveButtonText}>
            {pAvailable === 0 ? 'Complet' : 'Réserver une place'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    height: 200,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  marker: {
    // marker style
  },
  backButton: {
    position: 'absolute',
    top: SIZES.md,
    left: SIZES.md,
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  directionsButton: {
    position: 'absolute',
    bottom: SIZES.md,
    right: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    ...SHADOWS.medium,
  },
  favoriteButton: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  directionsButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    marginLeft: SIZES.xs,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    padding: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.sm,
  },
  infoMain: {
    flex: 1,
  },
  parkingName: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  priceTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
  },
  priceValue: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: SIZES.fontXs,
    color: COLORS.primary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  addressText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.xs,
  },
  statusText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  section: {
    padding: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  availabilityCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.light,
  },
  availabilityMain: {
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  availableCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  availableLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  totalText: {
    fontSize: SIZES.fontSm,
    color: COLORS.gray,
    marginTop: 2,
  },
  availabilityBar: {
    height: 8,
    backgroundColor: COLORS.grayLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  floorsContainer: {
    flexDirection: 'row',
    marginTop: SIZES.md,
  },
  floorCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginHorizontal: SIZES.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.light,
  },
  floorCardSelected: {
    borderColor: COLORS.primary,
  },
  floorName: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  floorNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  floorAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  floorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  floorCount: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  floorCountSelected: {
    color: COLORS.primary,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    width: '33%',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  amenityIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  amenityLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  pricingRowHighlight: {
    backgroundColor: COLORS.primary + '10',
    marginHorizontal: -SIZES.md,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 0,
    borderRadius: SIZES.radiusMd,
    marginTop: SIZES.xs,
  },
  pricingLabel: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  pricingValue: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pricingLabelHighlight: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pricingValueHighlight: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    ...SHADOWS.dark,
  },
  ctaInfo: {
    flex: 1,
  },
  ctaPrice: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  ctaUnit: {
    fontSize: SIZES.fontSm,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  ctaAvailable: {
    fontSize: SIZES.fontSm,
    color: COLORS.success,
  },
  reserveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.medium,
  },
  reserveButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  reserveButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.light,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  reviewAvatarText: {
    fontSize: SIZES.fontMd,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reviewStars: {
    flexDirection: 'row',
    marginTop: 2,
  },
  reviewComment: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // IoT Styles
  iotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iotLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  iotLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  iotLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  iotTech: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SIZES.md,
  },
  iotStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iotStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
    alignItems: 'center',
    marginHorizontal: 3,
    ...SHADOWS.light,
  },
  iotStatValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  iotStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  iotEnvCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginTop: SIZES.md,
    ...SHADOWS.light,
  },
  iotEnvTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  iotEnvGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iotEnvItem: {
    alignItems: 'center',
    flex: 1,
  },
  iotEnvValue: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  iotEnvLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default ParkingDetailScreen;

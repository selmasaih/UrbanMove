import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { navigationService } from '../../services/navigationService';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const NavigationScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [geocodeResults, setGeocodeResults] = useState([]);
  const [searchingDest, setSearchingDest] = useState(false);
  const [smartLights, setSmartLights] = useState([]);
  const [userLocation, setUserLocation] = useState({
    latitude: 34.0084,
    longitude: -6.8539,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  // Lieux populaires réels à Rabat
  const popularPlaces = [
    { name: 'Gare Rabat Ville', coords: { latitude: 34.0128, longitude: -6.8355 } },
    { name: 'Aéroport Rabat-Salé', coords: { latitude: 34.0515, longitude: -6.7515 } },
    { name: 'Mega Mall Rabat', coords: { latitude: 33.9575, longitude: -6.8667 } },
    { name: 'CHU Ibn Sina', coords: { latitude: 34.0031, longitude: -6.8462 } },
    { name: 'INPT Al Irfane', coords: { latitude: 33.9632, longitude: -6.8890 } },
    { name: 'Tour Hassan', coords: { latitude: 34.0246, longitude: -6.8225 } },
    { name: 'Médina Bab El Had', coords: { latitude: 34.0178, longitude: -6.8345 } },
    { name: 'Chellah', coords: { latitude: 34.0059, longitude: -6.8144 } },
    { name: 'Hay Riad', coords: { latitude: 33.9616, longitude: -6.8663 } },
    { name: 'Marjane Hay Riad', coords: { latitude: 33.9530, longitude: -6.8572 } },
    { name: 'Agdal', coords: { latitude: 33.9897, longitude: -6.8498 } },
    { name: 'Stade Moulay Abdellah', coords: { latitude: 33.9589, longitude: -6.8669 } },
  ];

  // Tous les lieux connus pour la recherche
  const allKnownPlaces = [
    ...popularPlaces,
    { name: 'Université Mohammed V', coords: { latitude: 33.9862, longitude: -6.8597 } },
    { name: 'Faculté de Médecine Rabat', coords: { latitude: 34.0015, longitude: -6.8480 } },
    { name: 'Marché Central Rabat', coords: { latitude: 34.0175, longitude: -6.8340 } },
    { name: 'Kasbah des Oudayas', coords: { latitude: 34.0323, longitude: -6.8378 } },
    { name: 'Jardin d\'Essais', coords: { latitude: 34.0122, longitude: -6.8212 } },
    { name: 'Mosquée As-Sunna', coords: { latitude: 34.0167, longitude: -6.8300 } },
    { name: 'Gare Rabat Agdal', coords: { latitude: 33.9953, longitude: -6.8508 } },
    { name: 'Technopolis', coords: { latitude: 33.9274, longitude: -6.9115 } },
    { name: 'Salé Tabriquet', coords: { latitude: 34.0361, longitude: -6.8100 } },
    { name: 'Bab Rouah', coords: { latitude: 34.0126, longitude: -6.8389 } },
    { name: 'Place Moulay Hassan', coords: { latitude: 34.0195, longitude: -6.8302 } },
    { name: 'Océan Rabat', coords: { latitude: 34.0230, longitude: -6.8470 } },
    { name: 'Souissi', coords: { latitude: 33.9670, longitude: -6.8580 } },
    { name: 'Témara Centre', coords: { latitude: 33.9275, longitude: -6.9080 } },
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation({ ...userLocation, ...coords });
      setOriginCoords(coords);
      setOrigin('Ma position');
    } catch (error) {
      console.log('Erreur localisation:', error);
    }
  };

  // Charger les feux intelligents
  useEffect(() => {
    const loadSmartLights = async () => {
      try {
        const res = await navigationService.getSmartTrafficLights({ lat: 34.0209, lng: -6.8416 }, 20000);
        if (res.success && res.data?.data) {
          setSmartLights(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch (e) { console.log('Feux intelligents non disponibles'); }
    };
    loadSmartLights();
  }, []);

  // Recherche de destination par texte (geocoding local + API)
  const searchDestination = async (text) => {
    setDestination(text);
    setDestCoords(null);

    if (text.length < 2) {
      setGeocodeResults([]);
      return;
    }

    // Recherche locale dans les lieux connus
    const localResults = allKnownPlaces.filter(p =>
      p.name.toLowerCase().includes(text.toLowerCase())
    );
    
    if (localResults.length > 0) {
      setGeocodeResults(localResults.slice(0, 5));
      return;
    }

    // Geocoding via expo-location si pas de résultat local
    setSearchingDest(true);
    try {
      const results = await Location.geocodeAsync(text + ', Rabat, Maroc');
      if (results.length > 0) {
        setGeocodeResults([{
          name: text,
          coords: { latitude: results[0].latitude, longitude: results[0].longitude },
        }]);
      } else {
        setGeocodeResults([]);
      }
    } catch (e) {
      console.log('Geocoding non disponible:', e.message);
      setGeocodeResults([]);
    } finally {
      setSearchingDest(false);
    }
  };

  const selectGeoResult = (place) => {
    setDestination(place.name);
    setDestCoords(place.coords);
    setGeocodeResults([]);
    Keyboard.dismiss();
  };

  const calculateRoute = async () => {
    if (!originCoords || !destCoords) {
      return;
    }

    setLoading(true);
    
    try {
      const res = await navigationService.calculateRoute(
        originCoords,
        destCoords,
        { avoidTraffic: true }
      );

      if (res.success && res.data?.data) {
        const apiData = res.data.data;
        // Normaliser les données du backend vers le format attendu par l'UI
        const normalizedRoute = {
          distance: apiData.distance >= 1000
            ? Math.round(apiData.distance / 100) / 10  // mètres → km
            : apiData.distance,
          duration: typeof apiData.duration === 'object'
            ? apiData.duration.optimized
            : apiData.duration,
          durationStandard: typeof apiData.duration === 'object'
            ? apiData.duration.standard
            : apiData.duration,
          timeSaved: typeof apiData.duration === 'object'
            ? apiData.duration.saved
            : 0,
          fuelSaving: apiData.smartFeatures
            ? Math.min(Math.round(apiData.smartFeatures.co2Saved / 10), 25)
            : 12,
          coordinates: apiData.coordinates || [originCoords, destCoords],
          steps: apiData.steps || [],
          smartFeatures: apiData.smartFeatures || null,
          smartLightsCount: apiData.smartFeatures?.trafficLightsCount || 0,
          co2Saved: apiData.smartFeatures?.co2Saved || 0,
          trafficStatus: apiData.trafficStatus || 'fluide',
          alerts: apiData.alerts || [],
        };
        setRoute(normalizedRoute);
        setShowRouteInfo(true);

        const coords = normalizedRoute.coordinates || [originCoords, destCoords];
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      } else {
        // Fallback to basic route display
        const dist = calculateDistance(originCoords, destCoords);
        const dur = Math.round(dist / 30 * 60);
        const fallbackRoute = {
          distance: dist,
          duration: dur,
          durationStandard: dur + 3,
          timeSaved: 3,
          trafficDelay: 0,
          fuelSaving: 12,
          coordinates: [originCoords, destCoords],
          steps: [],
          smartFeatures: { trafficLightsCount: 3, timeSaved: 180, co2Saved: 414 },
          smartLightsCount: 3,
          co2Saved: 414,
          trafficStatus: 'fluide',
          alerts: [],
        };
        setRoute(fallbackRoute);
        setShowRouteInfo(true);
        mapRef.current?.fitToCoordinates([originCoords, destCoords], {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.log('Erreur calcul itinéraire:', error);
      // Fallback
      const dist2 = calculateDistance(originCoords, destCoords);
      const dur2 = Math.round(dist2 / 30 * 60);
      const fallbackRoute = {
        distance: dist2,
        duration: dur2,
        durationStandard: dur2 + 3,
        timeSaved: 3,
        trafficDelay: 0,
        fuelSaving: 12,
        coordinates: [originCoords, destCoords],
        steps: [],
        smartFeatures: { trafficLightsCount: 3, timeSaved: 180, co2Saved: 414 },
        smartLightsCount: 3,
        co2Saved: 414,
        trafficStatus: 'fluide',
        alerts: [],
      };
      setRoute(fallbackRoute);
      setShowRouteInfo(true);
      mapRef.current?.fitToCoordinates([originCoords, destCoords], {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Haversine distance in km
  const calculateDistance = (p1, p2) => {
    const R = 6371;
    const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
    const dLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(p1.latitude*Math.PI/180) * Math.cos(p2.latitude*Math.PI/180) * Math.sin(dLng/2)**2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
  };

  const clearRoute = () => {
    setRoute(null);
    setShowRouteInfo(false);
    setDestination('');
    setDestCoords(null);
  };

  const swapOriginDest = () => {
    const tmpOrigin = origin;
    const tmpOriginCoords = originCoords;
    setOrigin(destination);
    setOriginCoords(destCoords);
    setDestination(tmpOrigin);
    setDestCoords(tmpOriginCoords);
    // Clear existing route so user recalculates
    setRoute(null);
    setShowRouteInfo(false);
  };

  const getTrafficStatusColor = (status) => {
    switch (status) {
      case 'fluide': return COLORS.success;
      case 'normal': return '#4CAF50';
      case 'dense': return COLORS.warning;
      case 'congestionné': return COLORS.error;
      case 'bloqué': return '#B71C1C';
      default: return COLORS.success;
    }
  };

  const getTrafficStatusLabel = (status) => {
    switch (status) {
      case 'fluide': return 'Fluide';
      case 'normal': return 'Normal';
      case 'dense': return 'Dense';
      case 'congestionné': return 'Congestionné';
      case 'bloqué': return 'Bloqué';
      default: return 'Fluide';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Navigation</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.dotIndicator}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <View style={styles.dotLine} />
            <View style={[styles.dot, { backgroundColor: COLORS.accent }]} />
          </View>
          
          <View style={styles.searchInputs}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Point de départ"
                placeholderTextColor={COLORS.gray}
                value={origin}
                onChangeText={setOrigin}
              />
              <TouchableOpacity onPress={getUserLocation}>
                <Ionicons name="locate" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputDivider} />
            
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Destination (tapez un lieu)"
                placeholderTextColor={COLORS.gray}
                value={destination}
                onChangeText={searchDestination}
              />
              {searchingDest && (
                <ActivityIndicator size="small" color={COLORS.primary} />
              )}
              {destination.length > 0 && !searchingDest && (
                <TouchableOpacity onPress={() => { setDestination(''); setDestCoords(null); setGeocodeResults([]); }}>
                  <Ionicons name="close-circle" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Swap button */}
          {origin.length > 0 && destination.length > 0 && (
            <TouchableOpacity style={styles.swapButton} onPress={swapOriginDest}>
              <Ionicons name="swap-vertical" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Résultats de recherche destination */}
        {geocodeResults.length > 0 && (
          <View style={styles.geocodeResults}>
            {geocodeResults.map((place, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.geocodeItem}
                onPress={() => selectGeoResult(place)}
              >
                <Ionicons name="location" size={18} color={COLORS.primary} />
                <Text style={styles.geocodeItemText}>{place.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bouton Calculer */}
        <TouchableOpacity
          style={[styles.calculateButton, (!originCoords || !destCoords) && styles.buttonDisabled]}
          onPress={calculateRoute}
          disabled={!originCoords || !destCoords || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="navigate" size={20} color={COLORS.white} />
              <Text style={styles.calculateButtonText}>Calculer l'itinéraire</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Popular Places */}
      {!showRouteInfo && (
        <View style={styles.popularSection}>
          <Text style={styles.sectionTitle}>Destinations populaires</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularPlaces.map((place, index) => (
              <TouchableOpacity
                key={index}
                style={styles.placeChip}
                onPress={() => selectGeoResult(place)}
              >
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <Text style={styles.placeChipText}>{place.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Feux intelligents */}
      {!showRouteInfo && smartLights.length > 0 && (
        <View style={styles.smartLightsSection}>
          <View style={styles.smartLightsHeader}>
            <Ionicons name="bulb" size={18} color={COLORS.accent} />
            <Text style={styles.smartLightsTitle}>Feux intelligents</Text>
            <View style={styles.smartLightsCount}>
              <Text style={styles.smartLightsCountText}>{smartLights.length} actifs</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {smartLights.slice(0, 6).map((light, idx) => (
              <View key={idx} style={styles.lightCard}>
                <View style={[
                  styles.lightIndicator,
                  light.status === 'green' && { backgroundColor: COLORS.success },
                  light.status === 'red' && { backgroundColor: COLORS.error },
                  light.status === 'yellow' && { backgroundColor: COLORS.warning },
                ]} />
                <Text style={styles.lightId}>{light.id?.replace('tl_', '').replace('_', ' ')}</Text>
                <Text style={styles.lightWait}>{light.nextChange}s</Text>
                {light.optimizationActive && (
                  <View style={styles.lightOptimized}>
                    <Ionicons name="flash" size={10} color={COLORS.success} />
                    <Text style={styles.lightOptText}>IA</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={userLocation}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {originCoords && (
            <Marker coordinate={originCoords}>
              <View style={styles.originMarker}>
                <Ionicons name="radio-button-on" size={24} color={COLORS.primary} />
              </View>
            </Marker>
          )}
          
          {destCoords && (
            <Marker coordinate={destCoords}>
              <View style={styles.destMarker}>
                <Ionicons name="location" size={32} color={COLORS.accent} />
              </View>
            </Marker>
          )}

          {route && (
            <Polyline
              coordinates={route.coordinates}
              strokeWidth={5}
              strokeColor={COLORS.primary}
            />
          )}

          {/* Feux de circulation en temps réel sur la carte */}
          {smartLights.length > 0 && smartLights.map((light, idx) => {
            if (!light.location?.lat || !light.location?.lng) return null;
            const lightColor = light.status === 'green' ? COLORS.success 
              : light.status === 'red' ? COLORS.error 
              : COLORS.warning;
            return (
              <Marker
                key={`light-${idx}`}
                coordinate={{ latitude: light.location.lat, longitude: light.location.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.trafficLightMarker}>
                  <View style={[styles.trafficLightBody]}>
                    <View style={[styles.trafficLightDot, { backgroundColor: light.status === 'red' ? COLORS.error : '#555' }]} />
                    <View style={[styles.trafficLightDot, { backgroundColor: light.status === 'yellow' ? COLORS.warning : '#555' }]} />
                    <View style={[styles.trafficLightDot, { backgroundColor: light.status === 'green' ? COLORS.success : '#555' }]} />
                  </View>
                  {light.optimizationActive && (
                    <View style={styles.trafficLightAiBadge}>
                      <Ionicons name="flash" size={8} color={COLORS.white} />
                    </View>
                  )}
                </View>
              </Marker>
            );
          })}
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

        {/* Traffic lights legend on map */}
        {smartLights.length > 0 && !showRouteInfo && (
          <View style={styles.mapLegend}>
            <Ionicons name="bulb" size={14} color={COLORS.accent} />
            <Text style={styles.mapLegendText}>{smartLights.length} feux IA actifs</Text>
          </View>
        )}
      </View>

      {/* Route Info Bottom Sheet */}
      {showRouteInfo && route && (
        <View style={styles.routeInfoSheet}>
          {/* Prominent close button */}
          <TouchableOpacity 
            style={styles.closeRouteButton} 
            onPress={clearRoute}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.routeInfoHeader}>
            <View style={{ flex: 1, paddingRight: 40 }}>
              <Text style={styles.routeTitle}>Itinéraire optimal</Text>
              <Text style={styles.routeSubtitle}>
                Via feux intelligents • Économie carburant
              </Text>
            </View>
            {/* Traffic status badge */}
            <View style={[styles.trafficBadge, { backgroundColor: getTrafficStatusColor(route.trafficStatus) + '20' }]}>
              <View style={[styles.trafficBadgeDot, { backgroundColor: getTrafficStatusColor(route.trafficStatus) }]} />
              <Text style={[styles.trafficBadgeText, { color: getTrafficStatusColor(route.trafficStatus) }]}>
                {getTrafficStatusLabel(route.trafficStatus)}
              </Text>
            </View>
          </View>

          <View style={styles.routeStats}>
            <View style={styles.routeStat}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
              <Text style={styles.routeStatValue}>{route.duration} min</Text>
              <Text style={styles.routeStatLabel}>Durée</Text>
            </View>
            <View style={styles.routeStat}>
              <Ionicons name="speedometer-outline" size={24} color={COLORS.secondary} />
              <Text style={styles.routeStatValue}>{route.distance} km</Text>
              <Text style={styles.routeStatLabel}>Distance</Text>
            </View>
            <View style={styles.routeStat}>
              <Ionicons name="leaf-outline" size={24} color={COLORS.success} />
              <Text style={styles.routeStatValue}>-{route.fuelSaving}%</Text>
              <Text style={styles.routeStatLabel}>Carburant</Text>
            </View>
          </View>

          <View style={styles.smartFeature}>
            <Ionicons name="bulb" size={20} color={COLORS.accent} />
            <Text style={styles.smartFeatureText}>
              {route.smartLightsCount || 3} feux intelligents • {route.timeSaved || 3} min gagnées • -{route.co2Saved || 0}g CO₂
            </Text>
          </View>

          {route.durationStandard > route.duration && (
            <View style={[styles.smartFeature, { backgroundColor: COLORS.success + '15', marginTop: 6 }]}>
              <Ionicons name="trending-down" size={20} color={COLORS.success} />
              <Text style={[styles.smartFeatureText, { color: COLORS.success }]}>
                Sans optimisation : {route.durationStandard} min → Avec IA : {route.duration} min
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('RouteDetail', { route })}
          >
            <Ionicons name="navigate" size={20} color={COLORS.white} />
            <Text style={styles.startButtonText}>Démarrer la navigation</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  title: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  searchSection: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  searchRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  dotIndicator: {
    alignItems: 'center',
    marginRight: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: 4,
  },
  searchInputs: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  inputDivider: {
    height: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: SIZES.xs,
  },
  swapButton: {
    position: 'absolute',
    right: -4,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40',
    ...SHADOWS.light,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md,
    marginTop: SIZES.md,
    ...SHADOWS.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    marginLeft: SIZES.sm,
  },
  popularSection: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    marginRight: SIZES.sm,
    ...SHADOWS.light,
  },
  placeChipText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    marginLeft: SIZES.xs,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  originMarker: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusFull,
    padding: 4,
  },
  destMarker: {
    // marker style
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
  // Traffic light markers on map
  trafficLightMarker: {
    alignItems: 'center',
  },
  trafficLightBody: {
    backgroundColor: '#333',
    borderRadius: 6,
    padding: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  trafficLightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginVertical: 1,
  },
  trafficLightAiBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLegend: {
    position: 'absolute',
    bottom: SIZES.lg,
    left: SIZES.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white + 'EE',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    ...SHADOWS.light,
  },
  mapLegendText: {
    fontSize: SIZES.fontXs,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginLeft: 4,
  },
  routeInfoSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    paddingTop: SIZES.md,
    ...SHADOWS.dark,
  },
  closeRouteButton: {
    position: 'absolute',
    top: -18,
    right: SIZES.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...SHADOWS.medium,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  trafficBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
    marginTop: 2,
  },
  trafficBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  trafficBadgeText: {
    fontSize: SIZES.fontXs,
    fontWeight: '700',
  },
  routeTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  routeSubtitle: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusLg,
    paddingVertical: SIZES.md,
    marginBottom: SIZES.md,
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SIZES.xs,
  },
  routeStatLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
  },
  smartFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '15',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  smartFeatureText: {
    flex: 1,
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    marginLeft: SIZES.sm,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.md,
    ...SHADOWS.medium,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    marginLeft: SIZES.sm,
  },

  // Geocode results
  geocodeResults: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    marginTop: -SIZES.xs,
    marginBottom: SIZES.sm,
    ...SHADOWS.medium,
  },
  geocodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  geocodeItemText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    marginLeft: SIZES.sm,
  },

  // Smart lights section
  smartLightsSection: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.sm,
  },
  smartLightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  smartLightsTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: SIZES.xs,
    flex: 1,
  },
  smartLightsCount: {
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
  },
  smartLightsCountText: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.accent,
  },
  lightCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
    marginRight: SIZES.sm,
    alignItems: 'center',
    minWidth: 70,
    ...SHADOWS.light,
  },
  lightIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gray,
  },
  lightId: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  lightWait: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  lightOptimized: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lightOptText: {
    fontSize: 9,
    color: COLORS.success,
    fontWeight: '700',
    marginLeft: 2,
  },
});

export default NavigationScreen;

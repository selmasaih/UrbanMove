import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { iotService } from '../../services/iotService';

const { width } = Dimensions.get('window');

const ImpactScreen = () => {
  const [dashboard, setDashboard] = useState(null);
  const [smartLightsData, setSmartLightsData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [cityData, setCityData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('rabat');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('environmental');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAllData = useCallback(async () => {
    try {
      const [dashRes, lightsRes, netRes] = await Promise.all([
        iotService.getDashboard(),
        iotService.getSmartLightsAnalytics(),
        iotService.getNetworkStatus(),
      ]);
      if (dashRes.success && dashRes.data?.data) setDashboard(dashRes.data.data);
      if (lightsRes.success && lightsRes.data?.data) setSmartLightsData(lightsRes.data.data);
      if (netRes.success && netRes.data?.data) setNetworkData(netRes.data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.log('Erreur chargement IoT:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadCityData = useCallback(async (city) => {
    try {
      const res = await iotService.getCityAnalytics(city);
      if (res.success && res.data?.data) setCityData(res.data.data);
    } catch (error) {
      console.log('Erreur city analytics:', error);
    }
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);
  useEffect(() => { loadCityData(selectedCity); }, [selectedCity, loadCityData]);

  // Auto-refresh toutes les 30 secondes pour les données live
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData();
      loadCityData(selectedCity);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAllData, loadCityData, selectedCity]);

  const onRefresh = () => { setRefreshing(true); loadAllData(); loadCityData(selectedCity); };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des données IoT...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const impact = dashboard?.impact || {};
  const system = dashboard?.system || {};
  const realtime = dashboard?.realtime || {};
  const wc2030 = dashboard?.worldCup2030 || {};
  const lightsOverview = smartLightsData?.overview || {};
  const lightsCities = smartLightsData?.cities || [];
  const lightsToday = smartLightsData?.todayImpact || {};
  const lightsTech = smartLightsData?.technology || {};
  const lightsHourly = smartLightsData?.hourlyImpact || [];
  const netOverview = networkData?.overview || {};
  const netGateways = networkData?.gateways || [];
  const netArch = networkData?.architecture || {};
  const netMetrics = networkData?.networkMetrics || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Impact & IoT</Text>
          <Text style={styles.subtitle}>Smart Urban Mobility System</Text>
          {lastUpdated && (
            <Text style={styles.lastUpdatedText}>Mis à jour: {formatLastUpdated()}</Text>
          )}
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Système IoT Status */}
        <View style={styles.systemCard}>
          <View style={styles.systemHeader}>
            <Ionicons name="hardware-chip" size={24} color={COLORS.primary} />
            <Text style={styles.systemTitle}>Système IoT</Text>
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineText}>En ligne</Text>
            </View>
          </View>
          <Text style={styles.systemTech}>{system.technology || 'IoT (LoRaWAN + Capteurs ultrasoniques)'}</Text>
          
          <View style={styles.systemStats}>
            <View style={styles.systemStat}>
              <Text style={styles.systemStatValue}>{system.totalParkings || 0}</Text>
              <Text style={styles.systemStatLabel}>Parkings</Text>
            </View>
            <View style={styles.systemStatDivider} />
            <View style={styles.systemStat}>
              <Text style={styles.systemStatValue}>{system.totalSensors || 0}</Text>
              <Text style={styles.systemStatLabel}>Capteurs</Text>
            </View>
            <View style={styles.systemStatDivider} />
            <View style={styles.systemStat}>
              <Text style={styles.systemStatValue}>{system.uptime || '99.7%'}</Text>
              <Text style={styles.systemStatLabel}>Uptime</Text>
            </View>
            <View style={styles.systemStatDivider} />
            <View style={styles.systemStat}>
              <Text style={styles.systemStatValue}>{(system.cities || []).length}</Text>
              <Text style={styles.systemStatLabel}>Villes</Text>
            </View>
          </View>
        </View>

        {/* Occupation en temps réel */}
        <View style={styles.realtimeCard}>
          <Text style={styles.sectionTitle}>Occupation en temps réel</Text>
          <View style={styles.occupancyBarContainer}>
            <View style={styles.occupancyBar}>
              <View 
                style={[
                  styles.occupancyFill, 
                  { width: `${realtime.globalOccupancy || 0}%` },
                  (realtime.globalOccupancy || 0) > 80 && { backgroundColor: COLORS.error },
                  (realtime.globalOccupancy || 0) > 60 && (realtime.globalOccupancy || 0) <= 80 && { backgroundColor: COLORS.warning },
                ]}
              />
            </View>
            <Text style={styles.occupancyPercent}>{realtime.globalOccupancy || 0}%</Text>
          </View>
          <View style={styles.occupancyDetails}>
            <View style={styles.occupancyDetail}>
              <View style={[styles.occupancyDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.occupancyDetailText}>Occupées: {realtime.occupiedSpots || 0}</Text>
            </View>
            <View style={styles.occupancyDetail}>
              <View style={[styles.occupancyDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.occupancyDetailText}>Libres: {realtime.availableSpots || 0}</Text>
            </View>
            <View style={styles.occupancyDetail}>
              <Ionicons name="car" size={14} color={COLORS.gray} />
              <Text style={styles.occupancyDetailText}>Total: {realtime.totalSpots || 0}</Text>
            </View>
          </View>
        </View>

        {/* Filtre par ville */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityFilter} contentContainerStyle={{ paddingHorizontal: SIZES.lg }}>
          {['rabat', 'casablanca', 'tanger'].map(city => (
            <TouchableOpacity
              key={city}
              style={[styles.cityChip, selectedCity === city && styles.cityChipActive]}
              onPress={() => setSelectedCity(city)}
            >
              <Text style={[styles.cityChipText, selectedCity === city && styles.cityChipTextActive]}>
                {city.charAt(0).toUpperCase() + city.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mini dashboard ville sélectionnée */}
        {cityData && (
          <View style={styles.cityDashboard}>
            <Text style={styles.cityDashTitle}>📊 {cityData.city} — Aperçu IoT</Text>
            <View style={styles.cityDashRow}>
              <View style={styles.cityDashItem}>
                <Text style={styles.cityDashVal}>{cityData.summary?.totalParkings || 0}</Text>
                <Text style={styles.cityDashLbl}>Parkings</Text>
              </View>
              <View style={styles.cityDashItem}>
                <Text style={styles.cityDashVal}>{cityData.summary?.occupancyRate || 0}%</Text>
                <Text style={styles.cityDashLbl}>Occupation</Text>
              </View>
              <View style={styles.cityDashItem}>
                <Text style={styles.cityDashVal}>{cityData.impact?.co2SavedKg || 0} kg</Text>
                <Text style={styles.cityDashLbl}>CO₂ ↓</Text>
              </View>
              <View style={styles.cityDashItem}>
                <Text style={styles.cityDashVal}>{cityData.impact?.economySavedMAD || 0} DH</Text>
                <Text style={styles.cityDashLbl}>Économie</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tabs Impact — 5 onglets */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ paddingHorizontal: SIZES.lg }}>
          <View style={styles.tabContainer}>
            {[
              { key: 'environmental', label: 'Environ.', icon: 'leaf' },
              { key: 'economic', label: 'Écon.', icon: 'trending-up' },
              { key: 'social', label: 'Social', icon: 'people' },
              { key: 'smartlights', label: 'Feux IA', icon: 'bulb' },
              { key: 'network', label: 'Réseau', icon: 'hardware-chip' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={16} 
                  color={activeTab === tab.key ? COLORS.white : COLORS.gray} 
                />
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ── Tab: Environnemental ── */}
        {activeTab === 'environmental' && (
          <View style={styles.impactSection}>
            <View style={styles.impactHeader}>
              <Ionicons name="earth" size={28} color={COLORS.success} />
              <View style={{ marginLeft: SIZES.sm, flex: 1 }}>
                <Text style={styles.impactTitle}>Impact Environnemental</Text>
                <Text style={styles.impactSubtitle}>Étude MDPI (2023) : réduction CO₂ de 32% à 40%</Text>
              </View>
            </View>

            <View style={styles.impactGrid}>
              <View style={[styles.impactCard, { backgroundColor: '#E8F5E9' }]}> 
                <Ionicons name="cloud-outline" size={32} color="#2E7D32" />
                <Text style={styles.impactCardValue}>{impact.environmental?.co2Saved || 0} kg</Text>
                <Text style={styles.impactCardLabel}>CO₂ économisé</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="water-outline" size={32} color="#1565C0" />
                <Text style={styles.impactCardValue}>{impact.environmental?.fuelSaved || 0} L</Text>
                <Text style={styles.impactCardLabel}>Carburant économisé</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#F1F8E9' }]}>
                <Ionicons name="leaf-outline" size={32} color="#558B2F" />
                <Text style={styles.impactCardValue}>{impact.environmental?.treesEquivalent || 0}</Text>
                <Text style={styles.impactCardLabel}>Arbres équivalents</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="sunny-outline" size={32} color="#EF6C00" />
                <Text style={styles.impactCardValue}>{impact.environmental?.co2ReductionRate || '36%'}</Text>
                <Text style={styles.impactCardLabel}>Réduction CO₂</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailCard, { borderLeftColor: COLORS.success }]}>
                <Text style={styles.detailLabel}>Qualité de l'air</Text>
                <Text style={styles.detailValue}>+{impact.environmental?.airQualityImprovement || '32%'}</Text>
                <Text style={styles.detailSub}>Amélioration mesurée</Text>
              </View>
              <View style={[styles.detailCard, { borderLeftColor: COLORS.info }]}>
                <Text style={styles.detailLabel}>Émissions évitées</Text>
                <Text style={styles.detailValue}>{lightsToday.co2SavedKg || 0} kg/jour</Text>
                <Text style={styles.detailSub}>Grâce aux feux IA</Text>
              </View>
            </View>

            <View style={styles.studyCard}>
              <Ionicons name="document-text" size={20} color={COLORS.primary} />
              <Text style={styles.studyText}>
                Une gestion intelligente des parkings permet de réduire les émissions de CO₂ de 32% à 40% en fonction de la densité du trafic (MDPI, 2023). Moins de temps passé à chercher une place = moins de pollution.
              </Text>
            </View>
          </View>
        )}

        {/* ── Tab: Économique ── */}
        {activeTab === 'economic' && (
          <View style={styles.impactSection}>
            <View style={styles.impactHeader}>
              <Ionicons name="cash" size={28} color={COLORS.primary} />
              <View style={{ marginLeft: SIZES.sm, flex: 1 }}>
                <Text style={styles.impactTitle}>Impact Économique</Text>
                <Text style={styles.impactSubtitle}>Réduction temps d'attente jusqu'à 72%</Text>
              </View>
            </View>

            <View style={styles.impactGrid}>
              <View style={[styles.impactCard, { backgroundColor: '#E8EAF6' }]}>
                <Ionicons name="time-outline" size={32} color="#283593" />
                <Text style={styles.impactCardValue}>{impact.economic?.timeSavedHours || 0}h</Text>
                <Text style={styles.impactCardLabel}>Temps économisé</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="wallet-outline" size={32} color="#C62828" />
                <Text style={styles.impactCardValue}>{impact.economic?.totalEconomySaved || 0} DH</Text>
                <Text style={styles.impactCardLabel}>Économie totale</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#E0F7FA' }]}>
                <Ionicons name="receipt-outline" size={32} color="#00838F" />
                <Text style={styles.impactCardValue}>{impact.economic?.totalReservations || 0}</Text>
                <Text style={styles.impactCardLabel}>Réservations</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="rocket-outline" size={32} color="#6A1B9A" />
                <Text style={styles.impactCardValue}>{impact.economic?.productivityGain || '72%'}</Text>
                <Text style={styles.impactCardLabel}>Gain productivité</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailCard, { borderLeftColor: '#C62828' }]}>
                <Text style={styles.detailLabel}>Carburant</Text>
                <Text style={styles.detailValue}>{impact.economic?.fuelCostSaved || 0} DH</Text>
                <Text style={styles.detailSub}>Économie essence</Text>
              </View>
              <View style={[styles.detailCard, { borderLeftColor: '#283593' }]}>
                <Text style={styles.detailLabel}>Temps valorisé</Text>
                <Text style={styles.detailValue}>{impact.economic?.timeCostSaved || 0} DH</Text>
                <Text style={styles.detailSub}>À ~50 DH/heure</Text>
              </View>
            </View>

            <View style={styles.studyCard}>
              <Ionicons name="document-text" size={20} color={COLORS.primary} />
              <Text style={styles.studyText}>
                La mobilité inefficace a un coût direct sur l'économie nationale. En moyenne, un conducteur passe 20 minutes à chercher une place. Avec notre système IoT, ce temps est réduit à 5 minutes — soit 75% de gain.
              </Text>
            </View>
          </View>
        )}

        {/* ── Tab: Social ── */}
        {activeTab === 'social' && (
          <View style={styles.impactSection}>
            <View style={styles.impactHeader}>
              <Ionicons name="heart" size={28} color={COLORS.accent} />
              <View style={{ marginLeft: SIZES.sm, flex: 1 }}>
                <Text style={styles.impactTitle}>Impact Social</Text>
                <Text style={styles.impactSubtitle}>Federal Highway Administration</Text>
              </View>
            </View>

            <View style={styles.impactGrid}>
              <View style={[styles.impactCard, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="happy-outline" size={32} color="#C62828" />
                <Text style={styles.impactCardValue}>{impact.social?.stressReduction || '45%'}</Text>
                <Text style={styles.impactCardLabel}>Réduction stress</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="shield-checkmark-outline" size={32} color="#2E7D32" />
                <Text style={styles.impactCardValue}>{impact.social?.accidentReduction || '13.3%'}</Text>
                <Text style={styles.impactCardLabel}>Moins d'accidents</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="warning-outline" size={32} color="#F57F17" />
                <Text style={styles.impactCardValue}>{impact.social?.severeAccidentReduction || '35.8%'}</Text>
                <Text style={styles.impactCardLabel}>Accidents graves ↓</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#E0F2F1' }]}>
                <Ionicons name="star-outline" size={32} color="#00695C" />
                <Text style={styles.impactCardValue}>{impact.social?.userSatisfaction || '92%'}</Text>
                <Text style={styles.impactCardLabel}>Satisfaction</Text>
              </View>
            </View>

            <View style={styles.socialBenefits}>
              <Text style={styles.socialBenefitsTitle}>Les embouteillages provoquent :</Text>
              {['Stress quotidien des automobilistes', 'Fatigue chronique et baisse cognitive', 'Retards au travail et perte de productivité', 'Irritation et accidents routiers'].map((item, i) => (
                <View key={i} style={styles.socialBenefitItem}>
                  <Ionicons name="remove-circle" size={16} color={COLORS.error} />
                  <Text style={styles.socialBenefitText}>{item}</Text>
                </View>
              ))}
              <Text style={[styles.socialBenefitsTitle, { marginTop: SIZES.md }]}>Notre solution réduit :</Text>
              {[
                `${impact.social?.avgTimeSavedPerTrip || '15 min'} de recherche en moyenne`,
                'Temps d\'attente aux feux réduit de 42%',
                'Accidents graves réduits de 35.8%',
                'Qualité de vie améliorée pour tous',
              ].map((item, i) => (
                <View key={i} style={styles.socialBenefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.socialBenefitText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Tab: Feux Intelligents ── */}
        {activeTab === 'smartlights' && (
          <View style={styles.impactSection}>
            <View style={styles.impactHeader}>
              <Ionicons name="bulb" size={28} color={COLORS.warning} />
              <View style={{ marginLeft: SIZES.sm, flex: 1 }}>
                <Text style={styles.impactTitle}>Feux Intelligents</Text>
                <Text style={styles.impactSubtitle}>
                  {lightsOverview.totalSmartLights || 0} feux IA / {lightsOverview.totalLights || 0} total — {lightsOverview.globalCoverage || 0}% couverture
                </Text>
              </View>
            </View>

            {/* KPI Cards */}
            <View style={styles.impactGrid}>
              <View style={[styles.impactCard, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="bulb" size={32} color="#E65100" />
                <Text style={styles.impactCardValue}>{lightsOverview.totalSmartLights || 0}</Text>
                <Text style={styles.impactCardLabel}>Feux connectés</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="git-network-outline" size={32} color="#2E7D32" />
                <Text style={styles.impactCardValue}>{lightsOverview.totalIntersections || 0}</Text>
                <Text style={styles.impactCardLabel}>Intersections</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="time-outline" size={32} color="#1565C0" />
                <Text style={styles.impactCardValue}>{lightsToday.totalTimeSaved || 0}h</Text>
                <Text style={styles.impactCardLabel}>Temps gagné /jour</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="car-outline" size={32} color="#C62828" />
                <Text style={styles.impactCardValue}>{lightsToday.totalVehiclesOptimized || 0}</Text>
                <Text style={styles.impactCardLabel}>Véhicules /jour</Text>
              </View>
            </View>

            {/* Impact Aujourd'hui */}
            <View style={styles.todayImpactCard}>
              <Text style={styles.todayImpactTitle}>🚦 Impact aujourd'hui</Text>
              <View style={styles.todayImpactRow}>
                <View style={styles.todayImpactItem}>
                  <Ionicons name="cloud-outline" size={20} color={COLORS.success} />
                  <Text style={styles.todayImpactValue}>-{lightsToday.co2SavedKg || 0} kg CO₂</Text>
                </View>
                <View style={styles.todayImpactItem}>
                  <Ionicons name="water-outline" size={20} color={COLORS.info} />
                  <Text style={styles.todayImpactValue}>-{lightsToday.fuelSavedLiters || 0} L</Text>
                </View>
                <View style={styles.todayImpactItem}>
                  <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.todayImpactValue}>{lightsToday.costSavedMAD || 0} DH</Text>
                </View>
              </View>
            </View>

            {/* Couverture par ville */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: SIZES.md }]}>Couverture par ville</Text>
            {lightsCities.map((city, i) => (
              <View key={i} style={styles.cityLightCard}>
                <View style={styles.cityLightHeader}>
                  <Text style={styles.cityLightName}>{city.city}</Text>
                  <View style={[
                    styles.cityLightBadge,
                    { backgroundColor: city.status === 'avancé' ? COLORS.success + '20' : COLORS.warning + '20' },
                  ]}>
                    <Text style={[
                      styles.cityLightBadgeText,
                      { color: city.status === 'avancé' ? COLORS.success : COLORS.warning },
                    ]}>
                      {city.status === 'avancé' ? '✓ Avancé' : '⟳ En cours'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cityLightStats}>
                  <View style={styles.cityLightStat}>
                    <Text style={styles.cityLightStatVal}>{city.smartLights}/{city.totalLights}</Text>
                    <Text style={styles.cityLightStatLbl}>Feux IA</Text>
                  </View>
                  <View style={styles.cityLightStat}>
                    <Text style={styles.cityLightStatVal}>{city.intersections}</Text>
                    <Text style={styles.cityLightStatLbl}>Carrefours</Text>
                  </View>
                  <View style={styles.cityLightStat}>
                    <Text style={styles.cityLightStatVal}>-{city.avgWaitReduction}s</Text>
                    <Text style={styles.cityLightStatLbl}>Attente ↓</Text>
                  </View>
                  <View style={styles.cityLightStat}>
                    <Text style={styles.cityLightStatVal}>{city.peakOptimization}%</Text>
                    <Text style={styles.cityLightStatLbl}>Pic optimisé</Text>
                  </View>
                </View>
                <View style={styles.coverageBarBg}>
                  <View style={[styles.coverageBarFill, { width: `${city.coverage}%` }]} />
                </View>
                <Text style={styles.coverageLabel}>{city.coverage}% de couverture</Text>
              </View>
            ))}

            {/* Graphique horaire simplifié */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: SIZES.md }]}>Temps d'attente moyen (24h)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
              {lightsHourly.map((h, i) => (
                <View key={i} style={styles.chartBar}>
                  <View style={styles.chartBarStack}>
                    <View style={[styles.chartBarOld, { height: Math.max(h.avgWaitWithout * 0.8, 10) }]} />
                    <View style={[styles.chartBarNew, { height: Math.max(h.avgWaitWith * 0.8, 8) }]} />
                  </View>
                  <Text style={styles.chartBarLabel}>{h.hour.slice(0, 2)}h</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chartLegend}>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, { backgroundColor: COLORS.error + '60' }]} />
                <Text style={styles.chartLegendText}>Sans IA</Text>
              </View>
              <View style={styles.chartLegendItem}>
                <View style={[styles.chartLegendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.chartLegendText}>Avec IA</Text>
              </View>
            </View>

            {/* Technologies utilisées */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: SIZES.md }]}>Technologies & Algorithmes</Text>
            <View style={styles.techGrid}>
              {(lightsTech.algorithms || []).map((algo, i) => (
                <View key={i} style={styles.techItem}>
                  <View style={[styles.techIcon, { backgroundColor: ['#E8EAF6', '#E8F5E9', '#FFF3E0', '#FCE4EC'][i % 4] }]}>
                    <Ionicons name={['analytics', 'git-branch', 'hardware-chip', 'pulse'][i % 4]} size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.techContent}>
                    <Text style={styles.techName}>{algo.name}</Text>
                    <Text style={styles.techDesc}>{algo.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Capacités IA */}
            <View style={styles.iaCard}>
              <Text style={styles.iaTitle}>🤖 Capacités IA</Text>
              {(lightsTech.iaCapabilities || []).map((cap, i) => (
                <View key={i} style={styles.iaItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.iaText}>{cap}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Tab: Réseau IoT ── */}
        {activeTab === 'network' && (
          <View style={styles.impactSection}>
            <View style={styles.impactHeader}>
              <Ionicons name="hardware-chip" size={28} color={COLORS.secondary} />
              <View style={{ marginLeft: SIZES.sm, flex: 1 }}>
                <Text style={styles.impactTitle}>Réseau IoT</Text>
                <Text style={styles.impactSubtitle}>
                  {netOverview.activeSensors || 0}/{netOverview.totalSensors || 0} capteurs actifs — {netOverview.totalGateways || 0} passerelles
                </Text>
              </View>
            </View>

            {/* KPI réseau */}
            <View style={styles.impactGrid}>
              <View style={[styles.impactCard, { backgroundColor: '#E8EAF6' }]}>
                <Ionicons name="radio" size={32} color="#283593" />
                <Text style={styles.impactCardValue}>{netOverview.activeSensors || 0}</Text>
                <Text style={styles.impactCardLabel}>Capteurs actifs</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="wifi" size={32} color="#2E7D32" />
                <Text style={styles.impactCardValue}>{netOverview.onlineGateways || 0}</Text>
                <Text style={styles.impactCardLabel}>Passerelles</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="pulse" size={32} color="#E65100" />
                <Text style={styles.impactCardValue}>{netOverview.sensorUptime || '99%'}</Text>
                <Text style={styles.impactCardLabel}>Uptime</Text>
              </View>
              <View style={[styles.impactCard, { backgroundColor: '#E0F7FA' }]}>
                <Ionicons name="globe" size={32} color="#00838F" />
                <Text style={styles.impactCardValue}>{netOverview.totalCities || 0}</Text>
                <Text style={styles.impactCardLabel}>Villes</Text>
              </View>
            </View>

            {/* Métriques réseau */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: SIZES.md }]}>Métriques temps réel</Text>
            <View style={styles.metricsCard}>
              <View style={styles.metricRow}>
                <Ionicons name="swap-horizontal" size={18} color={COLORS.info} />
                <Text style={styles.metricLabel}>Latence moyenne</Text>
                <Text style={styles.metricValue}>{netMetrics.latency?.avg || 0} ms</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricRow}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.warning} />
                <Text style={styles.metricLabel}>Perte de paquets</Text>
                <Text style={styles.metricValue}>{netMetrics.packetLoss?.rate || 0}%</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricRow}>
                <Ionicons name="speedometer" size={18} color={COLORS.success} />
                <Text style={styles.metricLabel}>Bande passante</Text>
                <Text style={styles.metricValue}>{netMetrics.bandwidth?.used || 0}/{netMetrics.bandwidth?.total || 0} Gbps</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricRow}>
                <Ionicons name="chatbubbles" size={18} color={COLORS.primary} />
                <Text style={styles.metricLabel}>Messages/sec</Text>
                <Text style={styles.metricValue}>{netMetrics.messagesPerSecond || 0}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricRow}>
                <Ionicons name="server" size={18} color={COLORS.secondary} />
                <Text style={styles.metricLabel}>Données traitées</Text>
                <Text style={styles.metricValue}>{netMetrics.dataProcessedToday || '0 GB'}</Text>
              </View>
            </View>

            {/* Architecture IoT */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: SIZES.md }]}>Architecture IoT</Text>
            {(netArch.layers || []).map((layer, i) => (
              <View key={i} style={styles.archLayer}>
                <View style={styles.archLayerHeader}>
                  <View style={[styles.archLayerNum, { backgroundColor: [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success][i] }]}>
                    <Text style={styles.archLayerNumText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.archLayerName}>{layer.name}</Text>
                    <Text style={styles.archLayerDesc}>{layer.description}</Text>
                  </View>
                </View>
                {layer.components.map((comp, j) => (
                  <View key={j} style={styles.archComponent}>
                    <View style={styles.archCompDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.archCompType}>
                        {comp.type} {comp.count > 1 ? `(${comp.count})` : ''}
                      </Text>
                      <Text style={styles.archCompRole}>{comp.role}</Text>
                    </View>
                  </View>
                ))}
                {i < (netArch.layers || []).length - 1 && (
                  <View style={styles.archConnector}>
                    <Ionicons name="arrow-down" size={20} color={COLORS.gray} />
                  </View>
                )}
              </View>
            ))}

            {/* Passerelles LoRaWAN */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: SIZES.md }]}>Passerelles LoRaWAN</Text>
            {netGateways.map((gw, i) => (
              <View key={i} style={styles.gatewayCard}>
                <View style={styles.gatewayHeader}>
                  <View style={[styles.gatewayDot, { backgroundColor: gw.status === 'online' ? COLORS.success : COLORS.error }]} />
                  <Text style={styles.gatewayId}>{gw.id}</Text>
                  <Text style={styles.gatewayCity}>{gw.city}</Text>
                </View>
                <View style={styles.gatewayStats}>
                  <Text style={styles.gatewayStat}>📍 {gw.location}</Text>
                  <Text style={styles.gatewayStat}>📶 {gw.signal}%</Text>
                  <Text style={styles.gatewayStat}>📡 {gw.devicesConnected} devices</Text>
                </View>
                <Text style={styles.gatewayProto}>{gw.protocol} — {gw.frequency}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Coupe du Monde 2030 */}
        <View style={styles.worldCupCard}>
          <View style={styles.worldCupHeader}>
            <Text style={styles.worldCupEmoji}>⚽🏆</Text>
            <Text style={styles.worldCupTitle}>Coupe du Monde 2030</Text>
          </View>
          <Text style={styles.worldCupText}>
            Avec l'organisation de la Coupe du Monde 2030, le Maroc accueillera des millions de visiteurs. Notre système IoT de smart parking et feux intelligents est prêt pour faciliter les déplacements et renforcer l'image du Maroc à l'international.
          </Text>
          <View style={styles.worldCupStats}>
            <View style={styles.worldCupStat}>
              <Text style={styles.worldCupStatValue}>{wc2030.readyParkings || 0}</Text>
              <Text style={styles.worldCupStatLabel}>Parkings prêts</Text>
            </View>
            <View style={styles.worldCupStat}>
              <Text style={styles.worldCupStatValue}>{wc2030.readyCities || 0}</Text>
              <Text style={styles.worldCupStatLabel}>Villes couvertes</Text>
            </View>
            <View style={styles.worldCupStat}>
              <Text style={styles.worldCupStatValue}>{wc2030.targetCapacity || 0}</Text>
              <Text style={styles.worldCupStatLabel}>Places totales</Text>
            </View>
          </View>
          <View style={styles.worldCupReady}>
            <Ionicons name="checkmark-shield" size={20} color="#A5D6A7" />
            <Text style={styles.worldCupReadyText}>
              {lightsOverview.totalSmartLights || 0} feux intelligents • {netOverview.totalGateways || 0} passerelles • Couverture {lightsOverview.globalCoverage || 0}%
            </Text>
          </View>
        </View>

        {/* Problématique */}
        <View style={styles.problemCard}>
          <Ionicons name="help-circle" size={24} color={COLORS.primary} />
          <Text style={styles.problemTitle}>Problématique</Text>
          <Text style={styles.problemText}>
            Comment digitaliser le transport urbain afin d'améliorer la mobilité, réduire la congestion et rendre les villes marocaines plus intelligentes et durables ?
          </Text>
          <View style={styles.problemSolution}>
            <Ionicons name="bulb" size={20} color={COLORS.success} />
            <Text style={styles.problemSolutionText}>
              Solution : Un système intelligent de gestion du stationnement et du trafic basé sur les technologies IoT, IA et feux intelligents
            </Text>
          </View>
        </View>

        <View style={{ height: SIZES.xxl + 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: SIZES.md, fontSize: SIZES.fontMd, color: COLORS.textSecondary },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg, paddingTop: SIZES.md, paddingBottom: SIZES.sm,
  },
  title: { fontSize: SIZES.fontXxl, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: SIZES.fontSm, color: COLORS.textSecondary, marginTop: 2 },
  lastUpdatedText: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success + '15',
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, borderRadius: SIZES.radiusFull,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: SIZES.xs },
  liveText: { fontSize: SIZES.fontXs, fontWeight: '700', color: COLORS.success },

  // System Card
  systemCard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.lg, marginTop: SIZES.sm,
    borderRadius: SIZES.radiusLg, padding: SIZES.lg, ...SHADOWS.light,
  },
  systemHeader: { flexDirection: 'row', alignItems: 'center' },
  systemTitle: { fontSize: SIZES.fontLg, fontWeight: '600', color: COLORS.textPrimary, marginLeft: SIZES.sm, flex: 1 },
  onlineBadge: { backgroundColor: COLORS.success + '20', paddingHorizontal: SIZES.sm, paddingVertical: 2, borderRadius: SIZES.radiusFull },
  onlineText: { fontSize: SIZES.fontXs, color: COLORS.success, fontWeight: '600' },
  systemTech: { fontSize: SIZES.fontSm, color: COLORS.textSecondary, marginTop: SIZES.xs, marginBottom: SIZES.md },
  systemStats: { flexDirection: 'row', justifyContent: 'space-between' },
  systemStat: { alignItems: 'center', flex: 1 },
  systemStatValue: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.primary },
  systemStatLabel: { fontSize: SIZES.fontXs, color: COLORS.textSecondary, marginTop: 2 },
  systemStatDivider: { width: 1, backgroundColor: COLORS.grayLight },

  // Realtime
  realtimeCard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.lg, marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg, padding: SIZES.lg, ...SHADOWS.light,
  },
  sectionTitle: { fontSize: SIZES.fontLg, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SIZES.md },
  occupancyBarContainer: { flexDirection: 'row', alignItems: 'center' },
  occupancyBar: { flex: 1, height: 16, backgroundColor: COLORS.grayLight, borderRadius: 8, overflow: 'hidden', marginRight: SIZES.sm },
  occupancyFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 8 },
  occupancyPercent: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.textPrimary, minWidth: 45, textAlign: 'right' },
  occupancyDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SIZES.md },
  occupancyDetail: { flexDirection: 'row', alignItems: 'center' },
  occupancyDot: { width: 10, height: 10, borderRadius: 5, marginRight: SIZES.xs },
  occupancyDetailText: { fontSize: SIZES.fontSm, color: COLORS.textSecondary },

  // City Filter
  cityFilter: { marginTop: SIZES.md },
  cityChip: {
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white, marginRight: SIZES.sm, ...SHADOWS.light,
  },
  cityChipActive: { backgroundColor: COLORS.primary },
  cityChipText: { fontSize: SIZES.fontSm, fontWeight: '600', color: COLORS.textSecondary },
  cityChipTextActive: { color: COLORS.white },

  // City Dashboard
  cityDashboard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.lg, marginTop: SIZES.md,
    borderRadius: SIZES.radiusLg, padding: SIZES.md, ...SHADOWS.light,
  },
  cityDashTitle: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  cityDashRow: { flexDirection: 'row', justifyContent: 'space-around' },
  cityDashItem: { alignItems: 'center' },
  cityDashVal: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.primary },
  cityDashLbl: { fontSize: SIZES.fontXs, color: COLORS.textSecondary, marginTop: 2 },

  // Tabs — 5 onglets
  tabScroll: { marginTop: SIZES.lg },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: 3, ...SHADOWS.light },
  tab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SIZES.sm, paddingHorizontal: SIZES.sm, borderRadius: SIZES.radiusMd - 2,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 11, fontWeight: '600', color: COLORS.gray, marginLeft: 3 },
  tabTextActive: { color: COLORS.white },

  // Impact Section
  impactSection: { paddingHorizontal: SIZES.lg, marginTop: SIZES.md },
  impactHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.md },
  impactTitle: { fontSize: SIZES.fontLg, fontWeight: '600', color: COLORS.textPrimary },
  impactSubtitle: { fontSize: SIZES.fontXs, color: COLORS.textSecondary, marginTop: 2 },
  impactGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  impactCard: {
    width: (width - SIZES.lg * 2 - SIZES.sm) / 2, borderRadius: SIZES.radiusLg,
    padding: SIZES.md, marginBottom: SIZES.sm, alignItems: 'center',
  },
  impactCardValue: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: SIZES.sm },
  impactCardLabel: { fontSize: SIZES.fontXs, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },

  // Detail cards
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SIZES.sm },
  detailCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginHorizontal: 4, borderLeftWidth: 4, ...SHADOWS.light,
  },
  detailLabel: { fontSize: SIZES.fontXs, color: COLORS.textSecondary },
  detailValue: { fontSize: SIZES.fontLg, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 2 },
  detailSub: { fontSize: SIZES.fontXs, color: COLORS.textSecondary, marginTop: 2 },

  studyCard: {
    flexDirection: 'row', backgroundColor: COLORS.primary + '10', borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginTop: SIZES.sm,
  },
  studyText: { flex: 1, fontSize: SIZES.fontSm, color: COLORS.textSecondary, marginLeft: SIZES.sm, lineHeight: 20 },

  // Social
  socialBenefits: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: SIZES.md, marginTop: SIZES.sm, ...SHADOWS.light,
  },
  socialBenefitsTitle: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  socialBenefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.xs },
  socialBenefitText: { fontSize: SIZES.fontSm, color: COLORS.textSecondary, marginLeft: SIZES.sm },

  // Smart Lights
  todayImpactCard: {
    backgroundColor: COLORS.primary + '10', borderRadius: SIZES.radiusLg,
    padding: SIZES.md, marginTop: SIZES.sm,
  },
  todayImpactTitle: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  todayImpactRow: { flexDirection: 'row', justifyContent: 'space-around' },
  todayImpactItem: { flexDirection: 'row', alignItems: 'center' },
  todayImpactValue: { fontSize: SIZES.fontSm, fontWeight: '600', color: COLORS.textPrimary, marginLeft: 4 },

  cityLightCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.light,
  },
  cityLightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SIZES.sm },
  cityLightName: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.textPrimary },
  cityLightBadge: { paddingHorizontal: SIZES.sm, paddingVertical: 2, borderRadius: SIZES.radiusFull },
  cityLightBadgeText: { fontSize: SIZES.fontXs, fontWeight: '600' },
  cityLightStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.sm },
  cityLightStat: { alignItems: 'center' },
  cityLightStatVal: { fontSize: SIZES.fontMd, fontWeight: 'bold', color: COLORS.textPrimary },
  cityLightStatLbl: { fontSize: 10, color: COLORS.textSecondary },
  coverageBarBg: { height: 6, backgroundColor: COLORS.grayLight, borderRadius: 3, overflow: 'hidden' },
  coverageBarFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 3 },
  coverageLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },

  // Chart
  chartScroll: { marginTop: SIZES.sm },
  chartBar: { alignItems: 'center', marginRight: 6, width: 28 },
  chartBarStack: { alignItems: 'center', justifyContent: 'flex-end', height: 100 },
  chartBarOld: { width: 10, backgroundColor: COLORS.error + '40', borderRadius: 3, marginBottom: 2 },
  chartBarNew: { width: 10, backgroundColor: COLORS.success, borderRadius: 3 },
  chartBarLabel: { fontSize: 9, color: COLORS.textSecondary, marginTop: 2 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: SIZES.sm },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SIZES.md },
  chartLegendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  chartLegendText: { fontSize: SIZES.fontXs, color: COLORS.textSecondary },

  // Tech grid
  techGrid: { marginTop: SIZES.xs },
  techItem: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    padding: SIZES.sm, marginBottom: SIZES.xs, ...SHADOWS.light,
  },
  techIcon: { width: 40, height: 40, borderRadius: SIZES.radiusMd, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.sm },
  techContent: { flex: 1 },
  techName: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.textPrimary },
  techDesc: { fontSize: SIZES.fontXs, color: COLORS.textSecondary, marginTop: 1 },

  // IA Card
  iaCard: {
    backgroundColor: '#1A237E', borderRadius: SIZES.radiusLg,
    padding: SIZES.md, marginTop: SIZES.md,
  },
  iaTitle: { fontSize: SIZES.fontMd, fontWeight: '600', color: '#FFFFFF', marginBottom: SIZES.sm },
  iaItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iaText: { fontSize: SIZES.fontSm, color: '#C5CAE9', marginLeft: SIZES.sm },

  // Network
  metricsCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: SIZES.md, ...SHADOWS.light,
  },
  metricRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.sm },
  metricLabel: { flex: 1, fontSize: SIZES.fontSm, color: COLORS.textSecondary, marginLeft: SIZES.sm },
  metricValue: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.textPrimary },
  metricDivider: { height: 1, backgroundColor: COLORS.grayLight },

  // Architecture
  archLayer: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: SIZES.md, marginBottom: SIZES.xs, ...SHADOWS.light,
  },
  archLayerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm },
  archLayerNum: {
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.sm,
  },
  archLayerNumText: { color: '#FFF', fontWeight: 'bold', fontSize: SIZES.fontSm },
  archLayerName: { fontSize: SIZES.fontMd, fontWeight: '600', color: COLORS.textPrimary },
  archLayerDesc: { fontSize: SIZES.fontXs, color: COLORS.textSecondary },
  archComponent: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: SIZES.xl, marginBottom: 6 },
  archCompDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 6, marginRight: SIZES.sm },
  archCompType: { fontSize: SIZES.fontSm, fontWeight: '600', color: COLORS.textPrimary },
  archCompRole: { fontSize: SIZES.fontXs, color: COLORS.textSecondary },
  archConnector: { alignItems: 'center', paddingVertical: 4 },

  // Gateways
  gatewayCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.light,
  },
  gatewayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  gatewayDot: { width: 10, height: 10, borderRadius: 5, marginRight: SIZES.sm },
  gatewayId: { fontSize: SIZES.fontSm, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  gatewayCity: { fontSize: SIZES.fontSm, color: COLORS.primary, fontWeight: '600' },
  gatewayStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  gatewayStat: { fontSize: SIZES.fontXs, color: COLORS.textSecondary },
  gatewayProto: { fontSize: 10, color: COLORS.gray, fontStyle: 'italic' },

  // World Cup 2030
  worldCupCard: {
    backgroundColor: '#1B5E20', marginHorizontal: SIZES.lg, marginTop: SIZES.lg,
    borderRadius: SIZES.radiusLg, padding: SIZES.lg, overflow: 'hidden',
  },
  worldCupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm },
  worldCupEmoji: { fontSize: 24, marginRight: SIZES.sm },
  worldCupTitle: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: '#FFFFFF' },
  worldCupText: { fontSize: SIZES.fontSm, color: '#E8F5E9', lineHeight: 20, marginBottom: SIZES.md },
  worldCupStats: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: SIZES.md,
  },
  worldCupStat: { alignItems: 'center' },
  worldCupStatValue: { fontSize: SIZES.fontXl, fontWeight: 'bold', color: '#FFFFFF' },
  worldCupStatLabel: { fontSize: SIZES.fontXs, color: '#A5D6A7', marginTop: 2 },
  worldCupReady: {
    flexDirection: 'row', alignItems: 'center', marginTop: SIZES.md,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: SIZES.radiusMd, padding: SIZES.sm,
  },
  worldCupReadyText: { fontSize: SIZES.fontXs, color: '#A5D6A7', marginLeft: SIZES.sm, flex: 1 },

  // Problématique
  problemCard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.lg, marginTop: SIZES.lg,
    borderRadius: SIZES.radiusLg, padding: SIZES.lg, ...SHADOWS.light,
  },
  problemTitle: { fontSize: SIZES.fontLg, fontWeight: '600', color: COLORS.textPrimary, marginTop: SIZES.sm, marginBottom: SIZES.sm },
  problemText: { fontSize: SIZES.fontSm, color: COLORS.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  problemSolution: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.success + '10',
    borderRadius: SIZES.radiusMd, padding: SIZES.md, marginTop: SIZES.md,
  },
  problemSolutionText: { flex: 1, fontSize: SIZES.fontSm, color: COLORS.success, fontWeight: '600', marginLeft: SIZES.sm },
});

export default ImpactScreen;

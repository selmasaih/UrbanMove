import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { parkingService } from '../../services/parkingService';
import { alertService } from '../../services/alertService';
import { userService } from '../../services/userService';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trafficStatus, setTrafficStatus] = useState('fluent');
  const [nearbyParkings, setNearbyParkings] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [alertStats, setAlertStats] = useState({ total: 0 });

  const loadData = useCallback(async () => {
    try {
      // Charger les données en parallèle
      const [alertsResult, statsResult, reservationResult, walletResult] = await Promise.allSettled([
        alertService.getAlerts({ city: user?.preferences?.defaultCity || 'rabat', limit: 5, status: 'active' }),
        alertService.getAlertStats(),
        parkingService.getActiveReservation(),
        userService.getWallet(1, 1),
      ]);

      if (alertsResult.status === 'fulfilled' && alertsResult.value.success) {
        setAlerts(alertsResult.value.data?.data || []);
      }
      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        setAlertStats(statsResult.value.data?.data || { total: 0 });
      }
      if (reservationResult.status === 'fulfilled' && reservationResult.value.success) {
        setActiveReservation(reservationResult.value.data?.data || null);
      }
      if (walletResult.status === 'fulfilled' && walletResult.value.success) {
        setWalletBalance(walletResult.value.data?.data?.balance || 0);
      }
    } catch (error) {
      console.log('Erreur chargement données accueil:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getTrafficColor = () => {
    switch (trafficStatus) {
      case 'fluent': return COLORS.trafficFluent;
      case 'moderate': return COLORS.trafficModerate;
      case 'dense': return COLORS.trafficDense;
      default: return COLORS.trafficBlocked;
    }
  };

  const getTrafficText = () => {
    switch (trafficStatus) {
      case 'fluent': return 'Fluide';
      case 'moderate': return 'Modéré';
      case 'dense': return 'Dense';
      default: return 'Bloqué';
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `Il y a ${diffD}j`;
  };

  const quickActions = [
    {
      id: 'parking',
      icon: 'car',
      label: 'Trouver\nParking',
      color: COLORS.primary,
      onPress: () => navigation.navigate('Parking'),
    },
    {
      id: 'navigate',
      icon: 'navigate',
      label: 'Calculer\nItinéraire',
      color: COLORS.secondary,
      onPress: () => navigation.navigate('Navigation'),
    },
    {
      id: 'alerts',
      icon: 'warning',
      label: 'Voir\nAlertes',
      color: COLORS.accent,
      onPress: () => navigation.navigate('Alerts'),
    },
    {
      id: 'history',
      icon: 'time',
      label: 'Mon\nHistorique',
      color: COLORS.primaryDark,
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {user?.firstName || 'Utilisateur'} 👋
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
            {alerts.length > 0 && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
        </View>

        {/* Traffic Status Card */}
        <View style={styles.trafficCard}>
          <View style={styles.trafficHeader}>
            <Ionicons name="speedometer" size={24} color={COLORS.white} />
            <Text style={styles.trafficTitle}>État du Trafic</Text>
          </View>
          <View style={styles.trafficContent}>
            <View style={styles.trafficIndicator}>
              <View style={[styles.trafficDot, { backgroundColor: getTrafficColor() }]} />
              <Text style={styles.trafficText}>{getTrafficText()}</Text>
            </View>
            <Text style={styles.trafficLocation}>📍 Rabat Centre</Text>
          </View>
          <View style={styles.trafficStats}>
            <View style={styles.trafficStat}>
              <Text style={styles.statValue}>15 min</Text>
              <Text style={styles.statLabel}>Temps moyen</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.trafficStat}>
              <Text style={styles.statValue}>{nearbyParkings}</Text>
              <Text style={styles.statLabel}>Parkings proches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.trafficStat}>
              <Text style={styles.statValue}>{alertStats.total || 0}</Text>
              <Text style={styles.statLabel}>Alertes actives</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.onPress}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={28} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Reservation Banner */}
        {activeReservation && (
          <TouchableOpacity 
            style={styles.reservationBanner}
            onPress={() => navigation.navigate('Parking')}
          >
            <View style={styles.reservationBannerIcon}>
              <Ionicons name="car" size={24} color={COLORS.white} />
            </View>
            <View style={styles.reservationBannerContent}>
              <Text style={styles.reservationBannerTitle}>Réservation active</Text>
              <Text style={styles.reservationBannerText}>
                {activeReservation.parking?.name || 'Parking'} • {activeReservation.confirmationCode}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Wallet Quick Access */}
        <TouchableOpacity 
          style={styles.walletCard}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.walletLeft}>
            <Ionicons name="wallet" size={24} color={COLORS.success} />
            <View style={styles.walletInfo}>
              <Text style={styles.walletLabel}>Mon portefeuille</Text>
              <Text style={styles.walletBalance}>{walletBalance} DH</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.walletTopup}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
            <Text style={styles.walletTopupText}>Recharger</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertes récentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {alerts.length > 0 ? alerts.slice(0, 3).map((alert) => {
            const alertTypeConfig = {
              accident: { icon: 'car', color: COLORS.error },
              works: { icon: 'construct', color: COLORS.warning },
              traffic: { icon: 'speedometer', color: COLORS.accent },
              event: { icon: 'calendar', color: COLORS.info },
              closure: { icon: 'close-circle', color: COLORS.error },
              police: { icon: 'shield', color: COLORS.primary },
              weather: { icon: 'cloud', color: COLORS.info },
            };
            const typeConfig = alertTypeConfig[alert.type] || alertTypeConfig.traffic;
            const timeAgo = getTimeAgo(alert.createdAt);

            return (
              <View key={alert._id} style={styles.alertCard}>
                <View style={[styles.alertIcon, { backgroundColor: typeConfig.color + '20' }]}>
                  <Ionicons name={typeConfig.icon} size={24} color={typeConfig.color} />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
                  <Text style={styles.alertDescription} numberOfLines={1}>
                    {alert.description}
                  </Text>
                  <Text style={styles.alertTime}>{timeAgo}</Text>
                </View>
              </View>
            );
          }) : (
            <View style={styles.emptyAlerts}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
              <Text style={styles.emptyAlertsText}>Aucune alerte active</Text>
            </View>
          )}
        </View>

        {/* Smart Features Promo */}
        <View style={styles.promoCard}>
          <View style={styles.promoContent}>
            <Ionicons name="bulb" size={32} color={COLORS.accent} />
            <View style={styles.promoText}>
              <Text style={styles.promoTitle}>Feux Intelligents</Text>
              <Text style={styles.promoDescription}>
                Nos itinéraires s'adaptent aux feux de circulation en temps réel
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: SIZES.xxl }} />
      </ScrollView>
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
    paddingTop: SIZES.md,
    paddingBottom: SIZES.lg,
  },
  greeting: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: SIZES.fontXxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
  },
  trafficCard: {
    marginHorizontal: SIZES.lg,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.medium,
  },
  trafficHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  trafficTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SIZES.sm,
  },
  trafficContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  trafficIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trafficDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SIZES.sm,
  },
  trafficText: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  trafficLocation: {
    fontSize: SIZES.fontSm,
    color: COLORS.white,
    opacity: 0.9,
  },
  trafficStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
  },
  trafficStat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: SIZES.sm,
  },
  section: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  seeAllText: {
    fontSize: SIZES.fontMd,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: SIZES.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - SIZES.lg * 2 - SIZES.md) / 2,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  quickActionLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  reservationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
    backgroundColor: COLORS.success,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    ...SHADOWS.medium,
  },
  reservationBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  reservationBannerContent: {
    flex: 1,
  },
  reservationBannerTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.white,
  },
  reservationBannerText: {
    fontSize: SIZES.fontSm,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.md,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletInfo: {
    marginLeft: SIZES.sm,
  },
  walletLabel: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  walletBalance: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  walletTopup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
  },
  walletTopupText: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 2,
  },
  emptyAlerts: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  emptyAlertsText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.light,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  alertDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  alertTime: {
    fontSize: SIZES.fontXs,
    color: COLORS.gray,
    marginTop: 4,
  },
  promoCard: {
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.lg,
    backgroundColor: COLORS.accent + '15',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoText: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  promoTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  promoDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default HomeScreen;

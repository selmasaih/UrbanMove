import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { alertService } from '../../services/alertService';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

// Types d'alertes
const ALERT_TYPES = {
  accident: { icon: 'car', color: COLORS.error, label: 'Accident' },
  works: { icon: 'construct', color: COLORS.warning, label: 'Travaux' },
  construction: { icon: 'construct', color: COLORS.warning, label: 'Travaux' },
  event: { icon: 'calendar', color: COLORS.info, label: 'Événement' },
  closure: { icon: 'close-circle', color: COLORS.error, label: 'Fermeture' },
  traffic: { icon: 'speedometer', color: COLORS.accent, label: 'Trafic' },
  police: { icon: 'shield', color: COLORS.primary, label: 'Police' },
  weather: { icon: 'cloud', color: COLORS.info, label: 'Météo' },
  other: { icon: 'information-circle', color: COLORS.gray, label: 'Autre' },
};

const SOURCE_CONFIG = {
  sensor: { icon: 'hardware-chip', label: 'Capteur IoT', color: COLORS.success },
  authority: { icon: 'shield-checkmark', label: 'Autorités', color: COLORS.primary },
  system: { icon: 'analytics', label: 'Système IA', color: COLORS.accent },
  user: { icon: 'person', label: 'Citoyen', color: COLORS.info },
};

const AlertsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [liveFeed, setLiveFeed] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newAlert, setNewAlert] = useState({ type: 'traffic', title: '', description: '', location: '' });
  const [submitting, setSubmitting] = useState(false);

  const filters = [
    { id: 'all', label: 'Tout' },
    { id: 'accident', label: 'Accidents' },
    { id: 'works', label: 'Travaux' },
    { id: 'event', label: 'Événements' },
    { id: 'traffic', label: 'Trafic' },
    { id: 'closure', label: 'Fermetures' },
    { id: 'weather', label: 'Météo' },
  ];

  const loadAlerts = useCallback(async () => {
    try {
      const params = {
        city: user?.preferences?.defaultCity || 'rabat',
        status: 'active',
        limit: 30,
      };
      if (selectedFilter !== 'all') params.type = selectedFilter;

      const [alertsRes, statsRes, liveFeedRes] = await Promise.allSettled([
        alertService.getAlerts(params),
        alertService.getAlertStats(),
        alertService.getLiveFeed(user?.preferences?.defaultCity || 'rabat'),
      ]);

      if (alertsRes.status === 'fulfilled' && alertsRes.value.success) {
        setAlerts(alertsRes.value.data?.data || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStats(statsRes.value.data?.data || null);
      }
      if (liveFeedRes.status === 'fulfilled' && liveFeedRes.value.success) {
        setLiveFeed(liveFeedRes.value.data?.data || null);
      }
    } catch (error) {
      console.log('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedFilter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleConfirm = async (alertId) => {
    try {
      const res = await alertService.confirmAlert(alertId);
      if (res.success) {
        setAlerts(prev => prev.map(a => 
          a._id === alertId ? { ...a, confirmations: (a.confirmations || 0) + 1 } : a
        ));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de confirmer cette alerte');
    }
  };

  const handleDismiss = async (alertId) => {
    try {
      await alertService.dismissAlert(alertId);
      setAlerts(prev => prev.filter(a => a._id !== alertId));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de masquer cette alerte');
    }
  };

  const handleSubmitAlert = async () => {
    if (!newAlert.title.trim() || !newAlert.description.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le titre et la description');
      return;
    }
    setSubmitting(true);
    try {
      const res = await alertService.createAlert({
        ...newAlert,
        city: user?.preferences?.defaultCity || 'rabat',
      });
      if (res.success) {
        setShowReportModal(false);
        setNewAlert({ type: 'traffic', title: '', description: '', location: '' });
        Alert.alert('Succès', 'Alerte signalée avec succès');
        loadAlerts();
      }
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer l\'alerte');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAlerts = selectedFilter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === selectedFilter);

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      default: return COLORS.info;
    }
  };

  const renderAlertCard = (alert) => {
    const alertType = ALERT_TYPES[alert.type] || ALERT_TYPES.traffic;
    const sourceConfig = SOURCE_CONFIG[alert.source] || SOURCE_CONFIG.user;
    
    return (
      <TouchableOpacity key={alert._id || alert.id} style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertIcon, { backgroundColor: alertType.color + '20' }]}>
            <Ionicons name={alertType.icon} size={24} color={alertType.color} />
          </View>
          <View style={styles.alertInfo}>
            <View style={styles.alertTitleRow}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <View style={[styles.severityDot, { backgroundColor: getSeverityColor(alert.severity) }]} />
            </View>
            <View style={styles.alertMeta}>
              <Text style={styles.alertType}>{alertType.label}</Text>
              <Text style={styles.alertTime}>{getTimeAgo(alert.createdAt)}</Text>
              {alert.confirmations > 0 && (
                <Text style={styles.confirmCount}>✓ {alert.confirmations}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Source IoT Badge */}
        <View style={styles.sourceBadge}>
          <Ionicons name={sourceConfig.icon} size={12} color={sourceConfig.color} />
          <Text style={[styles.sourceBadgeText, { color: sourceConfig.color }]}>
            {sourceConfig.label}
          </Text>
          {alert.source === 'sensor' && (
            <View style={styles.sensorLive}>
              <View style={styles.sensorLiveDot} />
              <Text style={styles.sensorLiveText}>LIVE</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.alertDescription}>{alert.description}</Text>
        
        <View style={styles.alertFooter}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray} />
            <Text style={styles.alertLocation}>{alert.address?.street ? `${alert.address.street}, ${alert.address.city || ''}` : (alert.address?.city || alert.city || 'Position inconnue')}</Text>
          </View>
          
          {(alert.estimatedEnd || alert.endDate) && (
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.gray} />
              <Text style={styles.alertDate}>Fin estimée : {new Date(alert.estimatedEnd || alert.endDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          )}
        </View>

        <View style={styles.alertActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleConfirm(alert._id)}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.success} />
            <Text style={[styles.actionButtonText, { color: COLORS.success }]}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDismiss(alert._id)}>
            <Ionicons name="eye-off-outline" size={18} color={COLORS.gray} />
            <Text style={[styles.actionButtonText, { color: COLORS.gray }]}>Masquer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Partager</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Alertes</Text>
        <TouchableOpacity style={styles.reportButton} onPress={() => setShowReportModal(true)}>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
          <Text style={styles.reportButtonText}>Signaler</Text>
        </TouchableOpacity>
      </View>

      {/* IoT Live Feed Banner */}
      {liveFeed?.feedStats && (
        <View style={styles.liveFeedBanner}>
          <View style={styles.liveFeedHeader}>
            <View style={styles.liveFeedDot} />
            <Text style={styles.liveFeedTitle}>Flux IoT en direct</Text>
          </View>
          <View style={styles.liveFeedStats}>
            <View style={styles.liveFeedStat}>
              <Ionicons name="hardware-chip" size={14} color={COLORS.success} />
              <Text style={styles.liveFeedStatText}>{liveFeed.feedStats.fromSensors} capteurs</Text>
            </View>
            <View style={styles.liveFeedStat}>
              <Ionicons name="pulse" size={14} color={COLORS.accent} />
              <Text style={styles.liveFeedStatText}>{liveFeed.feedStats.liveNow} live</Text>
            </View>
            <View style={styles.liveFeedStat}>
              <Ionicons name="wifi" size={14} color={COLORS.info} />
              <Text style={styles.liveFeedStatText}>{liveFeed.feedStats.networkStatus}</Text>
            </View>
          </View>
          <Text style={styles.liveFeedCoverage}>{liveFeed.feedStats.sensorCoverage}</Text>
        </View>
      )}

      {/* Stats Bar */}
      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.last24h || 0}</Text>
            <Text style={styles.statLabel}>24h</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.byType?.accident || 0}</Text>
            <Text style={[styles.statLabel, { color: COLORS.error }]}>Accidents</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.byType?.works || 0}</Text>
            <Text style={[styles.statLabel, { color: COLORS.warning }]}>Travaux</Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter.id && styles.filterChipTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Active Alerts Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredAlerts.length} alerte{filteredAlerts.length > 1 ? 's' : ''} active{filteredAlerts.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Alerts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.alertsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(renderAlertCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
              <Text style={styles.emptyTitle}>Aucune alerte</Text>
              <Text style={styles.emptyText}>
                Il n'y a pas d'alerte active pour ce type actuellement.
              </Text>
            </View>
          )}
          <View style={{ height: SIZES.xxl }} />
        </ScrollView>
      )}

      {/* Report Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Signaler une alerte</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Type d'alerte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {Object.entries(ALERT_TYPES).map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.typeChip, newAlert.type === key && { backgroundColor: config.color + '20', borderColor: config.color }]}
                  onPress={() => setNewAlert(prev => ({ ...prev, type: key }))}
                >
                  <Ionicons name={config.icon} size={16} color={newAlert.type === key ? config.color : COLORS.gray} />
                  <Text style={[styles.typeChipText, newAlert.type === key && { color: config.color }]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Titre</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Accident sur l'autoroute"
              value={newAlert.title}
              onChangeText={(t) => setNewAlert(prev => ({ ...prev, title: t }))}
            />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Décrivez la situation..."
              multiline
              numberOfLines={3}
              value={newAlert.description}
              onChangeText={(t) => setNewAlert(prev => ({ ...prev, description: t }))}
            />

            <Text style={styles.modalLabel}>Localisation (optionnel)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Boulevard Mohammed V"
              value={newAlert.location}
              onChangeText={(t) => setNewAlert(prev => ({ ...prev, location: t }))}
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitAlert}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Envoyer l'alerte</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
  },
  reportButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SIZES.xs,
  },
  filterContainer: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
  },
  filterChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white,
    marginRight: SIZES.sm,
    ...SHADOWS.light,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  countContainer: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.sm,
  },
  countText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.fontLg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCount: {
    fontSize: SIZES.fontXs,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SIZES.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  modalLabel: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
    marginTop: SIZES.md,
  },
  typeSelector: {
    flexDirection: 'row',
    maxHeight: 50,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    marginRight: SIZES.xs,
  },
  typeChipText: {
    fontSize: SIZES.fontSm,
    color: COLORS.gray,
    marginLeft: 4,
  },
  modalInput: {
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontMd,
    fontWeight: '600',
  },
  alertsList: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
  },
  alertCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.light,
  },
  alertHeader: {
    flexDirection: 'row',
    marginBottom: SIZES.sm,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SIZES.sm,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  alertType: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
  },
  alertTime: {
    fontSize: SIZES.fontXs,
    color: COLORS.gray,
    marginLeft: SIZES.sm,
  },
  alertDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SIZES.sm,
  },
  alertFooter: {
    marginBottom: SIZES.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: SIZES.fontSm,
    color: COLORS.gray,
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertDate: {
    fontSize: SIZES.fontSm,
    color: COLORS.gray,
    marginLeft: 4,
  },
  alertActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: SIZES.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.lg,
  },
  actionButtonText: {
    fontSize: SIZES.fontSm,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
  },
  emptyText: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },

  // IoT Source Badge
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    paddingVertical: 3,
    paddingHorizontal: SIZES.sm,
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusFull,
    alignSelf: 'flex-start',
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  sensorLive: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.sm,
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: SIZES.radiusFull,
  },
  sensorLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 3,
  },
  sensorLiveText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Live Feed Banner
  liveFeedBanner: {
    marginHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
    backgroundColor: '#1A237E',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
  },
  liveFeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  liveFeedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: SIZES.xs,
  },
  liveFeedTitle: {
    fontSize: SIZES.fontSm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveFeedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.xs,
  },
  liveFeedStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveFeedStatText: {
    fontSize: SIZES.fontXs,
    color: '#C5CAE9',
    marginLeft: 4,
  },
  liveFeedCoverage: {
    fontSize: 10,
    color: '#7986CB',
    textAlign: 'center',
  },
});

export default AlertsScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const RouteDetailScreen = ({ route, navigation }) => {
  const { route: routeData } = route.params;
  const steps = routeData?.steps || [];
  const smartLightsCount = routeData?.smartLightsCount || routeData?.smartLights || 3;
  const smartFeatures = routeData?.smartFeatures || {};
  const timeSaved = routeData?.timeSaved || (smartFeatures.timeSaved ? Math.round(smartFeatures.timeSaved / 60) : 3);
  const co2Saved = routeData?.co2Saved || smartFeatures.co2Saved || 414;
  const durationStandard = routeData?.durationStandard || (routeData?.duration ? routeData.duration + timeSaved : 0);
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du trajet</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Route Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Ionicons name="time-outline" size={28} color={COLORS.primary} />
              <Text style={styles.statValue}>{routeData.duration} min</Text>
              <Text style={styles.statLabel}>Durée estimée</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.summaryStat}>
              <Ionicons name="speedometer-outline" size={28} color={COLORS.secondary} />
              <Text style={styles.statValue}>{routeData.distance} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.summaryStat}>
              <Ionicons name="leaf-outline" size={28} color={COLORS.success} />
              <Text style={styles.statValue}>-{routeData.fuelSaving || 12}%</Text>
              <Text style={styles.statLabel}>Carburant</Text>
            </View>
          </View>
        </View>

        {/* Smart Features - Impact des feux intelligents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚦 Impact des feux intelligents</Text>
          
          {/* Comparaison avant/après */}
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonOld}>
                <Ionicons name="time-outline" size={20} color={COLORS.accent} />
                <Text style={styles.comparisonLabel}>Sans optimisation</Text>
                <Text style={styles.comparisonValueOld}>{durationStandard} min</Text>
              </View>
              <View style={styles.comparisonArrow}>
                <Ionicons name="arrow-forward" size={24} color={COLORS.success} />
              </View>
              <View style={styles.comparisonNew}>
                <Ionicons name="flash" size={20} color={COLORS.success} />
                <Text style={styles.comparisonLabel}>Avec IA</Text>
                <Text style={styles.comparisonValueNew}>{routeData.duration} min</Text>
              </View>
            </View>
            <View style={styles.savingsBadge}>
              <Ionicons name="trending-down" size={16} color={COLORS.white} />
              <Text style={styles.savingsBadgeText}>
                {timeSaved} min économisées grâce aux feux intelligents
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="bulb" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{smartLightsCount} feux intelligents détectés</Text>
              <Text style={styles.featureDescription}>
                Synchronisation IA en temps réel pour réduire le temps d'attente
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="leaf" size={24} color={COLORS.success} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>-{co2Saved}g de CO₂</Text>
              <Text style={styles.featureDescription}>
                Réduction des émissions grâce à l'optimisation du trafic
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.info + '20' }]}>
              <Ionicons name="car-sport" size={24} color={COLORS.info} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Trafic {routeData?.trafficStatus || 'fluide'}</Text>
              <Text style={styles.featureDescription}>
                Analyse en temps réel des conditions de circulation
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="analytics" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Économie estimée</Text>
              <Text style={styles.featureDescription}>
                Environ {Math.max(Math.round(co2Saved * 0.005), 1)} DH d'économie de carburant par trajet
              </Text>
            </View>
          </View>
        </View>

        {/* Turn by Turn */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          
          <View style={styles.stepsContainer}>
            {steps.length > 0 ? steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepIndicator}>
                  <View style={[
                    styles.stepDot,
                    index === 0 && styles.stepDotStart,
                    index === steps.length - 1 && styles.stepDotEnd
                  ]}>
                    {index === 0 && (
                      <Ionicons name="radio-button-on" size={16} color={COLORS.primary} />
                    )}
                    {index === steps.length - 1 && (
                      <Ionicons name="location" size={16} color={COLORS.accent} />
                    )}
                  </View>
                  {index < steps.length - 1 && (
                    <View style={styles.stepLine} />
                  )}
                </View>
                
                <View style={styles.stepContent}>
                  <View style={styles.stepIconContainer}>
                    <Ionicons 
                      name={
                        step.instruction?.includes('droite') ? 'arrow-forward' :
                        step.instruction?.includes('gauche') ? 'arrow-back' :
                        'arrow-up'
                      } 
                      size={20} 
                      color={COLORS.primary} 
                    />
                  </View>
                  <View style={styles.stepText}>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                    <View style={styles.stepMeta}>
                      <Text style={styles.stepDistance}>{step.distance}</Text>
                      <Text style={styles.stepDuration}>{step.duration}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )) : (
              <View style={{ alignItems: 'center', padding: SIZES.lg }}>
                <Ionicons name="navigate-outline" size={32} color={COLORS.gray} />
                <Text style={{ color: COLORS.textSecondary, marginTop: SIZES.sm, textAlign: 'center' }}>
                  Instructions détaillées disponibles au démarrage de la navigation
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Alerts on Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes sur le trajet</Text>
          
          <View style={styles.noAlertCard}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <Text style={styles.noAlertText}>
              Aucun incident signalé sur votre trajet
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        {isNavigating ? (
          <View style={styles.navigatingContainer}>
            <View style={styles.navigatingHeader}>
              <View style={styles.navigatingPulse} />
              <Text style={styles.navigatingText}>Navigation en cours...</Text>
            </View>
            <View style={styles.navigatingStats}>
              <View style={styles.navStatItem}>
                <Ionicons name="time" size={18} color={COLORS.primary} />
                <Text style={styles.navStatText}>{routeData.duration} min restantes</Text>
              </View>
              <View style={styles.navStatItem}>
                <Ionicons name="bulb" size={18} color={COLORS.success} />
                <Text style={styles.navStatText}>{smartLightsCount} feux optimisés</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: COLORS.accent }]}
              onPress={() => {
                setIsNavigating(false);
                Alert.alert(
                  'Navigation terminée',
                  `Vous avez économisé ${timeSaved} min et ${co2Saved}g de CO₂ grâce aux feux intelligents !`,
                  [{ text: 'Super !', onPress: () => navigation.goBack() }]
                );
              }}
            >
              <Ionicons name="stop-circle" size={24} color={COLORS.white} />
              <Text style={styles.startButtonText}>Arrêter la navigation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              setIsNavigating(true);
            }}
          >
            <Ionicons name="navigate" size={24} color={COLORS.white} />
            <Text style={styles.startButtonText}>Démarrer la navigation</Text>
          </TouchableOpacity>
        )}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  headerTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    ...SHADOWS.light,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SIZES.sm,
  },
  statLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: SIZES.sm,
  },
  section: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.lg,
  },
  sectionTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    ...SHADOWS.light,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  featureDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    ...SHADOWS.light,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotStart: {
    backgroundColor: COLORS.primary + '20',
  },
  stepDotEnd: {
    backgroundColor: COLORS.accent + '20',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: SIZES.md,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  stepText: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  stepMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  stepDistance: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginRight: SIZES.md,
  },
  stepDuration: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  noAlertCard: {
    backgroundColor: COLORS.success + '15',
    borderRadius: SIZES.radiusMd,
    padding: SIZES.lg,
    alignItems: 'center',
  },
  noAlertText: {
    fontSize: SIZES.fontMd,
    color: COLORS.success,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
  // Comparison card styles
  comparisonCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonOld: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  comparisonArrow: {
    paddingHorizontal: SIZES.sm,
  },
  comparisonNew: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.success + '10',
    borderRadius: SIZES.radiusMd,
  },
  comparisonLabel: {
    fontSize: SIZES.fontXs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  comparisonValueOld: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  comparisonValueNew: {
    fontSize: SIZES.fontXl,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: 2,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: SIZES.radiusMd,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.sm,
  },
  savingsBadgeText: {
    color: COLORS.white,
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    marginLeft: SIZES.xs,
  },
  // Navigation state styles
  navigatingContainer: {
  },
  navigatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  navigatingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    marginRight: SIZES.sm,
  },
  navigatingText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.success,
  },
  navigatingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.md,
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.sm,
  },
  navStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navStatText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SIZES.lg,
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    ...SHADOWS.dark,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    ...SHADOWS.medium,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    marginLeft: SIZES.sm,
  },
});

export default RouteDetailScreen;

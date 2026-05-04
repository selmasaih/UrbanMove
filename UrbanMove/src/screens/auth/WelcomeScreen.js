import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header avec illustration */}
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="car-sport" size={100} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>UrbanMove</Text>
        <Text style={styles.subtitle}>Smart Urban Mobility</Text>
        <View style={styles.wc2030Badge}>
          <Text style={styles.wc2030Emoji}>⚽</Text>
          <Text style={styles.wc2030Text}>Prêt pour la Coupe du Monde 2030</Text>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: COLORS.primaryLight + '30' }]}>
            <Ionicons name="car" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Parking Intelligent</Text>
            <Text style={styles.featureDescription}>
              Trouvez et réservez votre place en temps réel
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: COLORS.secondary + '30' }]}>
            <Ionicons name="navigate" size={28} color={COLORS.secondary} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Navigation Optimisée</Text>
            <Text style={styles.featureDescription}>
              Itinéraires adaptés au trafic en temps réel
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: COLORS.accent + '30' }]}>
            <Ionicons name="notifications" size={28} color={COLORS.accent} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Alertes Instantanées</Text>
            <Text style={styles.featureDescription}>
              Soyez informé des incidents et travaux
            </Text>
          </View>
        </View>
      </View>

      {/* Boutons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.primaryButtonText}>Créer un compte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🇲🇦 Pour les villes de Rabat, Casablanca, Tanger, Marrakech, Fes et Agadir
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: height * 0.06,
    paddingBottom: SIZES.lg,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: SIZES.fontLg,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  wc2030Badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    marginTop: SIZES.sm,
  },
  wc2030Emoji: {
    fontSize: 16,
    marginRight: SIZES.xs,
  },
  wc2030Text: {
    fontSize: SIZES.fontXs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  featuresContainer: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    borderRadius: SIZES.radiusLg,
    marginBottom: SIZES.md,
    ...SHADOWS.light,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: SIZES.fontLg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  featureDescription: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  buttonsContainer: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    marginBottom: SIZES.md,
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.fontLg,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: SIZES.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
});

export default WelcomeScreen;

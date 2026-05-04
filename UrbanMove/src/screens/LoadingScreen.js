import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Ionicons name="car-sport" size={80} color={COLORS.primary} />
        <Text style={styles.title}>UrbanMove</Text>
        <Text style={styles.subtitle}>Smart Urban Mobility</Text>
      </View>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.xxl,
  },
  title: {
    fontSize: SIZES.fontTitle,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SIZES.md,
  },
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
  },
});

export default LoadingScreen;

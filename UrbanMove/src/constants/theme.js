// Couleurs principales de l'application UrbanMove
export const COLORS = {
  primary: '#1E88E5',       // Bleu principal
  primaryDark: '#1565C0',   // Bleu foncé
  primaryLight: '#64B5F6',  // Bleu clair
  secondary: '#26A69A',     // Vert teal
  accent: '#FF7043',        // Orange accent
  
  // Couleurs de statut
  success: '#4CAF50',       // Vert succès
  warning: '#FFC107',       // Jaune avertissement
  error: '#F44336',         // Rouge erreur
  info: '#2196F3',          // Bleu info
  
  // Couleurs neutres
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  grayLight: '#F5F5F5',
  grayDark: '#616161',
  
  // Couleurs de fond
  background: '#F8F9FA',
  surface: '#FFFFFF',
  
  // Couleurs de texte
  textPrimary: '#212121',
  textSecondary: '#757575',
  textLight: '#FFFFFF',
  
  // Couleurs spécifiques parking
  parkingFree: '#4CAF50',      // Place libre
  parkingOccupied: '#F44336',  // Place occupée
  parkingReserved: '#FF9800',  // Place réservée
  
  // Couleurs trafic
  trafficFluent: '#4CAF50',    // Trafic fluide
  trafficModerate: '#FFC107',  // Trafic modéré
  trafficDense: '#FF5722',     // Trafic dense
  trafficBlocked: '#F44336',   // Trafic bloqué

  // Couleurs review/rating
  star: '#FFC107',
  starEmpty: '#E0E0E0',
};

// Couleurs mode sombre
export const DARK_COLORS = {
  ...COLORS,
  background: '#121212',
  surface: '#1E1E1E',
  white: '#1E1E1E',
  black: '#FFFFFF',
  grayLight: '#2C2C2C',
  grayDark: '#B0B0B0',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textLight: '#FFFFFF',
};

export const SIZES = {
  // Marges et padding
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Tailles de police
  fontXs: 10,
  fontSm: 12,
  fontMd: 14,
  fontLg: 16,
  fontXl: 20,
  fontXxl: 24,
  fontTitle: 28,
  
  // Border radius
  radiusSm: 4,
  radiusMd: 8,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 9999,
  
  // Icônes
  iconSm: 16,
  iconMd: 24,
  iconLg: 32,
  iconXl: 48,
};

export const FONTS = {
  regular: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '500',
  },
  semiBold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export default { COLORS, DARK_COLORS, SIZES, FONTS, SHADOWS };

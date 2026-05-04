// Configuration de l'API
const DEV_API_URL = 'http://172.20.10.13:5001/api'; // IP du PC via hotspot
const ANDROID_API_URL = 'http://10.0.2.2:5001/api'; // Pour émulateur Android
const PROD_API_URL = 'https://urbanmove-production-3c94.up.railway.app/api';

// En dev (Expo Go) → utilise l'IP locale, en production (APK) → utilise Railway
export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// Points de terminaison API
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password', // + /:token
  VERIFY_EMAIL: '/auth/verify-email', // + /:token
  CHANGE_PASSWORD: '/auth/change-password',

  // Parking
  PARKINGS: '/parkings',
  PARKING_DETAIL: '/parkings/', // + id
  PARKING_NEARBY: '/parkings/nearby',
  PARKING_FEATURED: '/parkings/featured',
  PARKING_STATS: '/parkings/stats',
  PARKING_RESERVE: '/parkings/', // + id + /reserve
  PARKING_REVIEWS: '/parkings/', // + id + /reviews

  // Reservations
  MY_RESERVATIONS: '/parkings/reservations/my',
  ACTIVE_RESERVATION: '/parkings/reservations/active',
  CANCEL_RESERVATION: '/parkings/reservations/', // + id + /cancel
  EXTEND_RESERVATION: '/parkings/reservations/', // + id + /extend
  RATE_RESERVATION: '/parkings/reservations/', // + id + /rate

  // Navigation
  CALCULATE_ROUTE: '/navigation/route',
  TRAFFIC_STATUS: '/navigation/traffic',
  TRAFFIC_LIGHTS: '/navigation/traffic-lights',
  SMART_LIGHTS: '/navigation/smart-lights',
  ALTERNATIVE_ROUTES: '/navigation/alternatives',

  // Alerts
  ALERTS: '/alerts',
  ALERTS_NEARBY: '/alerts/nearby',
  ALERTS_STATS: '/alerts/stats/summary',
  ALERTS_MY: '/alerts/my',
  ALERTS_IOT_GENERATE: '/alerts/iot/generate',
  ALERTS_IOT_LIVE_FEED: '/alerts/iot/live-feed',

  // Reviews
  REVIEWS: '/reviews',
  MY_REVIEWS: '/reviews/my',

  // IoT
  IOT_SENSORS: '/iot/sensors/', // + parkingId
  IOT_DASHBOARD: '/iot/dashboard',
  IOT_LIVE: '/iot/parking/', // + parkingId + /live
  IOT_SMART_LIGHTS_ANALYTICS: '/iot/smart-lights/analytics',
  IOT_NETWORK_STATUS: '/iot/network/status',
  IOT_CITY_ANALYTICS: '/iot/city/', // + cityName + /analytics

  // User
  USER_VEHICLES: '/user/vehicles',
  USER_WALLET: '/user/wallet',
  USER_WALLET_TOPUP: '/user/wallet/topup',
  USER_FAVORITES: '/user/favorites',
  USER_FAVORITES_PARKINGS: '/user/favorites/parkings', // + /:id
  USER_FAVORITES_PLACES: '/user/favorites/places', // + /:id
  USER_STATS: '/user/stats',
  USER_HISTORY: '/user/history',
  USER_PREFERENCES: '/user/preferences',
  USER_PUSH_TOKEN: '/user/push-token',
  USER_DELETE: '/user/account',
};

// Villes supportées
export const CITIES = [
  { id: 'rabat', name: 'Rabat', lat: 34.0209, lng: -6.8416 },
  { id: 'casablanca', name: 'Casablanca', lat: 33.5731, lng: -7.5898 },
  { id: 'tanger', name: 'Tanger', lat: 35.7595, lng: -5.8340 },
  { id: 'marrakech', name: 'Marrakech', lat: 31.6295, lng: -7.9811 },
  { id: 'fes', name: 'Fès', lat: 34.0181, lng: -5.0078 },
  { id: 'agadir', name: 'Agadir', lat: 30.4278, lng: -9.5981 },
];

// Clés de stockage local
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@urbanmove_token',
  REFRESH_TOKEN: '@urbanmove_refresh_token',
  USER_DATA: '@urbanmove_user',
  SETTINGS: '@urbanmove_settings',
  RECENT_SEARCHES: '@urbanmove_recent_searches',
  DARK_MODE: '@urbanmove_dark_mode',
  DEFAULT_CITY: '@urbanmove_default_city',
};

// App constants
export const APP_VERSION = '2.0.0';
export const MAX_VEHICLES = 5;
export const MAX_FAVORITE_PLACES = 10;
export const WALLET_MIN_TOPUP = 10;
export const WALLET_MAX_TOPUP = 10000;

export default { API_URL, ENDPOINTS, CITIES, STORAGE_KEYS, APP_VERSION };

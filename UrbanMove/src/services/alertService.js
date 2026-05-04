import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/config';

export const alertService = {
  // Récupérer toutes les alertes avec filtres
  getAlerts: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.ALERTS, { params });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des alertes',
      };
    }
  },

  // Alertes à proximité
  getNearbyAlerts: async (latitude, longitude, radius = 5000) => {
    try {
      const response = await apiClient.get(ENDPOINTS.ALERTS_NEARBY, {
        params: { lat: latitude, lng: longitude, radius },
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la recherche des alertes proches',
      };
    }
  },

  // Mes alertes signalées
  getMyAlerts: async (page = 1) => {
    try {
      const response = await apiClient.get(ENDPOINTS.ALERTS_MY, {
        params: { page },
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération de vos alertes',
      };
    }
  },

  // Statistiques des alertes
  getAlertStats: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.ALERTS_STATS);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des statistiques',
      };
    }
  },

  // Détail d'une alerte
  getAlert: async (alertId) => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.ALERTS}/${alertId}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de la récupération de l'alerte",
      };
    }
  },

  // Signaler une alerte
  createAlert: async (alertData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.ALERTS, alertData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors du signalement',
      };
    }
  },

  // Confirmer une alerte
  confirmAlert: async (alertId) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.ALERTS}/${alertId}/confirm`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de la confirmation de l'alerte",
      };
    }
  },

  // Infirmer une alerte
  dismissAlert: async (alertId) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.ALERTS}/${alertId}/dismiss`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de l'infirmation de l'alerte",
      };
    }
  },

  // Résoudre une alerte
  resolveAlert: async (alertId) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.ALERTS}/${alertId}/resolve`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de la résolution de l'alerte",
      };
    }
  },

  // Flux d'alertes IoT en temps réel
  getLiveFeed: async (city) => {
    try {
      const params = {};
      if (city) params.city = city;
      const response = await apiClient.get(ENDPOINTS.ALERTS_IOT_LIVE_FEED, { params });
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur flux temps réel',
      };
    }
  },

  // Forcer la génération d'alertes IoT
  triggerIoTGeneration: async () => {
    try {
      const response = await apiClient.post(ENDPOINTS.ALERTS_IOT_GENERATE);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur génération IoT',
      };
    }
  },
};

export default alertService;

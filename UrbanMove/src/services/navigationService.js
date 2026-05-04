import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/config';

export const navigationService = {
  /**
   * Calculer un itinéraire optimisé
   * @param {Object} origin - Point de départ {lat, lng}
   * @param {Object} destination - Point d'arrivée {lat, lng}
   * @param {Object} options - Options de navigation
   * @returns {Promise} - Itinéraire avec instructions
   */
  calculateRoute: async (origin, destination, options = {}) => {
    try {
      const response = await apiClient.post(ENDPOINTS.CALCULATE_ROUTE, {
        origin,
        destination,
        avoidTraffic: options.avoidTraffic || true,
        mode: options.mode || 'driving', // driving, walking, transit
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors du calcul de l\'itinéraire' 
      };
    }
  },

  /**
   * Récupérer l'état du trafic en temps réel
   * @param {string} cityId - ID de la ville
   * @returns {Promise} - État du trafic par zone
   */
  getTrafficStatus: async (cityId) => {
    try {
      const response = await apiClient.get(ENDPOINTS.TRAFFIC_STATUS, {
        params: { city: cityId },
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération du trafic' 
      };
    }
  },

  /**
   * Récupérer l'état des feux intelligents
   * @param {Object} location - Position actuelle {lat, lng}
   * @param {number} radius - Rayon en mètres
   * @returns {Promise} - État des feux à proximité
   */
  getSmartTrafficLights: async (location, radius = 1000) => {
    try {
      const response = await apiClient.get('/navigation/traffic-lights', {
        params: { 
          lat: location.lat, 
          lng: location.lng, 
          radius 
        },
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des feux' 
      };
    }
  },

  /**
   * Récupérer les alertes de circulation
   * @param {string} cityId - ID de la ville
   * @param {Array} types - Types d'alertes (accident, works, event)
   * @returns {Promise} - Liste des alertes actives
   */
  getAlerts: async (cityId, types = []) => {
    try {
      const response = await apiClient.get(ENDPOINTS.ALERTS, {
        params: { 
          city: cityId, 
          types: types.join(',') 
        },
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des alertes' 
      };
    }
  },

  /**
   * Signaler un incident
   * @param {Object} alertData - Données de l'alerte
   * @returns {Promise}
   */
  reportAlert: async (alertData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.ALERTS, alertData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors du signalement' 
      };
    }
  },

  /**
   * S'abonner aux alertes d'une zone
   * @param {Object} subscription - Données d'abonnement
   * @returns {Promise}
   */
  subscribeToAlerts: async (subscription) => {
    try {
      const response = await apiClient.post(ENDPOINTS.ALERT_SUBSCRIBE, subscription);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de l\'abonnement' 
      };
    }
  },

  /**
   * Obtenir des suggestions d'itinéraires alternatifs
   * @param {Object} origin - Point de départ
   * @param {Object} destination - Point d'arrivée
   * @returns {Promise} - Liste d'itinéraires alternatifs
   */
  getAlternativeRoutes: async (origin, destination) => {
    try {
      const response = await apiClient.post('/navigation/alternatives', {
        origin,
        destination,
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la recherche d\'alternatives' 
      };
    }
  },
};

export default navigationService;

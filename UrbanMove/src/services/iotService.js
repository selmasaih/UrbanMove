import apiClient from './apiClient';

/**
 * Service IoT - Capteurs intelligents de stationnement
 * Système basé sur les technologies IoT (LoRaWAN + Capteurs ultrasoniques)
 */
export const iotService = {
  /**
   * Obtenir l'état des capteurs d'un parking
   */
  getSensorData: async (parkingId) => {
    try {
      const response = await apiClient.get(`/iot/sensors/${parkingId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur capteurs IoT' };
    }
  },

  /**
   * Tableau de bord IoT global - impact environnemental et économique
   */
  getDashboard: async (city) => {
    try {
      const params = city ? { city } : {};
      const response = await apiClient.get('/iot/dashboard', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur dashboard IoT' };
    }
  },

  /**
   * Données live d'un parking (historique + prédictions)
   */
  getLiveData: async (parkingId) => {
    try {
      const response = await apiClient.get(`/iot/parking/${parkingId}/live`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur données live' };
    }
  },

  /**
   * Analytiques des feux intelligents - impact détaillé et données horaires
   */
  getSmartLightsAnalytics: async () => {
    try {
      const response = await apiClient.get('/iot/smart-lights/analytics');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur smart lights analytics' };
    }
  },

  /**
   * État du réseau IoT - capteurs, passerelles, architecture
   */
  getNetworkStatus: async () => {
    try {
      const response = await apiClient.get('/iot/network/status');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur network status' };
    }
  },

  /**
   * Analytiques IoT détaillées par ville
   */
  getCityAnalytics: async (cityName) => {
    try {
      const response = await apiClient.get(`/iot/city/${cityName}/analytics`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur city analytics' };
    }
  },
};

export default iotService;

import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/config';

export const parkingService = {
  // Récupérer tous les parkings avec filtres
  getParkings: async (filters = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PARKINGS, { params: filters });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des parkings',
      };
    }
  },

  // Rechercher des parkings
  searchParkings: async (query, filters = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PARKINGS, {
        params: { search: query, ...filters },
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la recherche',
      };
    }
  },

  // Parkings à proximité
  getNearbyParkings: async (latitude, longitude, radius = 2000) => {
    try {
      const response = await apiClient.get(ENDPOINTS.PARKING_NEARBY, {
        params: { lat: latitude, lng: longitude, radius },
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la recherche de parkings',
      };
    }
  },

  // Parkings en vedette
  getFeaturedParkings: async (city) => {
    try {
      const params = city ? { city } : {};
      const response = await apiClient.get(ENDPOINTS.PARKING_FEATURED, { params });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des parkings vedettes',
      };
    }
  },

  // Statistiques globales parking
  getParkingStats: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.PARKING_STATS);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des statistiques',
      };
    }
  },

  // Détails d'un parking
  getParkingDetail: async (parkingId) => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.PARKINGS}/${parkingId}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération du parking',
      };
    }
  },

  // Avis d'un parking
  getParkingReviews: async (parkingId, params = {}) => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.PARKINGS}/${parkingId}/reviews`, { params });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des avis',
      };
    }
  },

  // Réserver une place
  reserveSpot: async (parkingId, reservationData) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.PARKINGS}/${parkingId}/reserve`, reservationData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la réservation',
      };
    }
  },

  // Mes réservations
  getMyReservations: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.MY_RESERVATIONS, { params });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des réservations',
      };
    }
  },

  // Réservation active
  getActiveReservation: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.ACTIVE_RESERVATION);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération de la réservation active',
      };
    }
  },

  // Annuler une réservation
  cancelReservation: async (reservationId, reason = '') => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.CANCEL_RESERVATION}${reservationId}/cancel`, {
        reason,
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de l'annulation",
      };
    }
  },

  // Prolonger une réservation
  extendReservation: async (reservationId, additionalHours) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.EXTEND_RESERVATION}${reservationId}/extend`, {
        additionalHours,
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la prolongation',
      };
    }
  },

  // Noter une réservation
  rateReservation: async (reservationId, score, comment = '') => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.RATE_RESERVATION}${reservationId}/rate`, {
        score,
        comment,
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la notation',
      };
    }
  },
};

export default parkingService;

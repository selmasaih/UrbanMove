import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/config';

export const reviewService = {
  // Récupérer les avis (avec filtres)
  getReviews: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.REVIEWS, { params });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des avis',
      };
    }
  },

  // Mes avis
  getMyReviews: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.MY_REVIEWS);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération de vos avis',
      };
    }
  },

  // Détail d'un avis
  getReview: async (reviewId) => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REVIEWS}/${reviewId}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de la récupération de l'avis",
      };
    }
  },

  // Créer un avis
  createReview: async (reviewData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.REVIEWS, reviewData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de la création de l'avis",
      };
    }
  },

  // Modifier un avis
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.REVIEWS}/${reviewId}`, reviewData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de la modification de l'avis",
      };
    }
  },

  // Supprimer un avis
  deleteReview: async (reviewId) => {
    try {
      const response = await apiClient.delete(`${ENDPOINTS.REVIEWS}/${reviewId}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de la suppression de l'avis",
      };
    }
  },

  // Marquer un avis comme utile
  toggleHelpful: async (reviewId) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.REVIEWS}/${reviewId}/helpful`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors du vote',
      };
    }
  },

  // Signaler un avis
  reportReview: async (reviewId, reason) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.REVIEWS}/${reviewId}/report`, { reason });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors du signalement',
      };
    }
  },
};

export default reviewService;

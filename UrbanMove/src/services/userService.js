import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/config';

export const userService = {
  // ===== VÉHICULES =====
  
  // Récupérer les véhicules
  getVehicles: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.USER_VEHICLES);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des véhicules',
      };
    }
  },

  // Ajouter un véhicule
  addVehicle: async (vehicleData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.USER_VEHICLES, vehicleData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de l'ajout du véhicule",
      };
    }
  },

  // Modifier un véhicule
  updateVehicle: async (vehicleId, vehicleData) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.USER_VEHICLES}/${vehicleId}`, vehicleData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la modification du véhicule',
      };
    }
  },

  // Supprimer un véhicule
  deleteVehicle: async (vehicleId) => {
    try {
      const response = await apiClient.delete(`${ENDPOINTS.USER_VEHICLES}/${vehicleId}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la suppression du véhicule',
      };
    }
  },

  // ===== PORTEFEUILLE =====
  
  // Récupérer le portefeuille et transactions
  getWallet: async (page = 1, limit = 20) => {
    try {
      const response = await apiClient.get(ENDPOINTS.USER_WALLET, {
        params: { page, limit },
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération du portefeuille',
      };
    }
  },

  // Recharger le portefeuille
  topupWallet: async (amount, paymentMethod = 'card') => {
    try {
      const response = await apiClient.post(ENDPOINTS.USER_WALLET_TOPUP, {
        amount,
        paymentMethod,
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la recharge',
      };
    }
  },

  // ===== FAVORIS =====
  
  // Récupérer les favoris
  getFavorites: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.USER_FAVORITES);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des favoris',
      };
    }
  },

  // Ajouter un parking aux favoris
  addFavoriteParking: async (parkingId) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.USER_FAVORITES_PARKINGS}/${parkingId}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de l'ajout aux favoris",
      };
    }
  },

  // Retirer un parking des favoris
  removeFavoriteParking: async (parkingId) => {
    try {
      const response = await apiClient.delete(`${ENDPOINTS.USER_FAVORITES_PARKINGS}/${parkingId}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors du retrait des favoris',
      };
    }
  },

  // Ajouter un lieu favori
  addFavoritePlace: async (placeData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.USER_FAVORITES_PLACES, placeData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de l'ajout du lieu favori",
      };
    }
  },

  // Supprimer un lieu favori
  removeFavoritePlace: async (placeId) => {
    try {
      const response = await apiClient.delete(`${ENDPOINTS.USER_FAVORITES_PLACES}/${placeId}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors du retrait du lieu favori',
      };
    }
  },

  // ===== STATISTIQUES =====
  
  // Récupérer les stats utilisateur
  getStats: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.USER_STATS);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération des statistiques',
      };
    }
  },

  // ===== HISTORIQUE =====
  
  // Récupérer l'historique
  getHistory: async (type = null, page = 1, limit = 20) => {
    try {
      const params = { page, limit };
      if (type) params.type = type;
      const response = await apiClient.get(ENDPOINTS.USER_HISTORY, { params });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de la récupération de l'historique",
      };
    }
  },

  // ===== PRÉFÉRENCES =====
  
  // Mettre à jour les préférences
  updatePreferences: async (preferences) => {
    try {
      const response = await apiClient.put(ENDPOINTS.USER_PREFERENCES, preferences);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la mise à jour des préférences',
      };
    }
  },

  // Enregistrer le push token
  updatePushToken: async (pushToken) => {
    try {
      const response = await apiClient.put(ENDPOINTS.USER_PUSH_TOKEN, { pushToken });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de l'enregistrement du token",
      };
    }
  },

  // ===== COMPTE =====
  
  // Supprimer le compte
  deleteAccount: async (password) => {
    try {
      const response = await apiClient.delete(ENDPOINTS.USER_DELETE, {
        data: { password },
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la suppression du compte',
      };
    }
  },
};

export default userService;

import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/config';

export const authService = {
  // Connexion utilisateur
  login: async (email, password) => {
    try {
      const response = await apiClient.post(ENDPOINTS.LOGIN, { email, password });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Email ou mot de passe incorrect',
        status: error.status,
      };
    }
  },

  // Inscription nouvel utilisateur
  register: async (userData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.REGISTER, userData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de l'inscription",
        errors: error.errors,
      };
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      await apiClient.post(ENDPOINTS.LOGOUT);
      return { success: true };
    } catch (error) {
      return { success: true }; // Déconnecter quand même
    }
  },

  // Récupérer le profil
  getProfile: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROFILE);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la récupération du profil',
      };
    }
  },

  // Mettre à jour le profil
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put(ENDPOINTS.PROFILE, profileData);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la mise à jour du profil',
      };
    }
  },

  // Changer le mot de passe
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiClient.put(ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors du changement de mot de passe',
      };
    }
  },

  // Mot de passe oublié
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post(ENDPOINTS.FORGOT_PASSWORD, { email });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de l'envoi de l'email",
      };
    }
  },

  // Réinitialiser le mot de passe avec token
  resetPassword: async (token, password) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.RESET_PASSWORD}/${token}`, { 
        password,
      });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la réinitialisation',
      };
    }
  },

  // Vérifier email
  verifyEmail: async (token) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.VERIFY_EMAIL}/${token}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || "Erreur lors de la vérification de l'email",
      };
    }
  },

  // Rafraîchir le token
  refreshToken: async (refreshToken) => {
    try {
      const response = await apiClient.post(ENDPOINTS.REFRESH_TOKEN, { refreshToken });
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors du rafraîchissement du token',
      };
    }
  },
};

export default authService;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS, ENDPOINTS } from '../constants/config';

// Créer une instance axios avec configuration de base
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag pour éviter les boucles de refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Intercepteur pour ajouter le token aux requêtes
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs avec refresh token
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;
      
      // Si 401 et pas déjà en train de retry, tenter le refresh
      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Si un refresh est déjà en cours, mettre en file d'attente
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          
          if (refreshToken) {
            const response = await axios.post(`${API_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
              refreshToken,
            });
            
            const { token: newToken, refreshToken: newRefreshToken } = response.data;
            
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
            if (newRefreshToken) {
              await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }
            
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Refresh a échoué - déconnecter
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_DATA,
          ]);
        } finally {
          isRefreshing = false;
        }
      }

      // Compte verrouillé
      if (status === 423) {
        return Promise.reject({
          status: 423,
          message: data.message || 'Compte temporairement verrouillé',
          lockUntil: data.lockUntil,
        });
      }

      // Trop de requêtes
      if (status === 429) {
        return Promise.reject({
          status: 429,
          message: data.message || 'Trop de requêtes. Réessayez plus tard.',
          retryAfter: data.retryAfter,
        });
      }
      
      return Promise.reject({
        status,
        message: data.message || 'Une erreur est survenue',
        errors: data.errors || [],
      });
    } else if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
      });
    } else {
      return Promise.reject({
        status: 0,
        message: error.message || 'Une erreur inattendue est survenue',
      });
    }
  }
);

export default apiClient;

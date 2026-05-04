import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { STORAGE_KEYS } from '../constants/config';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier si l'utilisateur est déjà connecté au démarrage
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Rafraîchir le profil depuis le serveur en arrière-plan
        try {
          const profileResult = await authService.getProfile();
          if (profileResult.success && profileResult.data?.data) {
            const freshUser = profileResult.data.data;
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(freshUser));
            setUser(freshUser);
          }
        } catch (profileErr) {
          // Silencieux - utiliser les données en cache
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification auth:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(email, password);
      
      if (response.success) {
        const { token, refreshToken, user } = response.data;
        
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        if (refreshToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        
        setToken(token);
        setUser(user);
        
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = err.message || 'Erreur de connexion';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      
      if (response.success) {
        const { token, refreshToken, user } = response.data;
        
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        if (refreshToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        
        setToken(token);
        setUser(user);
        
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = err.message || "Erreur d'inscription";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Tenter le logout côté serveur
      try {
        await authService.logout();
      } catch (e) {
        // Silencieux
      }
      
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      
      setToken(null);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedData) => {
    try {
      const newUser = { ...user, ...updatedData };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(newUser));
      setUser(newUser);
    } catch (err) {
      console.error('Erreur lors de la mise à jour utilisateur:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const result = await authService.getProfile();
      if (result.success && result.data?.data) {
        const freshUser = result.data.data;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(freshUser));
        setUser(freshUser);
        return freshUser;
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement profil:', err);
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;

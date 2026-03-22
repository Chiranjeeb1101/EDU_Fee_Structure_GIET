import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService, { UserData } from '../services/authService';

// ─── Types ──────────────────────────────────────────────────────
interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (collegeId: string, password: string, remember: boolean) => Promise<{ success: boolean; message: string }>;
  register: (payload: any) => Promise<{ success: boolean; message: string; data?: any }>;
  logout: () => Promise<void>;
  updateUser: (payload: any) => Promise<{ success: boolean; message: string }>;
  completeRegistration: (token: string, user: UserData) => Promise<void>;
  isBioEnabled: boolean;
  isBioVerified: boolean;
  setBioVerified: (verified: boolean) => void;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, message: '' }),
  register: async () => ({ success: false, message: '' }),
  logout: async () => {},
  updateUser: async () => ({ success: false, message: '' }),
  completeRegistration: async () => {},
  isBioEnabled: false,
  isBioVerified: false,
  setBioVerified: () => {},
  toggleBiometrics: async () => {},
});

import api, { setOnUnauthorized } from '../services/api';

// ─── Provider ───────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBioEnabled, setIsBioEnabled] = useState(false);
  const [isBioVerified, setIsBioVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Set up global 401 handler
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setToken(null);
      setIsBioVerified(false);
    });
  }, []);

  // Check for existing session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await authService.getStoredSession();
        if (session.token && session.user) {
          // ── Validate the stored token is still alive ───────────
          // Make a lightweight call to /health or /students/dashboard.
          // If the server returns 401, the interceptor will auto-clear.
          try {
            await api.get('/students/dashboard');
            // Token is still valid – restore the session
            setToken(session.token);
            setUser(session.user);
          } catch (validationError: any) {
            const status = validationError?.response?.status;
            if (status === 401) {
              // Token is expired/invalid – clear it silently
              console.warn('Stored token expired. Clearing session.');
              await AsyncStorage.removeItem('auth_token');
              await AsyncStorage.removeItem('user_data');
              // Don't set token/user — user will see the login screen
            } else {
              // Non-auth error (network, server down) – still restore session
              // so the user isn't forced to re-login when offline
              setToken(session.token);
              setUser(session.user);
            }
          }
        }
        
        // Load biometric preference
        const bioPref = await AsyncStorage.getItem('is_bio_enabled');
        setIsBioEnabled(bioPref === 'true');
      } catch (error) {
        console.warn('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const toggleBiometrics = async (enabled: boolean) => {
    setIsBioEnabled(enabled);
    await AsyncStorage.setItem('is_bio_enabled', enabled ? 'true' : 'false');
  };

  const login = async (collegeId: string, password: string, remember: boolean) => {
    try {
      const response = await authService.login({
        college_id_number: collegeId,
        password,
      });

      setToken(response.data.token);
      setUser(response.data.user);
      setIsBioVerified(true); // Password login counts as verified

      // Save credentials if "Remember Me" is checked OR if Biometrics are enabled
      if (remember || isBioEnabled) {
        await authService.saveCredentials(collegeId, password, response.data.user.role);
      } else {
        await authService.clearSavedCredentials();
      }

      return { success: true, message: response.message };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setIsBioVerified(false);
  };

  const updateUser = async (payload: any) => {
    try {
      const result = await authService.updateProfile(payload);
      if (result.success) {
        setUser(result.user);
        await AsyncStorage.setItem('user_data', JSON.stringify(result.user));
        return { success: true, message: 'Profile updated successfully' };
      }
      return { success: false, message: result.message || 'Update failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Update failed';
      return { success: false, message };
    }
  };

  const register = async (payload: any) => {
    try {
      const response = await authService.register(payload);
      
      if (response.success && response.data.token) {
        // We DO NOT set the token immediately to allow the RegistrationSuccessScreen 
        // to show while still in the Auth stack. The token is set via completeRegistration.
        return { success: true, message: response.message, data: response.data };
      }

      return { success: true, message: response.message, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed.';
      return { success: false, message };
    }
  };

  const completeRegistration = async (regToken: string, regUser: UserData) => {
    setToken(regToken);
    setUser(regUser);
    await AsyncStorage.setItem('auth_token', regToken);
    await AsyncStorage.setItem('user_data', JSON.stringify(regUser));
    setIsBioVerified(true); // Just registered counts as verified
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
        completeRegistration,
        isBioEnabled,
        isBioVerified,
        setBioVerified: setIsBioVerified,
        toggleBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────────────
export const useAuth = () => useContext(AuthContext);

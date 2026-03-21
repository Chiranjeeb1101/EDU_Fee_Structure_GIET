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
  logout: () => Promise<void>;
  updateUser: (payload: any) => Promise<{ success: boolean; message: string }>;
}

// ─── Context ────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, message: '' }),
  logout: async () => {},
  updateUser: async () => ({ success: false, message: '' }),
});

// ─── Provider ───────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await authService.getStoredSession();
        if (session.token && session.user) {
          setToken(session.token);
          setUser(session.user);
        }
      } catch (error) {
        console.warn('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (collegeId: string, password: string, remember: boolean) => {
    try {
      const response = await authService.login({
        college_id_number: collegeId,
        password,
      });

      setToken(response.data.token);
      setUser(response.data.user);

      // Save credentials if "Remember Me" is checked
      if (remember) {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────────────
export const useAuth = () => useContext(AuthContext);

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Base URL Configuration ─────────────────────────────────────
// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator and web use localhost directly
// For physical devices via Expo tunnel, use your machine's LAN IP or ngrok URL
const getBaseUrl = () => {
  if (__DEV__) {
    // For Web development
    if (Platform.OS === 'web') {
      return 'http://10.102.57.101:5000/api';
    }
    // For Mobile development (Android Emulator, iOS Simulator, or Physical Device)
    // Using current machine IP: 10.102.57.101
    return 'http://10.102.57.101:5000/api';
  }
  // Production URL (update when deployed)
  return 'https://your-production-api.com/api';
};

// ─── Axios Instance ─────────────────────────────────────────────
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor (Attach Token) ─────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (Handle Errors Globally) ───────────────
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn('API returned 401 — triggering logout');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Base URL Configuration ─────────────────────────────────────
// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator and web use localhost directly
// For physical devices via Expo tunnel, use your machine's LAN IP or ngrok URL
const getBaseUrl = () => {
  if (__DEV__) {
    // Using your machine's local IP network address instead of localhost/10.0.2.2
    // so that physical devices running Expo Go can reach the backend over Wi-Fi.
    return 'http://10.225.103.101:5000/api';
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
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    }
    return Promise.reject(error);
  }
);

export default api;

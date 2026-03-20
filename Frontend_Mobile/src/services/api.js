import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import ENV from '../config/env';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to append JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors like unauthenticated
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access - Token might be expired or invalid.');
      // Logic to trigger logout or emit event can be placed here
    }
    return Promise.reject(error);
  }
);

export default api;

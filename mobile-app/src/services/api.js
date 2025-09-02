import axios from 'axios';
import { API_BASE_URL, TIMEOUT, DEBUG } from '../config/api';

// Create axios instance with configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Try to get token from Redux store first, then fall back to AsyncStorage
    try {
      const { store } = await import('../store');
      const state = store.getState();
      const token = state.auth.tokens.accessToken;
      
      console.log('API Request - Redux token:', token ? 'Present' : 'Missing');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API Request - Using Redux token');
      } else {
        // Fall back to AsyncStorage if Redux doesn't have the token
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const storedToken = await AsyncStorage.default.getItem('accessToken');
        console.log('API Request - AsyncStorage token:', storedToken ? 'Present' : 'Missing');
        
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
          console.log('API Request - Using AsyncStorage token');
        } else {
          console.log('API Request - No token available');
        }
      }
      
      console.log('API Request - Final headers:', config.headers);
    } catch (error) {
      console.log('Error getting token in interceptor:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      // You can dispatch a logout action here
      console.log('Authentication failed, redirecting to login...');
    }
    return Promise.reject(error);
  }
);

export default api;

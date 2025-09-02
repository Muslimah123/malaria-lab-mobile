import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, TIMEOUT, getApiBaseUrl } from '../../config/api';

// Create axios instance with configuration
const api = axios.create({
  baseURL: API_BASE_URL, // Fallback base URL
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-update base URL when discovered
let isDiscoveryComplete = false;
const updateBaseUrl = async () => {
  if (!isDiscoveryComplete) {
    try {
      const discoveredUrl = await getApiBaseUrl();
      api.defaults.baseURL = discoveredUrl;
      isDiscoveryComplete = true;
      console.log('📡 API base URL updated to:', discoveredUrl);
    } catch (error) {
      console.warn('⚠️ API discovery failed, using fallback:', API_BASE_URL);
    }
  }
};

// Request interceptor to add auth token and auto-discover API
api.interceptors.request.use(
  async (config) => {
    // Auto-discover API URL on first request
    await updateBaseUrl();
    
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post('/auth/refresh', {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });
          
          const { access_token } = response.data;
          await AsyncStorage.setItem('accessToken', access_token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      const { access_token, refresh_token, user } = response.data;
      
      // Store tokens and user data
      await AsyncStorage.setItem('accessToken', access_token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, user, tokens: { accessToken: access_token, refreshToken: refresh_token } };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  // Register user
  async register(userData) {
    try {
      console.log('Attempting to register user with data:', userData);
      console.log('Making request to: /auth/register');
      
      const response = await api.post('/auth/register', userData);
      
      console.log('Registration response:', response.data);
      
      const { access_token, refresh_token, user } = response.data;
      
      // Store tokens and user data
      await AsyncStorage.setItem('accessToken', access_token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, user, tokens: { accessToken: access_token, refreshToken: refresh_token } };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  // Logout user
  async logout() {
    try {
      // Call logout endpoint
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage regardless of API call success
      await this.clearAuthData();
    }
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get profile');
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      // Update stored user data
      const updatedUser = response.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      throw new Error(error.response?.data?.error || 'Failed to change password');
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const user = await AsyncStorage.getItem('user');
      
      return !!(token && user);
    } catch (error) {
      console.error('Check auth error:', error);
      return false;
    }
  },

  // Get current user from storage
  async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Get access token
  async getAccessToken() {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Get access token error:', error);
      return null;
    }
  },

  // Clear all authentication data
  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'user',
      ]);
    } catch (error) {
      console.error('Clear auth data error:', error);
    }
  },

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
              const response = await api.post('/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      
      const { access_token } = response.data;
      await AsyncStorage.setItem('accessToken', access_token);
      
      return access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.clearAuthData();
      throw new Error('Token refresh failed');
    }
  },
};

// Export the configured axios instance for other services
export { api };
export default authService;

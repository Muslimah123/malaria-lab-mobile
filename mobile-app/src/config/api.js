import AsyncStorage from '@react-native-async-storage/async-storage';

// Stores the last working API URL so we do not depend on auto-discovery each launch
const API_BASE_URL_STORAGE_KEY = 'apiBaseUrl';

// Auto-discovery configuration with fallbacks
const DEV_CONFIG = {
  // Try multiple common IPs automatically (campus defaults + localhost for dev)
  POSSIBLE_BASE_URLS: [
    'http://192.168.1.86:5002/api',  // Your specific IP
    'http://172.29.106.158:5002/api',  // Campus server (default)
    'http://192.168.1.168:5002/api', // Previous campus IP (backup)
    'http://172.20.10.3:5002/api',   // Backup hotspot IP
    'http://192.168.1.100:5002/api', // Common router range
    'http://10.0.0.2:5002/api',      // Common Docker/VM IP
    'http://localhost:5002/api',     // Same machine
    'http://127.0.0.1:5002/api',     // Localhost alternative
  ],
  TIMEOUT: 120000,
  DEBUG: true
};

const PROD_CONFIG = {
  API_BASE_URL: 'https://your-production-server.com/api',
  TIMEOUT: 120000,
  DEBUG: false
};

// Auto-discovered base URL (will be set after discovery or manual override)
let discoveredBaseUrl = null;

const persistBaseUrl = async (baseUrl) => {
  discoveredBaseUrl = baseUrl;
  try {
    await AsyncStorage.setItem(API_BASE_URL_STORAGE_KEY, baseUrl);
  } catch (error) {
    console.warn('⚠️ Unable to persist API base URL:', error?.message || error);
  }
  return baseUrl;
};

const getStoredBaseUrl = async () => {
  if (discoveredBaseUrl) {
    return discoveredBaseUrl;
  }

  try {
    const stored = await AsyncStorage.getItem(API_BASE_URL_STORAGE_KEY);
    if (stored) {
      discoveredBaseUrl = stored;
      return stored;
    }
  } catch (error) {
    console.warn('⚠️ Unable to read stored API base URL:', error?.message || error);
  }

  return null;
};

// Simple health check function
const checkHealth = async (baseUrl) => {
  try {
    const healthUrl = baseUrl.replace('/api', '/api/health');
    const response = await fetch(healthUrl, { 
      method: 'GET',
      timeout: 5000 // Quick timeout for discovery
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};


const discoverApiUrl = async () => {
  const stored = await getStoredBaseUrl();
  if (stored) {
    return stored;
  }

  console.log(' Auto-discovering server...');
  
  for (const baseUrl of DEV_CONFIG.POSSIBLE_BASE_URLS) {
    console.log(`🔍 Trying: ${baseUrl}`);
    const isHealthy = await checkHealth(baseUrl);
    
    if (isHealthy) {
      console.log(`✅ Found server at: ${baseUrl}`);
      await persistBaseUrl(baseUrl);
      return baseUrl;
    }
  }
  
  // Fallback to first URL if none work
  console.log('⚠️ No server found, using fallback');
  return await persistBaseUrl(DEV_CONFIG.POSSIBLE_BASE_URLS[0]);
};


export const TIMEOUT = DEV_CONFIG.TIMEOUT;
export const DEBUG = DEV_CONFIG.DEBUG;

// base URL for development
export const API_BASE_URL = 'http://127.0.0.1:5002/api';


export const getApiBaseUrl = async () => API_BASE_URL;

export const getApiUrl = async (endpoint) => `${API_BASE_URL}${endpoint}`;


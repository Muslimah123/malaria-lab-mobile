// Auto-discovery configuration with fallbacks
const DEV_CONFIG = {
  // Try multiple common IPs automatically
  POSSIBLE_BASE_URLS: [
    'http://172.20.10.3:5000/api',  // Current IP
    'http://192.168.1.168:5000/api', // Previous IP
    'http://localhost:5000/api',     // Same machine
    'http://127.0.0.1:5000/api',     // Localhost alternative
    'http://10.0.0.2:5000/api',      // Common Docker/VM IP
    'http://192.168.1.100:5000/api', // Common router range
  ],
  TIMEOUT: 120000,
  DEBUG: true
};

const PROD_CONFIG = {
  API_BASE_URL: 'https://your-production-server.com/api',
  TIMEOUT: 120000,
  DEBUG: false
};

// Auto-discovered base URL (will be set after discovery)
let discoveredBaseUrl = null;

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

// Auto-discovery function
const discoverApiUrl = async () => {
  if (discoveredBaseUrl) {
    return discoveredBaseUrl; // Already discovered
  }

  console.log('🔍 Auto-discovering server...');
  
  for (const baseUrl of DEV_CONFIG.POSSIBLE_BASE_URLS) {
    console.log(`🔍 Trying: ${baseUrl}`);
    const isHealthy = await checkHealth(baseUrl);
    
    if (isHealthy) {
      console.log(`✅ Found server at: ${baseUrl}`);
      discoveredBaseUrl = baseUrl;
      return baseUrl;
    }
  }
  
  // Fallback to first URL if none work
  console.log('⚠️ No server found, using fallback');
  discoveredBaseUrl = DEV_CONFIG.POSSIBLE_BASE_URLS[0];
  return discoveredBaseUrl;
};

// Public exports
export const TIMEOUT = DEV_CONFIG.TIMEOUT;
export const DEBUG = DEV_CONFIG.DEBUG;

// Auto-discovered API base URL
export const getApiBaseUrl = async () => {
  return await discoverApiUrl();
};

// Legacy export for backward compatibility
export const API_BASE_URL = DEV_CONFIG.POSSIBLE_BASE_URLS[0]; // Fallback

export const getApiUrl = async (endpoint) => {
  const baseUrl = await discoverApiUrl();
  return `${baseUrl}${endpoint}`;
};


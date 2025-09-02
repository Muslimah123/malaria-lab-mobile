// API Connection Test Utility
import { API_BASE_URL, TIMEOUT, DEBUG } from '../config/api';

// Test API configuration
const testApiConfig = () => {
  console.log('🔧 Testing API Configuration...');
  console.log('Base URL:', API_BASE_URL);
  console.log('Timeout:', TIMEOUT);
  console.log('Debug Mode:', DEBUG);
  
  return {
    baseURL: API_BASE_URL,
    timeout: TIMEOUT,
    debug: DEBUG
  };
};

export const testApiConnection = async () => {
  try {
    const config = testApiConfig();
    console.log('Testing API connection to:', config.baseURL);
    
    // Test health endpoint
    const healthResponse = await fetch(`${config.baseURL.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check response:', healthData);
    
    // Test auth endpoint availability
    const authResponse = await fetch(`${config.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        username: 'testuser',
        password: 'testpass123',
        first_name: 'Test',
        last_name: 'User'
      })
    });
    
    console.log('Auth endpoint status:', authResponse.status);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth response:', authData);
      return { success: true, message: 'API connection successful' };
    } else {
      const errorData = await authResponse.text();
      console.log('Auth error response:', errorData);
      return { 
        success: false, 
        message: `API connection failed: ${authResponse.status}`,
        details: errorData
      };
    }
  } catch (error) {
    console.error('API connection test failed:', error);
    return { 
      success: false, 
      message: 'API connection test failed',
      error: error.message 
    };
  }
};

export const logApiConfig = () => {
  try {
    const config = testApiConfig();
    console.log('Current API Configuration:');
    console.log('Base URL:', config.baseURL);
    console.log('Timeout:', config.timeout);
    console.log('Debug Mode:', config.debug);
  } catch (error) {
    console.log('Configuration not initialized yet');
  }
};

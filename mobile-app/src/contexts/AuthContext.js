import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser, getCurrentUser, setInitialized } from '../store/slices/authSlice';
import authService from '../services/api/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // TEMPORARILY DISABLED: Auto-login on app start
        // This was causing the app to skip the login screen
        console.log('🚫 AuthContext: Auto-login disabled for testing');
        
        // Clear any stored auth data to ensure clean start
        await authService.clearAuthData();
        
        // Don't try to auto-login - let user login manually
      } catch (error) {
        console.error('Auth initialization error:', error);
        await authService.clearAuthData();
      } finally {
        setIsLoading(false);
        dispatch(setInitialized());
      }
    };

    initializeAuth();
  }, [dispatch]);

  const value = {
    isAuthenticated,
    user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

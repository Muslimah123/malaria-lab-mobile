
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { clearAuth } from './src/store/slices/authSlice';

export default function App() {
  useEffect(() => {
    // Force logout on app start to ensure clean authentication state
    console.log('🚀 App starting - clearing authentication state');
    store.dispatch(clearAuth());
  }, []);

  return (
    <Provider store={store}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
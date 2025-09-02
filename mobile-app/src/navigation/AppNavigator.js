// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import UploadScreen from '../screens/upload/UploadScreen';
import ResultsScreen from '../screens/results/ResultsScreen';
import PatientScreen from '../screens/patient/PatientScreen';
import PatientDetailScreen from '../screens/patient/PatientDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CaptureScreen from '../screens/capture/CaptureScreen';
import HistoryScreen from '../screens/test/HistoryScreen';
import TestDetailScreen from '../screens/test/TestDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main app tabs (after login)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e9ecef',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
          tabBarLabel: 'Upload',
        }}
      />
      <Tab.Screen 
        name="Results" 
        component={ResultsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
          tabBarLabel: 'Results',
        }}
      />
      <Tab.Screen 
        name="TestHistory" 
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
          tabBarLabel: 'History',
        }}
      />
      <Tab.Screen 
        name="Patients" 
        component={PatientScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          tabBarLabel: 'Patients',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarLabel: 'Profile',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Main navigation stack
const AppNavigator = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  console.log('🔐 AppNavigator - Auth state:', isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isAuthenticated ? (
        // Authenticated user - show main app
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Capture" component={CaptureScreen} />
          <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
          <Stack.Screen 
            name="TestDetail" 
            component={TestDetailScreen}
            listeners={{
              focus: () => console.log('🎯 TestDetail screen focused'),
              beforeRemove: () => console.log('🎯 TestDetail screen removing')
            }}
          />
        </>
      ) : (
        // Not authenticated - show login
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;


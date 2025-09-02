import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';

const SettingsScreen = ({ navigation }) => {
  const { logout, user } = useAuth();
  const [serverIP, setServerIP] = useState('');
  const [currentServerIP, setCurrentServerIP] = useState('');

  useEffect(() => {
    // Get current server IP from simple config
    const currentIP = API_BASE_URL?.replace('http://', '').replace('/api', '');
    setCurrentServerIP(currentIP);
    setServerIP(currentIP);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout }
      ]
    );
  };

  const handleUpdateServerIP = () => {
    if (!serverIP.trim()) {
      Alert.alert('Error', 'Please enter a valid IP address');
      return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(serverIP)) {
      Alert.alert('Error', 'Please enter a valid IP address (e.g., 192.168.1.100)');
      return;
    }

    Alert.alert(
      'IP Update Note', 
      `To change the server IP, you need to edit the config file:\n\n1. Open: mobile-app/src/config/api.js\n2. Change: API_BASE_URL to your new IP\n3. Restart the app\n\nCurrent IP: ${API_BASE_URL}`,
      [{ text: 'OK' }]
    );
  };

  const handleTestConnection = async () => {
    if (!serverIP.trim()) {
      Alert.alert('Error', 'Please enter a valid IP address first');
      return;
    }

    try {
      const response = await fetch(`http://${serverIP}/api/health`, {
        method: 'GET',
        timeout: 5000,
      });

      if (response.ok) {
        Alert.alert('✅ Connection Successful', `Server at ${serverIP} is responding!`);
      } else {
        Alert.alert('❌ Connection Failed', `Server at ${serverIP} responded with status ${response.status}`);
      }
    } catch (error) {
      Alert.alert('❌ Connection Failed', `Could not connect to ${serverIP}\n\nError: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Server Configuration Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Configuration</Text>
        <Text style={styles.sectionDescription}>
          Configure the malaria lab server IP address for your current network
        </Text>
        
        <View style={styles.serverConfig}>
          <Text style={styles.label}>Current Server IP:</Text>
          <Text style={styles.currentIP}>{currentServerIP || 'Not configured'}</Text>
          
          <Text style={styles.label}>New Server IP:</Text>
          <TextInput
            style={styles.input}
            value={serverIP}
            onChangeText={setServerIP}
            placeholder="e.g., 192.168.1.100"
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.testButton]} 
              onPress={handleTestConnection}
            >
              <Ionicons name="wifi" size={20} color="#fff" />
              <Text style={styles.buttonText}>Test Connection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.updateButton]} 
              onPress={handleUpdateServerIP}
            >
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.buttonText}>Update IP</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.hint}>
            💡 Tip: Use this when switching between home WiFi, campus WiFi, or other networks
          </Text>
        </View>
      </View>

      {/* User Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Information</Text>
        <View style={styles.userInfo}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{user?.name || 'N/A'}</Text>
          
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || 'N/A'}</Text>
          
          <Text style={styles.label}>Role:</Text>
          <Text style={styles.value}>{user?.role || 'N/A'}</Text>
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  serverConfig: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  currentIP: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    backgroundColor: '#f0f2ff',
    padding: 8,
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: '#27ae60',
  },
  updateButton: {
    backgroundColor: '#667eea',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  userInfo: {
    gap: 12,
  },
  value: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7d7',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
});

export default SettingsScreen;

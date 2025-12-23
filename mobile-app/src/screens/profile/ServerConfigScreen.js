import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { getApiBaseUrl, updateApiBaseUrl } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ServerConfigScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const [serverIP, setServerIP] = useState('');
  const [currentServerIP, setCurrentServerIP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  useEffect(() => {
    loadCurrentServerConfig();
  }, []);

  const loadCurrentServerConfig = async () => {
    try {
      const currentIP = await getApiBaseUrl();
      const ipOnly = currentIP?.replace('http://', '').replace('/api', '');
      setCurrentServerIP(ipOnly);
      setServerIP(ipOnly);
      await testConnection(ipOnly);
    } catch (error) {
      console.error('Error loading server config:', error);
    }
  };

  const testConnection = async (ip) => {
    if (!ip) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://${ip}/api/health`, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateServerIP = async () => {
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

    setIsLoading(true);
    try {
      // Test connection first
      await testConnection(serverIP);
      
      if (connectionStatus === 'connected') {
        // Update the API base URL
        const newBaseUrl = `http://${serverIP}/api`;
        await updateApiBaseUrl(newBaseUrl);
        await AsyncStorage.setItem('apiBaseUrl', newBaseUrl);
        
        setCurrentServerIP(serverIP);
        Alert.alert('Success', 'Server configuration updated successfully!');
      } else {
        Alert.alert('Connection Failed', 'Cannot connect to the specified server. Please check the IP address and try again.');
      }
    } catch (error) {
      console.error('Error updating server IP:', error);
      Alert.alert('Error', 'Failed to update server configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefault = () => {
    Alert.alert(
      'Reset to Default',
      'This will reset the server configuration to the default settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            try {
              const defaultIP = '192.168.1.64';
              await updateApiBaseUrl(`http://${defaultIP}/api`);
              await AsyncStorage.setItem('apiBaseUrl', `http://${defaultIP}/api`);
              setServerIP(defaultIP);
              setCurrentServerIP(defaultIP);
              await testConnection(defaultIP);
              Alert.alert('Success', 'Server configuration reset to default');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset server configuration');
            }
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => dispatch(logout()) }
      ]
    );
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#27ae60';
      case 'error': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'error': return 'Connection Failed';
      default: return 'Testing...';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Server Configuration</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Configuration</Text>
            
            <View style={styles.configCard}>
              <View style={styles.configItem}>
                <Ionicons name="server" size={20} color="#4FC3F7" />
                <Text style={styles.configLabel}>Server IP:</Text>
                <Text style={styles.configValue}>{currentServerIP || 'Not configured'}</Text>
              </View>
              
              <View style={styles.configItem}>
                <Ionicons name="pulse" size={20} color={getConnectionStatusColor()} />
                <Text style={styles.configLabel}>Status:</Text>
                <Text style={[styles.configValue, { color: getConnectionStatusColor() }]}>
                  {getConnectionStatusText()}
                </Text>
              </View>
            </View>
          </View>

          {/* Server Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Server Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Server IP Address</Text>
              <TextInput
                style={styles.textInput}
                value={serverIP}
                onChangeText={setServerIP}
                placeholder="192.168.1.100"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.inputHint}>
                Enter the IP address of your malaria lab server
              </Text>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={handleUpdateServerIP}
                disabled={isLoading}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  {isLoading ? 'Testing...' : 'Update Server'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleResetToDefault}
                disabled={isLoading}
              >
                <Ionicons name="refresh" size={20} color="#667eea" />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Reset to Default
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Network Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Network Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Ionicons name="information-circle" size={20} color="#4FC3F7" />
                <Text style={styles.infoText}>
                  Make sure your device and the server are on the same network
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="wifi" size={20} color="#4FC3F7" />
                <Text style={styles.infoText}>
                  The server must be running and accessible on the specified IP
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color="#4FC3F7" />
                <Text style={styles.infoText}>
                  Default port is 5000 (http://IP:5000/api)
                </Text>
              </View>
            </View>
          </View>

          {/* User Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            
            <TouchableOpacity 
              style={[styles.button, styles.dangerButton]} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color="#fff" />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 16,
  },
  configCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 12,
    marginRight: 8,
    minWidth: 60,
  },
  configValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  secondaryButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#667eea',
  },
  infoCard: {
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.3)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default ServerConfigScreen;



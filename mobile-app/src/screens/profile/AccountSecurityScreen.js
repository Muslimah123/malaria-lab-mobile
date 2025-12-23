import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccountSecurityScreen = ({ navigation }) => {
  const user = useSelector(selectUser);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: 30, // minutes
    loginNotifications: true,
    suspiciousActivityAlerts: true,
  });
  const [loginHistory, setLoginHistory] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load security settings from storage
      const storedSettings = await AsyncStorage.getItem('securitySettings');
      if (storedSettings) {
        setSecuritySettings(JSON.parse(storedSettings));
      }

      // Load login history (mock data for now)
      const mockLoginHistory = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          device: 'iPhone 13 Pro',
          location: 'New York, NY',
          ipAddress: '192.168.1.64',
          status: 'success',
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          device: 'Samsung Galaxy S21',
          location: 'New York, NY',
          ipAddress: '192.168.1.64',
          status: 'success',
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          device: 'iPad Pro',
          location: 'New York, NY',
          ipAddress: '192.168.1.64',
          status: 'failed',
        },
      ];

      setLoginHistory(mockLoginHistory);

      // Load active sessions (mock data for now)
      const mockActiveSessions = [
        {
          id: 1,
          device: 'iPhone 13 Pro',
          location: 'New York, NY',
          lastActive: new Date().toISOString(),
          current: true,
        },
        {
          id: 2,
          device: 'Samsung Galaxy S21',
          location: 'New York, NY',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          current: false,
        },
      ];

      setActiveSessions(mockActiveSessions);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSecuritySetting = async (key, value) => {
    try {
      const newSettings = { ...securitySettings, [key]: value };
      setSecuritySettings(newSettings);
      await AsyncStorage.setItem('securitySettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating security setting:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handleTwoFactorToggle = (value) => {
    if (value) {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'This will add an extra layer of security to your account. You will need to verify your identity with a second factor when logging in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => updateSecuritySetting('twoFactorEnabled', true) },
        ]
      );
    } else {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: () => updateSecuritySetting('twoFactorEnabled', false) },
        ]
      );
    }
  };

  const handleBiometricToggle = (value) => {
    if (value) {
      Alert.alert(
        'Enable Biometric Login',
        'This will allow you to use your fingerprint or face ID to log in quickly and securely.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => updateSecuritySetting('biometricEnabled', true) },
        ]
      );
    } else {
      updateSecuritySetting('biometricEnabled', false);
    }
  };

  const terminateSession = (sessionId) => {
    Alert.alert(
      'Terminate Session',
      'Are you sure you want to terminate this session? The user will be logged out.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Terminate', 
          style: 'destructive',
          onPress: () => {
            setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
            Alert.alert('Success', 'Session terminated successfully.');
          }
        },
      ]
    );
  };

  const renderSecurityItem = ({ icon, title, subtitle, onPress, showSwitch, switchValue, onSwitchChange, showArrow = true, danger = false }) => (
    <TouchableOpacity style={styles.securityItem} onPress={onPress}>
      <View style={styles.securityItemLeft}>
        <View style={[styles.securityIcon, danger && styles.securityIconDanger]}>
          <Ionicons name={icon} size={24} color={danger ? '#e74c3c' : '#667eea'} />
        </View>
        <View style={styles.securityText}>
          <Text style={[styles.securityTitle, danger && styles.securityTitleDanger]}>{title}</Text>
          {subtitle && <Text style={styles.securitySubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.securityItemRight}>
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#e0e0e0', true: '#667eea' }}
            thumbColor={switchValue ? '#fff' : '#f4f3f4'}
          />
        ) : showArrow ? (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderLoginHistoryItem = (login) => (
    <View key={login.id} style={styles.historyItem}>
      <View style={styles.historyIcon}>
        <Ionicons 
          name={login.status === 'success' ? 'checkmark-circle' : 'close-circle'} 
          size={20} 
          color={login.status === 'success' ? '#27ae60' : '#e74c3c'} 
        />
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyDevice}>{login.device}</Text>
        <Text style={styles.historyDetails}>
          {login.location} • {login.ipAddress}
        </Text>
        <Text style={styles.historyTime}>
          {new Date(login.timestamp).toLocaleString()}
        </Text>
      </View>
      {login.status === 'failed' && (
        <View style={styles.failedBadge}>
          <Text style={styles.failedText}>Failed</Text>
        </View>
      )}
    </View>
  );

  const renderActiveSession = (session) => (
    <View key={session.id} style={styles.sessionItem}>
      <View style={styles.sessionIcon}>
        <Ionicons name="phone-portrait" size={20} color="#667eea" />
      </View>
      <View style={styles.sessionContent}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionDevice}>{session.device}</Text>
          {session.current && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>Current</Text>
            </View>
          )}
        </View>
        <Text style={styles.sessionDetails}>
          {session.location} • Last active: {new Date(session.lastActive).toLocaleString()}
        </Text>
      </View>
      {!session.current && (
        <TouchableOpacity 
          style={styles.terminateButton}
          onPress={() => terminateSession(session.id)}
        >
          <Ionicons name="close" size={16} color="#e74c3c" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          locations={[0, 0.6, 1]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4FC3F7" />
            <Text style={styles.loadingText}>Loading security settings...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Account Security</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Security Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Settings</Text>
            
            {renderSecurityItem({
              icon: 'shield-checkmark',
              title: 'Two-Factor Authentication',
              subtitle: 'Add an extra layer of security',
              showSwitch: true,
              switchValue: securitySettings.twoFactorEnabled,
              onSwitchChange: handleTwoFactorToggle,
              showArrow: false,
            })}
            
            {renderSecurityItem({
              icon: 'finger-print',
              title: 'Biometric Login',
              subtitle: 'Use fingerprint or face ID',
              showSwitch: true,
              switchValue: securitySettings.biometricEnabled,
              onSwitchChange: handleBiometricToggle,
              showArrow: false,
            })}
            
            {renderSecurityItem({
              icon: 'notifications',
              title: 'Login Notifications',
              subtitle: 'Get notified of new logins',
              showSwitch: true,
              switchValue: securitySettings.loginNotifications,
              onSwitchChange: (value) => updateSecuritySetting('loginNotifications', value),
              showArrow: false,
            })}
            
            {renderSecurityItem({
              icon: 'warning',
              title: 'Suspicious Activity Alerts',
              subtitle: 'Alert for unusual activity',
              showSwitch: true,
              switchValue: securitySettings.suspiciousActivityAlerts,
              onSwitchChange: (value) => updateSecuritySetting('suspiciousActivityAlerts', value),
              showArrow: false,
            })}
          </View>

          {/* Active Sessions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Sessions</Text>
            {activeSessions.length > 0 ? (
              activeSessions.map(renderActiveSession)
            ) : (
              <Text style={styles.emptyText}>No active sessions</Text>
            )}
          </View>

          {/* Login History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Login History</Text>
            {loginHistory.length > 0 ? (
              loginHistory.map(renderLoginHistoryItem)
            ) : (
              <Text style={styles.emptyText}>No login history available</Text>
            )}
          </View>

          {/* Security Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Actions</Text>
            
            {renderSecurityItem({
              icon: 'key',
              title: 'Change Password',
              subtitle: 'Update your password',
              onPress: () => navigation.navigate('ChangePassword'),
            })}
            
            {renderSecurityItem({
              icon: 'log-out',
              title: 'Sign Out All Devices',
              subtitle: 'Terminate all other sessions',
              onPress: () => Alert.alert('Sign Out All Devices', 'This will sign out all devices except this one.'),
              danger: true,
            })}
            
            {renderSecurityItem({
              icon: 'download',
              title: 'Download Security Data',
              subtitle: 'Export your security information',
              onPress: () => Alert.alert('Download Security Data', 'This feature will be available soon.'),
            })}
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
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  securityIconDanger: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  securityText: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  securityTitleDanger: {
    color: '#e74c3c',
  },
  securitySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  securityItemRight: {
    alignItems: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyIcon: {
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyDevice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  historyDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  failedBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  failedText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  sessionIcon: {
    marginRight: 12,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentText: {
    color: '#27ae60',
    fontSize: 10,
    fontWeight: '600',
  },
  sessionDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  terminateButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default AccountSecurityScreen;

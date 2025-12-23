import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'userPreferences';

const defaultPreferences = {
  darkMode: false,
  compactMode: false,
  autoSync: true,
  useCellularData: false,
  hapticFeedback: true,
  pushNotifications: true,
  emailReports: false,
  soundAlerts: true,
  diagnosticsSharing: false,
  language: 'en',
};

const languageOptions = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
  { id: 'es', label: 'Spanish' },
];

const PreferencesScreen = ({ navigation }) => {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
        setLastSavedAt(parsed?.lastSavedAt || null);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      Alert.alert('Error', 'Unable to load your preferences. Defaults will be used.');
    } finally {
      setIsInitializing(false);
    }
  };

  const persistPreferences = async (nextPreferences) => {
    const payload = { ...nextPreferences, lastSavedAt: new Date().toISOString() };
    setPreferences(nextPreferences);
    setLastSavedAt(payload.lastSavedAt);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Error', 'There was a problem saving your changes. Please try again.');
    }
  };

  const updatePreference = (key, value) => {
    const nextPreferences = { ...preferences, [key]: value };
    persistPreferences(nextPreferences);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Preferences',
      'This will reset all settings back to their default values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => persistPreferences(defaultPreferences) },
      ]
    );
  };

  const renderPreferenceToggle = ({ icon, title, subtitle, value, onChange }) => (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceLeft}>
        <View style={styles.preferenceIcon}>
          <Ionicons name={icon} size={22} color="#4FC3F7" />
        </View>
        <View style={styles.preferenceText}>
          <Text style={styles.preferenceTitle}>{title}</Text>
          {subtitle && <Text style={styles.preferenceSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#e0e0e0', true: '#667eea' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const renderLanguageSelector = () => (
    <View style={styles.languageContainer}>
      {languageOptions.map((option) => {
        const isActive = option.id === preferences.language;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.languageOption, isActive && styles.languageOptionActive]}
            onPress={() => updatePreference('language', option.id)}
          >
            <Text style={[styles.languageLabel, isActive && styles.languageLabelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (isInitializing) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preferences</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display</Text>
            {renderPreferenceToggle({
              icon: 'moon',
              title: 'Dark Mode',
              subtitle: 'Use darker colors to reduce glare',
              value: preferences.darkMode,
              onChange: (value) => updatePreference('darkMode', value),
            })}
            {renderPreferenceToggle({
              icon: 'resize',
              title: 'Compact Layout',
              subtitle: 'Fit more information on the screen',
              value: preferences.compactMode,
              onChange: (value) => updatePreference('compactMode', value),
            })}
            {renderPreferenceToggle({
              icon: 'barbell',
              title: 'Haptic Feedback',
              subtitle: 'Vibrate on important actions',
              value: preferences.hapticFeedback,
              onChange: (value) => updatePreference('hapticFeedback', value),
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {renderPreferenceToggle({
              icon: 'notifications',
              title: 'Push Notifications',
              subtitle: 'Receive alerts about new results',
              value: preferences.pushNotifications,
              onChange: (value) => updatePreference('pushNotifications', value),
            })}
            {renderPreferenceToggle({
              icon: 'mail',
              title: 'Email Reports',
              subtitle: 'Send daily summaries to email',
              value: preferences.emailReports,
              onChange: (value) => updatePreference('emailReports', value),
            })}
            {renderPreferenceToggle({
              icon: 'volume-high',
              title: 'Sound Alerts',
              subtitle: 'Play sound for urgent notifications',
              value: preferences.soundAlerts,
              onChange: (value) => updatePreference('soundAlerts', value),
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data & Sync</Text>
            {renderPreferenceToggle({
              icon: 'cloud-upload',
              title: 'Auto Sync',
              subtitle: 'Upload captured data automatically',
              value: preferences.autoSync,
              onChange: (value) => updatePreference('autoSync', value),
            })}
            {renderPreferenceToggle({
              icon: 'cellular',
              title: 'Use Cellular Data',
              subtitle: 'Allow syncing on mobile networks',
              value: preferences.useCellularData,
              onChange: (value) => updatePreference('useCellularData', value),
            })}
            {renderPreferenceToggle({
              icon: 'medkit',
              title: 'Diagnostics Sharing',
              subtitle: 'Share anonymized diagnostics to improve AI',
              value: preferences.diagnosticsSharing,
              onChange: (value) => updatePreference('diagnosticsSharing', value),
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language</Text>
            {renderLanguageSelector()}
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.footerTitle}>Need to start over?</Text>
              <Text style={styles.footerSubtitle}>
                Reset all preferences back to their default values.
              </Text>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="refresh" size={18} color="#e74c3c" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {lastSavedAt && (
            <Text style={styles.lastSavedText}>
              Last updated {new Date(lastSavedAt).toLocaleString()}
            </Text>
          )}
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
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4FC3F7',
    marginBottom: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  preferenceSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.25)',
    borderColor: '#667eea',
  },
  languageLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  languageLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  footerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.6)',
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    gap: 6,
  },
  resetButtonText: {
    color: '#e74c3c',
    fontWeight: '700',
    fontSize: 14,
  },
  lastSavedText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 24,
  },
});

export default PreferencesScreen;



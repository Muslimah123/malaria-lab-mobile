import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, selectUser } from '../../store/slices/authSlice';
import UserRegistrationModal from '../../components/common/UserRegistrationModal';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showUserRegistration, setShowUserRegistration] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => dispatch(logoutUser()),
        },
      ]
    );
  };

  const handleUserRegistrationSuccess = () => {
    // Refresh user list or show success message
    Alert.alert('Success', 'New user has been registered successfully!');
  };

  const isAdmin = user?.role === 'admin';

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'supervisor':
        return 'Supervisor/Doctor';
      case 'technician':
        return 'Lab Technician';
      default:
        return role?.charAt(0).toUpperCase() + role?.slice(1) || 'Unknown';
    }
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color="#667eea" />
          </View>
        )}
      </View>
      <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>
      <View style={styles.roleContainer}>
        <Text style={styles.roleText}>{getRoleDisplayName(user?.role)}</Text>
        <Text style={styles.departmentText}>Malaria Laboratory</Text>
      </View>
    </View>
  );

  const renderMenuItem = ({ icon, title, subtitle, onPress, showSwitch, switchValue, onSwitchChange, showArrow = true, showBadge = false, badgeText = '' }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Ionicons name={icon} size={24} color="#667eea" />
        </View>
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {showBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account and settings</Text>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            {renderProfileHeader()}

            {/* Admin Section - Only visible to admin users */}
            {isAdmin && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Administration</Text>
                {renderMenuItem({
                  icon: 'person-add',
                  title: 'Register New User',
                  subtitle: 'Create new user accounts',
                  onPress: () => setShowUserRegistration(true),
                  showBadge: true,
                  badgeText: 'Admin'
                })}
                {renderMenuItem({
                  icon: 'people',
                  title: 'Manage Users',
                  subtitle: 'View and manage all users',
                  onPress: () => Alert.alert('Manage Users', 'User management coming soon'),
                })}
                {renderMenuItem({
                  icon: 'settings',
                  title: 'System Settings',
                  subtitle: 'Configure system parameters',
                  onPress: () => Alert.alert('System Settings', 'System settings coming soon'),
                })}
              </View>
            )}

            {/* Account Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Settings</Text>
              {renderMenuItem({
                icon: 'person',
                title: 'Edit Profile',
                subtitle: 'Update your personal information',
                onPress: () => Alert.alert('Edit Profile', 'Edit profile functionality coming soon'),
              })}
              {renderMenuItem({
                icon: 'key',
                title: 'Change Password',
                subtitle: 'Update your password',
                onPress: () => Alert.alert('Change Password', 'Change password functionality coming soon'),
              })}
              {renderMenuItem({
                icon: 'shield-checkmark',
                title: 'Two-Factor Authentication',
                subtitle: 'Add an extra layer of security',
                onPress: () => Alert.alert('2FA', 'Two-factor authentication coming soon'),
              })}
            </View>

            {/* App Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Settings</Text>
              {renderMenuItem({
                icon: 'settings',
                title: 'Server Configuration',
                subtitle: 'Configure server IP and network settings',
                onPress: () => navigation.navigate('Settings'),
              })}
              {renderMenuItem({
                icon: 'notifications',
                title: 'Push Notifications',
                subtitle: 'Receive alerts for test results',
                showSwitch: true,
                switchValue: notificationsEnabled,
                onSwitchChange: setNotificationsEnabled,
                showArrow: false,
              })}
              {renderMenuItem({
                icon: 'moon',
                title: 'Dark Mode',
                subtitle: 'Switch to dark theme',
                showSwitch: true,
                switchValue: darkModeEnabled,
                onSwitchChange: setDarkModeEnabled,
                showArrow: false,
              })}
              {renderMenuItem({
                icon: 'finger-print',
                title: 'Biometric Login',
                subtitle: 'Use fingerprint or face ID',
                showSwitch: true,
                switchValue: biometricEnabled,
                onSwitchChange: setBiometricEnabled,
                showArrow: false,
              })}
            </View>

            {/* Support & Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support & Information</Text>
              {renderMenuItem({
                icon: 'help-circle',
                title: 'Help & Support',
                subtitle: 'Get help with the app',
                onPress: () => Alert.alert('Help', 'Help and support coming soon'),
              })}
              {renderMenuItem({
                icon: 'document-text',
                title: 'Terms of Service',
                subtitle: 'Read our terms and conditions',
                onPress: () => Alert.alert('Terms', 'Terms of service coming soon'),
              })}
              {renderMenuItem({
                icon: 'shield',
                title: 'Privacy Policy',
                subtitle: 'Learn about data protection',
                onPress: () => Alert.alert('Privacy', 'Privacy policy coming soon'),
              })}
              {renderMenuItem({
                icon: 'information-circle',
                title: 'About',
                subtitle: 'App version and information',
                onPress: () => Alert.alert('About', 'App version 1.0.0'),
              })}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </LinearGradient>

      {/* User Registration Modal */}
      <UserRegistrationModal
        visible={showUserRegistration}
        onClose={() => setShowUserRegistration(false)}
        onSuccess={handleUserRegistrationSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
  },
  departmentText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuItemRight: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    margin: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default ProfileScreen;

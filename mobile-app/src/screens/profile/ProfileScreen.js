import React, { useState, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, selectUser, updateUserProfile } from '../../store/slices/authSlice';
import UserRegistrationModal from '../../components/common/UserRegistrationModal';
import { authService } from '../../services/api/authService';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showUserRegistration, setShowUserRegistration] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  // Profile picture functionality
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to change your profile picture.');
      return;
    }

    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to add your profile picture',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImageLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      await saveProfilePicture(imageUri);
    }
  };

  const openImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      await saveProfilePicture(imageUri);
    }
  };

  // Load profile picture from storage
  const loadProfilePicture = async () => {
    try {
      // First try to load from AsyncStorage
      const storedProfilePicture = await AsyncStorage.getItem(`profilePicture_${user?.id}`);
      if (storedProfilePicture) {
        setProfileImage(storedProfilePicture);
      } else if (user?.avatar) {
        // Fallback to user's avatar from user data
        setProfileImage(user.avatar);
      }
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
  };

  // Save profile picture to server and local storage
  const saveProfilePicture = async (imageUri) => {
    try {
      // First save locally for immediate UI update
      await AsyncStorage.setItem(`profilePicture_${user?.id}`, imageUri);
      
      // Upload to server
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `avatar_${user?.id}.jpg`,
      });

      const response = await authService.uploadProfileAvatar(formData);
      
      if (response.avatar_url) {
        // Update user data with server URL
        const updatedUser = { ...user, avatar: response.avatar_url };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update Redux store
        dispatch(updateUserProfile(updatedUser));
        
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    }
  };

  // Initialize animations and load profile picture
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for profile picture
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Load profile picture from storage
    loadProfilePicture();
  }, [user?.id]);

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
    <Animated.View 
      style={[
        styles.profileHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#4FC3F7" />
            </View>
          )}
        </Animated.View>
        <View style={styles.editIconContainer}>
          <Ionicons name="camera" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
      <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>
      <View style={styles.roleContainer}>
        <Text style={styles.roleText}>{getRoleDisplayName(user?.role)}</Text>
        <Text style={styles.departmentText}>Malaria Laboratory</Text>
      </View>
    </Animated.View>
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
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        locations={[0, 0.6, 1]}
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
                onPress: () => navigation.navigate('EditProfile'),
              })}
            </View>

            {/* App Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Settings</Text>
              {renderMenuItem({
                icon: 'analytics',
                title: 'My Statistics',
                subtitle: 'View your performance and activity',
                onPress: () => navigation.navigate('UserStats'),
              })}
              {renderMenuItem({
                icon: 'shield-checkmark',
                title: 'Account Security',
                subtitle: 'Manage security settings and sessions',
                onPress: () => navigation.navigate('AccountSecurity'),
              })}
              {renderMenuItem({
                icon: 'settings',
                title: 'Preferences',
                subtitle: 'Customize app behavior and appearance',
                onPress: () => navigation.navigate('Preferences'),
              })}
              {renderMenuItem({
                icon: 'key',
                title: 'Change Password',
                subtitle: 'Update your account password',
                onPress: () => navigation.navigate('ChangePassword'),
              })}
              {renderMenuItem({
                icon: 'server',
                title: 'Server Configuration',
                subtitle: 'Configure server IP and network settings',
                onPress: () => navigation.navigate('ServerConfig'),
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
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4FC3F7',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4FC3F7',
    borderStyle: 'dashed',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
  },
  departmentText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#fff',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
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
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    margin: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default ProfileScreen;

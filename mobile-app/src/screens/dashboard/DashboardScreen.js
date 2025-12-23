import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView, 
  Alert,
  RefreshControl,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [serverIP, setServerIP] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  // Revolutionary neural network animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const neuralAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const dataFlowAnim = useRef(new Animated.Value(0)).current;

  // Initialize neural animations
  useEffect(() => {
    const initializeNeuralAnimations = () => {
      // Advanced entrance sequence
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous neural network effects
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(neuralAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 15000,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.timing(dataFlowAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        })
      ).start();
    };

    initializeNeuralAnimations();
  }, []);

  // Check server connection
  const checkServerConnection = async () => {
    try {
      console.log('🔍 Testing server connection to:', `${API_BASE_URL}/health`);
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      console.log('✅ Server response:', response.status, response.ok);
      
      if (response.ok) {
        setIsConnected(true);
        const baseURL = API_BASE_URL.replace('/api', '');
        const ipMatch = baseURL.match(/http:\/\/([^:]+):/);
        if (ipMatch) {
          setServerIP(ipMatch[1]);
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      setIsConnected(false);
    }
  };

  // Refresh handler
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    checkServerConnection().finally(() => {
      setRefreshing(false);
    });
  }, []);

  // Check connection on mount
  useEffect(() => {
    checkServerConnection();
  }, []);

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

  // Load profile picture when user changes
  useEffect(() => {
    if (user?.id) {
      loadProfilePicture();
    }
  }, [user?.id]);

  // Animation interpolations
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const neuralWaveInterpolate = neuralAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  const particleFloatInterpolate = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const glowIntensity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const dataFlowInterpolate = dataFlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  // Action data for medical dashboard
  const actions = [
    {
      id: 'upload',
      title: 'Upload Sample',
      subtitle: 'Blood Sample Analysis',
      description: 'Start new malaria diagnosis',
      icon: 'cloud-upload-outline',
      gradient: ['#ff6b6b', '#ff8e8e'],
      glowColor: '#ff6b6b',
      disabled: !isConnected,
      onPress: () => navigation.navigate('Upload'),
    },
    {
      id: 'patients',
      title: 'Patient Records',
      subtitle: 'Medical Database',
      description: 'View patient information',
      icon: 'people-outline',
      gradient: ['#4ecdc4', '#44d3d3'],
      glowColor: '#4ecdc4',
      disabled: !isConnected,
      onPress: () => navigation.navigate('Patients'),
    },
    {
      id: 'tests',
      title: 'Test History',
      subtitle: 'Diagnosis Archive',
      description: 'Review previous tests',
      icon: 'document-text-outline',
      gradient: ['#45b7d1', '#5bc0de'],
      glowColor: '#45b7d1',
      disabled: !isConnected,
              onPress: () => navigation.navigate('TestHistory'),
    },
    {
      id: 'results',
      title: 'Lab Results',
      subtitle: 'AI Diagnostics',
      description: 'View analysis results',
      icon: 'analytics-outline',
      gradient: ['#96ceb4', '#a8d5ba'],
      glowColor: '#96ceb4',
      disabled: !isConnected,
      onPress: () => navigation.navigate('Results'),
    },
  ];

  return (
    <View style={styles.neuralContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      
      {/* Revolutionary Neural Background */}
      <LinearGradient
        colors={['#0f0f23', '#1a1a3a', '#2d2d5f']}
        style={styles.neuralGradient}
      >
        <View style={styles.neuralBackgroundContainer}>
          {/* Animated data streams */}
          {[...Array(3)].map((_, i) => (
            <Animated.View
              key={`stream-${i}`}
              style={[
                styles.dataStream,
                {
                  top: `${20 + i * 30}%`,
                  transform: [{ translateX: dataFlowInterpolate }],
                  opacity: glowIntensity,
                }
              ]}
            />
          ))}
          
          {/* Neural nodes */}
          {[...Array(5)].map((_, i) => (
            <Animated.View
              key={`node-${i}`}
              style={[
                styles.neuralNode,
                {
                  top: `${10 + i * 20}%`,
                  left: `${15 + (i % 2) * 70}%`,
                  transform: [
                    { scale: pulseAnim },
                    { rotate: rotateInterpolate },
                    { translateY: particleFloatInterpolate },
                  ],
                  opacity: glowIntensity,
                }
              ]}
            />
          ))}
        </View>

          <ScrollView
          style={styles.neuralScrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00d4ff"
              colors={['#00d4ff']}
            />
          }
            showsVerticalScrollIndicator={false}
        >
          {/* Revolutionary Neural Header */}
          <Animated.View
            style={[
              styles.neuralHeaderContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(0, 212, 255, 0.15)', 'rgba(91, 115, 255, 0.15)']}
              style={styles.headerBackground}
            >
              <View style={styles.headerContent}>
                <View style={styles.statusSection}>
                  <Animated.View
                    style={[
                      styles.connectionIndicator,
                      {
                        backgroundColor: isConnected ? '#00ff88' : '#ff4757',
                        transform: [{ scale: pulseAnim }],
                      }
                    ]}
                  />
                  <View style={styles.statusInfo}>
                                      <Text style={styles.connectionStatus}>
                    {isConnected ? 'Server Connected' : 'Connection Lost'}
                  </Text>
                    <Text style={styles.serverInfo}>
                      {isConnected ? `Server: ${serverIP}` : 'Reconnecting...'}
                    </Text>
                </View>
              </View>
              
                {!isConnected && (
                  <Animated.View style={[styles.emergencyButton, { transform: [{ scale: pulseAnim }] }]}>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.prompt(
                          'Neural Network Configuration',
                          'Enter server IP address:',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Sync', 
                              onPress: (ip) => {
                                if (ip && ip.trim()) {
                                  Alert.alert('Neural Link', `Attempting sync to ${ip.trim()}`);
                                  checkServerConnection();
                                }
                              }
                            }
                          ],
                          'plain-text',
                          '192.168.1.100'
                        );
                      }}
                    >
                      <LinearGradient
                        colors={['#ff6b6b', '#ff8e8e']}
                        style={styles.configureGradient}
                      >
                        <Ionicons name="warning" size={20} color="#fff" />
                        <Text style={styles.configureButtonText}>CONFIGURE</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                </View>
              
              {/* Scan line effect */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{ translateX: dataFlowInterpolate }],
                    opacity: glowIntensity,
                  }
                ]}
              />
            </LinearGradient>
          </Animated.View>

          {/* Revolutionary Welcome Neural Interface */}
          <Animated.View
            style={[
              styles.neuralWelcomeContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={['rgba(0, 212, 255, 0.1)', 'rgba(91, 115, 255, 0.1)']}
              style={styles.welcomeBackground}
            >
              <View style={styles.welcomeContent}>
                <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
                  {profileImage ? (
                    <View style={styles.profileImageContainer}>
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                      <View style={styles.profileImageBorder} />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['#00d4ff', '#5b73ff']}
                      style={styles.neuralAvatar}
                    >
                      <Ionicons name="person" size={30} color="#fff" />
                    </LinearGradient>
                  )}
                  <Animated.View
                    style={[
                      styles.orbitingIndicator,
                      { transform: [{ rotate: rotateInterpolate }] }
                    ]}
                  >
                    <View style={styles.orbitDot} />
                  </Animated.View>
                </Animated.View>
                
                <View style={styles.welcomeTextContainer}>
                  <Text style={styles.neuralWelcomeText}>
                    Welcome, Dr. {user?.firstName || 'Doctor'}
                  </Text>
                  <Text style={styles.neuralWelcomeSubtext}>
                    Malaria Diagnostic Center
                  </Text>
                  <Text style={styles.neuralMission}>
                    AI-powered malaria detection system
                  </Text>
              </View>
            </View>
            </LinearGradient>
          </Animated.View>

          {/* Revolutionary Neural Action Grid */}
          <Animated.View
            style={[
              styles.actionsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.actionsTitle}>Medical Operations</Text>
            <Text style={styles.actionsSubtitle}>Select diagnostic function</Text>
            
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <Animated.View
                  key={action.id}
                  style={[
                    styles.neuralActionCard,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: action.disabled ? 0.4 : 1,
                    }
                  ]}
                >
                  <TouchableOpacity
                    onPress={action.onPress}
                    disabled={action.disabled}
                    style={styles.actionButton}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.actionGradient}
                    >
                      {/* Neural glow effect */}
                      <Animated.View style={[
                        styles.actionGlow,
                        { 
                          opacity: glowIntensity,
                          shadowColor: action.glowColor
                        }
                      ]} />
                      
                      <View style={styles.actionContent}>
                        <Animated.View style={[
                          styles.actionIconContainer,
                          { transform: [{ rotate: rotateInterpolate }] }
                        ]}>
                          <Ionicons name={action.icon} size={28} color="#fff" />
                        </Animated.View>
                        
                        <View style={styles.actionTextContainer}>
                          <Text style={styles.neuralActionTitle}>{action.title}</Text>
                          <Text style={styles.neuralActionSubtitle}>{action.subtitle}</Text>
                          <Text style={styles.neuralActionDescription}>{action.description}</Text>
                </View>
                        
                        <Animated.View style={[
                          styles.actionArrow,
                          { transform: [{ translateX: neuralWaveInterpolate }] }
                        ]}>
                          <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.8)" />
                        </Animated.View>
              </View>
              
                      {/* Data flow indicator */}
                      <Animated.View
                        style={[
                          styles.dataFlowIndicator,
                          {
                            transform: [{ translateX: dataFlowInterpolate }],
                            opacity: glowIntensity,
                          }
                        ]}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
                </View>
          </Animated.View>

          {/* Advanced Neural Diagnostic Panel */}
          {!isConnected && (
            <Animated.View
              style={[
                styles.diagnosticPanel,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={['rgba(255, 107, 107, 0.15)', 'rgba(255, 142, 142, 0.15)']}
                style={styles.diagnosticBackground}
              >
                <View style={styles.diagnosticHeader}>
                  <Animated.View style={[styles.alertIcon, { transform: [{ scale: pulseAnim }] }]}>
                    <Ionicons name="warning" size={24} color="#ff6b6b" />
                  </Animated.View>
                  <Text style={styles.diagnosticTitle}>Neural Network Offline</Text>
            </View>

                <Text style={styles.diagnosticDescription}>
                  Connection to malaria detection server lost. Neural processing capabilities disabled.
                </Text>
                
                <View style={styles.networkMetrics}>
                  <Text style={styles.metricText}>• Server Status: Disconnected</Text>
                  <Text style={styles.metricText}>• Neural Link: Inactive</Text>
                  <Text style={styles.metricText}>• AI Processing: Offline</Text>
            </View>

                <Animated.View style={[styles.quickConfigureContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.prompt(
                        'Neural Network Configuration',
                        'Enter server IP address:',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Sync', 
                            onPress: (ip) => {
                              if (ip && ip.trim()) {
                                Alert.alert('Neural Link', `Synced to ${ip.trim()}`);
                                checkServerConnection();
                              } else {
                                Alert.alert('Error', 'Neural sync failed');
                              }
                            }
                          }
                        ],
                        'plain-text',
                        '192.168.1.100'
                      );
                    }}
                  >
                    <LinearGradient
                      colors={['#00d4ff', '#5b73ff']}
                      style={styles.configureGradient}
                    >
                      <Ionicons name="flash" size={20} color="#fff" />
                      <Text style={styles.configureButtonText}>Sync Neural Network</Text>
                    </LinearGradient>
                </TouchableOpacity>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          )}
          </ScrollView>
      </LinearGradient>
        </View>
  );
};

const styles = StyleSheet.create({
  neuralContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  neuralGradient: {
    flex: 1,
  },
  neuralBackgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  dataStream: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(0, 212, 255, 0.6)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    width: 100,
  },
  neuralNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(91, 115, 255, 0.8)',
    shadowColor: '#5b73ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  neuralScrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  neuralHeaderContainer: {
    margin: 20,
    marginTop: Platform.OS === 'ios' ? 50 : 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    zIndex: 2,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  statusInfo: {
    flex: 1,
  },
  connectionStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  serverInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emergencyButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  configureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  configureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 2,
    backgroundColor: 'rgba(0, 212, 255, 0.8)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  neuralWelcomeContainer: {
    margin: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  welcomeBackground: {
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 20,
    position: 'relative',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neuralAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'relative',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileImageBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00d4ff',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  orbitingIndicator: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  orbitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  neuralWelcomeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  neuralWelcomeSubtext: {
    fontSize: 14,
    color: 'rgba(0, 212, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 4,
  },
  neuralMission: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  actionsSection: {
    margin: 20,
    marginTop: 10,
  },
  actionsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  actionsSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 15,
  },
  neuralActionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 20,
  },
  actionButton: {
    overflow: 'hidden',
  },
  actionGradient: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    zIndex: 1,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 25,
    zIndex: 2,
  },
  actionIconContainer: {
    marginRight: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  actionTextContainer: {
    flex: 1,
  },
  neuralActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  neuralActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  neuralActionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  actionArrow: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dataFlowIndicator: {
    position: 'absolute',
    top: '50%',
    height: 2,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  diagnosticPanel: {
    margin: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  diagnosticBackground: {
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  alertIcon: {
    marginRight: 12,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  diagnosticTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff6b6b',
  },
  diagnosticDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 20,
  },
  networkMetrics: {
    marginBottom: 25,
  },
  metricText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  quickConfigureContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
});

export default DashboardScreen;
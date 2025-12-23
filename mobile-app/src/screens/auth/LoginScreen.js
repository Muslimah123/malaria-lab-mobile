// src/screens/auth/LoginScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { loginUser, selectIsLoading, selectError, clearError } from '../../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Demo credentials
  const demoCredentials = [
    {
      name: 'Admin User',
      email: 'admin@malarialab.com',
      password: 'admin123',
      role: 'Admin',
      color: '#667eea'
    },
    {
      name: 'Lab Technician',
      email: 'lab.tech@clinic.com',
      password: 'lab123',
      role: 'Technician',
      color: '#764ba2'
    },
    {
      name: 'Supervisor/Doctor',
      email: 'dr.smith@clinic.com',
      password: 'password123',
      role: 'Supervisor',
      color: '#9c88ff'
    }
  ];

  // Advanced animation refs for cutting-edge UI
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const formSlideAnim = useRef(new Animated.Value(30)).current;
  const emailLabelAnim = useRef(new Animated.Value(email ? 1 : 0)).current;
  const passwordLabelAnim = useRef(new Animated.Value(password ? 1 : 0)).current;
  
  // Advanced neural network effects
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const neuralAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Clear any previous errors
    dispatch(clearError());
    
    // Revolutionary entrance animations with neural network effects
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(formSlideAnim, {
          toValue: 0,
          tension: 110,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous neural network ambient effects
    const pulseAnimation = Animated.loop(
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
    );

    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );

    const glowAnimation = Animated.loop(
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
    );

    const neuralAnimation = Animated.loop(
      Animated.timing(neuralAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    );

    const particleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    rotationAnimation.start();
    glowAnimation.start();
    neuralAnimation.start();
    particleAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotationAnimation.stop();
      glowAnimation.stop();
      neuralAnimation.stop();
      particleAnimation.stop();
    };
  }, [dispatch]);

  const animateLabel = (labelAnim, value) => {
    Animated.timing(labelAnim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    animateLabel(emailLabelAnim, text);
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    animateLabel(passwordLabelAnim, text);
  };

  const handleDemoLogin = (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    animateLabel(emailLabelAnim, demoUser.email);
    animateLabel(passwordLabelAnim, demoUser.password);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      if (result.success) {
        console.log('Login successful:', result.user);
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error || 'Login failed. Please try again.');
    }
  };

  // Advanced interpolations for neural effects
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const neuralWaveInterpolate = neuralAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  const particleFloat = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });

  const glowIntensity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        locations={[0, 0.6, 1]}
        style={styles.neuralGradient}
      >
        {/* Revolutionary Neural Network Background */}
        <View style={styles.neuralBackgroundContainer}>
          {/* Animated neural nodes */}
          <Animated.View style={[
            styles.neuralNode, 
            styles.node1,
            { 
              opacity: glowIntensity,
              transform: [
                { scale: pulseAnim },
                { translateY: particleFloat }
              ]
            }
          ]} />
          <Animated.View style={[
            styles.neuralNode, 
            styles.node2,
            { 
              opacity: glowIntensity,
              transform: [
                { scale: pulseAnim },
                { translateX: neuralWaveInterpolate }
              ]
            }
          ]} />
          <Animated.View style={[
            styles.neuralNode, 
            styles.node3,
            { 
              opacity: glowIntensity,
              transform: [
                { rotate: rotateInterpolate },
                { scale: pulseAnim }
              ]
            }
          ]} />

          {/* Neural connections */}
          <Animated.View style={[
            styles.neuralConnection,
            styles.connection1,
            { opacity: glowIntensity }
          ]} />
          <Animated.View style={[
            styles.neuralConnection,
            styles.connection2,
            { opacity: glowIntensity }
          ]} />
          <Animated.View style={[
            styles.neuralConnection,
            styles.connection3,
            { opacity: glowIntensity }
          ]} />

          {/* Floating particles */}
          <Animated.View style={[
            styles.floatingParticle,
            styles.particle1,
            { 
              opacity: particleAnim,
              transform: [{ translateY: particleFloat }]
            }
          ]} />
          <Animated.View style={[
            styles.floatingParticle,
            styles.particle2,
            { 
              opacity: particleAnim,
              transform: [{ translateX: neuralWaveInterpolate }]
            }
          ]} />
          <Animated.View style={[
            styles.floatingParticle,
            styles.particle3,
            { 
              opacity: particleAnim,
              transform: [{ rotate: rotateInterpolate }]
            }
          ]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
            
            {/*  Neural AI Logo Section */}
            <Animated.View 
              style={[
                styles.neuralLogoSection,
                { 
                  opacity: fadeAnim,
                  transform: [{ scale: logoScaleAnim }] 
                }
              ]}
            >
              <View style={styles.neuralLogoContainer}>
                <Animated.View style={[
                  styles.neuralLogoBorder,
                  { 
                    transform: [{ rotate: rotateInterpolate }],
                    opacity: glowIntensity
                  }
                ]}>
                  <LinearGradient
                    colors={['#00d4ff', '#5b73ff', '#9c44ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.neuralLogo}
                  >
                    <Animated.View 
                      style={[
                        styles.logoIconContainer,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      <Ionicons name="analytics" size={40} color="#fff" />
                    </Animated.View>
                    
                    {/* Neural glow effect */}
                    <Animated.View 
                      style={[
                        styles.neuralGlow,
                        { opacity: glowIntensity }
                      ]} 
                    />
                  </LinearGradient>
                </Animated.View>
                
                {/* Orbiting particles around logo */}
                <Animated.View style={[
                  styles.orbitingParticle,
                  styles.orbit1,
                  { transform: [{ rotate: rotateInterpolate }] }
                ]}>
                  <View style={styles.particle} />
                </Animated.View>
                <Animated.View style={[
                  styles.orbitingParticle,
                  styles.orbit2,
                  { transform: [{ rotate: rotateInterpolate }] }
                ]}>
                  <View style={styles.particle} />
                </Animated.View>
              </View>
              
              <Text style={styles.neuralAppTitle}>MalariaLab</Text>
              <Text style={styles.neuralAppSubtitle}> AI Diagnostic Platform</Text>
              
              <View style={styles.neuralTaglineContainer}>
                <Animated.View style={[
                  styles.taglinePulse,
                  { opacity: glowIntensity }
                ]} />
                <Text style={styles.neuralTagline}>🧬 Quantum Precision • ⚡ Speed • 🔬 AI Reliability</Text>
              </View>
            </Animated.View>

            {/* Advanced Neural Demo Section */}
            <Animated.View 
              style={[
                styles.neuralDemoSection,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: formSlideAnim }] 
                }
              ]}
            >
              <LinearGradient
                colors={['rgba(0, 212, 255, 0.1)', 'rgba(91, 115, 255, 0.1)', 'rgba(156, 68, 255, 0.1)']}
                style={styles.demoSectionBackground}
              >
                <Text style={styles.neuralDemoTitle}> Access Profiles</Text>
                <Text style={styles.neuralDemoSubtitle}>Select your interface authorization level</Text>
                
                <View style={styles.neuralDemoButtonsContainer}>
                  {demoCredentials.map((demoUser, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.neuralDemoCard,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.neuralDemoButton}
                        onPress={() => handleDemoLogin(demoUser)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={[demoUser.color, `${demoUser.color}CC`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.neuralDemoGradient}
                        >
                          <View style={styles.neuralDemoContent}>
                            <View style={styles.neuralDemoInfo}>
                              <Text style={styles.neuralDemoName}>{demoUser.name}</Text>
                              <Text style={styles.neuralDemoRole}>{demoUser.role}</Text>
                              <View style={styles.neuralAccessLevel}>
                                <Ionicons name="shield-checkmark" size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.accessLevelText}> Access Level {index + 1}</Text>
                              </View>
                            </View>
                            
                            <Animated.View style={[
                              styles.neuralDemoIcon,
                              { transform: [{ rotate: rotateInterpolate }] }
                            ]}>
                              <Ionicons name="arrow-forward-circle" size={28} color="#fff" />
                            </Animated.View>
                          </View>
                          
                          {/* Neural pattern overlay */}
                          <Animated.View style={[
                            styles.neuralPatternOverlay,
                            { opacity: glowIntensity }
                          ]} />
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Enhanced Login Form */}
            <Animated.View 
              style={[
                styles.formContainer,
                { transform: [{ translateY: formSlideAnim }] }
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                style={styles.formGradient}
              >
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Animated.Text 
                    style={[
                      styles.floatingLabel,
                      {
                        opacity: emailLabelAnim,
                        transform: [{
                          translateY: emailLabelAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    Email or Username
                  </Animated.Text>
                  <View style={[
                    styles.inputWrapper,
                    emailFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={emailFocused ? "#667eea" : "#999"} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="doctor@malarialab.com"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={handleEmailChange}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Animated.Text 
                    style={[
                      styles.floatingLabel,
                      {
                        opacity: passwordLabelAnim,
                        transform: [{
                          translateY: passwordLabelAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    Password
                  </Animated.Text>
                  <View style={[
                    styles.inputWrapper,
                    passwordFocused && styles.inputWrapperFocused
                  ]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={passwordFocused ? "#667eea" : "#999"} 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Enter your password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={handlePasswordChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Enhanced Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isLoading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.loadingText}>Signing In...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonContent}>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Info Badge */}
                <View style={styles.infoBadge}>
                  <Ionicons name="information-circle-outline" size={16} color="#667eea" />
                  <Text style={styles.infoText}>Use demo accounts above for quick testing</Text>
                </View>

                <TouchableOpacity 
                  style={styles.serverConfigButton}
                  onPress={() => navigation.navigate('ServerConfig')}
                >
                  <Ionicons name="server" size={20} color="#667eea" />
                  <View style={styles.serverConfigText}>
                    <Text style={styles.serverConfigTitle}>Configure Server</Text>
                    <Text style={styles.serverConfigSubtitle}>
                      Update IP or port before signing in
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#667eea" />
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            {/* Enhanced Footer */}
            <View style={styles.footer}>
              <View style={styles.securityBadges}>
                <View style={styles.securityBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.badgeText}>Secure</Text>
                </View>
                <View style={styles.securityBadge}>
                  <Ionicons name="medical" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.badgeText}>HIPAA</Text>
                </View>
                <View style={styles.securityBadge}>
                  <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.badgeText}>Encrypted</Text>
                </View>
              </View>
            </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  neuralGradient: {
    flex: 1,
    position: 'relative',
  },
  neuralBackgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  neuralNode: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 212, 255, 0.3)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  node1: {
    top: 80,
    right: 50,
  },
  node2: {
    bottom: 200,
    left: 30,
  },
  node3: {
    top: '45%',
    right: -30,
  },
  neuralConnection: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(91, 115, 255, 0.6)',
    shadowColor: '#5b73ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  connection1: {
    width: 200,
    top: 150,
    right: 100,
    transform: [{ rotate: '45deg' }],
  },
  connection2: {
    width: 150,
    bottom: 250,
    left: 80,
    transform: [{ rotate: '-30deg' }],
  },
  connection3: {
    width: 180,
    top: '50%',
    right: 20,
    transform: [{ rotate: '60deg' }],
  },
  floatingParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  particle1: {
    top: 120,
    left: 80,
  },
  particle2: {
    bottom: 300,
    right: 100,
  },
  particle3: {
    top: '35%',
    left: 150,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    minHeight: height,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'flex-start',
  },
  neuralLogoSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  neuralLogoContainer: {
    marginBottom: 15,
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neuralLogoBorder: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.6)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  neuralLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#5b73ff',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logoIconContainer: {
    zIndex: 3,
  },
  neuralGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 66,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  orbitingParticle: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit1: {
    top: -10,
    left: -10,
  },
  orbit2: {
    bottom: -10,
    right: -10,
  },
  particle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00d4ff',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  neuralAppTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  neuralAppSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 6,
  },
  neuralTaglineContainer: {
    alignItems: 'center',
    marginTop: 15,
    position: 'relative',
  },
  taglinePulse: {
    position: 'absolute',
    width: 300,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  neuralTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 2,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  neuralDemoSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  demoSectionBackground: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  neuralDemoTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  neuralDemoSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  neuralDemoButtonsContainer: {
    gap: 10,
  },
  neuralDemoCard: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  neuralDemoButton: {
    overflow: 'hidden',
  },
  neuralDemoGradient: {
    position: 'relative',
    overflow: 'hidden',
  },
  neuralDemoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    zIndex: 2,
  },
  neuralDemoInfo: {
    flex: 1,
  },
  neuralDemoName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  neuralDemoRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  neuralAccessLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accessLevelText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  neuralDemoIcon: {
    marginLeft: 15,
  },
  neuralPatternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  formContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 25,
  },
  formGradient: {
    padding: 35,
  },
  inputContainer: {
    marginBottom: 25,
  },
  floatingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    borderRadius: 16,
    marginTop: 10,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 20,
    alignSelf: 'center',
  },
  infoText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  serverConfigButton: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
  },
  serverConfigText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  serverConfigTitle: {
    color: '#1a1a2e',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  serverConfigSubtitle: {
    color: '#4c4f66',
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  securityBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  badgeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default LoginScreen;

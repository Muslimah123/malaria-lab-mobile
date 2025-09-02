import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AddPatientModal = ({ visible, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone_number: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modern animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (visible) {
      // Start animations when modal opens
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
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
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Call API to create patient
      console.log('Creating patient:', formData);
      
      // Call the onSuccess callback with the form data
      // The parent component will handle the API call
      await onSuccess(formData);
      handleClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      phone_number: '',
      email: '',
    });
    setErrors({});
    onClose();
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modernContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
        
        <LinearGradient
          colors={['#0f0f23', '#1a1a3a', '#2d2d5f']}
          style={styles.backgroundGradient}
        >
          {/* Floating Elements Background */}
          <View style={styles.floatingElementsContainer}>
            {[...Array(4)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.floatingElement,
                  {
                    top: `${15 + i * 20}%`,
                    left: `${10 + (i % 2) * 75}%`,
                    opacity: fadeAnim,
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              />
            ))}
          </View>

          {/* Modern Header */}
          <Animated.View
            style={[
              styles.modernHeader,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={styles.modernCloseButton}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.closeButtonGradient}
              >
                <Ionicons name="close" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.modernHeaderTitle}>New Patient Registration</Text>
              <Text style={styles.modernHeaderSubtitle}>Medical Record Creation</Text>
            </View>
            
            <View style={styles.headerIconContainer}>
              <Animated.View style={[styles.headerIcon, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.headerIconGradient}
                >
                  <Ionicons name="person-add" size={20} color="white" />
                </LinearGradient>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Modern Content */}
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              style={styles.modernContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Basic Information Card */}
              <Animated.View
                style={[
                  styles.modernCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.modernCardHeader}>
                    <Ionicons name="person" size={18} color="#667eea" />
                    <Text style={styles.modernCardTitle}>Personal Information</Text>
                  </View>
                  
                  <View style={styles.modernCardContent}>
                    {/* Name Row */}
                    <View style={styles.modernRow}>
                      <View style={styles.modernInputGroup}>
                        <Text style={styles.modernLabel}>First Name *</Text>
                        <TextInput
                          style={[styles.modernInput, errors.first_name && styles.modernInputError]}
                          value={formData.first_name}
                          onChangeText={(value) => updateField('first_name', value)}
                          placeholder="Enter first name"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />
                        {errors.first_name && <Text style={styles.modernErrorText}>{errors.first_name}</Text>}
                      </View>
                      
                      <View style={styles.modernInputGroup}>
                        <Text style={styles.modernLabel}>Last Name *</Text>
                        <TextInput
                          style={[styles.modernInput, errors.last_name && styles.modernInputError]}
                          value={formData.last_name}
                          onChangeText={(value) => updateField('last_name', value)}
                          placeholder="Enter last name"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />
                        {errors.last_name && <Text style={styles.modernErrorText}>{errors.last_name}</Text>}
                      </View>
                    </View>

                    {/* Date & Gender Row */}
                    <View style={styles.modernRow}>
                      <View style={styles.modernInputGroup}>
                        <Text style={styles.modernLabel}>Date of Birth *</Text>
                        <TextInput
                          style={[styles.modernInput, errors.date_of_birth && styles.modernInputError]}
                          value={formData.date_of_birth}
                          onChangeText={(value) => updateField('date_of_birth', value)}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />
                        {errors.date_of_birth && <Text style={styles.modernErrorText}>{errors.date_of_birth}</Text>}
                      </View>
                      
                      <View style={styles.modernInputGroup}>
                        <Text style={styles.modernLabel}>Gender *</Text>
                        <View style={styles.modernGenderContainer}>
                          <TouchableOpacity
                            style={[
                              styles.modernGenderButton,
                              formData.gender === 'male' && styles.modernGenderButtonActive
                            ]}
                            onPress={() => updateField('gender', 'male')}
                          >
                            <Text style={[
                              styles.modernGenderButtonText,
                              formData.gender === 'male' && styles.modernGenderButtonTextActive
                            ]}>Male</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.modernGenderButton,
                              formData.gender === 'female' && styles.modernGenderButtonActive
                            ]}
                            onPress={() => updateField('gender', 'female')}
                          >
                            <Text style={[
                              styles.modernGenderButtonText,
                              formData.gender === 'female' && styles.modernGenderButtonTextActive
                            ]}>Female</Text>
                          </TouchableOpacity>
                        </View>
                        {errors.gender && <Text style={styles.modernErrorText}>{errors.gender}</Text>}
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Contact Information Card */}
              <Animated.View
                style={[
                  styles.modernCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.modernCardHeader}>
                    <Ionicons name="call" size={18} color="#667eea" />
                    <Text style={styles.modernCardTitle}>Contact Information</Text>
                  </View>
                  
                  <View style={styles.modernCardContent}>
                    <View style={styles.modernInputGroup}>
                      <Text style={styles.modernLabel}>Phone Number *</Text>
                      <TextInput
                        style={[styles.modernInput, errors.phone_number && styles.modernInputError]}
                        value={formData.phone_number}
                        onChangeText={(value) => updateField('phone_number', value)}
                        placeholder="Enter phone number"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        keyboardType="phone-pad"
                      />
                      {errors.phone_number && <Text style={styles.modernErrorText}>{errors.phone_number}</Text>}
                    </View>

                    <View style={styles.modernInputGroup}>
                      <Text style={styles.modernLabel}>Email (Optional)</Text>
                      <TextInput
                        style={styles.modernInput}
                        value={formData.email}
                        onChangeText={(value) => updateField('email', value)}
                        placeholder="Enter email address"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            </ScrollView>

            {/* Modern Footer */}
            <Animated.View
              style={[
                styles.modernFooter,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.modernCancelButton} 
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.modernCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modernSubmitButton, isSubmitting && styles.modernSubmitButtonDisabled]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={isSubmitting ? ['#95a5a6', '#7f8c8d'] : ['#667eea', '#764ba2']}
                  style={styles.submitButtonGradient}
                >
                  {isSubmitting ? (
                    <Animated.View style={[styles.loadingIcon, { transform: [{ rotate: '360deg' }] }]}>
                      <Ionicons name="hourglass" size={18} color="white" />
                    </Animated.View>
                  ) : (
                    <Ionicons name="person-add" size={18} color="white" />
                  )}
                  <Text style={styles.modernSubmitButtonText}>
                    {isSubmitting ? 'Creating...' : 'Create Patient'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  floatingElementsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  modernHeader: {
    paddingTop: StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernCloseButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  modernHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  modernHeaderSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: 2,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
  },
  headerIcon: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  modernContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  modernCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    padding: 20,
  },
  modernCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  modernCardContent: {
    gap: 16,
  },
  modernRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modernInputGroup: {
    flex: 1,
  },
  modernLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modernInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    letterSpacing: 0.2,
  },
  modernInputError: {
    borderColor: '#e74c3c',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  modernErrorText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  modernGenderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modernGenderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  modernGenderButtonActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderColor: '#667eea',
  },
  modernGenderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
  },
  modernGenderButtonTextActive: {
    color: 'white',
  },
  modernFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  modernCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  modernCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
  },
  modernSubmitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modernSubmitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  modernSubmitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
  loadingIcon: {
    marginRight: 4,
  },
});

export default AddPatientModal;
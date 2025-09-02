import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { registerUser } from '../../store/slices/authSlice';

const UserRegistrationModal = ({ visible, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'technician',
  });

  const [errors, setErrors] = useState({});

  const roles = [
    { value: 'technician', label: 'Lab Technician', color: '#667eea' },
    { value: 'supervisor', label: 'Supervisor/Doctor', color: '#764ba2' },
    { value: 'admin', label: 'Administrator', color: '#f093fb' },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.username) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await dispatch(registerUser(formData)).unwrap();
      if (result.success) {
        Alert.alert(
          'Success',
          'User registered successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess();
                handleClose();
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to register user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: 'technician',
    });
    setErrors({});
    onClose();
  };

  const renderInput = (field, label, placeholder, options = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          secureTextEntry={field.includes('password')}
          autoCapitalize={options.autoCapitalize || 'none'}
          keyboardType={options.keyboardType || 'default'}
          {...options}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.modalHeader}
          >
            <View style={styles.headerContent}>
              <Text style={styles.modalTitle}>Register New User</Text>
              <Text style={styles.modalSubtitle}>Create a new user account</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Role Selection */}
            <View style={styles.roleSection}>
              <Text style={styles.sectionTitle}>Select Role</Text>
              <View style={styles.roleButtons}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleButton,
                      { backgroundColor: role.color },
                      formData.role === role.value && styles.roleButtonActive
                    ]}
                    onPress={() => handleInputChange('role', role.value)}
                  >
                    <Text style={styles.roleButtonText}>{role.label}</Text>
                    {formData.role === role.value && (
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              {renderInput('firstName', 'First Name', 'Enter first name', { autoCapitalize: 'words' })}
              {renderInput('lastName', 'Last Name', 'Enter last name', { autoCapitalize: 'words' })}
            </View>

            {/* Account Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              {renderInput('email', 'Email', 'Enter email address', { keyboardType: 'email-address' })}
              {renderInput('username', 'Username', 'Enter username')}
            </View>

            {/* Password */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Password</Text>
              {renderInput('password', 'Password', 'Enter password')}
              {renderInput('confirmPassword', 'Confirm Password', 'Confirm password')}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                style={styles.submitButtonGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.loadingText}>Creating User...</Text>
                  </View>
                ) : (
                  <View style={styles.submitButtonContent}>
                    <Ionicons name="person-add" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Create User</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
  },
  modalHeader: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 20,
  },
  roleSection: {
    marginBottom: 25,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  roleButtonActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  roleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  input: {
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 5,
    marginLeft: 4,
  },
  submitButton: {
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserRegistrationModal;

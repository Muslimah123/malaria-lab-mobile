// src/screens/upload/UploadScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  StatusBar,
  Image,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import patientService from '../../services/api/patientService';
import testService from '../../services/api/testService';
import api from '../../services/api';
import { API_BASE_URL } from '../../config/api';

const ZoomableImage = ({ source, style }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const [lastScale, setLastScale] = useState(1);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTranslateY, setLastTranslateY] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        scale.setOffset(lastScale);
        translateX.setOffset(lastTranslateX);
        translateY.setOffset(lastTranslateY);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Handle pinch-to-zoom
        if (gestureState.numberActiveTouches === 2) {
          // Simplified zoom based on gesture
          const scaleValue = Math.max(0.5, Math.min(gestureState.scale || 1, 3));
          scale.setValue(scaleValue);
        } else if (gestureState.numberActiveTouches === 1 && lastScale > 1) {
          // Handle pan when zoomed in
          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Double tap to zoom
        if (gestureState.numberActiveTouches === 0 && !gestureState.dx && !gestureState.dy) {
          const currentScale = lastScale;
          const newScale = currentScale > 1 ? 1 : 2;
          
          setLastScale(newScale);
          setLastTranslateX(newScale === 1 ? 0 : lastTranslateX);
          setLastTranslateY(newScale === 1 ? 0 : lastTranslateY);
          
          Animated.parallel([
            Animated.timing(scale, {
              toValue: newScale,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: newScale === 1 ? 0 : lastTranslateX,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: newScale === 1 ? 0 : lastTranslateY,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        scale.flattenOffset();
        translateX.flattenOffset();
        translateY.flattenOffset();
      },
    })
  ).current;

  return (
    <View style={style} {...panResponder.panHandlers}>
      <Animated.Image
        source={source}
        style={[
          {
            width: '100%',
            height: '100%',
            transform: [
              { scale },
              { translateX },
              { translateY },
            ],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const UploadScreen = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Patient Information State
  const [patientOption, setPatientOption] = useState('existing'); // 'existing' or 'new'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New Patient Form State
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    email: '',
  });
  
  // Test Information State
  const [testData, setTestData] = useState({
    priority: 'normal',
    sampleType: 'blood_smear',
    clinicalNotes: '',
  });
  
  // Upload Session State
  const [uploadSession, setUploadSession] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState(null);

  // Advanced animation states for cutting-edge UI
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const morphAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Initialize sophisticated entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous sophisticated pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
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
    pulseAnimation.start();

    // Smooth rotation for processing indicators
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    rotationAnimation.start();

    // Ambient glow effect
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
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotationAnimation.stop();
      glowAnimation.stop();
    };
  }, []);

  // Advanced sparkle effect for success states
  const triggerSparkleEffect = () => {
    Animated.sequence([
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(sparkleAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Morphing animation for state transitions
  const triggerMorphTransition = (callback) => {
    Animated.sequence([
      Animated.timing(morphAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(morphAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };
  
  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        searchPatients(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Cleanup progress monitoring when component unmounts
  useEffect(() => {
    return () => {
      if (uploadSession?.progressInterval) {
        console.log('Cleaning up progress monitoring interval');
        clearInterval(uploadSession.progressInterval);
      }
    };
  }, [uploadSession?.progressInterval]);

  const searchPatients = async (query) => {
    try {
      const response = await patientService.searchPatients(query);
      setSearchResults(response.patients || response);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    Alert.alert('Success', 'Patient selected successfully!');
  };

  const handleCreatePatient = async () => {
    try {
      setIsLoading(true);
      
      // Transform data to match patientService expectations
      const transformedData = {
        first_name: newPatientData.firstName,
        last_name: newPatientData.lastName,
        date_of_birth: newPatientData.dateOfBirth,
        gender: newPatientData.gender,
        phone_number: newPatientData.phoneNumber,
        email: newPatientData.email,
      };
      
      const newPatient = await patientService.createPatient(transformedData);
      setSelectedPatient(newPatient);
      setShowCreateModal(false);
      setNewPatientData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        email: '',
      });
      Alert.alert('Success', 'Patient created successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create patient');
    } finally {
      setIsLoading(false);
    }
  };

  const createUploadSession = async () => {
    try {
      setIsLoading(true);
      
      // Create test record
      const testRecord = await testService.createTest({
        patient_id: selectedPatient.id,
        priority: testData.priority,
        sample_type: testData.sampleType,
        clinical_notes: testData.clinicalNotes,
        status: 'pending',
      });
      
      // Create upload session
      const session = {
        id: `SESSION-${Date.now()}`,
        testId: testRecord.id,
        patientId: selectedPatient.id,
        status: 'created',
        createdAt: new Date().toISOString(),
        step: currentStep,
      };
      
      setUploadSession(session);
      return session;
    } catch (error) {
      Alert.alert('Error', 'Failed to create upload session');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    console.log('Next button pressed. Current step:', currentStep);
    console.log('Selected patient:', selectedPatient);
    
    if (currentStep === 1) {
      // Validate patient selection
      if (!selectedPatient) {
        Alert.alert('Error', 'Please select or create a patient first');
        return;
      }
      
      console.log('Creating upload session...');
      // Create upload session before proceeding
      try {
        await createUploadSession();
        console.log('Upload session created successfully');
      } catch (error) {
        console.error('Failed to create upload session:', error);
        return; // Error already handled
      }
    }
    
    if (currentStep === 2) {
      // Validate images before proceeding to review
      if (!validateAllImages()) {
        return; // Validation failed
      }
    }
    
    if (currentStep === 3) {
      // FIXED: Prevent double-clicks and show upload progress
      if (isLoading) {
        console.log('Upload already in progress, ignoring click');
        return;
      }
      
      // FIXED: Upload images to backend WITHOUT starting AI processing
      // This should just validate, upload, and store images
      try {
        await uploadImagesToBackend();
        console.log('Images uploaded to backend successfully');
      } catch (error) {
        console.error('Failed to upload images:', error);
        Alert.alert('Error', 'Failed to upload images. Please try again.');
        return;
      }
    }
    
    if (currentStep < 5) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRefresh = () => {
    // Reset all state to initial values
    setCurrentStep(1);
    setSelectedPatient(null);
    setSearchQuery('');
    setSearchResults([]);
    setPatientOption('existing');
    setNewPatientData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phoneNumber: '',
      email: '',
    });
    setTestData({
      priority: 'normal',
      sampleType: 'blood_smear',
      clinicalNotes: '',
    });
    setSelectedImages([]);
    setUploadSession(null);
    setProcessingProgress(0);
    setProcessingStage('');
    
    Alert.alert('Refreshed', 'Upload form has been reset to start over.');
  };

  // Image handling functions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are required to take photos and select images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImage = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: result.assets[0].fileSize || 0,
        };
        
        if (selectedImages.length >= 20) {
          Alert.alert('Maximum Files Reached', 'You can only upload up to 20 images per session.');
          return;
        }
        
        setSelectedImages(prev => [...prev, newImage]);
        Alert.alert('Success', 'Photo captured successfully!');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const selectFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 20 - selectedImages.length,
        allowsEditing: false,
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => {
          // Determine the correct file type and name
          let fileName = asset.fileName;
          let fileType = asset.type;
          
          // If no fileName, generate one with proper extension
          if (!fileName) {
            const timestamp = Date.now();
            const extension = fileType === 'image/png' ? '.png' : 
                            fileType === 'image/tiff' ? '.tiff' : '.jpg';
            fileName = `image_${timestamp}_${index}${extension}`;
          }
          
          // If no fileType, try to infer from fileName
          if (!fileType) {
            const lowerFileName = fileName.toLowerCase();
            if (lowerFileName.endsWith('.png')) {
              fileType = 'image/png';
            } else if (lowerFileName.endsWith('.tiff') || lowerFileName.endsWith('.tif')) {
              fileType = 'image/tiff';
          } else {
              fileType = 'image/jpeg'; // Default for .jpg/.jpeg
            }
          }
          
          return {
            id: `${Date.now()}_${index}`,
            uri: asset.uri,
            name: fileName,
            type: fileType,
            size: asset.fileSize || 0,
          };
        });
        
        // Debug logging for selected images
        console.log('Selected images:', newImages.map(img => ({
          name: img.name,
          type: img.type,
          size: img.size
        })));
        
        setSelectedImages(prev => [...prev, ...newImages]);
        Alert.alert('Success', `${newImages.length} image(s) selected successfully!`);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const validateImage = (image) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
    
    if (image.size > maxSize) {
      Alert.alert('File Too Large', `${image.name} is larger than 10MB. Please select a smaller image.`);
      return false;
    }
    
    // Debug logging
    console.log(`Validating image: ${image.name}, Type: ${image.type}, Size: ${image.size}`);
    
    // Check if type is in allowed types
    if (allowedTypes.includes(image.type)) {
      console.log(`Image ${image.name} passed type validation`);
      return true;
    }
    
    // If type is not available or not in allowed types, check file extension
    const fileName = image.name.toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (hasValidExtension) {
      console.log(`Image ${image.name} passed extension validation`);
      return true;
    }
    
    console.log(`Image ${image.name} failed validation. Type: ${image.type}, Extensions checked: ${allowedExtensions.join(', ')}`);
    Alert.alert('Invalid File Type', `${image.name} is not a supported image format. Please select JPG, JPEG, PNG, or TIFF.`);
    return false;
  };

  const validateAllImages = () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images Selected', 'Please select at least one image for analysis.');
      return false;
    }
    
    if (selectedImages.length > 20) {
      Alert.alert('Too Many Images', 'You can only select up to 20 images per session.');
      return false;
    }
    
    for (const image of selectedImages) {
      if (!validateImage(image)) {
        return false;
      }
    }
    
    return true;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step ? styles.activeStep : styles.inactiveStep
          ]}>
            <Text style={[
              styles.stepNumber,
              currentStep >= step ? styles.activeStepText : styles.inactiveStepText
            ]}>
              {step}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            currentStep >= step ? styles.activeStepLabel : styles.inactiveStepLabel
          ]}>
            {getStepLabel(step)}
          </Text>
        </View>
      ))}
    </View>
  );

  const getStepLabel = (step) => {
    switch (step) {
      case 1: return 'Patient Info';
      case 2: return 'Upload Files';
      case 3: return 'Review';
      case 4: return 'Processing';
      case 5: return 'Complete';
      default: return '';
    }
  };

  const renderPatientInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Patient Information</Text>
      <Text style={styles.stepSubtitle}>Enter patient details or search existing patient</Text>
      
      {/* Patient Selection Options */}
      <View style={styles.patientOptions}>
        <TouchableOpacity 
          style={[
            styles.optionButton,
            patientOption === 'existing' && styles.optionButtonActive
          ]}
          onPress={() => setPatientOption('existing')}
        >
          <Ionicons 
            name="search" 
            size={20} 
            color={patientOption === 'existing' ? '#fff' : '#667eea'} 
          />
          <Text style={[
            styles.optionButtonText,
            patientOption === 'existing' && styles.optionButtonTextActive
          ]}>
            Existing Patient
          </Text>
      </TouchableOpacity>
      
        <TouchableOpacity 
          style={[
            styles.optionButton,
            patientOption === 'new' && styles.optionButtonActive
          ]}
          onPress={() => setPatientOption('new')}
        >
          <Ionicons 
            name="person-add" 
            size={20} 
            color={patientOption === 'new' ? '#fff' : '#667eea'} 
          />
          <Text style={[
            styles.optionButtonText,
            patientOption === 'new' && styles.optionButtonTextActive
          ]}>
            New Patient
          </Text>
        </TouchableOpacity>
      </View>

      {/* Existing Patient Search */}
      {patientOption === 'existing' && (
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Search Existing Patient</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID, name, or phone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={styles.searchResultItem}
                  onPress={() => handlePatientSelect(patient)}
                >
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>
                      {patient.firstName} {patient.lastName}
                    </Text>
                    <Text style={styles.patientDetails}>
                      ID: {patient.patientId} • Age: {patient.age || 'N/A'} • {patient.phoneNumber || 'No phone'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
              ))}
    </View>
          )}
          
          {searchQuery && searchResults.length === 0 && (
            <Text style={styles.noResults}>No patients found</Text>
          )}
        </View>
      )}

      {/* New Patient Form */}
      {patientOption === 'new' && (
        <View style={styles.newPatientSection}>
          <Text style={styles.sectionTitle}>Create New Patient</Text>
          <View style={styles.formRow}>
      <View style={styles.formField}>
              <Text style={styles.fieldLabel}>First Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newPatientData.firstName}
                onChangeText={(text) => setNewPatientData(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter first name"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Last Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newPatientData.lastName}
                onChangeText={(text) => setNewPatientData(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter last name"
              />
            </View>
      </View>
      
          <View style={styles.formRow}>
      <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date of Birth *</Text>
              <TextInput
                style={styles.textInput}
                value={newPatientData.dateOfBirth}
                onChangeText={(text) => setNewPatientData(prev => ({ ...prev, dateOfBirth: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Gender *</Text>
              <View style={styles.genderOptions}>
                {['Male', 'Female', 'Other'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      newPatientData.gender === gender && styles.genderOptionActive
                    ]}
                    onPress={() => setNewPatientData(prev => ({ ...prev, gender }))}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      newPatientData.gender === gender && styles.genderOptionTextActive
                    ]}>
                      {gender}
                    </Text>
        </TouchableOpacity>
                ))}
              </View>
            </View>
      </View>
      
          <View style={styles.formRow}>
      <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={newPatientData.phoneNumber}
                onChangeText={(text) => setNewPatientData(prev => ({ ...prev, phoneNumber: text }))}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
      </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={newPatientData.email}
                onChangeText={(text) => setNewPatientData(prev => ({ ...prev, email: text }))}
                placeholder="Enter email"
                keyboardType="email-address"
              />
    </View>
          </View>
          
          <TouchableOpacity
            style={styles.createPatientButton}
            onPress={handleCreatePatient}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.createPatientButtonText}>Create Patient</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

             {/* Test Information */}
       <View style={styles.testInfoSection}>
         <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Test Information</Text>
        <TouchableOpacity 
             style={styles.resetTestButton}
             onPress={() => setTestData({
               priority: 'normal',
               sampleType: 'blood_smear',
               clinicalNotes: '',
             })}
           >
             <Ionicons name="refresh" size={16} color="#667eea" />
             <Text style={styles.resetTestButtonText}>Reset</Text>
        </TouchableOpacity>
         </View>
        
        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Priority *</Text>
            <View style={styles.priorityOptions}>
              {['Low', 'Normal', 'High', 'Urgent'].map((priority) => (
        <TouchableOpacity 
                  key={priority}
                  style={[
                    styles.priorityOption,
                    testData.priority === priority.toLowerCase() && styles.priorityOptionActive
                  ]}
                  onPress={() => setTestData(prev => ({ ...prev, priority: priority.toLowerCase() }))}
                >
                  <Text style={[
                    styles.priorityOptionText,
                    testData.priority === priority.toLowerCase() && styles.priorityOptionTextActive
                  ]}>
                    {priority}
                  </Text>
        </TouchableOpacity>
              ))}
            </View>
          </View>
      </View>
      
        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Sample Type *</Text>
            <View style={styles.sampleTypeOptions}>
              {['Blood Smear', 'Thick Smear', 'Thin Smear'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.sampleTypeOption,
                    testData.sampleType === type.toLowerCase().replace(' ', '_') && styles.sampleTypeOptionActive
                  ]}
                  onPress={() => setTestData(prev => ({ 
                    ...prev, 
                    sampleType: type.toLowerCase().replace(' ', '_') 
                  }))}
                >
                  <Text style={[
                    styles.sampleTypeOptionText,
                    testData.sampleType === type.toLowerCase().replace(' ', '_') && styles.sampleTypeOptionTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Clinical Notes</Text>
          <TextInput
            style={styles.textArea}
            value={testData.clinicalNotes}
            onChangeText={(text) => setTestData(prev => ({ ...prev, clinicalNotes: text }))}
            placeholder="Enter symptoms, duration, travel history, medications, additional notes..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

             {/* Selected Patient Display */}
       {selectedPatient && (
         <View style={styles.selectedPatientCard}>
           <View style={styles.selectedPatientHeader}>
             <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
             <Text style={styles.selectedPatientTitle}>Patient Selected Successfully</Text>
           </View>
           <Text style={styles.selectedPatientName}>
             {selectedPatient.firstName} {selectedPatient.lastName}
           </Text>
           <Text style={styles.selectedPatientDetails}>
             ID: {selectedPatient.patientId} • Age: {selectedPatient.age || 'N/A'} • {selectedPatient.phoneNumber || 'No phone'}
           </Text>
           <TouchableOpacity 
             style={styles.changePatientButton}
             onPress={() => setSelectedPatient(null)}
           >
             <Ionicons name="swap-horizontal" size={16} color="#667eea" />
             <Text style={styles.changePatientButtonText}>Change Patient</Text>
           </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderUploadFilesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Upload Files</Text>
      <Text style={styles.stepSubtitle}>Upload blood sample images for analysis</Text>
      
             <View style={styles.uploadArea}>
         <Ionicons name="cloud-upload" size={60} color="#667eea" />
         <Text style={styles.uploadTitle}>Select Images for Analysis</Text>
         <Text style={styles.uploadSubtitle}>
           Supported formats: JPG, JPEG, PNG, TIFF{'\n'}
           Max file size: 10MB per file{'\n'}
           Maximum 20 files per session
         </Text>
        
                 <View style={styles.uploadButtons}>
           <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
             <Ionicons name="camera" size={20} color="#fff" />
             <Text style={styles.uploadButtonText}>Take Photo</Text>
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.uploadButton} onPress={selectFromGallery}>
             <Ionicons name="images" size={20} color="#fff" />
             <Text style={styles.uploadButtonText}>Select from Gallery</Text>
           </TouchableOpacity>
         </View>
      </View>
      
      {selectedImages.length > 0 && (
         <View style={styles.uploadedFiles}>
           <View style={styles.uploadedFilesHeader}>
             <Text style={styles.uploadedFilesTitle}>Selected Images ({selectedImages.length}/20)</Text>
                <TouchableOpacity 
               style={styles.clearAllButton}
               onPress={() => setSelectedImages([])}
                >
               <Ionicons name="trash" size={16} color="#e74c3c" />
               <Text style={styles.clearAllButtonText}>Clear All</Text>
                </TouchableOpacity>
           </View>
           <View style={styles.imageGrid}>
             {selectedImages.map((image) => (
               <View key={image.id} style={styles.imageItem}>
                 <Image source={{ uri: image.uri }} style={styles.imageThumbnail} />
                 <View style={styles.imageInfo}>
                   <Text style={styles.imageName} numberOfLines={1}>
                     {image.name}
                </Text>
                <Text style={styles.imageSize}>
                     {(image.size / (1024 * 1024)).toFixed(2)} MB
                </Text>
                 </View>
                 <TouchableOpacity
                   style={styles.removeImageButton}
                   onPress={() => removeImage(image.id)}
                 >
                   <Ionicons name="close-circle" size={24} color="#e74c3c" />
                 </TouchableOpacity>
              </View>
            ))}
           </View>
        </View>
      )}
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      <Text style={styles.stepSubtitle}>Review all information before processing</Text>
      
      {/* Patient Summary */}
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Patient Information</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Name:</Text>
          <Text style={styles.reviewValue}>
            {selectedPatient?.firstName} {selectedPatient?.lastName}
          </Text>
        </View>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Patient ID:</Text>
          <Text style={styles.reviewValue}>{selectedPatient?.patientId}</Text>
        </View>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Age:</Text>
          <Text style={styles.reviewValue}>{selectedPatient?.age || 'N/A'}</Text>
        </View>
      </View>
      
      {/* Test Summary */}
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Test Information</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Priority:</Text>
          <Text style={styles.reviewValue}>{testData.priority.toUpperCase()}</Text>
        </View>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Sample Type:</Text>
          <Text style={styles.reviewValue}>{testData.sampleType.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Clinical Notes:</Text>
          <Text style={styles.reviewValue}>
            {testData.clinicalNotes || 'None provided'}
          </Text>
        </View>
      </View>
      
      {/* Files Summary */}
      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Files to Process</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Total Images:</Text>
          <Text style={styles.reviewValue}>{selectedImages.length}</Text>
      </View>
      </View>
    </View>
  );

  const renderProcessingStep = () => {
    const isProcessing = uploadSession?.status === 'processing';
    const isReady = uploadSession?.status === 'uploaded';
    
    return (
    <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Processing</Text>
        
        {isReady && (
          <>
            <Text style={styles.stepSubtitle}>Images uploaded and validated</Text>
            <View style={styles.readyStateContainer}>
              <View style={styles.readyIconContainer}>
                <Ionicons name="play-circle" size={80} color="#667eea" />
              </View>
              <Text style={styles.readyText}>
                {uploadSession.totalFiles} images ready for AI processing
              </Text>
              <TouchableOpacity 
                style={styles.startProcessingButton}
                onPress={startAIProcessing}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.startProcessingButtonText}>Starting...</Text>
                  </View>
                ) : (
                  <Text style={styles.startProcessingButtonText}>Start Processing</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
        
        {isProcessing && (
          <>
            <Text style={styles.stepSubtitle}>AI analysis in progress</Text>
      <View style={styles.processingContainer}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressText}>{processingProgress}%</Text>
        </View>
        <Text style={styles.processingStage}>{processingStage}</Text>
        
              {/* FIXED: Show better status messages */}
              {processingStage.includes('Results Processing') && (
                <View style={styles.statusMessage}>
                  <Ionicons name="information-circle" size={20} color="#667eea" />
                  <Text style={styles.statusText}>
                    AI processing complete. Waiting for results to be stored...
                  </Text>
        </View>
              )}
              
              {processingStage.includes('Error') && (
                <View style={styles.statusMessage}>
                  <Ionicons name="warning" size={20} color="#e74c3c" />
                  <Text style={styles.statusText}>
                    {processingStage}
                  </Text>
              </View>
              )}
              
              {/* FIXED: Add manual check results button */}
              <TouchableOpacity 
                style={styles.checkResultsButton}
                onPress={() => fetchFinalResults(uploadSession.testId)}
              >
                <Ionicons name="refresh" size={20} color="#667eea" />
                <Text style={styles.checkResultsButtonText}>Check Results</Text>
              </TouchableOpacity>
              
              <Text style={styles.checkResultsHint}>
                If processing seems stuck, click "Check Results" to see if analysis is complete
              </Text>
              
              {/* Additional manual check button for immediate results */}
              <TouchableOpacity 
                style={[styles.checkResultsButton, { marginTop: 10, backgroundColor: '#28a745' }]}
                onPress={() => {
                  console.log('Manual check triggered by user');
                  fetchFinalResults(uploadSession.testId);
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={[styles.checkResultsButtonText, { color: '#fff' }]}>Force Check Results</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
    </View>
  );
  };

  const renderCompleteStep = () => {
    const results = uploadSession?.results;
    const patientId = results?.patientId;
    const testId = results?.testId;
    const totalImages = results?.detections?.length || 0;
    const totalParasites = results?.totalParasites || 0;
    const totalWbcs = results?.totalWbcs || 0;
    const parasiteWbcRatio = results?.parasiteWbcRatio !== null ? results.parasiteWbcRatio.toFixed(2) : 'N/A';
    const overallConfidence = results?.overallConfidence !== null ? (results.overallConfidence * 100).toFixed(1) : 'N/A';
    const mostProbableParasiteType = results?.mostProbableParasite?.type || 'N/A';
    const mostProbableParasiteFullName = results?.mostProbableParasite?.fullName || 'N/A';
    const statusColor = results?.status === 'POSITIVE' ? '#e74c3c' : '#27ae60';
    const processingTime = results?.processingTime ? `${results.processingTime.toFixed(1)}s` : 'N/A';
    
    console.log('Rendering complete step with results:', results);

    // Advanced rotations for dynamic elements
    const rotateInterpolate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const sparkleScale = sparkleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1.2],
    });

    const glowIntensity = glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3],
    });
    
    return (
      <Animated.View 
        style={[
          styles.advancedCompleteContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Revolutionary Neural Network Header */}
        <LinearGradient
          colors={results?.status === 'POSITIVE' 
            ? ['#ff6b6b', '#ee5a6f', '#e74c3c'] 
            : ['#4ecdc4', '#44a08d', '#27ae60']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.neuralHeader}
        >
          <Animated.View 
            style={[
              styles.neuralPattern,
              {
                opacity: glowIntensity,
                transform: [{ rotate: rotateInterpolate }]
              }
            ]}
          />
          
          <View style={styles.headerContent}>
            <Animated.View 
              style={[
                styles.diagnosticBadge,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.badgeGradient}
              >
                <Ionicons 
                  name={results?.status === 'POSITIVE' ? 'warning' : 'shield-checkmark'} 
                  size={32} 
                  color="#fff" 
                />
              </LinearGradient>
              
              {/* Sparkle effects for positive results */}
              {results?.status === 'POSITIVE' && (
                <Animated.View 
                  style={[
                    styles.sparkleEffect,
                    { transform: [{ scale: sparkleScale }] }
                  ]}
                >
                  <Ionicons name="star" size={16} color="#FFD700" />
                </Animated.View>
              )}
            </Animated.View>
            
            <View style={styles.diagnosticInfo}>
              <Text style={styles.diagnosticStatus}>
                {results?.status || 'ANALYZING'}
              </Text>
              <Text style={styles.diagnosticDetail}>
                {results?.status === 'POSITIVE' 
                  ? `${mostProbableParasiteFullName} • ${overallConfidence}% Confidence`
                  : `Clean Sample • ${overallConfidence}% Confidence`
                }
              </Text>
              <View style={styles.processingMetrics}>
                <View style={styles.metric}>
                  <Ionicons name="time" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metricText}>{processingTime}</Text>
                </View>
                <View style={styles.metric}>
                  <Ionicons name="layers" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metricText}>{totalImages} Images</Text>
                </View>
              </View>
            </View>
            </View>
            
          {/* Advanced confidence visualizer */}
          <View style={styles.confidenceVisualizer}>
            <Text style={styles.confidenceLabel}>Diagnostic Confidence</Text>
            <View style={styles.confidenceBar}>
              <LinearGradient
                colors={['#4FACFE', '#00F2FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.confidenceFill,
                  { width: `${overallConfidence}%` }
                ]}
              />
              <Text style={styles.confidencePercentage}>{overallConfidence}%</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.advancedScrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Revolutionary Data Dashboard */}
          <View style={styles.dataDashboard}>
            <Text style={styles.dashboardTitle}>Analysis Dashboard</Text>
            
            <View style={styles.metricsGrid}>
              {/* Parasite Density Meter */}
              <Animated.View 
                style={[
                  styles.advancedMetricCard,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <LinearGradient
                  colors={['#ff9a9e', '#fecfef']}
                  style={styles.metricGradient}
                >
                  <View style={styles.metricHeader}>
                    <Ionicons name="analytics" size={20} color="#ffffff" />
                    <Text style={styles.metricTitle}>Parasite Density</Text>
                  </View>
                  <Text style={styles.metricValue}>{totalParasites}</Text>
                  <View style={styles.densityMeter}>
                    <View style={[styles.densityBar, { 
                      width: `${Math.min((totalParasites / 100) * 100, 100)}%`,
                      backgroundColor: totalParasites > 50 ? '#e74c3c' : totalParasites > 20 ? '#f39c12' : '#27ae60'
                    }]} />
                  </View>
                  <Text style={styles.metricSubtext}>
                    {totalParasites > 50 ? 'High Density' : totalParasites > 20 ? 'Moderate' : 'Low Density'}
                </Text>
                </LinearGradient>
              </Animated.View>

              {/* WBC Counter */}
              <Animated.View 
                style={[
                  styles.advancedMetricCard,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <LinearGradient
                  colors={['#a8edea', '#fed6e3']}
                  style={styles.metricGradient}
                >
                  <View style={styles.metricHeader}>
                    <Ionicons name="cellular" size={20} color="#ffffff" />
                    <Text style={styles.metricTitle}>White Blood Cells</Text>
                  </View>
                  <Text style={styles.metricValue}>{totalWbcs}</Text>
                  <View style={styles.circularProgress}>
                    <Text style={styles.wbcRatio}>{parasiteWbcRatio}</Text>
                    <Text style={styles.ratioLabel}>P/WBC</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Processing Intelligence */}
              <Animated.View 
                style={[
                  styles.advancedMetricCard,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <LinearGradient
                  colors={['#ffecd2', '#fcb69f']}
                  style={styles.metricGradient}
                >
                  <View style={styles.metricHeader}>
                    <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                      <Ionicons name="hardware-chip" size={20} color="#ffffff" />
                    </Animated.View>
                    <Text style={styles.metricTitle}>AI Processing</Text>
                  </View>
                  <Text style={styles.metricValue}>{processingTime}</Text>
                  <Text style={styles.metricSubtext}>YOLOv12 Neural Network</Text>
                </LinearGradient>
              </Animated.View>

              {/* Sample Quality */}
              <Animated.View 
                style={[
                  styles.advancedMetricCard,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <LinearGradient
                  colors={['#d299c2', '#fef9d7']}
                  style={styles.metricGradient}
                >
                  <View style={styles.metricHeader}>
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.metricTitle}>Sample Quality</Text>
                  </View>
                  <Text style={styles.metricValue}>{totalImages}</Text>
                  <Text style={styles.metricSubtext}>Images Analyzed</Text>
                </LinearGradient>
              </Animated.View>
            </View>
          </View>

          {/* Revolutionary Interactive Neural Gallery */}
          {results?.detections && results.detections.length > 0 && (
            <View style={styles.neuralGallerySection}>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(240,248,255,0.95)']}
                style={styles.galleryBackground}
              >
                <View style={styles.galleryHeaderAdvanced}>
                  <View style={styles.galleryTitleContainer}>
                    <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                      <Ionicons name="grid" size={24} color="#667eea" />
                    </Animated.View>
                    <Text style={styles.galleryTitleAdvanced}>Neural Detection Gallery</Text>
                  </View>
                  <Text style={styles.gallerySubtitleAdvanced}>
                    Advanced AI visualization with real-time annotations
                </Text>
              </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScrollContainer}
                  style={styles.galleryScrollView}
                >
                  {results.detections.map((detection, index) => {
                    let annotatedUrl;
                    if (detection.annotatedImageUrl) {
                      let cleanPath = detection.annotatedImageUrl;
                      if (cleanPath.includes('/uploads/uploads/')) {
                        cleanPath = cleanPath.replace('/uploads/uploads/', '/uploads/');
                      }
                      annotatedUrl = `${API_BASE_URL.replace('/api', '')}${cleanPath}`;
                    } else {
                      annotatedUrl = `${API_BASE_URL.replace('/api', '')}/uploads/${detection.originalFilename}`;
                    }

                    return (
                      <Animated.View 
                        key={index}
                        style={[
                          styles.neuralImageCard,
                          { 
                            transform: [
                              { scale: pulseAnim },
                              { translateY: slideAnim }
                            ]
                          }
                        ]}
                      >
                        <TouchableOpacity 
                          style={styles.neuralImageContainer}
                          onPress={() => {
                            triggerSparkleEffect();
                            setSelectedImageModal({
                              ...detection,
                              url: annotatedUrl,
                              index: index
                            });
                          }}
                          activeOpacity={0.9}
                        >
                          {/* Holographic border effect */}
                          <LinearGradient
                            colors={['#667eea', '#764ba2', '#f093fb']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.holographicBorder}
                          >
                            <View style={styles.imageContentWrapper}>
                              <Image 
                                source={{ uri: annotatedUrl }}
                                style={styles.neuralImage}
                                resizeMode="cover"
                              />
                              
                              {/* Advanced overlay with animations */}
                              <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.7)']}
                                style={styles.advancedOverlay}
                              />
                              
                              {/* Floating detection stats */}
                              <View style={styles.floatingStats}>
                                <Animated.View 
                                  style={[
                                    styles.statBubble,
                                    styles.parasiteStatBubble,
                                    { transform: [{ scale: pulseAnim }] }
                                  ]}
                                >
                                  <Ionicons name="bug" size={14} color="#fff" />
                                  <Text style={styles.statBubbleText}>{detection.totalParasites}</Text>
                                </Animated.View>
                                
                                <Animated.View 
                                  style={[
                                    styles.statBubble,
                                    styles.wbcStatBubble,
                                    { transform: [{ scale: pulseAnim }] }
                                  ]}
                                >
                                  <Ionicons name="cellular" size={14} color="#fff" />
                                  <Text style={styles.statBubbleText}>{detection.whiteBloodCellsDetected}</Text>
                                </Animated.View>
                              </View>

                              {/* Scan line effect */}
                              <Animated.View 
                                style={[
                                  styles.scanLine,
                                  { 
                                    opacity: glowIntensity,
                                    transform: [{ translateY: slideAnim }]
                                  }
                                ]}
                              />

                              {/* Interactive zoom indicator */}
                              <Animated.View 
                                style={[
                                  styles.zoomIndicator,
                                  { transform: [{ scale: sparkleScale }] }
                                ]}
                              >
                                <LinearGradient
                                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
                                  style={styles.zoomIndicatorGradient}
                                >
                                  <Ionicons name="expand" size={18} color="#ffffff" />
                                </LinearGradient>
                              </Animated.View>
                            </View>
                          </LinearGradient>
                          
                          {/* Neural pattern overlay */}
                          <Animated.View 
                            style={[
                              styles.neuralPatternOverlay,
                              { 
                                opacity: glowIntensity,
                                transform: [{ rotate: rotateInterpolate }]
                              }
                            ]}
                          />
                        </TouchableOpacity>
                        
                        <View style={styles.imageMetadata}>
                          <Text style={styles.imageIndex}>Sample #{index + 1}</Text>
                          <Text style={styles.imageDetails}>
                            {detection.totalParasites + detection.whiteBloodCellsDetected} detections
              </Text>
            </View>
                      </Animated.View>
                    );
                  })}
                </ScrollView>
                
                <Text style={styles.galleryFooterAdvanced}>
                  🔬 AI-powered analysis • Tap to explore detailed annotations
                </Text>
              </LinearGradient>
              </View>
            )}

          {/* Detailed Analysis Section */}
          <View style={styles.analysisDetailsSection}>
            <Text style={styles.sectionTitle}>Detailed Analysis</Text>
            
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Ionicons name="analytics" size={20} color="#667eea" />
                <Text style={styles.analysisCardTitle}>Detection Metrics</Text>
          </View>
              
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>P/WBC Ratio</Text>
                  <Text style={styles.metricValue}>{parasiteWbcRatio}</Text>
          </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Parasite Type</Text>
                  <Text style={styles.metricValue}>{mostProbableParasiteType}</Text>
                </View>
              </View>
            </View>

            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Ionicons name="document-text" size={20} color="#667eea" />
                <Text style={styles.analysisCardTitle}>Test Information</Text>
              </View>
              
              <View style={styles.testInfoGrid}>
                <View style={styles.testInfoItem}>
                  <Text style={styles.testInfoLabel}>Patient ID</Text>
                  <Text style={styles.testInfoValue}>{patientId || 'N/A'}</Text>
                </View>
                <View style={styles.testInfoItem}>
                  <Text style={styles.testInfoLabel}>Test ID</Text>
                  <Text style={styles.testInfoValue}>{testId || 'N/A'}</Text>
                </View>
                <View style={styles.testInfoItem}>
                  <Text style={styles.testInfoLabel}>Sample Type</Text>
                  <Text style={styles.testInfoValue}>{results?.sampleType || 'Blood Smear'}</Text>
                </View>
                <View style={styles.testInfoItem}>
                  <Text style={styles.testInfoLabel}>Priority</Text>
                  <Text style={styles.testInfoValue}>{results?.priority || 'Normal'}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

                {/* Revolutionary Action Command Center */}
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.95)']}
          style={styles.commandCenter}
        >
          <View style={styles.actionGrid}>
            <Animated.View 
              style={[
                styles.primaryActionContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <TouchableOpacity 
                style={styles.advancedPrimaryAction}
                onPress={() => {
                  triggerSparkleEffect();
                  // TODO: Implement export functionality
                }}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <Animated.View 
                    style={[
                      styles.actionIconContainer,
                      { transform: [{ rotate: rotateInterpolate }] }
                    ]}
                  >
                    <Ionicons name="document-text" size={24} color="#fff" />
                  </Animated.View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.primaryActionTitle}>Export Report</Text>
                    <Text style={styles.primaryActionSubtitle}>PDF • Secure • Encrypted</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
                </LinearGradient>
          </TouchableOpacity>
            </Animated.View>

            <View style={styles.secondaryActionsRow}>
              <Animated.View 
                style={[
                  styles.secondaryActionContainer,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <TouchableOpacity 
                  style={styles.advancedSecondaryAction}
                  onPress={() => {
                    triggerMorphTransition(() => handleRefresh());
                  }}
                >
                  <LinearGradient
                    colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
                    style={styles.secondaryActionGradient}
                  >
            <Ionicons name="add-circle" size={20} color="#667eea" />
                    <Text style={styles.secondaryActionTitle}>New Test</Text>
                  </LinearGradient>
      </TouchableOpacity>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.secondaryActionContainer,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <TouchableOpacity 
                  style={styles.advancedSecondaryAction}
                  onPress={() => {
                    triggerSparkleEffect();
                    // TODO: Implement share functionality
                  }}
                >
                  <LinearGradient
                    colors={['rgba(39, 174, 96, 0.1)', 'rgba(46, 204, 113, 0.1)']}
                    style={styles.secondaryActionGradient}
                  >
                    <Ionicons name="share-social" size={20} color="#27ae60" />
                    <Text style={styles.secondaryActionTitle}>Share</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
        </View>
    </View>
          
          {/* Neural network footer pattern */}
          <Animated.View 
            style={[
              styles.neuralFooterPattern,
              { 
                opacity: glowIntensity,
                transform: [{ scaleX: pulseAnim }]
              }
            ]}
          />
        </LinearGradient>

        {/* Full-Screen Image Viewer Modal */}
        {selectedImageModal && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSelectedImageModal(null)}
          >
            <View style={styles.imageModalOverlay}>
              <View style={styles.imageModalContainer}>
                {/* Header */}
                <View style={styles.imageModalHeader}>
                  <Text style={styles.imageModalTitle}>
                    {selectedImageModal.originalFilename}
                  </Text>
                  <TouchableOpacity 
                    style={styles.imageModalCloseButton}
                    onPress={() => setSelectedImageModal(null)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Full-Screen Zoomable Image */}
                <View style={styles.imageModalImageContainer}>
                  <ZoomableImage 
                    source={{ uri: selectedImageModal.url }}
                    style={styles.imageModalImage}
                  />
                </View>

                {/* Detection Details Overlay */}
                <View style={styles.imageModalDetails}>
                  <View style={styles.detectionSummary}>
                    <View style={styles.detectionSummaryItem}>
                      <View style={[styles.detectionIndicator, { backgroundColor: '#e74c3c' }]}>
                        <Ionicons name="bug" size={16} color="#fff" />
                      </View>
                      <Text style={styles.detectionSummaryCount}>
                        {selectedImageModal.totalParasites}
                      </Text>
                      <Text style={styles.detectionSummaryLabel}>Parasites</Text>
                    </View>
                    
                    <View style={styles.detectionSummaryItem}>
                      <View style={[styles.detectionIndicator, { backgroundColor: '#3498db' }]}>
                        <Ionicons name="cellular" size={16} color="#fff" />
                      </View>
                      <Text style={styles.detectionSummaryCount}>
                        {selectedImageModal.whiteBloodCellsDetected}
                      </Text>
                      <Text style={styles.detectionSummaryLabel}>WBCs</Text>
                    </View>
                  </View>

                  <Text style={styles.imageModalDescription}>
                    Red boxes indicate parasites, blue boxes indicate white blood cells. 
                    Each box shows the detection confidence score.
                    {'\n\n'}
                    Tap to zoom in/out • Pinch to zoom • Drag to pan when zoomed
                  </Text>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </Animated.View>
  );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPatientInfoStep();
      case 2:
        return renderUploadFilesStep();
      case 3:
        return renderReviewStep();
      case 4:
        return renderProcessingStep();
      case 5:
        return renderCompleteStep();
      default:
        return null;
    }
  };

  const uploadImagesToBackend = async () => {
    try {
      setIsLoading(true);
      
      console.log('=== UPLOAD DEBUG START ===');
      console.log('Selected images count:', selectedImages.length);
      console.log('Selected patient:', selectedPatient);
      console.log('Test data:', testData);
      
      // Create FormData for image upload
      const formData = new FormData();
      
      // Add test data
      formData.append('testData', JSON.stringify({
        patientId: selectedPatient.id,
        priority: testData.priority,
        sampleType: testData.sampleType,
        clinicalNotes: testData.clinicalNotes
      }));
      
      // Add images - convert URIs to file objects
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        
        console.log(`Processing image ${i + 1}:`, {
          originalName: image.name,
          originalType: image.type,
          uri: image.uri
        });
        
        // Determine correct MIME type based on file extension
        let mimeType = 'image/jpeg'; // default
        if (image.name) {
          const ext = image.name.toLowerCase().split('.').pop();
          if (ext === 'png') mimeType = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
          else if (ext === 'gif') mimeType = 'image/gif';
          else if (ext === 'bmp') mimeType = 'image/bmp';
        }
        
        // Create a proper file object for React Native FormData
        const imageFile = {
          uri: image.uri,
          type: mimeType,
          name: image.name || `image_${i}.jpg`,
        };
        
        console.log(`Adding image ${i + 1}:`, imageFile);
        
        // For React Native, we need to append the file object directly
        formData.append('images', imageFile);
      }
      
      console.log('FormData created successfully');
      console.log('FormData contents:', formData);
      console.log('FormData _parts:', formData._parts);
      
      // Debug: Check if FormData is properly structured
      for (let i = 0; i < formData._parts.length; i++) {
        const part = formData._parts[i];
        console.log(`FormData part ${i}:`, {
          key: part[0],
          value: typeof part[1],
          valueDetails: part[1]
        });
      }
      
      console.log('About to make API call to /upload/images...');
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout after 2 minutes')), 120000);
      });
      
      // Upload images to backend using authenticated API service
      const uploadPromise = api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });
      
      // Race between upload and timeout
      const response = await Promise.race([uploadPromise, timeoutPromise]);
      
      console.log('=== API RESPONSE RECEIVED ===');
      console.log('Raw response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response));
      
      // FIXED: Access the data property correctly from axios response
      const result = response.data; // Changed from: const result = response;
      console.log('Result object:', result);
      console.log('Result.success:', result.success);
      console.log('Result.message:', result.message);
      
      if (result.success) {
        console.log('✅ SUCCESS: Images uploaded successfully');
        // Store session ID and test ID for later AI processing
        setUploadSession(prev => ({
          ...prev,
          sessionId: result.sessionId,
          testId: result.testId,
          status: 'uploaded' // Changed from 'processing' to 'uploaded'
        }));
        
        console.log('Upload session updated:', {
          sessionId: result.sessionId,
          testId: result.testId,
          status: 'uploaded'
        });
        
        Alert.alert('Success', 'Images uploaded successfully! Ready for AI processing.');
      } else {
        console.log('❌ FAILED: result.success is false');
        console.log('Error from result:', result.error);
        throw new Error(result.error || 'Upload failed');
      }
      
    } catch (error) {
      console.error('=== UPLOAD ERROR CAUGHT ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      
      Alert.alert('Error', `Failed to upload images: ${error.message}`);
      throw error; // Re-throw to be caught by nextStep
    } finally {
      setIsLoading(false);
      console.log('=== UPLOAD DEBUG END ===');
    }
  };

  const startAIProcessing = async () => {
    try {
      setIsLoading(true);
      
      if (!uploadSession?.sessionId || !uploadSession?.testId) {
        throw new Error('No upload session found. Please upload images first.');
      }
      
      console.log('Starting AI processing for session:', uploadSession.sessionId);
      
      // Trigger AI processing on the backend
      const response = await api.post('/upload/start-processing', {
        sessionId: uploadSession.sessionId,
        testId: uploadSession.testId
      });
      
      console.log('AI processing response:', response);
      console.log('Response data:', response.data);
      
      // FIXED: Access the data property correctly from axios response
      if (response.data.success) {
        // Update session status to processing
        setUploadSession(prev => ({
          ...prev,
          status: 'processing'
        }));
        
        // Start monitoring progress
        startProgressMonitoring(uploadSession.sessionId, uploadSession.testId);
        
        Alert.alert('Success', 'AI processing started successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to start AI processing');
      }
      
    } catch (error) {
      console.error('=== AI PROCESSING ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error object:', error);
      
      Alert.alert('Error', `Failed to start AI processing: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startProgressMonitoring = (sessionId, testId) => {
    console.log('Starting progress monitoring for session:', sessionId);
    
    const monitoringStartTime = Date.now();
    console.log('Progress monitoring started at:', new Date(monitoringStartTime).toISOString());
    
    const progressInterval = setInterval(async () => {
      try {
        const response = await api.get(`/upload/progress/${sessionId}`);
        const progress = response.data;
          console.log('Progress update:', progress);
          
        // Update progress bar
          setProcessingProgress(progress.percentComplete || 0);
          
        // Check if session status changed to completed (fallback method)
        if (progress.status === 'completed') {
          console.log('Session completed, fetching results...');
          clearInterval(progressInterval);
          await fetchFinalResults(testId);
          return;
        }
        
        // Check AI processing status (primary method)
        if (progress.aiProcessing) {
          const aiStatus = progress.aiProcessing.status;
          setProcessingStage(aiStatus || 'Processing...');
          
          console.log('AI Processing Status:', aiStatus);
          
          // Check if AI processing is complete
          if (aiStatus === 'completed') {
            console.log('AI processing completed, fetching results...');
            clearInterval(progressInterval);
              await fetchFinalResults(testId);
            return;
          }
            } else {
          // No aiProcessing status - check if backend processing is done by trying to fetch results
          console.log('No aiProcessing status, checking for results...');
          try {
            const resultsResponse = await api.get(`/tests/${testId}/results`);
            const results = resultsResponse.data;
            
            if (results && results.status && results.status !== 'processing') {
              console.log('Results found, AI processing must be complete');
              clearInterval(progressInterval);
              await fetchFinalResults(testId);
              return;
            }
          } catch (error) {
            // Results not ready yet, continue monitoring
            console.log('Results not ready yet, continuing to monitor...');
          }
        }
        
        // Check for timeout
        const elapsed = Date.now() - monitoringStartTime;
        const elapsedMinutes = Math.floor(elapsed / (1000 * 60));
        
        console.log(`Progress monitoring elapsed: ${elapsedMinutes} minutes`);
        
        // Timeout after 10 minutes (since AI processing is usually fast)
        if (elapsed > 10 * 60 * 1000) {
          console.log('Processing timeout reached after 10 minutes');
          clearInterval(progressInterval);
          setProcessingStage('Processing Timeout - Please Check Results');
          Alert.alert(
            'Processing Timeout', 
            'Processing took longer than expected. Please check the results manually.',
            [
              { text: 'Check Results', onPress: () => fetchFinalResults(testId) },
              { text: 'OK', style: 'default' }
            ]
          );
        }
        
      } catch (error) {
        console.error('Progress monitoring error:', error);
        // Don't stop monitoring on error, just log it
      }
    }, 2000); // Check every 2 seconds
    
    setUploadSession(prev => ({ ...prev, progressInterval }));
  };

  const fetchFinalResults = async (testId) => {
    try {
      console.log('Fetching final results for test:', testId);
      
      const response = await api.get(`/tests/${testId}/results`);
      const results = response.data;
      console.log('Final results:', results);
        
      // Check if we have basic results
      if (!results || !results.status) {
        console.warn('No results found, retrying...');
        setProcessingStage('Waiting for Results...');
        return false;
      }
      
      // If results are still processing, wait
      if (results.status === 'processing') {
        console.log('Results still processing, waiting...');
        setProcessingStage('Results Processing...');
        return false;
      }
      
      // Results are ready!
      console.log('Results ready:', results);
      
      // Update state with results
      setUploadSession(prev => ({
        ...prev,
        results: results,
        status: 'completed'
      }));
        
      setProcessingProgress(100);
      setProcessingStage('Analysis Complete');
        
      console.log('Moving to Complete stage');
      setCurrentStep(5);
      return true;
      
    } catch (error) {
      console.error('Failed to fetch final results:', error);
      
      // If results endpoint fails, try to get basic test info as fallback
      try {
        console.log('Trying fallback: get basic test info...');
        const testResponse = await api.get(`/tests/${testId}`);
        const testData = testResponse.data;
        
        if (testData && testData.test && testData.test.status === 'completed') {
          console.log('Test completed, using basic test data');
          setUploadSession(prev => ({ 
            ...prev, 
            results: { status: 'completed', test: testData.test }, 
            status: 'completed' 
          }));
          setProcessingProgress(100);
          setProcessingStage('Analysis Complete');
          setCurrentStep(5);
          return true;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      setProcessingStage('Error - Retrying...');
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      
      <LinearGradient
        colors={['#0f0f23', '#1a1a3a', '#2d2d5f']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Sample</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => handleRefresh()}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

        {renderStepIndicator()}

      <LinearGradient
        colors={['#0f0f23', '#1a1a3a', '#2d2d5f']}
        style={styles.contentGradient}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderCurrentStep()}
          </ScrollView>
      </LinearGradient>

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color="#667eea" />
              <Text style={styles.prevButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
            <TouchableOpacity 
             style={[
               styles.nextButton,
               (!selectedPatient || (currentStep === 2 && selectedImages.length === 0) || isLoading) && styles.nextButtonDisabled
             ]} 
              onPress={nextStep}
             disabled={!selectedPatient || (currentStep === 2 && selectedImages.length === 0) || isLoading}
            >
             {isLoading ? (
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                 <ActivityIndicator size="small" color="#fff" />
                 <Text style={styles.nextButtonText}>
                   {currentStep === 3 ? 'Uploading...' : 'Processing...'}
                 </Text>
               </View>
             ) : (
             <Text style={styles.nextButtonText}>
               {currentStep === 4 ? 'Start Processing' : 'Next'}
             </Text>
             )}
            </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  contentGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStep: {
    backgroundColor: '#667eea',
  },
  inactiveStep: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  activeStepText: {
    color: '#667eea',
  },
  inactiveStepText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeStepLabel: {
    color: '#667eea',
  },
  inactiveStepLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  stepContent: {
    backgroundColor: '#2a2a4a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  patientOptions: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
    gap: 8,
  },
  optionButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  searchSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  searchResults: {
    marginTop: 12,
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  noResults: {
    textAlign: 'center',
    padding: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  newPatientSection: {
    marginBottom: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  formField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  genderOptionTextActive: {
    color: '#fff',
  },
  createPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  createPatientButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  testInfoSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  resetTestButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  priorityOptionTextActive: {
    color: '#fff',
  },
  sampleTypeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sampleTypeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  sampleTypeOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  sampleTypeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sampleTypeOptionTextActive: {
    color: '#fff',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 100,
  },
  selectedPatientCard: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    marginTop: 16,
  },
  selectedPatientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  selectedPatientTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  selectedPatientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  selectedPatientDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  changePatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    gap: 6,
  },
  changePatientButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
  },
  uploadArea: {
    alignItems: 'center',
    padding: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
     uploadedFiles: {
     marginTop: 24,
   },
   uploadedFilesHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
    alignItems: 'center',
     marginBottom: 16,
   },
   clearAllButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#fff',
     padding: 8,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#e74c3c',
     gap: 6,
   },
   clearAllButtonText: {
     fontSize: 14,
     fontWeight: '500',
     color: '#e74c3c',
   },
     uploadedFilesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
     marginBottom: 16,
   },
   imageGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 12,
  },
  imageItem: {
     width: '48%',
     backgroundColor: '#fff',
     borderRadius: 12,
     padding: 12,
     borderWidth: 1,
     borderColor: '#e9ecef',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   imageThumbnail: {
     width: '100%',
     height: 120,
     borderRadius: 8,
    marginBottom: 8,
  },
  imageInfo: {
     marginBottom: 8,
   },
   imageName: {
     fontSize: 14,
     fontWeight: '500',
     color: '#ffffff',
     marginBottom: 4,
  },
  imageSize: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
   },
   removeImageButton: {
     position: 'absolute',
     top: 8,
     right: 8,
     backgroundColor: '#fff',
     borderRadius: 12,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  reviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'right',
  },
  processingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  processingStage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  processingSteps: {
    width: '100%',
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingStepIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  processingStepIconActive: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
  },
  processingStepText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  processingStepTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  resultsContainer: {
    marginBottom: 32,
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  completionActions: {
    gap: 16,
  },
  viewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  viewReportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  newUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    gap: 8,
  },
  newUploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  startProcessingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  startProcessingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    gap: 8,
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    padding: 20,
  },
  readyStateContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  readyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  readyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  checkResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 8,
  },
  checkResultsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  checkResultsHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  manualCheckContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  manualCheckText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 12,
  },
  manualCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  manualCheckButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Modern Complete Screen Styles
  modernHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modernTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modernSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modernResultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroCardContent: {
    flex: 1,
  },
  heroStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e9ecef',
    marginHorizontal: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#666',
  },
  modernGallerySection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sectionBadge: {
    backgroundColor: '#667eea',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modernGallery: {
    marginHorizontal: -20,
  },
  galleryContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  modernGalleryItem: {
    width: 160,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  modernGalleryImage: {
    width: 160,
    height: 120,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  detectionStats: {
    flexDirection: 'row',
    gap: 8,
  },
  detectionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
  },
  detectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  modernImageLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  galleryFooter: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  modernActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryActionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },

  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  imageModalHeader: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
  },
  imageModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 16,
  },
  imageModalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 100,
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
    maxWidth: 400,
    maxHeight: 600,
  },
  imageModalDetails: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  detectionSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 16,
  },
  detectionSummaryItem: {
    alignItems: 'center',
    gap: 8,
  },
  detectionIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectionSummaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  detectionSummaryLabel: {
    fontSize: 12,
    color: '#ccc',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imageModalDescription: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modernized Complete Screen Styles
  modernCompleteContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modernStatusHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  statusHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    marginRight: 20,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  modernScrollContent: {
    flex: 1,
    paddingTop: 20,
  },
  statsCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  interactiveGallerySection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  galleryHeader: {
    marginBottom: 20,
  },
  galleryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  gallerySubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  imageGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
  },
  imageGridItem: {
    width: '48%',
    marginBottom: 15,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 1,
    marginBottom: 8,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  imageGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  detectionBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  parasiteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  wbcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  zoomIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  analysisDetailsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  testInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  testInfoItem: {
    flex: 1,
    minWidth: '45%',
  },
  testInfoLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  testInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  primaryAction: {
    flex: 2,
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },

  // Advanced Cutting-Edge UI Styles
  advancedCompleteContainer: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  neuralHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  neuralPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
    marginBottom: 20,
  },
  diagnosticBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    position: 'relative',
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleEffect: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  diagnosticInfo: {
    flex: 1,
  },
  diagnosticStatus: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  diagnosticDetail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  processingMetrics: {
    flexDirection: 'row',
    gap: 15,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  confidenceVisualizer: {
    marginTop: 10,
  },
  confidenceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    fontWeight: '600',
  },
  confidenceBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidencePercentage: {
    position: 'absolute',
    right: 8,
    top: -20,
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  advancedScrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  dataDashboard: {
    padding: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
  },
  advancedMetricCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  metricGradient: {
    padding: 20,
    height: 140,
    justifyContent: 'space-between',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  densityMeter: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 8,
  },
  densityBar: {
    height: '100%',
    borderRadius: 3,
  },
  circularProgress: {
    alignItems: 'center',
    marginVertical: 8,
  },
  wbcRatio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratioLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  neuralGallerySection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
  },
  galleryBackground: {
    padding: 25,
  },
  galleryHeaderAdvanced: {
    marginBottom: 20,
  },
  galleryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  galleryTitleAdvanced: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  gallerySubtitleAdvanced: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  galleryScrollView: {
    marginBottom: 15,
  },
  galleryScrollContainer: {
    paddingHorizontal: 5,
    gap: 20,
  },
  neuralImageCard: {
    width: 200,
    marginRight: 20,
  },
  neuralImageContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  holographicBorder: {
    padding: 3,
    borderRadius: 20,
  },
  imageContentWrapper: {
    borderRadius: 17,
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: 1,
  },
  neuralImage: {
    width: '100%',
    height: '100%',
  },
  advancedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  floatingStats: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  statBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  parasiteStatBubble: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
  },
  wbcStatBubble: {
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
  },
  statBubbleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00f2fe',
    shadowColor: '#00f2fe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  zoomIndicatorGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  neuralPatternOverlay: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 30,
  },
  imageMetadata: {
    marginTop: 12,
    alignItems: 'center',
  },
  imageIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  imageDetails: {
    fontSize: 12,
    color: '#666',
  },
  galleryFooterAdvanced: {
    fontSize: 14,
    color: '#667eea',
    textAlign: 'center',
    fontWeight: '600',
  },
  commandCenter: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  actionGrid: {
    gap: 15,
  },
  primaryActionContainer: {
    marginBottom: 10,
  },
  advancedPrimaryAction: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextContainer: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  primaryActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  secondaryActionContainer: {
    flex: 1,
  },
  advancedSecondaryAction: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  secondaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  secondaryActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  neuralFooterPattern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#667eea',
  },
});

export default UploadScreen;

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
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import patientService from '../../services/api/patientService';
import testService from '../../services/api/testService';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

const NewUploadScreen = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Patient Information State
  const [patientOption, setPatientOption] = useState('existing');
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
  
  // Upload State
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // AI Processing State
  const [uploadSession, setUploadSession] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInterval, setProgressInterval] = useState(null);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

  const steps = [
    { id: 1, title: 'Patient', subtitle: 'Select or create patient' },
    { id: 2, title: 'Test Info', subtitle: 'Configure test details' },
    { id: 3, title: 'Images', subtitle: 'Upload sample images' },
    { id: 4, title: 'Review', subtitle: 'Confirm and submit' },
    { id: 5, title: 'Processing', subtitle: 'AI analysis in progress' },
    { id: 6, title: 'Results', subtitle: 'Analysis complete' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#27ae60', icon: 'arrow-down' },
    { value: 'normal', label: 'Normal', color: '#f39c12', icon: 'remove' },
    { value: 'high', label: 'High', color: '#e74c3c', icon: 'arrow-up' },
    { value: 'urgent', label: 'Urgent', color: '#8e44ad', icon: 'flash' },
  ];

  const sampleTypeOptions = [
    { value: 'blood_smear', label: 'Blood Smear', icon: 'water' },
    { value: 'thick_smear', label: 'Thick Smear', icon: 'layers' },
    { value: 'thin_smear', label: 'Thin Smear', icon: 'document' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
  ];

  const genderOptions = [
    { label: 'Male', value: 'male', icon: 'male' },
    { label: 'Female', value: 'female', icon: 'female' },
    { label: 'Other', value: 'other', icon: 'person' },
  ];

  const searchPatients = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await patientService.searchPatients(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCreatePatient = async () => {
    if (!newPatientData.firstName || !newPatientData.lastName) {
      Alert.alert('Error', 'Please fill in required fields (First Name and Last Name)');
      return;
    }

    // Validate date format if provided
    if (newPatientData.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(newPatientData.dateOfBirth)) {
      Alert.alert('Error', 'Please enter date of birth in YYYY-MM-DD format');
      return;
    }

    try {
      setIsLoading(true);
      
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

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        maxWidth: 2048,
        maxHeight: 2048,
      });

      if (!result.canceled) {
        setSelectedImages(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        maxWidth: 2048,
        maxHeight: 2048,
      });

      if (!result.canceled) {
        setSelectedImages(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitTest = async () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient');
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert('Error', 'Please upload at least one image');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentStep(5); // Move to processing step

      // Create test record
      const testRecord = await testService.createTest({
        patient_id: selectedPatient.id,
        priority: testData.priority,
        sample_type: testData.sampleType,
        clinical_notes: testData.clinicalNotes,
        status: 'pending',
      });

      // Create upload session on the backend for this test
      const sessionResponse = await api.post('/upload/session', {
        testId: testRecord.id,
      });

      const sessionData = sessionResponse.data?.session || sessionResponse.data;

      const session = {
        sessionId: sessionData.sessionId,
        testId: testRecord.id,
        patientId: selectedPatient.id,
        status: sessionData.status,
        createdAt: sessionData.createdAt,
      };
      
      setUploadSession(session);

      // Upload images to backend using the created upload session
      await uploadImagesToBackend(session.sessionId, testRecord.id);

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit test');
      setCurrentStep(4); // Go back to review step
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImagesToBackend = async (sessionId, testId) => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingStage('Uploading images...');

      // Create FormData for image upload
      const formData = new FormData();
      
      // Add test data
      formData.append('testData', JSON.stringify({
        patientId: selectedPatient.id,
        priority: testData.priority,
        sampleType: testData.sampleType,
        clinicalNotes: testData.clinicalNotes,
      }));

      // Add images
      selectedImages.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `image_${index + 1}.jpg`,
        });
      });

      console.log('Uploading images to backend for session:', sessionId);
      
      // Upload to backend (files are tied to the upload session)
      const uploadResponse = await api.post(`/upload/files/${sessionId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', uploadResponse.data);
      
      if (uploadResponse.status === 200) {
        setProcessingStage('Images uploaded successfully. Starting AI analysis...');
        setProcessingProgress(50);

        // Trigger AI processing on the backend
        console.log('Starting AI processing for session:', sessionId, 'test:', testId);
        const startResponse = await api.post('/upload/start-processing', {
          sessionId,
          testId,
        });
        console.log('Start processing response:', startResponse.data);
        
        // Start monitoring progress
        startProgressMonitoring(sessionId, testId);
      } else {
        throw new Error(uploadResponse.data.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setProcessingStage('Upload failed: ' + error.message);
      setIsProcessing(false);
    }
  };

  const startProgressMonitoring = (sessionId, testId) => {
    const monitoringStartTime = Date.now();
    console.log('Starting progress monitoring for session:', sessionId);

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/upload/progress/${sessionId}`);
        const progress = response.data;
        console.log('Progress update:', progress);
        
        // Update progress bar
        setProcessingProgress(progress.percentComplete || 0);
        
        // Check if session status changed to completed
        if (progress.status === 'completed') {
          console.log('Session completed, fetching results...');
          clearInterval(interval);
          await fetchFinalResults(testId);
          return;
        }
        
        // Check AI processing status
        if (progress.aiProcessing) {
          const aiStatus = progress.aiProcessing.status;
          setProcessingStage(aiStatus || 'Processing...');
          
          console.log('AI Processing Status:', aiStatus);
          
          // Check if AI processing is complete
          if (aiStatus === 'completed') {
            console.log('AI processing completed, fetching results...');
            clearInterval(interval);
            await fetchFinalResults(testId);
            return;
          }
        } else {
          // Check if backend processing is done by trying to fetch results
          console.log('No aiProcessing status, checking for results...');
          try {
            const resultsResponse = await api.get(`/tests/${testId}/results`);
            const results = resultsResponse.data;
            
            if (results && results.status && results.status !== 'processing') {
              console.log('Results found, AI processing must be complete');
              clearInterval(interval);
              await fetchFinalResults(testId);
              return;
            }
          } catch (error) {
            // Results not ready yet, continue monitoring
            console.log('Results not ready yet, continuing to monitor...');
          }
        }
        
        // Check for timeout (5 minutes)
        const elapsed = Date.now() - monitoringStartTime;
        if (elapsed > 300000) { // 5 minutes
          console.log('Progress monitoring timeout');
          clearInterval(interval);
          setProcessingStage('Processing timeout - please check results manually');
        }
        
      } catch (error) {
        console.error('Progress monitoring error:', error);
        setProcessingStage('Error monitoring progress: ' + error.message);
      }
    }, 2000); // Check every 2 seconds

    setProgressInterval(interval);
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
      console.log('parasiteWbcRatio in results:', results?.parasiteWbcRatio);
      console.log('Full results object:', JSON.stringify(results, null, 2));
      
      // Update state with results
      setUploadSession(prev => ({
        ...prev,
        results: results,
        status: 'completed'
      }));
        
      setProcessingProgress(100);
      setProcessingStage('Analysis Complete');
        
      console.log('Moving to Results step');
      setCurrentStep(6);
      setIsProcessing(false);
      return true;
      
    } catch (error) {
      console.error('Failed to fetch final results:', error);
      setProcessingStage('Error fetching results: ' + error.message);
      setIsProcessing(false);
      return false;
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step.id && styles.stepCircleActive,
            currentStep > step.id && styles.stepCircleCompleted
          ]}>
            {currentStep > step.id ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step.id && styles.stepNumberActive
              ]}>
                {step.id}
              </Text>
            )}
          </View>
          <Text style={[
            styles.stepTitle,
            currentStep >= step.id && styles.stepTitleActive
          ]}>
            {step.title}
          </Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        </View>
      ))}
    </View>
  );

  const renderPatientStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Select Patient</Text>
      
      {selectedPatient ? (
        <View style={styles.selectedPatientCard}>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {selectedPatient.firstName} {selectedPatient.lastName}
            </Text>
            <Text style={styles.patientId}>ID: {selectedPatient.patientId}</Text>
            {selectedPatient.phoneNumber && (
              <Text style={styles.patientDetail}>{selectedPatient.phoneNumber}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.changePatientButton}
            onPress={() => setSelectedPatient(null)}
          >
            <Ionicons name="swap-horizontal" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.patientOptions}>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Ionicons name="search" size={24} color="#667eea" />
            <Text style={styles.optionText}>Search Existing Patient</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="person-add" size={24} color="#667eea" />
            <Text style={styles.optionText}>Create New Patient</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTestInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Test Configuration</Text>
      
      <View style={styles.configSection}>
        <Text style={styles.configLabel}>Priority Level</Text>
        <View style={styles.optionsGrid}>
          {priorityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                testData.priority === option.value && styles.optionCardActive
              ]}
              onPress={() => setTestData(prev => ({ ...prev, priority: option.value }))}
            >
              <Ionicons 
                name={option.icon} 
                size={24} 
                color={testData.priority === option.value ? '#fff' : option.color} 
              />
              <Text style={[
                styles.optionLabel,
                testData.priority === option.value && styles.optionLabelActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.configSection}>
        <Text style={styles.configLabel}>Sample Type</Text>
        <View style={styles.optionsGrid}>
          {sampleTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                testData.sampleType === option.value && styles.optionCardActive
              ]}
              onPress={() => setTestData(prev => ({ ...prev, sampleType: option.value }))}
            >
              <Ionicons 
                name={option.icon} 
                size={24} 
                color={testData.sampleType === option.value ? '#fff' : '#667eea'} 
              />
              <Text style={[
                styles.optionLabel,
                testData.sampleType === option.value && styles.optionLabelActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.configSection}>
        <Text style={styles.configLabel}>Clinical Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={testData.clinicalNotes}
          onChangeText={(text) => setTestData(prev => ({ ...prev, clinicalNotes: text }))}
          placeholder="Enter any relevant clinical information..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderImagesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Upload Sample Images</Text>
      
      <View style={styles.imageUploadArea}>
        {selectedImages.length === 0 ? (
          <View style={styles.emptyUploadArea}>
            <Ionicons name="camera" size={48} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.uploadPrompt}>No images selected</Text>
            <Text style={styles.uploadSubtext}>Add sample images for analysis</Text>
          </View>
        ) : (
          <FlatList
            data={selectedImages}
            numColumns={2}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.imageItem}>
                <Image source={{ uri: item.uri }} style={styles.uploadedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.uploadButtons}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
          <Ionicons name="images" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Review & Submit</Text>
      
      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Patient Information</Text>
        <Text style={styles.reviewText}>
          {selectedPatient?.firstName} {selectedPatient?.lastName}
        </Text>
        <Text style={styles.reviewSubtext}>ID: {selectedPatient?.patientId}</Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Test Configuration</Text>
        <Text style={styles.reviewText}>
          {priorityOptions.find(p => p.value === testData.priority)?.label} Priority
        </Text>
        <Text style={styles.reviewSubtext}>
          {sampleTypeOptions.find(s => s.value === testData.sampleType)?.label}
        </Text>
        {testData.clinicalNotes && (
          <Text style={styles.reviewSubtext}>Notes: {testData.clinicalNotes}</Text>
        )}
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Images ({selectedImages.length})</Text>
        <Text style={styles.reviewText}>
          {selectedImages.length} sample image{selectedImages.length !== 1 ? 's' : ''} ready for upload
        </Text>
      </View>

      {isUploading && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}
    </View>
  );

  const renderCreatePatientModal = () => (
    <Modal
      visible={showCreateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Patient</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>First Name *</Text>
              <TextInput
                style={styles.formInput}
                value={newPatientData.firstName}
                onChangeText={(text) => setNewPatientData(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter first name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Last Name *</Text>
              <TextInput
                style={styles.formInput}
                value={newPatientData.lastName}
                onChangeText={(text) => setNewPatientData(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter last name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date of Birth</Text>
              <TextInput
                style={styles.formInput}
                value={newPatientData.dateOfBirth}
                onChangeText={(text) => {
                  // Auto-format date as user types
                  let formatted = text.replace(/\D/g, ''); // Remove non-digits
                  if (formatted.length >= 4) {
                    formatted = formatted.substring(0, 4) + '-' + formatted.substring(4);
                  }
                  if (formatted.length >= 7) {
                    formatted = formatted.substring(0, 7) + '-' + formatted.substring(7, 9);
                  }
                  setNewPatientData(prev => ({ ...prev, dateOfBirth: formatted }));
                }}
                placeholder="YYYY-MM-DD (e.g., 1990-01-15)"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Gender</Text>
              <View style={styles.genderOptions}>
                {genderOptions.map((gender) => (
                  <TouchableOpacity
                    key={gender.value}
                    style={[
                      styles.genderOption,
                      newPatientData.gender === gender.value && styles.genderOptionActive
                    ]}
                    onPress={() => setNewPatientData(prev => ({ ...prev, gender: gender.value }))}
                  >
                    <Ionicons 
                      name={gender.icon} 
                      size={20} 
                      color={newPatientData.gender === gender.value ? '#fff' : '#667eea'} 
                    />
                    <Text style={[
                      styles.genderOptionText,
                      newPatientData.gender === gender.value && styles.genderOptionTextActive
                    ]}>
                      {gender.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                value={newPatientData.phoneNumber}
                onChangeText={(text) => setNewPatientData(prev => ({ ...prev, phoneNumber: text }))}
                placeholder="Enter phone number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={newPatientData.email}
                onChangeText={(text) => setNewPatientData(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreatePatient}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create Patient</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSearchModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Patients</Text>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchPatients(text);
              }}
              placeholder="Search by name or ID..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
            <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.5)" style={styles.searchIcon} />
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.searchResultItem}
                onPress={() => handlePatientSelect(item)}
              >
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.searchResultId}>ID: {item.patientId}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
            style={styles.searchResults}
          />
        </View>
      </View>
    </Modal>
  );

  const renderProcessingStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>AI Analysis in Progress</Text>
      
      <View style={styles.processingContainer}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressText}>{processingProgress}%</Text>
        </View>
        <Text style={styles.processingStage}>{processingStage}</Text>
        
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
        
        <TouchableOpacity 
          style={styles.checkResultsButton}
          onPress={() => fetchFinalResults(uploadSession?.testId)}
        >
          <Ionicons name="refresh" size={20} color="#667eea" />
          <Text style={styles.checkResultsButtonText}>Check Results</Text>
        </TouchableOpacity>
        
        <Text style={styles.checkResultsHint}>
          If processing seems stuck, click "Check Results" to see if analysis is complete
        </Text>
      </View>
    </View>
  );

  const renderResultsStep = () => {
    const results = uploadSession?.results;
    const totalImages = results?.detections?.length || 0;
    const totalParasites = results?.totalParasites || 0;
    const totalWbcs = results?.totalWbcs || 0;
    const parasiteWbcRatio = results?.parasiteWbcRatio !== null ? results.parasiteWbcRatio.toFixed(2) : 'N/A';
    const overallConfidence = results?.overallConfidence !== null ? (results.overallConfidence * 100).toFixed(1) : 'N/A';
    const mostProbableParasiteType = results?.mostProbableParasite?.type || 'N/A';
    const mostProbableParasiteFullName = results?.mostProbableParasite?.fullName || 'N/A';
    const statusColor = results?.status === 'POSITIVE' ? '#e74c3c' : '#27ae60';
    const processingTime = results?.processingTime ? `${results.processingTime.toFixed(1)}s` : 'N/A';
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepHeader}>Analysis Results</Text>
        
        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: statusColor }]}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={results?.status === 'POSITIVE' ? 'warning' : 'shield-checkmark'} 
              size={32} 
              color={statusColor} 
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {results?.status === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE'}
            </Text>
          </View>
          <Text style={styles.confidenceText}>
            Confidence: {overallConfidence}%
          </Text>
        </View>

        {/* Results Summary */}
        <View style={styles.resultsGrid}>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Images Analyzed</Text>
            <Text style={styles.resultValue}>{totalImages}</Text>
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Parasites Found</Text>
            <Text style={styles.resultValue}>{totalParasites}</Text>
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>White Blood Cells</Text>
            <Text style={styles.resultValue}>{totalWbcs}</Text>
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Parasite/WBC Ratio</Text>
            <Text style={styles.resultValue}>{parasiteWbcRatio}</Text>
          </View>
        </View>

        {/* Parasite Details */}
        {results?.status === 'POSITIVE' && (
          <View style={styles.parasiteCard}>
            <Text style={styles.parasiteTitle}>Most Probable Parasite</Text>
            <Text style={styles.parasiteType}>{mostProbableParasiteType}</Text>
            <Text style={styles.parasiteName}>{mostProbableParasiteFullName}</Text>
          </View>
        )}

        {/* Processing Info */}
        <View style={styles.processingInfoCard}>
          <Text style={styles.processingInfoTitle}>Processing Information</Text>
          <Text style={styles.processingInfoText}>
            Processing Time: {processingTime}
          </Text>
          <Text style={styles.processingInfoText}>
            Test ID: {results?.testId || 'N/A'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.resultsActions}>
          <TouchableOpacity 
            style={styles.newTestButton}
            onPress={() => {
              // Reset form
              setCurrentStep(1);
              setSelectedPatient(null);
              setSelectedImages([]);
              setTestData({
                priority: 'normal',
                sampleType: 'blood_smear',
                clinicalNotes: '',
              });
              setUploadSession(null);
              setProcessingProgress(0);
              setProcessingStage('');
              setIsProcessing(false);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newTestButtonText}>New Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => {
              // Navigate to test details or results screen
              Alert.alert('View Details', 'This would navigate to detailed results view');
            }}
          >
            <Ionicons name="eye" size={20} color="#667eea" />
            <Text style={styles.viewDetailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderPatientStep();
      case 2: return renderTestInfoStep();
      case 3: return renderImagesStep();
      case 4: return renderReviewStep();
      case 5: return renderProcessingStep();
      case 6: return renderResultsStep();
      default: return renderPatientStep();
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
          <Text style={styles.headerTitle}>Upload Sample</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        {currentStep === 3 ? (
          // Avoid nesting FlatList (VirtualizedList) inside a ScrollView
          <View style={styles.content}>
            {renderCurrentStep()}
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderCurrentStep()}
          </ScrollView>
        )}

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.navButton} onPress={prevStep}>
              <Ionicons name="chevron-back" size={20} color="#667eea" />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.navSpacer} />
          
          {currentStep < 4 ? (
            <TouchableOpacity 
              style={[styles.navButton, styles.navButtonPrimary]} 
              onPress={nextStep}
              disabled={!selectedPatient && currentStep === 1}
            >
              <Text style={styles.navButtonTextPrimary}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : currentStep === 4 ? (
            <TouchableOpacity 
              style={[styles.navButton, styles.navButtonSuccess]} 
              onPress={submitTest}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.navButtonTextPrimary}>Submit Test</Text>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          ) : currentStep === 5 ? (
            <TouchableOpacity 
              style={[styles.navButton, styles.navButtonSecondary]} 
              onPress={() => setCurrentStep(4)}
            >
              <Ionicons name="chevron-back" size={20} color="#667eea" />
              <Text style={styles.navButtonText}>Back to Review</Text>
            </TouchableOpacity>
          ) : currentStep === 6 ? (
            <TouchableOpacity 
              style={[styles.navButton, styles.navButtonSuccess]} 
              onPress={() => {
                // Reset form
                setCurrentStep(1);
                setSelectedPatient(null);
                setSelectedImages([]);
                setTestData({
                  priority: 'normal',
                  sampleType: 'blood_smear',
                  clinicalNotes: '',
                });
                setUploadSession(null);
                setProcessingProgress(0);
                setProcessingStage('');
                setIsProcessing(false);
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.navButtonTextPrimary}>New Test</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Modals */}
        {renderCreatePatientModal()}
        {renderSearchModal()}
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
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#667eea',
  },
  stepCircleCompleted: {
    backgroundColor: '#27ae60',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  stepTitleActive: {
    color: '#fff',
  },
  stepSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  selectedPatientCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 14,
    color: '#4FC3F7',
    marginBottom: 2,
  },
  patientDetail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  changePatientButton: {
    padding: 8,
  },
  patientOptions: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  configSection: {
    marginBottom: 24,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: (width - 60) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionCardActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  optionLabelActive: {
    color: '#fff',
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlignVertical: 'top',
  },
  imageUploadArea: {
    minHeight: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  emptyUploadArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  uploadPrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  imageItem: {
    position: 'relative',
    margin: 4,
  },
  uploadedImage: {
    width: (width - 60) / 2,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  reviewSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667eea',
    backgroundColor: 'transparent',
  },
  navButtonPrimary: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  navButtonSuccess: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  navSpacer: {
    flex: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  navButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  genderOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  genderOptionTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    position: 'absolute',
    left: 32,
    top: 16,
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  searchResultId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Processing Step Styles
  processingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#667eea',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  processingStage: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  checkResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkResultsButtonText: {
    fontSize: 16,
    color: '#667eea',
    marginLeft: 8,
  },
  checkResultsHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  // Results Step Styles
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  confidenceText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: (width - 60) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  parasiteCard: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  parasiteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  parasiteType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  parasiteName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  processingInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  processingInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4FC3F7',
    marginBottom: 8,
  },
  processingInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  newTestButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newTestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  navButtonSecondary: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderColor: '#667eea',
  },
});

export default NewUploadScreen;

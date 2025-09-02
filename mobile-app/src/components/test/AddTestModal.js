import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const AddTestModal = ({ visible, onClose, onSuccess, patients = [] }) => {
  const [formData, setFormData] = useState({
    patient_id: '',
    sample_type: '',
    priority: 'normal',
    clinical_notes: '',
  });

  const [errors, setErrors] = useState({});
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  const sampleTypes = [
    { value: 'blood_smear', label: 'Blood Smear', icon: '🔬' },
    { value: 'thick_smear', label: 'Thick Smear', icon: '🩸' },
    { value: 'thin_smear', label: 'Thin Smear', icon: '🧪' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'normal', label: 'Normal', color: '#17a2b8' },
    { value: 'high', label: 'High', color: '#ffc107' },
    { value: 'urgent', label: 'Urgent', color: '#dc3545' },
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.patient_id) newErrors.patient_id = 'Patient selection is required';
    if (!formData.sample_type) newErrors.sample_type = 'Sample type is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Call API to create test
      console.log('Creating test:', formData);
      
      // Call the onSuccess callback with the form data
      // The parent component will handle the API call
      onSuccess(formData);
      handleClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create test');
    }
  };

  const handleClose = () => {
    setFormData({
      patient_id: '',
      sample_type: '',
      priority: 'normal',
      clinical_notes: '',
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

  const getSelectedPatientName = () => {
    if (!formData.patient_id) return 'Select Patient';
    const patient = patients.find(p => p.id == formData.patient_id);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Select Patient';
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : '#17a2b8';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create New Test</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Patient Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Patient *</Text>
                <TouchableOpacity
                  style={[styles.patientSelector, errors.patient_id && styles.inputError]}
                  onPress={() => setShowPatientPicker(true)}
                >
                  <Text style={[
                    styles.patientSelectorText,
                    !formData.patient_id && styles.placeholderText
                  ]}>
                    {getSelectedPatientName()}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {errors.patient_id && <Text style={styles.errorText}>{errors.patient_id}</Text>}
              </View>
            </View>

            {/* Test Configuration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Configuration</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sample Type *</Text>
                <View style={styles.optionsContainer}>
                  {sampleTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.optionButton,
                        formData.sample_type === type.value && styles.optionButtonActive
                      ]}
                      onPress={() => updateField('sample_type', type.value)}
                    >
                      <Text style={styles.optionIcon}>{type.icon}</Text>
                      <Text style={[
                        styles.optionButtonText,
                        formData.sample_type === type.value && styles.optionButtonTextActive
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.sample_type && <Text style={styles.errorText}>{errors.sample_type}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Priority *</Text>
                <View style={styles.optionsContainer}>
                  {priorities.map((priority) => (
                    <TouchableOpacity
                      key={priority.value}
                      style={[
                        styles.priorityButton,
                        formData.priority === priority.value && styles.priorityButtonActive,
                        { borderColor: priority.color }
                      ]}
                      onPress={() => updateField('priority', priority.value)}
                    >
                      <View style={[styles.priorityIndicator, { backgroundColor: priority.color }]} />
                      <Text style={[
                        styles.priorityButtonText,
                        formData.priority === priority.value && styles.priorityButtonTextActive
                      ]}>
                        {priority.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.priority && <Text style={styles.errorText}>{errors.priority}</Text>}
              </View>
            </View>

            {/* Clinical Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Clinical Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Clinical Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.clinical_notes}
                  onChangeText={(value) => updateField('clinical_notes', value)}
                  placeholder="Enter clinical notes, symptoms, or observations..."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Create Test</Text>
          </TouchableOpacity>
        </View>

        {/* Patient Picker Modal */}
        <Modal
          visible={showPatientPicker}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Patient</Text>
                <TouchableOpacity onPress={() => setShowPatientPicker(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.pickerContent}>
                {patients.length === 0 ? (
                  <Text style={styles.noPatientsText}>No patients available</Text>
                ) : (
                  patients.map((patient) => (
                    <TouchableOpacity
                      key={patient.id}
                      style={styles.patientOption}
                      onPress={() => {
                        updateField('patient_id', patient.id);
                        setShowPatientPicker(false);
                      }}
                    >
                                           <Text style={styles.patientOptionName}>
                       {patient.firstName} {patient.lastName}
                     </Text>
                     <Text style={styles.patientOptionDetails}>
                       {patient.patientId} • {patient.phoneNumber}
                     </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  patientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  patientSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    gap: 8,
  },
  optionButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  optionIcon: {
    fontSize: 20,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  optionButtonTextActive: {
    color: 'white',
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'white',
    gap: 8,
  },
  priorityButtonActive: {
    backgroundColor: '#f8f9fa',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  priorityButtonTextActive: {
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerContent: {
    padding: 20,
  },
  patientOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patientOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  patientOptionDetails: {
    fontSize: 14,
    color: '#666',
  },
  noPatientsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
});

export default AddTestModal;

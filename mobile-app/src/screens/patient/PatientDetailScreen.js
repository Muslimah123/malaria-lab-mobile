import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
import patientService from '../../services/api/patientService';

// Render-time error boundary so crashes show on screen
class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    try { console.log('PatientDetailScreen render error:', error, info); } catch (_) {}
  }

  handleRetry = () => {
    this.setState({ error: null });
    if (this.props.onRetry) this.props.onRetry();
  };

  render() {
    if (this.state.error) {
      const message = String(this.state.error?.message || this.state.error);
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#2b1d3a', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <StatusBar barStyle="light-content" backgroundColor="#2b1d3a" />
          <View style={{ maxWidth: 520, width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <Text style={{ color: '#ffb4b4', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Screen Error</Text>
            <Text style={{ color: 'white', marginBottom: 12 }}>{message}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => (this.props.onGoBack ? this.props.onGoBack() : undefined)} style={{ backgroundColor: '#667eea', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 }}>
                <Text style={{ color: 'white', fontWeight: '700' }}>← Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.handleRetry} style={{ backgroundColor: '#27ae60', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 }}>
                <Text style={{ color: 'white', fontWeight: '700' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const PatientDetailScreen = ({ route, navigation }) => {
  const [fatalError, setFatalError] = useState(null);

  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Modern animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    try {
      loadPatientData();
      initializeAnimations();
    } catch (e) {
      setFatalError(e);
    }
  }, [patientId]);

  const initializeAnimations = () => {
    // Entrance animations
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

    // Continuous animations
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadPatientData = async () => {
    setIsLoading(true);
    try {
      // Load patient basic info
      const patientData = await patientService.getPatient(patientId);
      setPatient(patientData);
      setEditForm(patientData);

      // Load patient test history
      console.log('🔍 Loading test history for patient:', patientId);
      const testsData = await patientService.getPatientTests(patientId);
      console.log('🔍 Test history response:', testsData);
      console.log('🔍 Test history array length:', testsData?.length || 0);
      setTestHistory(testsData || []);
    } catch (error) {
      console.error('Error loading patient data:', error);
      setFatalError(error);
    } finally {
      setIsLoading(false);
    }
  };
  // Fatal render error overlay
  if (fatalError) {
    return (
      <SafeAreaView style={[styles.modernContainer, { backgroundColor: '#2b1d3a', justifyContent: 'center', alignItems: 'center', padding: 20 }]}> 
        <StatusBar barStyle="light-content" backgroundColor="#2b1d3a" />
        <View style={{ maxWidth: 520, width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
          <Text style={{ color: '#ffb4b4', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Screen Error</Text>
          <Text style={{ color: 'white', marginBottom: 12 }}>{String(fatalError?.message || fatalError)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 16 }}>If this persists, share this message with the developer.</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#667eea', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 }}>
              <Text style={{ color: 'white', fontWeight: '700' }}>← Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setFatalError(null); loadPatientData(); }} style={{ backgroundColor: '#27ae60', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 }}>
              <Text style={{ color: 'white', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getAge = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return `${age} years old`;
    } catch {
      return 'N/A';
    }
  };

  const handleEdit = async () => {
    try {
      // Transform data to match service expectations
      const formattedData = {
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        date_of_birth: editForm.dateOfBirth,
        gender: editForm.gender,
        phone_number: editForm.phoneNumber,
        email: editForm.email,
        address: editForm.address
      };
      
      const updatedPatient = await patientService.updatePatient(patientId, formattedData);
      setPatient(updatedPatient);
      setShowEditModal(false);
      Alert.alert('Success', 'Patient information updated successfully');
    } catch (error) {
      console.error('Error updating patient:', error);
      Alert.alert('Error', 'Failed to update patient information');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient?.firstName} ${patient?.lastName}? This action cannot be undone and will delete all associated test records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await patientService.deletePatient(patientId);
              Alert.alert('Success', 'Patient deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete patient');
            }
          }
        },
      ]
    );
  };

  const getTestStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'POSITIVE':
        return '#e74c3c';
      case 'NEGATIVE':
        return '#27ae60';
      case 'PENDING':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const getTestStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'POSITIVE':
        return 'alert-circle';
      case 'NEGATIVE':
        return 'checkmark-circle';
      case 'PENDING':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  // Animation interpolations
  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  if (isLoading) {
    return (
      <View style={styles.modernContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
        <LinearGradient
          colors={['#0f0f23', '#1a1a3a', '#2d2d5f']}
          style={styles.backgroundGradient}
        >
          {/* Floating Elements Background */}
          <View style={styles.floatingElementsContainer}>
            {[...Array(6)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.floatingElement,
                  {
                    top: `${10 + i * 15}%`,
                    left: `${5 + (i % 2) * 85}%`,
                    transform: [{ translateY: floatInterpolate }],
                    opacity: fadeAnim,
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
              style={styles.modernBackButton}
              onPress={() => navigation.goBack()}
             delayPressIn={0}
             delayPressOut={0}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.backButtonGradient}
              >
                <Ionicons name="arrow-back" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.modernHeaderTitle}>Patient Details</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* Modern Loading */}
          <View style={styles.modernLoadingContainer}>
            <Animated.View style={[styles.loadingIcon, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.loadingIconGradient}
              >
                <Ionicons name="medical" size={32} color="white" />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.modernLoadingText}>Loading Patient Profile...</Text>
            <Text style={styles.modernLoadingSubtext}>Retrieving medical records</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.modernContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
        <LinearGradient
          colors={['#0f0f23', '#1a1a3a', '#2d2d5f']}
          style={styles.backgroundGradient}
        >
          {/* Modern Header */}
          <Animated.View style={styles.modernHeader}>
            <TouchableOpacity
              style={styles.modernBackButton}
              onPress={() => navigation.goBack()}
             delayPressIn={0}
             delayPressOut={0}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.backButtonGradient}
              >
                <Ionicons name="arrow-back" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.modernHeaderTitle}>Patient Details</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* Modern Error State */}
          <View style={styles.modernErrorContainer}>
            <Ionicons name="person-outline" size={80} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.modernErrorTitle}>Patient Not Found</Text>
            <Text style={styles.modernErrorMessage}>
              The requested patient could not be located in the database
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScreenErrorBoundary onGoBack={() => navigation.goBack()} onRetry={() => loadPatientData()}>
    <SafeAreaView style={styles.modernContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      <LinearGradient
        colors={['#0f0f23', '#1a1a3a', '#2d2d5f']}
        style={styles.backgroundGradient}
      >
        {/* Floating Elements Background */}
        <View style={styles.floatingElementsContainer}>
          {[...Array(6)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.floatingElement,
                {
                  top: `${10 + i * 15}%`,
                  left: `${5 + (i % 2) * 85}%`,
                  transform: [{ translateY: floatInterpolate }],
                  opacity: fadeAnim,
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
            style={styles.modernBackButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.modernHeaderTitle}>Patient Profile</Text>
            <Text style={styles.modernHeaderSubtitle}>
              {patient.firstName} {patient.lastName}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.modernHeaderButton} 
              onPress={() => setShowEditModal(true)}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="create-outline" size={18} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modernHeaderButton} 
              onPress={handleDelete}
            >
              <LinearGradient
                colors={['rgba(231, 76, 60, 0.8)', 'rgba(192, 57, 43, 0.8)']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="trash-outline" size={18} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>



        {/* Modern Content */}
        <ScrollView
          style={styles.modernContent}
          contentContainerStyle={styles.scrollContentContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#667eea"
              colors={['#667eea']}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Patient Information Card */}
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
                <Ionicons name="person" size={20} color="#667eea" />
                <Text style={styles.modernCardTitle}>Personal Information</Text>
              </View>
              
              <View style={styles.modernCardContent}>
                <View style={styles.modernInfoGrid}>
                  <View style={styles.modernInfoItem}>
                    <Text style={styles.modernInfoLabel}>Full Name</Text>
                    <Text style={styles.modernInfoValue}>
                      {patient.firstName} {patient.lastName}
                    </Text>
                  </View>
                  <View style={styles.modernInfoItem}>
                    <Text style={styles.modernInfoLabel}>Patient ID</Text>
                    <Text style={styles.modernInfoValue}>{patient.patientId || patient.id}</Text>
                  </View>
                  <View style={styles.modernInfoItem}>
                    <Text style={styles.modernInfoLabel}>Date of Birth</Text>
                    <Text style={styles.modernInfoValue}>
                      {formatDate(patient.dateOfBirth)} ({getAge(patient.dateOfBirth)})
                    </Text>
                  </View>
                  <View style={styles.modernInfoItem}>
                    <Text style={styles.modernInfoLabel}>Gender</Text>
                    <Text style={styles.modernInfoValue}>
                      {patient.gender?.charAt(0).toUpperCase()}{patient.gender?.slice(1)}
                    </Text>
                  </View>
                  {patient.phoneNumber && (
                    <View style={styles.modernInfoItem}>
                      <Text style={styles.modernInfoLabel}>Phone</Text>
                      <Text style={styles.modernInfoValue}>{patient.phoneNumber}</Text>
                    </View>
                  )}
                  {patient.email && (
                    <View style={styles.modernInfoItem}>
                      <Text style={styles.modernInfoLabel}>Email</Text>
                      <Text style={styles.modernInfoValue}>{patient.email}</Text>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Medical Summary Card */}
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
                <Ionicons name="medical" size={20} color="#667eea" />
                <Text style={styles.modernCardTitle}>Medical Summary</Text>
              </View>
              
              <View style={styles.modernCardContent}>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{patient.totalTests || 0}</Text>
                    <Text style={styles.statLabel}>Total Tests</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: patient.positiveTests > 0 ? '#e74c3c' : '#27ae60' }]}>
                      {patient.positiveTests || 0}
                    </Text>
                    <Text style={styles.statLabel}>Positive</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{(patient.totalTests || 0) - (patient.positiveTests || 0)}</Text>
                    <Text style={styles.statLabel}>Negative</Text>
                  </View>
                </View>
                
                {patient.lastTestDate && (
                  <View style={styles.lastTestInfo}>
                    <Text style={styles.lastTestLabel}>Last Test Date</Text>
                    <Text style={styles.lastTestValue}>{formatDate(patient.lastTestDate)}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Test History Card */}
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
                <Ionicons name="list" size={20} color="#667eea" />
                <Text style={styles.modernCardTitle}>Test History ({testHistory.length})</Text>
              </View>
              
              <View style={styles.modernCardContent}>
                                 {testHistory.length === 0 ? (
                   <View style={styles.emptyTestHistory}>
                     <Ionicons name="flask-outline" size={40} color="rgba(255, 255, 255, 0.3)" />
                     <Text style={styles.emptyTestText}>No tests recorded yet</Text>
                     <Text style={styles.emptyTestText}>Debug: testHistory = {JSON.stringify(testHistory)}</Text>
                     
                     {/* Add test data for navigation testing */}
                     <TouchableOpacity
                       style={{
                         backgroundColor: '#4CAF50',
                         padding: 15,
                         borderRadius: 10,
                         marginTop: 20,
                         alignItems: 'center'
                       }}
                       onPress={() => {
                         const params = {
                           testId: 'DEMO-TEST-001', // Human-readable ID
                           patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Demo Patient',
                           internalId: 'demo-uuid-123'
                         };
                         console.log('🧪 Demo test navigation with params:', params);
                         navigation.navigate('TestDetail', params);
                       }}
                     >
                       <Text style={{ color: 'white', fontWeight: 'bold' }}>
                         🧪 Demo Test Detail (For Testing)
                       </Text>
                     </TouchableOpacity>
                   </View>
                 ) : (
                   <>
                     <Text style={{ color: 'white', marginBottom: 10 }}>
                       Debug: Found {testHistory.length} tests
                     </Text>
                     {testHistory.map((test, index) => (
                    <TouchableOpacity 
                      key={test.id || index} 
                      style={styles.modernTestItem}
                      onPress={() => {
                        const params = { 
                          testId: test.testId || test.id, // Use human-readable testId first
                          patientName: `${patient.firstName} ${patient.lastName}`,
                          internalId: test.id // Keep UUID for backend if needed
                        };
                        // Navigate directly to TestDetail with proper parameters
                        try {
                          console.log('🚀 Navigating to TestDetail with params:', params);
                          navigation.navigate('TestDetail', params);
                          console.log('✅ Navigation completed successfully');
                        } catch (error) {
                          console.error('❌ Navigation error:', error);
                          Alert.alert('Navigation Error', `Failed to navigate: ${error.message}`);
                        }
                      }}
                    >
                      <View style={styles.testItemHeader}>
                        <Text style={styles.modernTestId}>Test #{test.testId || test.id}</Text>
                        <View style={[
                          styles.modernStatusBadge,
                          { backgroundColor: `${getTestStatusColor(test.status)}20` }
                        ]}>
                          <Ionicons 
                            name={getTestStatusIcon(test.status)} 
                            size={12} 
                            color={getTestStatusColor(test.status)} 
                          />
                          <Text style={[styles.modernStatusText, { color: getTestStatusColor(test.status) }]}>
                            {test.status?.toUpperCase() || 'UNKNOWN'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.modernTestDate}>
                        {formatDateTime(test.createdAt)}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.5)" style={styles.testChevron} />
                                         </TouchableOpacity>
                   ))}
                   </>
                 )}
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </LinearGradient>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Patient</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {/* Edit form content would go here */}
        </View>
      </Modal>
    </SafeAreaView>
    </ScreenErrorBoundary>
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  modernHeader: {
    paddingTop: (StatusBar.currentHeight || 24) + 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernBackButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: 40,
    height: 40,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modernHeaderButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 30,
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
    gap: 12,
  },
  modernInfoGrid: {
    gap: 16,
  },
  modernInfoItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 12,
  },
  modernInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modernInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    letterSpacing: 0.2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  lastTestInfo: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  lastTestLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  lastTestValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.2,
  },
  emptyTestHistory: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTestText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 12,
    letterSpacing: 0.2,
  },
  modernTestItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  testItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernTestId: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2,
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  modernStatusText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  modernTestDate: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
  },
  testChevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default PatientDetailScreen;

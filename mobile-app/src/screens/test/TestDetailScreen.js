import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Image,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import testService from '../../services/api/testService';
import { getApiBaseUrl } from '../../config/api';

const { width } = Dimensions.get('window');

// Helper functions for formatting
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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Helper functions for styling
const getTestStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return '#27ae60'; // Green
    case 'PENDING': return '#f39c12'; // Orange
    case 'FAILED': return '#e74c3c'; // Red
    default: return '#95a5a6'; // Gray
  }
};

const getTestResultColor = (result) => {
  switch (result?.toUpperCase()) {
    case 'POSITIVE': return '#e74c3c'; // Red
    case 'NEGATIVE': return '#27ae60'; // Green
    case 'INCONCLUSIVE': return '#f39c12'; // Orange
    default: return '#95a5a6'; // Gray
  }
};

const getTestStatusIcon = (status) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'checkmark-circle';
    case 'PENDING': return 'time';
    case 'FAILED': return 'close-circle';
    default: return 'help-circle';
  }
};

const getTestResultIcon = (result) => {
  switch (result?.toUpperCase()) {
    case 'POSITIVE': return 'bug';
    case 'NEGATIVE': return 'shield-checkmark';
    case 'INCONCLUSIVE': return 'alert-circle';
    default: return 'flask';
  }
};

const getPriorityColor = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'URGENT': return '#e74c3c'; // Red
    case 'HIGH': return '#f39c12'; // Orange
    case 'NORMAL': return '#3498db'; // Blue
    default: return '#95a5a6'; // Gray
  }
};

const getSeverityColor = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return '#e74c3c'; // Red
    case 'HIGH': return '#f39c12'; // Orange
    case 'MODERATE': return '#f1c40f'; // Yellow
    case 'LOW': return '#27ae60'; // Green
    default: return '#95a5a6'; // Gray
  }
};

const TestDetailScreen = ({ route, navigation }) => {
  const [testData, setTestData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  // Extract route parameters
  const { testId, patientName, internalId } = route.params || {};

  useEffect(() => {
    console.log('🧪 TestDetailScreen mounted with:', { testId, patientName, internalId });
    loadTestData();
    initializeApiUrl();
  }, [testId, internalId]);

  const initializeApiUrl = async () => {
    try {
      const baseUrl = await getApiBaseUrl();
      setApiBaseUrl(baseUrl);
      console.log('🧪 [TestDetail] API Base URL:', baseUrl);
    } catch (error) {
      console.warn('🧪 [TestDetail] Failed to get API base URL:', error);
      setApiBaseUrl('http://localhost:5000'); // Fallback
    }
  };

  const loadTestData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🧪 [TestDetail] Loading test data for:', { testId, internalId });
      
      // Use internalId (UUID) for API call if available, otherwise fall back to testId
      const apiTestId = internalId || testId;
      
      if (!apiTestId) {
        throw new Error('No test ID provided');
      }
      
      // Fetch test details from backend API
      console.log('🧪 [TestDetail] Calling testService.getTest with ID:', apiTestId);
      const testResponse = await testService.getTest(apiTestId);
      console.log('🧪 [TestDetail] Test response:', testResponse);
      
      // Fetch test results separately if test is completed
      let testResults = null;
      if (testResponse.status === 'completed') {
        try {
          console.log('🧪 [TestDetail] Fetching test results...');
          testResults = await testService.getTestResults(apiTestId);
          console.log('🧪 [TestDetail] Test results:', testResults);
        } catch (resultsError) {
          console.warn('🧪 [TestDetail] Failed to fetch test results:', resultsError.message);
        }
      }
      
      // Transform backend data to match our UI expectations
      const transformedTestData = {
        id: testResponse.id,
        testId: testResponse.testId || testId, // Use human-readable ID
        patientId: testResponse.patientId,
        patientFirstName: testResponse.patient?.firstName || patientName?.split(' ')[0] || 'Unknown',
        patientLastName: testResponse.patient?.lastName || patientName?.split(' ')[1] || 'Patient',
        testType: testResponse.testType === 'malaria_detection' ? 'Malaria Parasite Detection' : testResponse.testType || 'Malaria Parasite Detection',
        status: testResponse.status || 'pending',
        result: testResults?.status || 'pending',
        priority: testResponse.priority || 'normal',
        createdAt: testResponse.createdAt,
        updatedAt: testResponse.updatedAt,
        completionDate: testResponse.processedAt || testResponse.updatedAt,
        technician: testResponse.technician ? 
          `${testResponse.technician.firstName} ${testResponse.technician.lastName}` : 
          'Lab Technician',
        // Use detections from testResults for images, not testResponse.images
        microscopyImages: testResults?.detections || testResponse.images || [],
        parasiteCount: testResults?.totalParasites || 0,
        wbcCount: testResults?.totalWbcs || 0,
        // Use overallConfidence from testResults
        confidenceScore: testResults?.overallConfidence || testResults?.confidence || 0,
        notes: testResponse.clinicalNotes?.additionalNotes || '',
        diagnosisDetails: {
          parasiteSpecies: testResults?.mostProbableParasite?.fullName || 'N/A',
          parasiteType: testResults?.mostProbableParasite?.type || 'N/A',
          parasiteConfidence: testResults?.mostProbableParasite?.confidence || 0,
          stage: 'N/A', // Not available in current data structure
          severity: testResults?.severity?.level || 'N/A',
          severityScore: testResults?.severity?.score || 0,
          severityDescription: testResults?.severity?.description || 'N/A',
        },
        processingDetails: {
          modelVersion: testResults?.modelVersion || 'N/A',
          processingTime: testResults?.processingTime || 0,
          qualityScore: testResults?.qualityScore || 0,
        },
      };
      
      console.log('🧪 [TestDetail] Transformed test data:', transformedTestData);
      setTestData(transformedTestData);
      
    } catch (error) {
      console.error('❌ [TestDetail] Error loading test data:', error);
      setError(`Failed to load test details: ${error.message}`);
      
      // For debugging - show more detailed error info
      if (error.response) {
        console.error('❌ [TestDetail] Error response:', error.response.data);
        console.error('❌ [TestDetail] Error status:', error.response.status);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTestData();
    setRefreshing(false);
  };

  const handleViewImages = () => {
    if (testData?.microscopyImages && testData.microscopyImages.length > 0) {
      setCurrentImageIndex(0);
      setShowImageViewer(true);
    } else {
      Alert.alert('No Images', 'No microscopy images available for this test.');
    }
  };

  const getImageUrl = (annotatedImageUrl) => {
    if (!annotatedImageUrl || !apiBaseUrl) {
      console.warn('🧪 [ImageViewer] Missing URL or base URL:', { annotatedImageUrl, apiBaseUrl });
      return null;
    }
    // Static files are served directly from server root, not from /api/
    // Remove /api from the base URL for static files
    const serverBaseUrl = apiBaseUrl.replace('/api', '');
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = annotatedImageUrl.startsWith('/') ? annotatedImageUrl.slice(1) : annotatedImageUrl;
    const fullUrl = `${serverBaseUrl}/${cleanPath}`;
    console.log('🧪 [ImageViewer] Constructed image URL:', fullUrl);
    return fullUrl;
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    setCurrentImageIndex(0);
  };

  const navigateImage = (direction) => {
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % testData.microscopyImages.length
      : currentImageIndex === 0 
        ? testData.microscopyImages.length - 1 
        : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
  };

  const handleDownloadReport = () => {
    Alert.alert('Download Report', 'Report download feature coming soon.');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'failed': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getResultColor = (result) => {
    switch (result?.toLowerCase()) {
      case 'negative': return '#27ae60';
      case 'positive': return '#e74c3c';
      case 'inconclusive': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'normal': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
        <LinearGradient colors={['#0f0f23', '#1a1a3a', '#2d2d5f']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading Test Details...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      <LinearGradient colors={['#0f0f23', '#1a1a3a', '#2d2d5f']} style={styles.gradient}>
        
        {/* Modern Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </LinearGradient>
      </TouchableOpacity>
      
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Test Details</Text>
            <Text style={styles.headerSubtitle}>{testData?.testId || testId}</Text>
          </View>
          
          <TouchableOpacity style={styles.headerAction}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="share-outline" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />}
          showsVerticalScrollIndicator={false}
        >
          {/* Patient Info Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="person" size={20} color="#667eea" />
                <Text style={styles.cardTitle}>Patient Information</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.patientName}>
                  {testData?.patientFirstName} {testData?.patientLastName}
                </Text>
                <Text style={styles.testType}>{testData?.testType}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Test Status Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="medical" size={20} color="#667eea" />
                <Text style={styles.cardTitle}>Test Status</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(testData?.priority) }]}>
                  <Text style={styles.priorityText}>{testData?.priority?.toUpperCase()}</Text>
                </View>
              </View>
              
              <View style={styles.statusGrid}>
                <View style={[styles.statusItem, { backgroundColor: `${getTestStatusColor(testData?.status)}15` }]}>
                  <View style={styles.statusIconContainer}>
                    <Ionicons 
                      name={getTestStatusIcon(testData?.status)} 
                      size={20} 
                      color={getTestStatusColor(testData?.status)} 
                    />
                  </View>
                  <Text style={styles.statusLabel}>Status</Text>
                  <Text style={[styles.statusValue, { color: getTestStatusColor(testData?.status) }]}>
                    {testData?.status?.toUpperCase()}
                  </Text>
                </View>
                
                <View style={[styles.statusItem, { backgroundColor: `${getTestResultColor(testData?.result)}15` }]}>
                  <View style={styles.statusIconContainer}>
                    <Ionicons 
                      name={getTestResultIcon(testData?.result)} 
                      size={20} 
                      color={getTestResultColor(testData?.result)} 
                    />
                  </View>
                  <Text style={styles.statusLabel}>Result</Text>
                  <Text style={[styles.statusValue, { color: getTestResultColor(testData?.result) }]}>
                    {testData?.result?.toUpperCase()}
                  </Text>
                </View>
                
                <View style={[styles.statusItem, { backgroundColor: 'rgba(102, 126, 234, 0.15)' }]}>
                  <View style={styles.statusIconContainer}>
                    <Ionicons name="analytics" size={20} color="#667eea" />
                  </View>
                  <Text style={styles.statusLabel}>Confidence</Text>
                  <Text style={[styles.statusValue, { color: '#667eea' }]}>
                    {testData?.confidenceScore ? (testData.confidenceScore * 100).toFixed(1) : 0}%
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Test Results Card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="analytics" size={20} color="#667eea" />
                <Text style={styles.cardTitle}>Detailed Results</Text>
              </View>
              
              <View style={styles.resultGrid}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Test Date</Text>
                  <Text style={styles.resultValue}>{formatDateTime(testData?.createdAt)}</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Completed</Text>
                  <Text style={styles.resultValue}>
                    {testData?.completionDate ? formatDateTime(testData?.completionDate) : 'In Progress'}
                  </Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Technician</Text>
                  <Text style={styles.resultValue}>{testData?.technician || 'N/A'}</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Sample Type</Text>
                  <Text style={styles.resultValue}>{testData?.testType || 'N/A'}</Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Parasite Count</Text>
                  <Text style={[styles.resultValue, { color: '#e74c3c' }]}>
                    {testData?.parasiteCount || 0}
                  </Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>White Blood Cells</Text>
                  <Text style={[styles.resultValue, { color: '#3498db' }]}>
                    {testData?.wbcCount || 0}
                  </Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Images Captured</Text>
                  <Text style={styles.resultValue}>
                    {testData?.microscopyImages?.length || 0} images
                  </Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Parasite Type</Text>
                  <Text style={[styles.resultValue, { color: '#9b59b6' }]}>
                    {testData?.diagnosisDetails?.parasiteType || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Severity Level</Text>
                  <Text style={[styles.resultValue, { color: getSeverityColor(testData?.diagnosisDetails?.severity) }]}>
                    {testData?.diagnosisDetails?.severity?.toUpperCase() || 'N/A'}
      </Text>
    </View>
              </View>
              
              {testData?.diagnosisDetails?.severityDescription && testData?.diagnosisDetails?.severityDescription !== 'N/A' && (
                <View style={styles.severitySection}>
                  <View style={styles.severityHeader}>
                    <Ionicons 
                      name="warning" 
                      size={18} 
                      color={getSeverityColor(testData?.diagnosisDetails?.severity)} 
                    />
                    <Text style={[styles.severityTitle, { color: getSeverityColor(testData?.diagnosisDetails?.severity) }]}>
                      Severity Analysis
                    </Text>
                  </View>
                  <Text style={styles.severityDescription}>
                    {testData?.diagnosisDetails?.severityDescription}
                  </Text>
                  {testData?.diagnosisDetails?.severityScore > 0 && (
                    <View style={styles.severityScoreContainer}>
                      <Text style={styles.severityScoreLabel}>Severity Score:</Text>
                      <Text style={[styles.severityScore, { color: getSeverityColor(testData?.diagnosisDetails?.severity) }]}>
                        {testData?.diagnosisDetails?.severityScore}/100
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {testData?.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Laboratory Notes</Text>
                  <Text style={styles.notesText}>{testData?.notes}</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleViewImages}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.buttonGradient}
              >
                <Ionicons name="images" size={20} color="white" />
                <Text style={styles.buttonText}>
                  View Images ({testData?.microscopyImages?.length || 0})
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={handleDownloadReport}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.buttonGradient}
              >
                <Ionicons name="download" size={20} color="white" />
                <Text style={styles.buttonText}>Download Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeImageViewer}
      >
        <SafeAreaView style={styles.imageViewerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          {/* Header */}
          <View style={styles.imageViewerHeader}>
            <TouchableOpacity onPress={closeImageViewer} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.imageViewerTitleContainer}>
              <Text style={styles.imageViewerTitle}>Annotated Images</Text>
              <Text style={styles.imageCounter}>
                {currentImageIndex + 1} of {testData?.microscopyImages?.length || 0}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => Alert.alert('Info', 'Red boxes show detected parasites\nBlue boxes show white blood cells')}
              style={styles.infoButton}
            >
              <Ionicons name="information-circle" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {testData?.microscopyImages && testData.microscopyImages.length > 0 && (
            <View style={styles.imageContainer}>
              {/* Current Image */}
              <View style={styles.currentImageContainer}>
                <Image
                  source={{ uri: getImageUrl(testData.microscopyImages[currentImageIndex]?.annotatedImageUrl) }}
                  style={styles.annotatedImage}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error('🧪 [ImageViewer] Error loading image:', error);
                    Alert.alert('Error', 'Failed to load image. Please check your connection.');
                  }}
                />
                
                {/* Image Navigation */}
                {testData.microscopyImages.length > 1 && (
                  <>
                    <TouchableOpacity
                      style={[styles.navButton, styles.prevButton]}
                      onPress={() => navigateImage('prev')}
                    >
                      <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.navButton, styles.nextButton]}
                      onPress={() => navigateImage('next')}
                    >
                      <Ionicons name="chevron-forward" size={24} color="white" />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Image Details */}
              <View style={styles.imageDetails}>
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.6)']}
                  style={styles.imageDetailsGradient}
                >
                  <Text style={styles.imageFilename}>
                    {testData.microscopyImages[currentImageIndex]?.originalFilename || 'Unknown'}
                  </Text>
                  <View style={styles.detectionStats}>
                    <View style={styles.detectionItem}>
                      <Ionicons name="bug" size={16} color="#e74c3c" />
                      <Text style={styles.detectionText}>
                        {testData.microscopyImages[currentImageIndex]?.totalParasites || 0} Parasites
                      </Text>
                    </View>
                    <View style={styles.detectionItem}>
                      <Ionicons name="cellular" size={16} color="#3498db" />
                      <Text style={styles.detectionText}>
                        {testData.microscopyImages[currentImageIndex]?.whiteBloodCellsDetected || 0} WBCs
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Image Thumbnail Strip */}
              {testData.microscopyImages.length > 1 && (
                <View style={styles.thumbnailStrip}>
                  <FlatList
                    data={testData.microscopyImages}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        onPress={() => setCurrentImageIndex(index)}
                        style={[
                          styles.thumbnailContainer,
                          index === currentImageIndex && styles.activeThumbnail
                        ]}
                      >
                        <Image
                          source={{ uri: getImageUrl(item.annotatedImageUrl) }}
                          style={styles.thumbnail}
                          resizeMode="cover"
                        />
                        {index === currentImageIndex && (
                          <View style={styles.thumbnailOverlay}>
                            <Ionicons name="checkmark" size={12} color="white" />
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.thumbnailList}
                  />
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  header: {
    paddingTop: (StatusBar.currentHeight || 24) + 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: 2,
  },
  headerAction: {
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
    letterSpacing: 0.2,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardContent: {
    gap: 8,
  },
  patientName: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  testType: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  resultGrid: {
    gap: 16,
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 12,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.2,
  },
  notesSection: {
    marginTop: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  severitySection: {
    marginTop: 16,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  severityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  severityDescription: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  severityScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  severityScoreLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  severityScore: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionButtons: {
    gap: 12,
    marginTop: 10,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusIconContainer: {
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Image Viewer Styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 5,
  },
  imageViewerTitleContainer: {
    alignItems: 'center',
  },
  imageViewerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  imageCounter: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  infoButton: {
    padding: 5,
  },
  imageContainer: {
    flex: 1,
  },
  currentImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  annotatedImage: {
    width: width - 40,
    height: '80%',
    maxHeight: 500,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    zIndex: 10,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  imageDetails: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageDetailsGradient: {
    padding: 16,
  },
  imageFilename: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detectionStats: {
    flexDirection: 'row',
    gap: 20,
  },
  detectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detectionText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  thumbnailStrip: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 10,
  },
  thumbnailList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  thumbnailContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#667eea',
  },
  thumbnail: {
    width: 60,
    height: 60,
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#667eea',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TestDetailScreen;
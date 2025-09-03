import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import testService from '../../services/api/testService';
import patientService from '../../services/api/patientService';

const { width } = Dimensions.get('window');

const ResultsScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    pending: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterResults();
  }, [results, selectedFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Load completed tests (tests with results)
      const [testsResponse, patientsResponse] = await Promise.all([
        testService.getTests(1, 50, 'completed'), // Only completed tests have results
        patientService.getPatients(1, 100)
      ]);
      
      console.log('🧪 [ResultsScreen] Loaded completed tests:', testsResponse.tests?.length);
      
      // Transform test data to include results
      const testsWithResults = await Promise.all(
        testsResponse.tests.map(async (test) => {
          try {
            // Get test results for completed tests
            const testResults = await testService.getTestResults(test.id);
            const patient = patientsResponse.patients.find(p => p.id == test.patientId);
            
            return {
              id: test.id,
              testId: test.testId,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
              status: testResults?.status?.toUpperCase() || 'PENDING',
              parasiteType: testResults?.mostProbableParasite?.type || null,
              confidence: testResults?.overallConfidence || testResults?.confidence || 0,
              date: test.createdAt ? new Date(test.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              priority: test.priority || 'normal',
              completionDate: test.processedAt || test.updatedAt,
              parasiteCount: testResults?.totalParasites || 0,
              wbcCount: testResults?.totalWbcs || 0,
              severity: testResults?.severity?.level || null,
              test: test // Keep original test data for navigation
            };
          } catch (error) {
            console.warn('🧪 [ResultsScreen] Failed to get results for test:', test.testId, error);
            const patient = patientsResponse.patients.find(p => p.id == test.patientId);
            return {
              id: test.id,
              testId: test.testId,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
              status: 'PENDING',
              parasiteType: null,
              confidence: 0,
              date: test.createdAt ? new Date(test.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              priority: test.priority || 'normal',
              completionDate: null,
              parasiteCount: 0,
              wbcCount: 0,
              severity: null,
              test: test
            };
          }
        })
      );

      setResults(testsWithResults);
      setPatients(patientsResponse.patients);
      
      // Calculate stats
      const total = testsWithResults.length;
      const positive = testsWithResults.filter(r => r.status === 'POSITIVE').length;
      const negative = testsWithResults.filter(r => r.status === 'NEGATIVE').length;
      const pending = testsWithResults.filter(r => r.status === 'PENDING').length;
      
      setStats({ total, positive, negative, pending });
      
      console.log('🧪 [ResultsScreen] Stats:', { total, positive, negative, pending });
      
    } catch (error) {
      console.error('🧪 [ResultsScreen] Failed to load data:', error);
      Alert.alert('Error', 'Failed to load test results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...results];
    
    switch (selectedFilter) {
      case 'positive':
        filtered = filtered.filter(result => result.status === 'POSITIVE');
        break;
      case 'negative':
        filtered = filtered.filter(result => result.status === 'NEGATIVE');
        break;
      case 'pending':
        filtered = filtered.filter(result => result.status === 'PENDING');
        break;
      default:
        // 'all' - sort by completion date (newest first)
        filtered.sort((a, b) => {
          const dateA = new Date(a.completionDate || a.date);
          const dateB = new Date(b.completionDate || b.date);
          return dateB - dateA;
        });
    }
    
    setFilteredResults(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleViewDetails = (result) => {
    // Navigate to TestDetailScreen
    navigation.navigate('TestDetail', {
      testId: result.testId, // Human-readable ID
      patientName: result.patientName,
      internalId: result.id // UUID for API calls
    });
  };

  const filters = [
    { id: 'all', label: `All (${stats.total})` },
    { id: 'positive', label: `Positive (${stats.positive})` },
    { id: 'negative', label: `Negative (${stats.negative})` },
    { id: 'pending', label: `Pending (${stats.pending})` },
  ];

  const getStatusColor = (status) => {
    switch (status) {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return '#e74c3c';
      case 'high':
        return '#f39c12';
      case 'normal':
        return '#3498db';
      case 'low':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
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

  const renderResultItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultCard}
      onPress={() => handleViewDetails(item)}
    >
      <View style={styles.cardGradient}>
        <View style={styles.resultHeader}>
          <View style={styles.testIdContainer}>
            <Text style={styles.testId}>{item.testId}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.resultContent}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
          
          {item.status === 'POSITIVE' && item.parasiteType && (
            <View style={styles.parasiteInfo}>
              <Text style={styles.parasiteLabel}>Parasite Type:</Text>
              <Text style={styles.parasiteType}>{item.parasiteType}</Text>
            </View>
          )}

          {item.status === 'POSITIVE' && (
            <View style={styles.additionalInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Parasites:</Text>
                <Text style={styles.infoValue}>{item.parasiteCount}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>WBCs:</Text>
                <Text style={styles.infoValue}>{item.wbcCount}</Text>
              </View>
              {item.severity && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Severity:</Text>
                  <Text style={[styles.infoValue, { color: getStatusColor(item.status) }]}>
                    {item.severity.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill, 
                  { 
                    width: `${Math.max(item.confidence * 100, 5)}%`,
                    backgroundColor: item.status === 'POSITIVE' ? '#e74c3c' : item.status === 'NEGATIVE' ? '#27ae60' : '#f39c12'
                  }
                ]} 
              />
            </View>
            <Text style={styles.confidenceValue}>{Math.round(item.confidence * 100)}%</Text>
          </View>
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="eye" size={18} color="#667eea" />
            <Text style={styles.actionText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share" size={18} color="#667eea" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={18} color="#667eea" />
            <Text style={styles.actionText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Tap Indicator */}
        <View style={styles.tapIndicator}>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
        <LinearGradient colors={['#0f0f23', '#1a1a3a', '#2d2d5f']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading test results...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      
      <LinearGradient
        colors={['#0f0f23', '#1a1a3a', '#2d2d5f']}
        style={styles.gradient}
      >
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Test Results</Text>
          <Text style={styles.headerSubtitle}>
            {stats.total} result{stats.total !== 1 ? 's' : ''} • Recent test outcomes
          </Text>
        </LinearGradient>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.activeFilter,
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.activeFilterText,
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results List */}
        <View style={styles.contentContainer}>
          {filteredResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>
                {selectedFilter !== 'all' ? 'No Results Found' : 'No Test Results Yet'}
              </Text>
              <Text style={styles.emptyText}>
                {selectedFilter !== 'all' 
                  ? `No test results match the "${filters.find(f => f.id === selectedFilter)?.label}" filter`
                  : 'Completed test results will appear here'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredResults}
              renderItem={renderResultItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  tintColor="rgba(255, 255, 255, 0.8)"
                />
              }
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeFilter: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  resultsList: {
    padding: 15,
    paddingBottom: 30,
  },
  resultCard: {
    borderRadius: 20,
    marginBottom: 16,
    marginHorizontal: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  cardGradient: {
    padding: 20,
    backgroundColor: '#2a2a4a', // Dark purple-blue like patient cards
    borderRadius: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  testIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // White like patient names
    marginRight: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultContent: {
    marginBottom: 15,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // White like patient names
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)', // Light grey like patient details
    marginBottom: 10,
  },
  parasiteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  parasiteLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)', // Light grey like patient details
    marginRight: 10,
  },
  parasiteType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c', // Keep red for parasite type
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)', // Light grey like patient details
    marginRight: 10,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff', // White for values
    minWidth: 35,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)', // Light border like patient cards
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.2)', // Purple like patient edit buttons
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  actionText: {
    color: '#667eea', // Purple text like patient cards
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent like patient contact buttons
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)', // Light grey like patient details
    marginRight: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff', // White for values
  },
  tapIndicator: {
    position: 'absolute',
    top: '50%',
    right: 20,
    transform: [{ translateY: -8 }],
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
});

export default ResultsScreen;

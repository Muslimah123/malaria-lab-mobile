import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');


import AddTestModal from '../../components/test/AddTestModal';
import TestCard from '../../components/test/TestCard';
import testService from '../../services/api/testService';
import patientService from '../../services/api/patientService';

const HistoryScreen = ({ navigation }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadTests();
    loadPatients();
  }, []);

  useEffect(() => {
    filterTests();
  }, [tests, selectedFilter]);

  const loadTests = async (page = 1, status = '', priority = '') => {
    setIsLoading(true);
    try {
      const response = await testService.getTests(page, pagination.perPage, status, '', priority);
      setTests(response.tests);
      setPagination({
        page: response.page,
        perPage: response.per_page,
        total: response.total,
        pages: response.pages
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load tests');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientService.getPatients(1, 100); // Load more patients for selection
      setPatients(response.patients);
    } catch (error) {
      console.error('Failed to load patients for test creation:', error);
    }
  };

  const filterTests = () => {
    let filtered = [...tests];

    // Apply filters
    switch (selectedFilter) {
      case 'pending':
        filtered = filtered.filter(test => test.status === 'pending');
        break;
      case 'processing':
        filtered = filtered.filter(test => test.status === 'processing');
        break;
      case 'completed':
        filtered = filtered.filter(test => test.status === 'completed');
        break;
      case 'urgent':
        filtered = filtered.filter(test => test.priority === 'urgent');
        break;
      case 'high':
        filtered = filtered.filter(test => test.priority === 'high');
        break;
      default:
        // 'all' - sort by creation date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredTests(filtered);
  };

  const handleAddTest = async (testData) => {
    try {
      const newTest = await testService.createTest(testData);
      setTests(prev => [newTest, ...prev]);
      Alert.alert('Success', 'Test created successfully!');
      // Refresh the list to get updated data
      await loadTests();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create test');
    }
  };

  const handleEditTest = (test) => {
    // TODO: Implement edit functionality
    Alert.alert('Edit Test', `Edit functionality for test ${test.testId} will be implemented soon.`);
  };

  const handleDeleteTest = async (testId) => {
    try {
      await testService.deleteTest(testId);
      setTests(prev => prev.filter(t => t.id !== testId));
      Alert.alert('Success', 'Test deleted successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete test');
    }
  };

  const handleTestPress = (test) => {
    // Navigate to TestDetailScreen with proper parameters
    const patient = patients.find(p => p.id == test.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
    
    console.log('🧪 [HistoryScreen] Navigating to test detail:', {
      testId: test.testId, // Human-readable ID
      patientName,
      internalId: test.id // UUID for API calls
    });
    
    navigation.navigate('TestDetail', {
      testId: test.testId, // Human-readable ID for display
      patientName,
      internalId: test.id // UUID for backend API calls
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTests(), loadPatients()]);
    setRefreshing(false);
  };

  const getStats = () => {
    const total = pagination.total;
    const pending = tests.filter(t => t.status === 'pending').length;
    const processing = tests.filter(t => t.status === 'processing').length;
    const completed = tests.filter(t => t.status === 'completed').length;
    const urgent = tests.filter(t => t.priority === 'urgent').length;

    return { total, pending, processing, completed, urgent };
  };

  const stats = getStats();

  const filters = [
    { key: 'all', label: 'All Tests', icon: 'list' },
    { key: 'pending', label: 'Pending', icon: 'time', count: stats.pending },
    { key: 'processing', label: 'Processing', icon: 'sync', count: stats.processing },
    { key: 'completed', label: 'Completed', icon: 'checkmark-circle', count: stats.completed },
    { key: 'urgent', label: 'Urgent', icon: 'warning', count: stats.urgent },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      <LinearGradient 
        colors={['#0f0f23', '#1a1a3a', '#2d2d5f']} 
        style={styles.mainGradient}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.title}>Test History</Text>
                <Text style={styles.subtitle}>
                  {stats.total} test{stats.total !== 1 ? 's' : ''} • Manage laboratory tests
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContent}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="flask" size={24} color="white" />
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tests</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#ffecd2', '#fcb69f']}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={24} color="#8B4513" />
            </View>
            <Text style={[styles.statNumber, { color: '#8B4513' }]}>{stats.pending}</Text>
            <Text style={[styles.statLabel, { color: '#8B4513' }]}>Pending</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#a8edea', '#fed6e3']}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="sync" size={24} color="#2E8B57" />
            </View>
            <Text style={[styles.statNumber, { color: '#2E8B57' }]}>{stats.processing}</Text>
            <Text style={[styles.statLabel, { color: '#2E8B57' }]}>Processing</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#d299c2', '#fef9d7']}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#006400" />
            </View>
            <Text style={[styles.statNumber, { color: '#006400' }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: '#006400' }]}>Completed</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#ff9a9e', '#fecfef']}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="warning" size={24} color="#8B0000" />
            </View>
            <Text style={[styles.statNumber, { color: '#8B0000' }]}>{stats.urgent}</Text>
            <Text style={[styles.statLabel, { color: '#8B0000' }]}>Urgent</Text>
          </LinearGradient>
        </ScrollView>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.filterTabActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={selectedFilter === filter.key ? 'white' : '#667eea'}
              />
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter.key && styles.filterTabTextActive
                ]}
              >
                {filter.label}
              </Text>
              {filter.count !== undefined && (
                <View style={[
                  styles.filterCount,
                  selectedFilter === filter.key && styles.filterCountActive
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    selectedFilter === filter.key && styles.filterCountTextActive
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading tests...</Text>
          </View>
        ) : filteredTests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>
              {selectedFilter !== 'all' ? 'No Tests Found' : 'No Tests Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {selectedFilter !== 'all' 
                ? `No tests match the "${filters.find(f => f.key === selectedFilter)?.label}" filter`
                : 'Your test history will appear here'
              }
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyAddButtonText}>➕ Create New Test</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.testList}>
            {filteredTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                patients={patients}
                onPress={handleTestPress}
                onEdit={handleEditTest}
                onDelete={handleDeleteTest}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AddTestModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddTest}
        patients={patients}
      />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  mainGradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleContainer: {
    marginBottom: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonGradient: {
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  statsScrollContent: {
    paddingHorizontal: 8,
    gap: 10,
  },
  statCard: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 90,
    maxWidth: 95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  statIconContainer: {
    marginBottom: 8,
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  filterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowOpacity: 0.2,
    elevation: 5,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterTabTextActive: {
    color: 'white',
  },
  filterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterCountTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    marginTop: 50,
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
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  emptyAddButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  testList: {
    padding: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
});

export default HistoryScreen;

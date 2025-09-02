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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';


import AddTestModal from '../../components/test/AddTestModal';
import TestCard from '../../components/test/TestCard';
import testService from '../../services/api/testService';
import patientService from '../../services/api/patientService';

const HistoryScreen = () => {
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
    // TODO: Navigate to test details screen
    Alert.alert('Test Details', `Viewing details for test ${test.testId}`);
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
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View>
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
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.processing}</Text>
            <Text style={styles.statLabel}>Processing</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.urgent}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
  },
  filterTabTextActive: {
    color: 'white',
  },
  filterCount: {
    backgroundColor: '#e9ecef',
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  filterCountTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAddButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  testList: {
    padding: 20,
  },
});

export default HistoryScreen;

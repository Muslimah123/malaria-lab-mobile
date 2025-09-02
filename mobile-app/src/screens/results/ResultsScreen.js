import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ResultsScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [results, setResults] = useState([
    {
      id: '1',
      testId: 'TEST-20241201-001',
      patientName: 'John Doe',
      status: 'POSITIVE',
      parasiteType: 'PF',
      confidence: 0.95,
      date: '2024-12-01',
      priority: 'high',
    },
    {
      id: '2',
      testId: 'TEST-20241201-002',
      patientName: 'Jane Smith',
      status: 'NEGATIVE',
      parasiteType: null,
      confidence: 0.98,
      date: '2024-12-01',
      priority: 'normal',
    },
  ]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'positive', label: 'Positive' },
    { id: 'negative', label: 'Negative' },
    { id: 'pending', label: 'Pending' },
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

  const renderResultItem = ({ item }) => (
    <TouchableOpacity style={styles.resultCard}>
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
        <Text style={styles.date}>{item.date}</Text>
        
        {item.status === 'POSITIVE' && (
          <View style={styles.parasiteInfo}>
            <Text style={styles.parasiteLabel}>Parasite Type:</Text>
            <Text style={styles.parasiteType}>{item.parasiteType}</Text>
          </View>
        )}
        
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Confidence:</Text>
          <View style={styles.confidenceBar}>
            <View 
              style={[
                styles.confidenceFill, 
                { 
                  width: `${item.confidence * 100}%`,
                  backgroundColor: item.status === 'POSITIVE' ? '#e74c3c' : '#27ae60'
                }
              ]} 
            />
          </View>
          <Text style={styles.confidenceValue}>{Math.round(item.confidence * 100)}%</Text>
        </View>
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye" size={20} color="#667eea" />
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share" size={20} color="#667eea" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="download" size={20} color="#667eea" />
          <Text style={styles.actionText}>Export</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Test Results</Text>
          <Text style={styles.headerSubtitle}>View and manage test results</Text>
        </View>

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
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        </View>
      </LinearGradient>
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
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: '#fff',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#667eea',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  resultsList: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  parasiteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  parasiteLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  parasiteType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
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
    color: '#333',
    minWidth: 35,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default ResultsScreen;

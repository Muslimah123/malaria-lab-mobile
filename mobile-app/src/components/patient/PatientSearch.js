import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PatientSearch = ({ onSearch, onFilterChange, searchQuery, selectedFilter }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const filters = [
    { key: 'all', label: 'All Patients', icon: 'people' },
    { key: 'recent', label: 'Recent', icon: 'time' },
    { key: 'name', label: 'By Name', icon: 'person' },
    { key: 'phone', label: 'By Phone', icon: 'call' },
    { key: 'email', label: 'By Email', icon: 'mail' },
  ];

  const handleFilterSelect = (filterKey) => {
    onFilterChange(filterKey);
    if (filterKey !== 'all') {
      setIsExpanded(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={onSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearch('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons name="filter" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      {isExpanded && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterOption,
                  selectedFilter === filter.key && styles.filterOptionActive
                ]}
                onPress={() => handleFilterSelect(filter.key)}
              >
                <Ionicons
                  name={filter.icon}
                  size={16}
                  color={selectedFilter === filter.key ? 'white' : '#667eea'}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedFilter === filter.key && styles.filterOptionTextActive
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Active Filter Display */}
      {selectedFilter !== 'all' && (
        <View style={styles.activeFilterContainer}>
          <Text style={styles.activeFilterText}>
            Filtering by: {filters.find(f => f.key === selectedFilter)?.label}
          </Text>
          <TouchableOpacity
            onPress={() => onFilterChange('all')}
            style={styles.clearFilterButton}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterContainer: {
    marginTop: 15,
    paddingBottom: 5,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  filterOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
  },
  filterOptionTextActive: {
    color: 'white',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  activeFilterText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  clearFilterButton: {
    padding: 5,
  },
});

export default PatientSearch;

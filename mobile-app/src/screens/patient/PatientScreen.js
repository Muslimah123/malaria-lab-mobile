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
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');


import AddPatientModal from '../../components/patient/AddPatientModal';
import PatientCard from '../../components/patient/PatientCard';
import PatientSearch from '../../components/patient/PatientSearch';
import patientService from '../../services/api/patientService';

const PatientScreen = ({ navigation }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    pages: 0
  });

  // Modern animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPatients();
    initializeAnimations();
  }, []);

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

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery, selectedFilter]);

  const loadPatients = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      console.log('PatientScreen: Loading patients from API...');
      const response = await patientService.getPatients(page, pagination.perPage, search);
      console.log('PatientScreen: API response:', response);
      console.log('PatientScreen: Patients array:', response.patients);
      console.log('PatientScreen: Total patients:', response.total);
      
      setPatients(response.patients);
      setPagination({
        page: response.page,
        perPage: response.per_page,
        total: response.total,
        pages: response.pages
      });
    } catch (error) {
      console.error('PatientScreen: Error loading patients:', error);
      Alert.alert('Error', error.message || 'Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.firstName?.toLowerCase().includes(query) ||
        patient.lastName?.toLowerCase().includes(query) ||
        patient.phoneNumber?.includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    switch (selectedFilter) {
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(patient => 
          new Date(patient.createdAt) > oneWeekAgo
        );
        break;
      case 'name':
        filtered.sort((a, b) => 
          `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
        );
        break;
      case 'phone':
        filtered.sort((a, b) => (a.phoneNumber || '').localeCompare(b.phoneNumber || ''));
        break;
      case 'email':
        filtered.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
        break;
      default:
        // 'all' - sort by creation date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredPatients(filtered);
  };

  const handleAddPatient = async (patientData) => {
    try {
      const newPatient = await patientService.createPatient(patientData);
      setPatients(prev => [newPatient, ...prev]);
      Alert.alert('Success', 'Patient created successfully!');
      // Refresh the list to get updated data
      await loadPatients();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create patient');
    }
  };

  const handleEditPatient = (patient) => {
    // TODO: Implement edit functionality
    Alert.alert('Edit Patient', `Edit functionality for ${patient.firstName} ${patient.lastName} will be implemented soon.`);
  };

  const handleDeletePatient = async (patientId) => {
    try {
      await patientService.deletePatient(patientId);
      setPatients(prev => prev.filter(p => p.id !== patientId));
      Alert.alert('Success', 'Patient deleted successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete patient');
    }
  };

  const handlePatientPress = (patient) => {
    Alert.alert(
      '🏥 Patient Selected',
      `Opening details for:\n${patient.firstName} ${patient.lastName}\n\nID: ${patient.patientId}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View Patient Details', 
          onPress: () => {
            console.log('🏥 Navigating to PatientDetail for:', patient.patientId);
            navigation.navigate('PatientDetail', { patientId: patient.id });
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const searchResults = await patientService.searchPatients(query);
        setPatients(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      // If search is cleared, reload all patients
      await loadPatients();
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  // Animation interpolations
  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.modernContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
      
      {/* Modern Gradient Background */}
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
                  transform: [
                    { translateY: floatInterpolate },
                    { scale: pulseAnim },
                  ],
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
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.15)', 'rgba(118, 75, 162, 0.15)']}
            style={styles.headerCard}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.headerIcon}
                    >
                      <Ionicons name="people" size={22} color="white" />
                    </LinearGradient>
                  </Animated.View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.modernTitle}>Registry</Text>
                    <Text style={styles.modernSubtitle}>
                      Medical Records
                    </Text>
                  </View>
                </View>
                <Animated.View style={[styles.addButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
                  <TouchableOpacity
                    style={styles.modernAddButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.addButtonGradient}
                    >
                      <Ionicons name="add" size={18} color="white" />
                      <Text style={styles.addButtonText}>Add Patient</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
              
              {/* Stats Section */}
              <View style={styles.headerStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color="rgba(255, 255, 255, 0.8)" style={styles.statIcon} />
                  <Text style={styles.statText}>{pagination.total} Patients</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="medical" size={16} color="rgba(255, 255, 255, 0.8)" style={styles.statIcon} />
                  <Text style={styles.statText}>Active Records</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="shield-checkmark" size={16} color="rgba(255, 255, 255, 0.8)" style={styles.statIcon} />
                  <Text style={styles.statText}>Secure</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Modern Search Section */}
        <Animated.View
          style={[
            styles.searchSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <PatientSearch
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            searchQuery={searchQuery}
            selectedFilter={selectedFilter}
          />
        </Animated.View>

        {/* Modern Content Area */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
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
            {isLoading ? (
              <View style={styles.modernLoadingContainer}>
                <Animated.View style={[styles.loadingIcon, { transform: [{ scale: pulseAnim }] }]}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.loadingIconGradient}
                  >
                    <Ionicons name="medical" size={32} color="white" />
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.modernLoadingText}>Accessing Patient Database...</Text>
                <Text style={styles.modernLoadingSubtext}>Retrieving medical records</Text>
              </View>
            ) : filteredPatients.length === 0 ? (
              <View style={styles.modernEmptyState}>
                <Animated.View style={[styles.emptyIcon, { transform: [{ scale: pulseAnim }] }]}>
                  <LinearGradient
                    colors={['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)']}
                    style={styles.emptyIconContainer}
                  >
                    <Ionicons name="people-outline" size={60} color="#667eea" />
                  </LinearGradient>
                </Animated.View>
                <Text style={styles.modernEmptyTitle}>
                  {searchQuery || selectedFilter !== 'all' ? 'No Results Found' : 'No Patients Registered'}
                </Text>
                <Text style={styles.modernEmptyMessage}>
                  {searchQuery || selectedFilter !== 'all' 
                    ? 'Try adjusting your search criteria or filters'
                    : 'Ready to register your first patient in the system'
                  }
                </Text>
                {!searchQuery && selectedFilter === 'all' && (
                  <TouchableOpacity
                    style={styles.modernEmptyButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.emptyButtonGradient}
                    >
                      <Ionicons name="add" size={18} color="white" />
                      <Text style={styles.modernEmptyButtonText}>Register Patient</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.modernPatientList}>
                {filteredPatients.map((patient, index) => (
                  <Animated.View
                    key={patient.id}
                    style={[
                      styles.patientCardContainer,
                      {
                        opacity: fadeAnim,
                        transform: [
                          { 
                            translateY: Animated.add(
                              slideAnim,
                              new Animated.Value(index * 5)
                            )
                          }
                        ]
                      }
                    ]}
                  >
                    <PatientCard
                      patient={patient}
                      onPress={handlePatientPress}
                      onEdit={handleEditPatient}
                      onDelete={handleDeletePatient}
                    />
                  </Animated.View>
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </LinearGradient>

      <AddPatientModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddPatient}
      />
    </View>
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
    paddingTop: StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  modernTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  modernSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.2,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statIcon: {
    marginRight: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
  },
  addButtonContainer: {
    marginLeft: 10,
  },
  modernAddButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modernContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 30,
  },
  modernLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingIconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernLoadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  modernLoadingSubtext: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  modernEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 30,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  modernEmptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modernEmptyMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    letterSpacing: 0.2,
    paddingHorizontal: 10,
  },
  modernEmptyButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  modernEmptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  modernPatientList: {
    paddingBottom: 20,
  },
  patientCardContainer: {
    marginBottom: 15,
  },
});

export default PatientScreen;

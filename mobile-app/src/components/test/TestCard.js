import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TestCard = ({ test, onPress, onEdit, onDelete, patients = [] }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'processing':
        return '#2196f3';
      case 'completed':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusGradient = (status) => {
    switch (status) {
      case 'pending':
        return ['#ff9800', '#ff5722'];
      case 'processing':
        return ['#2196f3', '#03a9f4'];
      case 'completed':
        return ['#4caf50', '#8bc34a'];
      case 'cancelled':
        return ['#f44336', '#e91e63'];
      default:
        return ['#9e9e9e', '#757575'];
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return '#4caf50';
      case 'normal':
        return '#2196f3';
      case 'high':
        return '#ff9800';
      case 'urgent':
        return '#f44336';
      default:
        return '#2196f3';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'processing':
        return 'sync-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'low':
        return 'chevron-down';
      case 'normal':
        return 'remove';
      case 'high':
        return 'chevron-up';
      case 'urgent':
        return 'warning';
      default:
        return 'remove';
    }
  };

  const getSampleTypeIcon = (sampleType) => {
    switch (sampleType) {
      case 'blood_smear':
        return '🔬';
      case 'thick_smear':
        return '🩸';
      case 'thin_smear':
        return '🧪';
      default:
        return '🧪';
    }
  };

  const getPatientName = () => {
    const patient = patients.find(p => p.id == test.patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Test',
      `Are you sure you want to delete this test? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(test.id)
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(test)}>
      <View style={styles.card}>
        {/* Header with Status Banner */}
        <LinearGradient
          colors={getStatusGradient(test.status)}
          style={styles.statusBanner}
        >
          <View style={styles.bannerContent}>
            <View style={styles.statusInfo}>
              <Ionicons name={getStatusIcon(test.status)} size={20} color="white" />
              <Text style={styles.statusText}>
                {test.status?.charAt(0).toUpperCase()}{test.status?.slice(1)}
              </Text>
            </View>
            <View style={styles.priorityBadge}>
              <Ionicons 
                name={getPriorityIcon(test.priority)} 
                size={14} 
                color={getPriorityColor(test.priority)} 
              />
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.cardContent}>
          {/* Test ID and Actions */}
          <View style={styles.cardHeader}>
            <View style={styles.testInfo}>
              <Text style={styles.testId}>{test.testId}</Text>
              <Text style={styles.testIdSubtext}>Test ID</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(test);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]} 
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#f44336" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Patient Information */}
          <View style={styles.patientSection}>
            <View style={styles.patientRow}>
              <View style={styles.patientIconContainer}>
                <Ionicons name="person" size={18} color="#667eea" />
              </View>
              <Text style={styles.patientName}>{getPatientName()}</Text>
            </View>
          </View>

          {/* Test Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <Text style={styles.detailIcon}>{getSampleTypeIcon(test.sampleType)}</Text>
              </View>
              <Text style={styles.detailLabel}>Sample Type</Text>
              <Text style={styles.detailValue}>
                {test.sampleType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Blood Smear'}
              </Text>
            </View>

            <View style={styles.detailCard}>
              <View style={[styles.detailIconContainer, { backgroundColor: `${getPriorityColor(test.priority)}20` }]}>
                <Ionicons 
                  name={getPriorityIcon(test.priority)} 
                  size={16} 
                  color={getPriorityColor(test.priority)} 
                />
              </View>
              <Text style={styles.detailLabel}>Priority</Text>
              <Text style={[styles.detailValue, { color: getPriorityColor(test.priority) }]}>
                {test.priority?.charAt(0).toUpperCase()}{test.priority?.slice(1)}
              </Text>
            </View>
          </View>

          {/* Clinical Notes */}
          {test.clinicalNotes?.additionalNotes && (
            <View style={styles.notesSection}>
              <View style={styles.notesHeader}>
                <Ionicons name="document-text-outline" size={16} color="#666" />
                <Text style={styles.notesLabel}>Clinical Notes</Text>
              </View>
              <Text style={styles.notesText} numberOfLines={2}>
                {test.clinicalNotes.additionalNotes}
              </Text>
            </View>
          )}

          {/* Footer with Dates */}
          <View style={styles.cardFooter}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={14} color="#999" />
              <Text style={styles.dateText}>Created: {formatDate(test.createdAt)}</Text>
            </View>
            {test.sampleCollectionDate && (
              <View style={styles.dateItem}>
                <Ionicons name="flask-outline" size={14} color="#999" />
                <Text style={styles.dateText}>Collected: {formatDate(test.sampleCollectionDate)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tap to View Indicator */}
        <View style={styles.tapIndicator}>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    marginHorizontal: 2,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    backgroundColor: '#2a2a4a', // Dark purple-blue like patient cards
  },
  statusBanner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 6,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  testInfo: {
    flex: 1,
  },
  testId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff', // White like patient names
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  testIdSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)', // Light grey like patient details
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.2)', // Purple like patient edit buttons
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)', // Red like patient delete buttons
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  patientSection: {
    marginBottom: 16,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patientIconContainer: {
    backgroundColor: '#667eea20',
    padding: 8,
    borderRadius: 10,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff', // White like patient names
    letterSpacing: -0.2,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent like patient contact buttons
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailIconContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailIcon: {
    fontSize: 18,
  },
  detailLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)', // Light grey like patient details
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff', // White for values
    textAlign: 'center',
    lineHeight: 18,
  },
  notesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent like patient contact buttons
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)', // Light grey like patient details
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)', // Light grey for notes
    lineHeight: 20,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'column',
    gap: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)', // Light grey like patient details
    fontWeight: '500',
  },
  tapIndicator: {
    position: 'absolute',
    top: '50%',
    right: 20,
    transform: [{ translateY: -8 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
});

export default TestCard;

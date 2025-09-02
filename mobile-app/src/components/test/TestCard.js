import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        return '#ffc107';
      case 'processing':
        return '#17a2b8';
      case 'completed':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return '#28a745';
      case 'normal':
        return '#17a2b8';
      case 'high':
        return '#ffc107';
      case 'urgent':
        return '#dc3545';
      default:
        return '#17a2b8';
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
    <TouchableOpacity style={styles.card} onPress={() => onPress(test)}>
      <View style={styles.cardHeader}>
        <View style={styles.testInfo}>
          <Text style={styles.testId}>{test.testId}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(test.status) }]} />
            <Text style={styles.statusText}>{test.status?.charAt(0).toUpperCase()}{test.status?.slice(1)}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => onEdit(test)}
          >
            <Ionicons name="create-outline" size={20} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.patientRow}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.patientName}>{getPatientName()}</Text>
        </View>
        
        <View style={styles.testDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>{getSampleTypeIcon(test.sampleType)}</Text>
              <Text style={styles.detailText}>{test.sampleType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(test.priority) }]} />
              <Text style={styles.detailText}>{test.priority?.charAt(0).toUpperCase()}{test.priority?.slice(1)}</Text>
            </View>
          </View>
        </View>
        
        {test.clinicalNotes?.additionalNotes && (
          <View style={styles.notesRow}>
            <Ionicons name="document-text" size={16} color="#666" />
            <Text style={styles.notesText} numberOfLines={2}>{test.clinicalNotes.additionalNotes}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.createdDate}>
          Created: {formatDate(test.createdAt)}
        </Text>
        {test.sampleCollectionDate && (
          <Text style={styles.collectedDate}>
            Collected: {formatDate(test.sampleCollectionDate)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  testInfo: {
    flex: 1,
    marginRight: 10,
  },
  testId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  cardBody: {
    padding: 16,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  testDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  createdDate: {
    fontSize: 12,
    color: '#999',
  },
  collectedDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default TestCard;

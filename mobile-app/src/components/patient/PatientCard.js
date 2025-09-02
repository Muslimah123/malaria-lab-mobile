import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const PatientCard = ({ patient, onPress, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getAge = (dateString) => {
    if (!dateString) return '';
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return ` (${age} years)`;
    } catch {
      return '';
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(patient.id)
        },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={() => onPress(patient)}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.modernCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.patientInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.modernPatientName}>
                {patient.firstName} {patient.lastName}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <Text style={styles.modernPatientDetails}>
              {patient.gender?.charAt(0).toUpperCase()}{patient.gender?.slice(1)} • {formatDate(patient.dateOfBirth)}{getAge(patient.dateOfBirth)}
            </Text>
          </View>
          <View style={styles.modernActions}>
            <TouchableOpacity 
              style={styles.modernActionButton} 
              onPress={() => onEdit(patient)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="create-outline" size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modernActionButton} 
              onPress={handleDelete}
            >
              <LinearGradient
                colors={['#e74c3c', '#c0392b']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="trash-outline" size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      
        <View style={styles.modernCardBody}>
          <View style={styles.infoGrid}>
            {patient.phoneNumber && (
              <View style={styles.modernInfoItem}>
                <Ionicons name="call" size={14} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.modernInfoText}>{patient.phoneNumber}</Text>
              </View>
            )}
            
            {patient.email && (
              <View style={styles.modernInfoItem}>
                <Ionicons name="mail" size={14} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.modernInfoText}>{patient.email}</Text>
              </View>
            )}
          </View>
          
          {patient.totalTests > 0 && (
            <View style={styles.testSummary}>
              <View style={styles.testSummaryHeader}>
                <Ionicons name="medical" size={16} color="#667eea" />
                <Text style={styles.testSummaryTitle}>Medical History</Text>
              </View>
              <View style={styles.testStats}>
                <View style={styles.testStat}>
                  <Text style={styles.testStatNumber}>{patient.totalTests}</Text>
                  <Text style={styles.testStatLabel}>Total Tests</Text>
                </View>
                <View style={styles.testStat}>
                  <Text style={[styles.testStatNumber, patient.positiveTests > 0 && styles.positiveNumber]}>
                    {patient.positiveTests}
                  </Text>
                  <Text style={styles.testStatLabel}>Positive</Text>
                </View>
                {patient.lastTestDate && (
                  <View style={styles.testStat}>
                    <Text style={styles.testStatLabel}>Last Test</Text>
                    <Text style={styles.testStatDate}>{formatDate(patient.lastTestDate)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {patient.totalTests > 0 && patient.positiveTests > 0 && (
            <View style={styles.modernAlertRow}>
              <Ionicons name="warning" size={14} color="#e74c3c" />
              <Text style={styles.modernAlertText}>
                Follow-up required
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.modernCardFooter}>
          <Text style={styles.modernPatientId}>ID: {patient.patientId}</Text>
          <Text style={styles.modernCreatedDate}>
            {formatDate(patient.createdAt)}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modernCard: {
    borderRadius: 20,
    marginBottom: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modernPatientName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modernPatientDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
  },
  modernActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modernActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    padding: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernCardBody: {
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  modernInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernInfoText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  testSummary: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
    marginBottom: 8,
  },
  testSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  testSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  testStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testStat: {
    alignItems: 'center',
    flex: 1,
  },
  testStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  positiveNumber: {
    color: '#e74c3c',
  },
  testStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  testStatDate: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  modernAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  modernAlertText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e74c3c',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  modernCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernPatientId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667eea',
    letterSpacing: 0.5,
  },
  modernCreatedDate: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.2,
  },
});

export default PatientCard;
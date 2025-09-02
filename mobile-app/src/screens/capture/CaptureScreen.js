import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

const CaptureScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Capture Test</Text>
        <Text style={styles.subtitle}>Take a photo of the blood sample</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraText}>Camera will be implemented here</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>📸 Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
            <Text style={styles.secondaryButtonText}>🖼️ Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: '#667eea',
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  cameraPlaceholder: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  cameraText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  actions: {
    gap: 15,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CaptureScreen;

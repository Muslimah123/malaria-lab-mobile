import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';

const TestDetailScreen = ({ route, navigation }) => {
  // FORCE CACHE CLEAR - Version 3.0 - FOR EXPO PHONE
  console.log('🔥 TestDetailScreen V3.0 - EXPO PHONE VERSION:', new Date().toISOString());
  
  useEffect(() => {
    // Show alert immediately when component mounts
    Alert.alert(
      '🎯 TEST DETAIL LOADED!',
      'TestDetailScreen component is working!\n\nTime: ' + new Date().toLocaleTimeString(),
      [{ text: 'OK', onPress: () => console.log('Alert closed') }]
    );
  }, []);
  
  // Simple, safe parameter extraction
  let testId = 'No ID';
  let patientName = 'No Name';
  
  try {
    if (route && route.params) {
      testId = route.params.testId || route.params.id || 'No ID';
      patientName = route.params.patientName || 'No Name';
    }
  } catch (error) {
    console.error('Error extracting params:', error);
  }
  
  const handleGoBack = () => {
    console.log('🔙 Go back pressed');
    try {
      if (navigation && navigation.goBack) {
        navigation.goBack();
      } else {
        console.error('Navigation.goBack not available');
      }
    } catch (error) {
      console.error('Go back error:', error);
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#00ffff', // Bright cyan/aqua - COMPLETELY NEW COLOR
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20 
    }}>
      <StatusBar barStyle="dark-content" backgroundColor="#00ffff" />
      
      <Text style={{ 
        color: 'white', 
        fontSize: 30, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 20 
      }}>
        🎯 TEST DETAIL SCREEN 🎯
      </Text>
      
      <Text style={{ 
        color: 'yellow', 
        fontSize: 24, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 20 
      }}>
        ✅ WORKING CORRECTLY!
      </Text>
      
      <Text style={{ 
        color: 'black', 
        fontSize: 18, 
        marginBottom: 10, 
        textAlign: 'center' 
      }}>
        Test ID: {testId}
      </Text>
      
      <Text style={{ 
        color: 'black', 
        fontSize: 18, 
        marginBottom: 30, 
        textAlign: 'center' 
      }}>
        Patient: {patientName}
      </Text>
      
      <TouchableOpacity 
        onPress={handleGoBack}
        style={{ 
          padding: 20, 
          backgroundColor: 'red', 
          borderRadius: 10,
          minWidth: 150,
          alignItems: 'center'
        }}
      >
        <Text style={{ 
          color: 'white', 
          fontSize: 18, 
          fontWeight: 'bold' 
        }}>
          GO BACK
        </Text>
      </TouchableOpacity>
      
      <Text style={{ 
        color: 'black', 
        fontSize: 14, 
        marginTop: 30, 
        textAlign: 'center' 
      }}>
        GREEN SCREEN = SUCCESS! 🎉
      </Text>
    </View>
  );
};

export default TestDetailScreen;
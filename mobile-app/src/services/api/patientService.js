import api from '../api';

const patientService = {
  // Get all patients with pagination and search
  async getPatients(page = 1, perPage = 20, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await api.get(`/patients/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch patients');
    }
  },

  // Get a specific patient by ID
  async getPatient(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}`);
      return response.data.patient;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch patient');
    }
  },

  // Create a new patient
  async createPatient(patientData) {
    try {
      console.log('PatientService: Creating patient with data:', patientData);
      
      // Transform date format from "2001/12/29" to "2001-12-29"
      const formatDate = (dateString) => {
        if (!dateString) return null;
        // Convert "2001/12/29" to "2001-12-29"
        return dateString.replace(/\//g, '-');
      };
      
      // Transform frontend data to backend format
      const backendData = {
        firstName: patientData.first_name,
        lastName: patientData.last_name,
        dateOfBirth: formatDate(patientData.date_of_birth),
        gender: patientData.gender,
        phoneNumber: patientData.phone_number,
        email: patientData.email
      };

      console.log('PatientService: Transformed backend data:', backendData);
      console.log('PatientService: Making API call to /patients/');
      
      const response = await api.post('/patients/', backendData);
      console.log('PatientService: API response:', response.data);
      
      return response.data.patient;
    } catch (error) {
      console.error('PatientService: Error creating patient:', error);
      console.error('PatientService: Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to create patient');
    }
  },

  // Update an existing patient
  async updatePatient(patientId, patientData) {
    try {
      // Transform date format from "2001/12/29" to "2001-12-29"
      const formatDate = (dateString) => {
        if (!dateString) return null;
        // Convert "2001/12/29" to "2001-12-29"
        return dateString.replace(/\//g, '-');
      };
      
      // Transform frontend data to backend format
      const backendData = {
        firstName: patientData.first_name,
        lastName: patientData.last_name,
        dateOfBirth: formatDate(patientData.date_of_birth),
        gender: patientData.gender,
        phoneNumber: patientData.phone_number,
        email: patientData.email
      };

      const response = await api.put(`/patients/${patientId}`, backendData);
      return response.data.patient;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update patient');
    }
  },

  // Delete a patient
  async deletePatient(patientId) {
    try {
      await api.delete(`/patients/${patientId}`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete patient');
    }
  },

  // Search patients
  async searchPatients(query, limit = 20) {
    try {
      const response = await api.get(`/patients/?search=${encodeURIComponent(query)}&per_page=${limit}`);
      return response.data.patients;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to search patients');
    }
  },

  // Get patient test history
  async getPatientTests(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/tests`);
      return response.data.tests || [];
    } catch (error) {
      console.error('Error fetching patient tests:', error);
      // Return empty array if endpoint doesn't exist yet
      return [];
    }
  }
};

export default patientService;

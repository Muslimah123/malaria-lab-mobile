import api from '../api';

const testService = {
  // Get all tests with pagination and filtering
  async getTests(page = 1, perPage = 20, status = '', patientId = '', priority = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      
      if (status) params.append('status', status);
      if (patientId) params.append('patient_id', patientId);
      if (priority) params.append('priority', priority);
      
      const response = await api.get(`/tests/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch tests');
    }
  },

  // Get a specific test by ID
  async getTest(testId) {
    try {
      const response = await api.get(`/tests/${testId}`);
      return response.data.test;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch test');
    }
  },

  // Create a new test
  async createTest(testData) {
    try {
      console.log('TestService: Creating test with data:', testData);
      
      // Transform frontend data to backend format
      const backendData = {
        patientId: testData.patient_id,
        sampleType: testData.sample_type,
        sampleCollectionDate: new Date().toISOString(),
        priority: testData.priority,
        clinicalNotes: {
          symptoms: [],
          duration: '',
          severity: '',
          previousTreatment: '',
          additionalNotes: testData.clinical_notes || ''
        }
      };

      console.log('TestService: Transformed backend data:', backendData);
      console.log('TestService: Making API call to /tests/');
      
      const response = await api.post('/tests/', backendData);
      console.log('TestService: API response:', response.data);
      
      return response.data.test;
    } catch (error) {
      console.error('TestService: Error creating test:', error);
      console.error('TestService: Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to create test');
    }
  },

  // Update an existing test
  async updateTest(testId, testData) {
    try {
      const backendData = {
        sampleType: testData.sample_type,
        priority: testData.priority,
        clinicalNotes: {
          symptoms: [],
          duration: '',
          previousTreatment: '',
          additionalNotes: testData.clinical_notes || ''
        }
      };

      const response = await api.put(`/tests/${testId}`, backendData);
      return response.data.test;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update test');
    }
  },

  // Delete a test
  async deleteTest(testId) {
    try {
      await api.delete(`/tests/${testId}`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete test');
    }
  },

  // Update test status
  async updateTestStatus(testId, status) {
    try {
      const response = await api.patch(`/tests/${testId}/status`, { status });
      return response.data.test;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update test status');
    }
  },

  // Get test results with diagnosis data
  async getTestResults(testId) {
    try {
      const response = await api.get(`/tests/${testId}/results`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch test results');
    }
  },

  // Get test statistics
  async getTestStats() {
    try {
      const response = await api.get('/tests/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch test statistics');
    }
  }
};

export default testService;

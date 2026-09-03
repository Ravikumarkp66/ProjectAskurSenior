import apiClient from './apiClient';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/admin-login', { email, password });
    return response.data;
  },

  googleLogin: async (credentialOrToken) => {
    // Use admin-specific google login endpoint to bypass V2 student auth flow
    try {
      const response = await apiClient.post('/auth/admin-google', { token: credentialOrToken });
      return response.data;
    } catch (err) {
      // Fallback to standard google endpoint if admin-google doesn't exist
      if (err.response?.status === 404) {
        const fallbackResponse = await apiClient.post('/auth/google', { token: credentialOrToken });
        return fallbackResponse.data;
      }
      throw err;
    }
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  }
};

export default authService;

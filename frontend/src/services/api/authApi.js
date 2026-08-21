import { apiClient } from './apiClient';

export const authAPI = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    adminLogin: (data) => apiClient.post('/auth/admin-login', data),
    googleLogin: (token) => apiClient.post('/auth/google', { token }),
    sendOtp: (email) => apiClient.post('/auth/send-otp', { email }),
    registerAndSendOtp: (data) => apiClient.post('/auth/register-send-otp', data),
    verifyOtp: (email, otp) => apiClient.post('/auth/verify-otp', { email, otp }),
    verifySignupOtp: (email, otp) => apiClient.post('/auth/verify-signup-otp', { email, otp }),
    completeGoogleRegistration: (data) => apiClient.post('/auth/complete-google-registration', data),
    getProfile: () => apiClient.get('/auth/profile'),
    updateProfile: (data) => apiClient.put('/auth/update-profile', data),
    uploadProfilePicture: (formData) => apiClient.post('/auth/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    changePassword: (data) => apiClient.put('/auth/change-password', data),
    switchBranch: (data) => apiClient.post('/auth/switch-branch', data),
    heartbeat: () => apiClient.post('/auth/heartbeat')
};

import axios from 'axios';

// Use Vite environment variable in production; fallback to `/api` so Vite dev proxy works.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authAPI = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    getProfile: () => apiClient.get('/auth/profile'),
    switchBranch: (data) => apiClient.post('/auth/switch-branch', data)
};

// Subject API
export const subjectAPI = {
    getSubjectsByBranch: (branch, cycle) =>
        apiClient.get(`/subjects/branch/${branch}`, {
            params: cycle ? { cycle } : {}
        }),
    getSubjectById: (subjectId) => apiClient.get(`/subjects/${subjectId}`),
    markQuestionCompleted: (data) => apiClient.post('/subjects/question/complete', data)
};

// Progress API
export const progressAPI = {
    getUserProgress: () => apiClient.get('/progress'),
    getProgressByBranch: (branch) => apiClient.get(`/progress/branch/${branch}`)
};

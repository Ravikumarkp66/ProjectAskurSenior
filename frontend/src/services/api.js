import axios from 'axios';

// Dev: use localhost:5000 via Vite proxy
// Production: use VITE_API_URL if set, otherwise use relative '/api' so vercel.json proxy routes to Render
const API_BASE_URL = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

export const apiClient = axios.create({
    baseURL: API_BASE_URL
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Add timeout for all requests - longer for uploads
    if (config.url.includes('/upload') || config.url.includes('/user-uploads')) {
        config.timeout = 300000; // 5 minute timeout for uploads (50MB files)
    } else {
        config.timeout = 120000; // 2 minute timeout for other requests
    }
    return config;
});

// Handle 401 responses - clear invalid tokens
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear invalid/expired token
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            // Redirect to login if not already there, with an optional message
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                const isSessionExpired = error.response.data?.sessionExpired;
                const message = isSessionExpired ? '?message=Session expired. Logged in from another device.' : '';
                window.location.href = `/login${message}`;
            }
        }

        // Log error details for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.error('API Error:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                data: error.response?.data
            });
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    adminLogin: (data) => apiClient.post('/auth/admin-login', data),
    googleLogin: (token) => apiClient.post('/auth/google', { token }),
    sendOtp: (email) => apiClient.post('/auth/send-otp', { email }),
    registerAndSendOtp: (data) => apiClient.post('/auth/register-send-otp', data), // signup: name+usn+email → OTP
    verifyOtp: (email, otp) => apiClient.post('/auth/verify-otp', { email, otp }),
    verifySignupOtp: (email, otp) => apiClient.post('/auth/verify-signup-otp', { email, otp }), // signup OTP verify
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

// Subject API with caching
const subjectCache = new Map();
export const subjectAPI = {
    getSubjectsByBranch: async (branch, cycle) => {
        const cacheKey = `subjects_${branch}_${cycle || 'any'}`;
        const cached = subjectCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < 300000)) { // 5 min cache
            return cached.promise;
        }

        const promise = apiClient.get(`/subjects/branch/${branch}`, {
            params: cycle ? { cycle } : {}
        });

        subjectCache.set(cacheKey, { promise, timestamp: Date.now() });
        return promise;
    },
    getAllSubjects: (params) => apiClient.get('/subjects', { params }),
    getSubjectById: (subjectId) => apiClient.get(`/subjects/${subjectId}`),
    getSubjectsByCode: (subjectCode) => apiClient.get(`/subjects/code/${subjectCode}`),
    markQuestionCompleted: (data) => apiClient.post('/subjects/question/complete', data),
    getModuleNotes: (subjectId, moduleNumber) =>
        apiClient.get(`/subjects/${subjectId}/module/${moduleNumber}/notes`),
    // New content APIs
    getSubjectContent: (subjectId) =>
        apiClient.get(`/subjects/${subjectId}/content`),
    getContentUrl: (subjectId, contentType, contentId) =>
        apiClient.get(`/subjects/${subjectId}/content/${contentType}/${contentId}`),
    getModuleContentUrl: (subjectId, moduleNumber, contentType, contentId) =>
        apiClient.get(`/subjects/${subjectId}/module/${moduleNumber}/content/${contentType}/${contentId}`)
};

// Upload API (Admin)
export const uploadAPI = {
    uploadSubjectFiles: (subjectId, contentType, items, options = {}) => {
        const formData = new FormData();
        items.forEach((item) => {
            if (item instanceof File) {
                formData.append('files', item);
            } else {
                formData.append('files', item.file);
                if (item.thumbnail) formData.append('thumbnails', item.thumbnail);
                if (item.pageCount) formData.append('pageCounts', item.pageCount);
            }
        });
        return apiClient.post(`/upload/${subjectId}/${contentType}`, formData, {
            timeout: 300000, // 5 minute timeout for large files
            onUploadProgress: options.onUploadProgress
        });
    },
    uploadSubjectZip: (subjectId, zipFile, options = {}) => {
        const formData = new FormData();
        formData.append('file', zipFile);
        return apiClient.post(`/upload/zip/${subjectId}`, formData, {
            timeout: 300000,
            onUploadProgress: options.onUploadProgress
        });
    },
    // Delete subject-level content
    deleteSubjectContent: (subjectId, contentType, contentId) =>
        apiClient.delete(`/upload/content/${subjectId}/${contentType}/${contentId}`),
    // Delete module-level content (legacy)
    deleteModuleContent: (subjectId, moduleNumber, contentType, contentId) =>
        apiClient.delete(`/upload/module-content/${subjectId}/${moduleNumber}/${contentType}/${contentId}`),

    // BULK UPLOAD - Upload to ALL subjects with same code across all branches/cycles

    bulkUploadSubjectContent: (subjectCode, contentType, items) => {
        const formData = new FormData();
        items.forEach((item) => {
            if (item instanceof File) {
                formData.append('files', item);
            } else {
                formData.append('files', item.file);
                if (item.thumbnail) formData.append('thumbnails', item.thumbnail);
                if (item.pageCount) formData.append('pageCounts', item.pageCount);
            }
        });
        return apiClient.post(`/upload/bulk/content/${subjectCode}/${contentType}`, formData, {
            timeout: 300000 // 5 minute timeout for large files
        });
    },
    // Bulk delete subject-level content from all subjects with this code
    bulkDeleteSubjectContent: (subjectCode, contentType, title) =>
        apiClient.delete(`/upload/bulk/content/${subjectCode}/${contentType}/${encodeURIComponent(title)}`),
    // Bulk delete module-level content from all subjects with this code (legacy)
    bulkDeleteModuleContent: (subjectCode, moduleNumber, contentType, title) =>
        apiClient.delete(`/upload/bulk/module-content/${subjectCode}/${moduleNumber}/${contentType}/${encodeURIComponent(title)}`)
};

// Notification API
export const notificationAPI = {
    // Get notifications for current user (optionally filtered by branch/cycle)
    getNotifications: (branch, cycle, limit = 20) =>
        apiClient.get('/notifications', {
            params: { branch, cycle, limit }
        }),
    // Mark specific notifications as read
    markAsRead: (notificationIds) =>
        apiClient.post('/notifications/read', { notificationIds }),
    // Mark all notifications as read
    markAllAsRead: (branch, cycle) =>
        apiClient.post('/notifications/read-all', null, {
            params: { branch, cycle }
        }),
    // Create notification (admin only)
    createNotification: (data) =>
        apiClient.post('/notifications', data),
    // Delete notification (admin only)
    deleteNotification: (notificationId) =>
        apiClient.delete(`/notifications/${notificationId}`)
};

// User upload API (user submits, admin approves)
export const userUploadAPI = {
    createUpload: (formData, options = {}) => apiClient.post('/user-uploads', formData, {
        timeout: 300000, // 5 minute timeout for large files
        onUploadProgress: options.onUploadProgress
    }),
    getUploads: (status = 'pending') =>
        apiClient.get('/user-uploads', { params: { status } }),
    getUploadUrl: (uploadId) =>
        apiClient.get(`/user-uploads/${uploadId}/url`),
    approveUpload: (uploadId) =>
        apiClient.post(`/user-uploads/${uploadId}/approve`),
    deleteUpload: (uploadId) =>
        apiClient.delete(`/user-uploads/${uploadId}`),
    // Admin management methods
    getUploadById: (uploadId) =>
        apiClient.get(`/documents/${uploadId}`),
    updateUpload: (uploadId, data) =>
        apiClient.patch(`/documents/${uploadId}`, data),
    restoreUpload: (uploadId) =>
        apiClient.post(`/documents/${uploadId}/restore`),
    permanentDeleteUpload: (uploadId) =>
        apiClient.delete(`/documents/${uploadId}/permanent`)
};

// Global Documents API
export const documentsAPI = {
    uploadDocument: (data, items, options = {}) => {
        const formData = new FormData();
        
        // Append all document metadata
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });

        // Append files and thumbnails
        items.forEach((item) => {
            if (item instanceof File) {
                formData.append('files', item);
            } else {
                formData.append('files', item.file);
                if (item.thumbnail) formData.append('thumbnails', item.thumbnail);
                if (item.pageCount) formData.append('pageCounts', item.pageCount);
            }
        });

        return apiClient.post('/documents/upload', formData, {
            timeout: 300000,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: options.onUploadProgress
        });
    },
    deleteDocument: (id) => apiClient.delete(`/documents/${id}/permanent`)
};



// Interview Experiences API
export const interviewExperiencesAPI = {
    getCompanies: () => apiClient.get('/experiences/companies'),
    getCompanyRoles: (companyId) => apiClient.get(`/experiences/companies/${companyId}/roles`),
    getExperiences: (params) => apiClient.get('/experiences/list', { params }),
    createExperience: (data) => apiClient.post('/experiences/create', data),
    upvoteExperience: (id) => apiClient.post(`/experiences/upvote/${id}`),
    updateExperience: (id, data) => apiClient.put(`/experiences/${id}`, data),
    createCompany: (data) => apiClient.post('/experiences/admin/companies', data)
};


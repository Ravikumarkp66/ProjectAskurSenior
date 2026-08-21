import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

export const apiClient = axios.create({
    baseURL: API_BASE_URL
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.url.includes('/upload') || config.url.includes('/user-uploads')) {
        config.timeout = 300000;
    } else {
        config.timeout = 120000;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                const isSessionExpired = error.response.data?.sessionExpired;
                const message = isSessionExpired ? '?message=Session expired. Logged in from another device.' : '';
                window.location.href = `/login${message}`;
            }
        }

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

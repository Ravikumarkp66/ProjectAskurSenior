import axios from 'axios';

export const getBaseApiUrl = (subPath = '') => {
    let base = '';
    if (import.meta.env.DEV) {
        base = 'http://localhost:5000/api';
    } else {
        const envUrl = import.meta.env.VITE_API_URL;
        if (!envUrl) {
            base = '/api';
        } else {
            const cleanUrl = envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
            base = `${cleanUrl}/api`;
        }
    }

    if (!subPath) return base;
    const cleanSubPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
    return `${base}${cleanSubPath}`;
};

export const API_BASE_URL = getBaseApiUrl();

export const apiClient = axios.create({
    baseURL: API_BASE_URL
});

apiClient.interceptors.request.use((config) => {
    config.headers['x-client-portal'] = 'frontend_3000';
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
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
            const currentPath = window.location.pathname;
            const isAuthRoute = currentPath === '/login' || currentPath === '/signup' || currentPath === '/complete-profile' || currentPath === '/admin/login';

            // Always clear invalid tokens from storage to prevent repeated failed calls
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // If already on an auth page, do NOT popup the modal or redirect
            if (isAuthRoute) {
                return Promise.reject(error);
            }

            const code = error.response?.data?.code;

            if (code === 'SESSION_REPLACED') {
                window.dispatchEvent(
                    new CustomEvent('session-replaced', {
                        detail: {
                            title: 'Logged Out',
                            message: 'You have logged in on another device.\nFor security, this device has been logged out.'
                        }
                    })
                );
                return Promise.reject(error);
            }

            if (code === 'SESSION_REVOKED') {
                window.dispatchEvent(
                    new CustomEvent('session-replaced', {
                        detail: {
                            title: 'Session Revoked',
                            message: error.response?.data?.error || 'Your session has been revoked by an administrator.'
                        }
                    })
                );
                return Promise.reject(error);
            }

            const isSessionExpired = error.response.data?.sessionExpired;
            const message = isSessionExpired ? '?message=Session expired. Please sign in again.' : '';
            window.location.href = `/login${message}`;
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

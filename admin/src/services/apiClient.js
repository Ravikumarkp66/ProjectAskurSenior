import axios from 'axios';

export const getBaseApiUrl = (subPath = '') => {
  let base = '';
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    base = envUrl.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
  } else if (import.meta.env.DEV) {
    base = 'http://localhost:5000/api';
  } else {
    base = '/api';
  }

  if (!subPath) return base;
  const cleanSubPath = subPath.startsWith('/') ? subPath : `/${subPath}`;
  return `${base}${cleanSubPath}`;
};

export const API_BASE_URL = getBaseApiUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request Interceptor: Attach Admin Token
apiClient.interceptors.request.use(
  (config) => {
    config.headers['x-client-portal'] = 'admin_portal_5174';
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthenticated
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRoute = window.location.pathname === '/login';

      // Always clear stale admin credentials to prevent persistent failed calls
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');

      // If already on login page, do not trigger modal or redirect
      if (isLoginRoute) {
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

      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

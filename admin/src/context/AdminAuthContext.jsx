import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('adminUser');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setAdmin(JSON.parse(storedUser));
          // Validate token with backend
          const profile = await authService.getProfile();
          if (profile && (profile.isAdmin || profile.role === 'admin')) {
            setAdmin(profile);
            localStorage.setItem('adminUser', JSON.stringify(profile));
          } else {
            logout();
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const authToken = data.token;
    const authUser = data.user;

    localStorage.setItem('adminToken', authToken);
    localStorage.setItem('adminUser', JSON.stringify(authUser));

    setToken(authToken);
    setAdmin(authUser);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, isAuthenticated: !!token && !!admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

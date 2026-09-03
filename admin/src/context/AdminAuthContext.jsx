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
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setAdmin(parsedUser);

          // Validate token with profile endpoint
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

  const loginWithGoogle = async (credentialOrToken) => {
    const data = await authService.googleLogin(credentialOrToken);
    const user = data.user || data.student || data.data?.user || data.data?.student || data.account;
    const authToken = data.token || data.accessToken || data.data?.token || data.data?.accessToken;

    // Check administrative authorization
    const isAdminUser = user && (
      user.isAdmin === true ||
      user.role === 'admin' ||
      (user.email && user.email.toLowerCase() === 'mreducator4566@gmail.com')
    );

    if (!isAdminUser) {
      const authError = new Error('Access denied. Your account is not authorized to access the AskUrSenior Admin Portal.');
      authError.code = 'UNAUTHORIZED_ADMIN';
      throw authError;
    }

    const adminUser = { ...user, isAdmin: true, role: 'admin' };
    localStorage.setItem('adminToken', authToken);
    localStorage.setItem('adminUser', JSON.stringify(adminUser));

    setToken(authToken);
    setAdmin(adminUser);
    return data;
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const user = data.user;

    if (!user || (!user.isAdmin && user.role !== 'admin')) {
      const authError = new Error('Access denied. Your account is not authorized to access the AskUrSenior Admin Portal.');
      authError.code = 'UNAUTHORIZED_ADMIN';
      throw authError;
    }

    const authToken = data.token;
    localStorage.setItem('adminToken', authToken);
    localStorage.setItem('adminUser', JSON.stringify(user));

    setToken(authToken);
    setAdmin(user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        loading,
        login,
        loginWithGoogle,
        logout
      }}
    >
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

export default AdminAuthContext;

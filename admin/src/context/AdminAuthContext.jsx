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
          if (profile && (profile.isAdmin || profile.role === 'admin' || profile.role === 'SUPER_ADMIN' || profile.role === 'ADMIN')) {
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
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN' ||
      user.isSuperAdmin === true ||
      (user.email && user.email.toLowerCase() === 'mreducator4566@gmail.com')
    );

    if (!isAdminUser) {
      const authError = new Error('Access denied. Your account is not authorized to access the AskUrSenior Admin Portal.');
      authError.code = 'UNAUTHORIZED_ADMIN';
      throw authError;
    }

    const adminUser = {
      ...user,
      isAdmin: true,
      role: user.role || 'ADMIN',
      isSuperAdmin: user.isSuperAdmin || user.role === 'SUPER_ADMIN'
    };
    localStorage.setItem('adminToken', authToken);
    setToken(authToken);

    try {
      const profile = await authService.getProfile();
      if (profile && (profile.isAdmin || profile.role === 'admin' || profile.role === 'SUPER_ADMIN' || profile.role === 'ADMIN')) {
        localStorage.setItem('adminUser', JSON.stringify(profile));
        setAdmin(profile);
        return data;
      }
    } catch (err) {
      console.warn('Failed to load profile on Google login, using initial adminUser:', err);
    }

    localStorage.setItem('adminUser', JSON.stringify(adminUser));
    setAdmin(adminUser);
    return data;
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const user = data.user;

    const isAdminUser = user && (
      user.isAdmin === true ||
      user.role === 'admin' ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN'
    );

    if (!isAdminUser) {
      const authError = new Error('Access denied. Your account is not authorized to access the AskUrSenior Admin Portal.');
      authError.code = 'UNAUTHORIZED_ADMIN';
      throw authError;
    }

    const authToken = data.token;
    localStorage.setItem('adminToken', authToken);
    setToken(authToken);

    try {
      const profile = await authService.getProfile();
      if (profile && (profile.isAdmin || profile.role === 'admin' || profile.role === 'SUPER_ADMIN' || profile.role === 'ADMIN')) {
        localStorage.setItem('adminUser', JSON.stringify(profile));
        setAdmin(profile);
        return data;
      }
    } catch (err) {
      console.warn('Failed to load profile on password login, using user:', err);
    }

    localStorage.setItem('adminUser', JSON.stringify(user));
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

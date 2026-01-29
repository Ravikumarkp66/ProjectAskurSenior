import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = useCallback((userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }, []);

    const updateUser = useCallback((patch) => {
        setUser((prev) => {
            if (!prev) return prev;
            const updatedUser = { ...prev, ...(patch || {}) };
            try {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch {
                // ignore
            }
            return updatedUser;
        });
    }, []);

    const switchBranch = useCallback((newBranch) => {
        if (user) {
            const updatedUser = { ...user, currentBranch: newBranch };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    }, [user]);

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        switchBranch,
        updateUser,
        isAuthenticated: !!token
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";


// Create the AuthContext
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load auth data from localStorage on mount
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");

    if (storedUser && storedToken) {
      try {
        let userObj = JSON.parse(storedUser);
        // Ensure subscription property exists and is 'free' if missing, for non-admins only
        if (!userObj.isAdmin && !userObj.subscription) {
          userObj.subscription = "free";
          localStorage.setItem("user", JSON.stringify(userObj));
        }
        setUser(userObj);
        setToken(storedToken);
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
      }
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    if (authToken) localStorage.setItem("authToken", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...(patch || {}) };
      try {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (err) {
        console.error("Failed to update user in localStorage:", err);
      }
      return updatedUser;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  }, []);

  const switchBranch = useCallback((newBranch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, currentBranch: newBranch };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!token, login, logout, updateUser, switchBranch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

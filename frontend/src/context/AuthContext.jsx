import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import authService from "../services/authService";
import { authAPI } from "../services/api";

// Create the AuthContext
export const AuthContext = createContext();

const normalizeUser = (u) => {
  if (!u) return u;
  const pic = u.profilePicture || u.avatar || u.picture || u.photo || '';
  const sem = u.semester ? Number(u.semester) : 1;
  return {
    ...u,
    semester: sem,
    profilePicture: pic,
    isAdmin: false,
    role: 'user'
  };
};

export const AuthProvider = ({ children }) => {
  const getStoredToken = () => localStorage.getItem("authToken") || localStorage.getItem("token") || null;

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = getStoredToken();
    if (storedUser && storedToken) {
      try {
        let userObj = JSON.parse(storedUser);
        if (!userObj.subscription) {
          userObj.subscription = "free";
        }
        userObj = normalizeUser(userObj);
        localStorage.setItem("user", JSON.stringify(userObj));
        return userObj;
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = getStoredToken();
    return (storedUser && storedToken) ? storedToken : null;
  });

  const [loading, setLoading] = useState(false);

  // Sync latest user profile details (including profilePicture & semester) from backend
  const syncUserProfile = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) return;
    try {
      let freshUser = null;
      try {
        const res = await authAPI.getProfile();
        freshUser = res.data?.user || res.data?.data || res.data;
      } catch (e) {
        const res = await authService.getMe();
        freshUser = res.data?.data || res.data?.user || res.data;
      }

      if (freshUser) {
        setUser((prev) => {
          const updated = normalizeUser({
            ...(prev || {}),
            ...freshUser,
            profilePicture: freshUser.profilePicture || freshUser.avatar || freshUser.picture || freshUser.photo || prev?.profilePicture || '',
          });
          try {
            localStorage.setItem("user", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    } catch (err) {
      console.warn("[AuthContext] Failed to sync user profile on mount:", err);
    }
  }, []);

  // Sync on mount if logged in
  useEffect(() => {
    if (token) {
      syncUserProfile();
    }
  }, [token, syncUserProfile]);

  const login = useCallback((userData, authToken) => {
    const norm = normalizeUser(userData);
    setUser(norm);
    setToken(authToken);
    if (authToken) {
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("token", authToken);
    }
    if (norm) localStorage.setItem("user", JSON.stringify(norm));

    // Immediately fetch full profile details in background
    syncUserProfile();
  }, [syncUserProfile]);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = normalizeUser({ ...prev, ...(patch || {}) });
      try {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (err) {
        console.error("Failed to update user in localStorage:", err);
      }
      return updatedUser;
    });
  }, []);

  const logout = useCallback(() => {
    console.log('[V2 Auth Debug] logout() called');
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
  }, []);

  const switchBranch = useCallback((newBranch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, currentBranch: newBranch };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, isAuthenticated: !!token, login, logout, updateUser, switchBranch }),
    [user, token, loading, login, logout, updateUser, switchBranch]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

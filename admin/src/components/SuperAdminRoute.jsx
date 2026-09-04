import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Loader2 } from 'lucide-react';

export const SuperAdminRoute = ({ children }) => {
  const { admin, isAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400 font-medium font-mono">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isSuper = admin?.isSuperAdmin || admin?.role === 'SUPER_ADMIN';
  if (!isSuper) {
    return <Navigate to="/materials" replace />;
  }

  return children;
};

export default SuperAdminRoute;

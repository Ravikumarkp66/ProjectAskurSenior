import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { useAuth } from './utils/hooks';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AdminReviewsPage from './pages/AdminReviewsPage';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-700 font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-700 font-semibold">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" />;
    if (!user?.isAdmin) return <Navigate to="/dashboard" />;
    return children;
};

function AppContent() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<LoginPage initialMode="register" />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardProvider>
                            <DashboardPage />
                        </DashboardProvider>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/reviews"
                element={
                    <AdminRoute>
                        <AdminReviewsPage />
                    </AdminRoute>
                }
            />
            <Route path="/" element={<HomePage />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;

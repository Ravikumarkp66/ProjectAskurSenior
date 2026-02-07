import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './utils/hooks';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AdminPanel from './pages/AdminPanel';
import CGPACalculatorPage from './pages/CGPACalculatorPage';
import SubjectContentPage from './pages/SubjectContentPage';
import QuizPage from './pages/QuizPage';
import GameifiedLoader from './components/GameifiedLoader';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <GameifiedLoader
                isLoading={true}
                loadingText="Authenticating"
                variant="auth"
            />
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <GameifiedLoader
                isLoading={true}
                loadingText="Preparing Admin Panel"
                variant="auth"
            />
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
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminPanel />
                    </AdminRoute>
                }
            />
            <Route
                path="/admin/reviews"
                element={
                    <AdminRoute>
                        <AdminPanel />
                    </AdminRoute>
                }
            />
            <Route
                path="/admin/study-materials"
                element={
                    <AdminRoute>
                        <AdminPanel />
                    </AdminRoute>
                }
            />
            <Route
                path="/calculator"
                element={
                    <ProtectedRoute>
                        <CGPACalculatorPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/subject/:subjectId/content"
                element={
                    <ProtectedRoute>
                        <SubjectContentPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/quiz/:quizId"
                element={
                    <ProtectedRoute>
                        <QuizPage />
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<HomePage />} />
            {/* Catch-all route for unmatched paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;

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
import CompleteRegistrationPage from './pages/CompleteRegistrationPage';
import GameifiedLoader from './components/GameifiedLoader';

const ProtectedRoute = ({ children, allowIncomplete = false }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <GameifiedLoader
                isLoading={true}
                loadingText="Authenticating"
                variant="auth"
            />
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" />;

    // Redirect to complete registration if needed (unless this route allows incomplete registration)
    if (!allowIncomplete && user && user.registrationComplete === false) {
        return <Navigate to="/complete-registration" />;
    }

    return children;
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
            <Route
                path="/complete-registration"
                element={
                    <ProtectedRoute allowIncomplete={true}>
                        <CompleteRegistrationPage />
                    </ProtectedRoute>
                }
            />
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

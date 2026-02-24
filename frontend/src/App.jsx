import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './utils/hooks';
import GameifiedLoader from './components/GameifiedLoader';
import WatermarkStamp from './components/common/WatermarkStamp';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const CGPACalculatorPage = lazy(() => import('./pages/CGPACalculatorPage'));
const SubjectContentPage = lazy(() => import('./pages/SubjectContentPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const CompleteRegistrationPage = lazy(() => import('./pages/CompleteRegistrationPage'));
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'));
const InterviewExperiencePage = lazy(() => import('./pages/InterviewExperiencePage'));

// Generic loading fallback for Suspense
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-vh-100 bg-slate-900">
        <GameifiedLoader isLoading={true} loadingText="Loading..." variant="general" />
    </div>
);

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
        return <Navigate to="/complete-profile" />;
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
    const location = useLocation();
    const pathname = location?.pathname || '';

    const shouldShowWatermark = pathname === '/calculator' || pathname.startsWith('/result') || pathname.startsWith('/pdf');

    return (
        <div className="relative">
            {shouldShowWatermark && (
                <WatermarkStamp opacity={0.05} size={450} rotation={-15} />
            )}

            <div className="relative z-[1]">
                <Suspense fallback={<LoadingFallback />}>
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
                            path="/complete-profile"
                            element={
                                <ProtectedRoute allowIncomplete={true}>
                                    <CompleteProfilePage />
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
                        <Route path="/calculator" element={<CGPACalculatorPage />} />
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
                </Suspense>
            </div>
        </div>
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

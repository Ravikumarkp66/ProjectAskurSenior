import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './utils/hooks';
import WatermarkStamp from './components/common/WatermarkStamp';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
import { authAPI } from './services/api';
const AdminCreateArticle = lazy(() => import('./pages/AdminCreateArticle'));
const CGPACalculatorPage = lazy(() => import('./pages/CGPACalculatorPage'));
const SubjectContentPage = lazy(() => import('./pages/SubjectContentPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const GuidesPage = lazy(() => import('./pages/GuidesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const CompleteRegistrationPage = lazy(() => import('./pages/CompleteRegistrationPage'));
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'));

const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const PricingSection = lazy(() => import('./components/PricingSection'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AskFinderPage = lazy(() => import('./pages/AskFinderPage'));

// Generic loading fallback for Suspense
// Simple loading fallback for Suspense to reduce initial bundle size and complexity
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">Loading AskUrSenior...</p>
        </div>
    </div>
);

const ProtectedRoute = ({ children, allowIncomplete = false }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
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
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/admin/login" />;
    if (!user?.isAdmin) return <Navigate to="/dashboard" />;
    return children;
};

function AppContent() {
    const location = useLocation();
    const pathname = location?.pathname || '';

    const shouldShowWatermark = pathname === '/calculator' || pathname.startsWith('/result') || pathname.startsWith('/pdf');

    const { user, isAuthenticated } = useAuth();
    
    // Global Heartbeat System
    React.useEffect(() => {
        if (!isAuthenticated) return;
        
        // Initial heartbeat
        authAPI.heartbeat().catch(() => {});
        
        const interval = setInterval(() => {
            authAPI.heartbeat().catch(() => {});
        }, 30000); // Heartbeat every 30 seconds
        
        return () => clearInterval(interval);
    }, [isAuthenticated]);

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
                        <Route path="/admin/login" element={<AdminLoginPage />} />
                        {/* UPGRADE_SECTION_HIDDEN: Uncomment these routes to restore subscription/upgrade features
                        <Route path="/subscription" element={<SubscriptionPage />} />
                        <Route path="/pricing" element={<PricingSection user={user} />} />
                        <Route path="/upgrade" element={<PaymentPage user={user} />} />
                        */}
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
                        <Route
                            path="/admin/articles/create"
                            element={
                                <AdminRoute>
                                    <AdminCreateArticle />
                                </AdminRoute>
                            }
                        />
                        <Route path="/calculator" element={<CGPACalculatorPage />} />

                        <Route path="/subject/:subjectId/content"
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
                        <Route path="/blog" element={<GuidesPage />} />
                        <Route path="/blog/:slug" element={<ArticlePage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/ask-finder" element={<AskFinderPage />} />
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

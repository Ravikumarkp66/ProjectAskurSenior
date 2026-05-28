import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './utils/hooks';
import WatermarkStamp from './components/common/WatermarkStamp';
import { authAPI } from './services/api';
import socket from './services/socket';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import InterviewLayout from './layouts/InterviewLayout';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminCreateArticle = lazy(() => import('./pages/AdminCreateArticle'));
const CGPACalculatorPage = lazy(() => import('./pages/CGPACalculatorPage'));
const SubjectContentPage = lazy(() => import('./pages/SubjectContentPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const GuidesPage = lazy(() => import('./pages/GuidesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const CompleteRegistrationPage = lazy(() => import('./pages/CompleteRegistrationPage'));
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AskFinderPage = lazy(() => import('./pages/AskFinderPage'));

// Academic Dashboard Pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const AcademicSetupPage = lazy(() => import('./pages/AcademicSetup'));

// Interview Experiences Module
const InterviewExperiencesPage = lazy(() => import('./pages/interviews/InterviewPage'));
const CompanyRolePage = lazy(() => import('./pages/interviews/CompanyRolePage'));
const ShareExperience = lazy(() => import('./pages/interviews/ShareExperience'));

// Simple loading fallback for Suspense
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0b]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black tracking-widest uppercase text-xs animate-pulse">Loading AskUrSenior...</p>
        </div>
    </div>
);

const ProtectedRoute = ({ children, allowIncomplete = false }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return <LoadingFallback />;
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    if (!allowIncomplete && user && user.registrationComplete === false) {
        return <Navigate to="/complete-profile" />;
    }

    return children;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return <LoadingFallback />;
    if (!isAuthenticated) return <Navigate to="/admin/login" />;
    if (!user?.isAdmin) return <Navigate to="/dashboard" />;
    return children;
};

function AppContent() {
    const { isAuthenticated, user } = useAuth();
    
    // Global Socket Connection
    React.useEffect(() => {
        socket.connect();
        return () => {
            socket.disconnect();
        };
    }, []);

    // Global Socket User Registration
    React.useEffect(() => {
        if (user && socket) {
            socket.emit("user_online", {
                userId: user.id || user._id,
                name: user.name || user.email,
                email: user.email,
                role: user.isAdmin ? 'admin' : 'user'
            });
            
            if (user.isAdmin) {
                socket.emit('join_admin');
            }
        }
    }, [user]);

    // Legacy heartbeat polling
    React.useEffect(() => {
        if (!isAuthenticated) return;
        authAPI.heartbeat().catch(() => {});
        const interval = setInterval(() => {
            authAPI.heartbeat().catch(() => {});
        }, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, user]);

    return (
        <div className="relative">
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<LoginPage initialMode="register" />} />
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/calculator" element={<CGPACalculatorPage />} />
                    <Route path="/blog" element={<GuidesPage />} />
                    <Route path="/blog/:slug" element={<ArticlePage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/ask-finder" element={<AskFinderPage />} />

                    {/* Registration Flow */}
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

                    {/* Academic Dashboard Layout Group */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<DashboardPage />} />
                    </Route>
                    
                    {/* Specialized Academic Content routes under protection */}
                    <Route path="/academic-setup" element={<ProtectedRoute><AcademicSetupPage /></ProtectedRoute>} />
                    <Route path="/subject/:subjectId/content" element={<ProtectedRoute><SubjectContentPage /></ProtectedRoute>} />
                    <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/reviews" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/study-materials" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/articles/create" element={<AdminRoute><AdminCreateArticle /></AdminRoute>} />

                    {/* Interview Experiences - Fully Public (no login required) */}
                    <Route path="/interview" element={<InterviewLayout />}>
                        <Route index element={<InterviewExperiencesPage />} />
                        <Route path=":id" element={<CompanyRolePage />} />
                        <Route path="add" element={<ShareExperience />} />
                        <Route path="share" element={<ShareExperience />} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
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

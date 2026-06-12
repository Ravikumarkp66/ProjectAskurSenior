import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { useAuth } from './utils/hooks';
import WatermarkStamp from './components/common/WatermarkStamp';
import { authAPI } from './services/api';
import socket from './services/socket';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import InterviewLayout from './layouts/InterviewLayout';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminCreateArticle = lazy(() => import('./pages/AdminCreateArticle'));
const KnowledgeBase = lazy(() => import('./pages/admin/KnowledgeBase'));
const AdminMentorship = lazy(() => import('./pages/admin/AdminMentorship'));
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
// const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));

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
    const location = useLocation();

    // Track page views
    React.useEffect(() => {
        if (isAuthenticated) {
            const token = localStorage.getItem('token');
            if (token) {
                fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/track`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ path: location.pathname })
                }).catch(err => console.error("Event tracking error:", err));
            }
        }
    }, [location.pathname, isAuthenticated]);
    
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
                    {/* <Route path="/roadmap" element={<RoadmapPage />} /> */}

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
                    <Route path="/admin/support" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/reviews" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/study-materials" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/articles" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/payments" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/articles/create" element={<AdminRoute><AdminCreateArticle /></AdminRoute>} />
                    <Route path="/admin/knowledge-base" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/requests" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    {/* <Route path="/admin/roadmap" element={<AdminRoute><AdminPanel /></AdminRoute>} /> */}
                    <Route path="/admin/mentorship" element={<AdminRoute><AdminMentorship /></AdminRoute>} />

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
            <Toaster position="bottom-right" toastOptions={{ duration: 5000 }} />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;

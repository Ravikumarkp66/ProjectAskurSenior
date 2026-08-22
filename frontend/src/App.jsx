import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { useAuth } from './utils/hooks';
import { authAPI, apiClient } from './services/api';
import socket from './services/socket';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import InterviewLayout from './layouts/InterviewLayout';
import SubjectLayout from './layouts/SubjectLayout';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const ProfileSettingsLayout = lazy(() => import('./pages/dashboard/ProfileSettingsLayout'));
const BasicInformationSettings = lazy(() => import('./pages/dashboard/settings/BasicInformationSettings'));
const CgpaSettings = lazy(() => import('./pages/dashboard/settings/CgpaSettings'));
const AttendanceSettings = lazy(() => import('./pages/dashboard/settings/AttendanceSettings'));
const TimetableSettings = lazy(() => import('./pages/dashboard/settings/TimetableSettings'));
const CieSettings = lazy(() => import('./pages/dashboard/settings/CieSettings'));
const SgpaSettings = lazy(() => import('./pages/dashboard/settings/SgpaSettings'));
const AcademicSummaryPage = lazy(() => import('./pages/dashboard/settings/AcademicSummaryPage'));
const AcademicRegisterPage = lazy(() => import('./pages/dashboard/settings/AcademicRegisterPage'));
const EventsSettings = lazy(() => import('./pages/dashboard/settings/EventsSettings'));
const AcademicSettings = lazy(() => import('./pages/dashboard/settings/AcademicSettings'));
const ProgressSettings = lazy(() => import('./pages/dashboard/settings/ProgressSettings'));
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
const PricingPage = lazy(() => import('./pages/PricingPage'));
// const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));

// Academic Dashboard Pages
const DashboardPage        = lazy(() => import('./pages/dashboard/DashboardPage'));
const UserHomePage         = lazy(() => import('./pages/dashboard/UserHomePage'));
const AcademicCalendarPage = lazy(() => import('./pages/dashboard/AcademicCalendarPage'));
const SubjectsPage         = lazy(() => import('./pages/dashboard/SubjectsPage'));
const AcademicSetupPage    = lazy(() => import('./pages/AcademicSetup'));
const SubjectRegistrationPage = lazy(() => import('./pages/SubjectRegistrationPage'));

// Interview Experiences Module
const InterviewExperiencesPage = lazy(() => import('./pages/interviews/InterviewPage'));
const CompanyRolePage = lazy(() => import('./pages/interviews/CompanyRolePage'));
const ShareExperience = lazy(() => import('./pages/interviews/ShareExperience'));

// Campus Hub
const CampusHub = lazy(() => import('./pages/CampusHub'));
const CampusMap = lazy(() => import('./pages/CampusMap'));

import Logo from './components/Logo';

// Brand Preloader fallback for Suspense & route loading
const LoadingFallback = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#030712] select-none fixed inset-0 z-[99999]">
        <div className="flex items-center justify-center">
            <Logo size="xl" showText={true} />
        </div>
    </div>
);

const ProtectedRoute = ({ children, allowIncomplete = false }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) return <LoadingFallback />;
    
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    
    // V2 Student Check
    if (user && (user.studentId !== undefined || user.registrationStatus !== undefined)) {
        if (user.registrationStatus === 'pending') {
            return <Navigate to="/login" />;
        }
    } else {
        // Legacy V1 User Check
        if (!allowIncomplete && user && user.registrationComplete === false) {
            return <Navigate to="/complete-profile" />;
        }
    }

    return children;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return <LoadingFallback />;
    if (!isAuthenticated) return <Navigate to="/admin/login" />;
    if (!user?.isAdmin) return <Navigate to="/plus" />;
    return children;
};

function AppContent() {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    // Track page views
    React.useEffect(() => {
        if (isAuthenticated) {
            apiClient.post('/events/track', { path: location.pathname })
                .catch(err => console.error("Event tracking error:", err));
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
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/lost-and-found" element={<Navigate to="/home/lost-and-found" replace />} />
                    <Route path="/marketplace" element={<Navigate to="/home/marketplace" replace />} />
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

                    {/* Profile & Settings routes */}
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<ProfilePage />} />
                        <Route path="edit" element={<ProfileSettingsLayout />}>
                            <Route index element={<Navigate to="basic" replace />} />
                            <Route path="basic" element={<BasicInformationSettings />} />
                            <Route path="cgpa" element={<CgpaSettings />} />
                            <Route path="attendance" element={<AttendanceSettings />} />
                            <Route path="timetable" element={<TimetableSettings />} />
                            <Route path="cie" element={<CieSettings />} />
                            <Route path="sgpa" element={<SgpaSettings />} />
                            <Route path="events" element={<EventsSettings />} />
                            {/* Mobile-only tabs */}
                            <Route path="academic" element={<AcademicSettings />} />
                            <Route path="progress" element={<ProgressSettings />} />
                        </Route>
                    </Route>
                    <Route path="/settings" element={<Navigate to="/profile/edit" replace />} />
                    <Route path="/subscription" element={<Navigate to="/pricing" replace />} />


                    {/* Academic Dashboard Layout Group */}
                    <Route path="/home" element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<UserHomePage />} />
                        <Route path="materials" element={<UserHomePage />} />
                        <Route path="interview-experiences" element={<UserHomePage />} />
                        <Route path="faculty-ratings" element={<UserHomePage />} />
                        <Route path="faculty-ratings/:facultyId" element={<UserHomePage />} />
                        <Route path="faculty-directory" element={<UserHomePage />} />
                        <Route path="faculty-directory/:facultyId" element={<UserHomePage />} />
                        <Route path="campus-explorer" element={<UserHomePage />} />
                        <Route path="lost-and-found" element={<UserHomePage />} />
                        <Route path="marketplace" element={<UserHomePage />} />
                        <Route path="cgpa-calculator" element={<SgpaSettings />} />
                        <Route path="sgpa-calculator" element={<SgpaSettings />} />
                        <Route path="sgpa" element={<SgpaSettings />} />
                        <Route path="academic-summary" element={<AcademicSummaryPage />} />
                        <Route path="blogs" element={<UserHomePage />} />
                        <Route path="attendance" element={<AttendanceSettings />} />
                        <Route path="timetable" element={<TimetableSettings />} />
                        <Route path="cie" element={<CieSettings />} />
                        <Route path="academic-register" element={<AcademicRegisterPage />} />
                    </Route>

                    {/* Plus Route Group */}
                    <Route path="/plus" element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<DashboardPage />} />
                        <Route path="home" element={<UserHomePage />} />
                        <Route path="materials" element={<AskFinderPage />} />
                        <Route path="subject/:subjectId/content" element={<SubjectContentPage />} />
                        <Route path="academic-calendar" element={<AcademicCalendarPage />} />
                        <Route path="subjects" element={<SubjectsPage />} />
                        <Route path="first-year" element={<SubjectLayout />}>
                            <Route path="subject/:subjectId/content" element={<SubjectContentPage />} />
                        </Route>
                        <Route path="second-year" element={<SubjectLayout />}>
                            <Route path="subject/:subjectId/content" element={<SubjectContentPage />} />
                        </Route>
                        <Route path="third-year" element={<SubjectLayout />}>
                            <Route path="subject/:subjectId/content" element={<SubjectContentPage />} />
                        </Route>
                        <Route path="fourth-year" element={<SubjectLayout />}>
                            <Route path="subject/:subjectId/content" element={<SubjectContentPage />} />
                        </Route>

                        {/* Nested Plus Feature Routes */}
                        <Route path="subject-registration" element={<SubjectRegistrationPage />} />
                        <Route path="cie-analyzer" element={<CieSettings />} />
                        <Route path="cie" element={<CieSettings />} />
                        <Route path="eligibility-checker" element={<AcademicSummaryPage />} />
                        <Route path="academic-summary" element={<AcademicSummaryPage />} />
                        <Route path="year-back-predictor" element={<DashboardPage />} />
                        <Route path="branch-change-predictor" element={<DashboardPage />} />
                        <Route path="attendance" element={<AttendanceSettings />} />
                        <Route path="todays-classes" element={<TimetableSettings />} />
                        <Route path="timetable" element={<TimetableSettings />} />
                        <Route path="cgpa" element={<SgpaSettings />} />
                        <Route path="sgpa" element={<SgpaSettings />} />
                        <Route path="roadmaps" element={<InterviewExperiencesPage />} />
                        <Route path="sessions" element={<DashboardPage />} />
                        <Route path="streaks" element={<DashboardPage />} />
                        <Route path="todo" element={<DashboardPage />} />
                        <Route path="leaderboard" element={<DashboardPage />} />
                        <Route path="whatsapp-community" element={<DashboardPage />} />
                    </Route>
                    
                    {/* Academic Setup & Quizzes */}
                    <Route path="/academic-setup" element={<Navigate to="/plus/subject-registration" replace />} />
                    <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                    <Route path="/campus-hub" element={<ProtectedRoute><CampusHub /></ProtectedRoute>} />
                    <Route path="/campus-map" element={<ProtectedRoute><CampusMap /></ProtectedRoute>} />

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
                    <Route path="/admin/subjects" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/materials" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    <Route path="/admin/health" element={<AdminRoute><AdminPanel /></AdminRoute>} />
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

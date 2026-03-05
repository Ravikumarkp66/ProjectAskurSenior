import React, { useEffect, useMemo, useRef, useState, Suspense, lazy, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useDebounce } from '../utils/hooks';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import SubjectCard from '../components/SubjectCard';
import StatsCards from '../components/StatsCards';
// import ProfileModal from '../components/ProfileModal'; // Will be lazy loaded
import { subjectAPI } from '../services/api';
import { BRANCHES, deriveBranchFromUSN, toBackendBranch, toUiBranch } from '../utils/constants';

const ProfileModal = lazy(() => import('../components/ProfileModal'));

const SubjectsSkeleton = ({ isLightMode }) => (
    <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
            <div
                key={i}
                className={`h-24 sm:h-32 rounded-2xl animate-pulse border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/20 border-white/5'
                    }`}
            />
        ))}
    </div>
);

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem('uiTheme');
            return saved === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const [subjects, setSubjects] = useState([]);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [subjectsLoading, setSubjectsLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showBranchPicker, setShowBranchPicker] = useState(false);
    const [branchOverride, setBranchOverride] = useState(() => {
        try {
            return localStorage.getItem('branchOverride') || '';
        } catch {
            return '';
        }
    });
    const [currentBranch, setCurrentBranch] = useState(
        branchOverride || deriveBranchFromUSN(user?.usn) || toUiBranch(user?.currentBranch) || 'CS'
    );
    const [cycle, setCycle] = useState('P');
    const [subjectSearch, setSubjectSearch] = useState('');
    const debouncedSearch = useDebounce(subjectSearch, 300);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const isLightMode = theme === 'light';

    useEffect(() => {
        const sync = () => {
            try {
                const saved = localStorage.getItem('uiTheme');
                setTheme(saved === 'light' ? 'light' : 'dark');
            } catch {
                setTheme('dark');
            }
        };
        window.addEventListener('uiThemeChange', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('uiThemeChange', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const calculateProgress = (subjectsList) => {
        if (!subjectsList || subjectsList.length === 0) return 0;
        let totalQuestions = 0;
        let completedQuestions = 0;

        subjectsList.forEach(s => {
            if (s.modules) {
                s.modules.forEach(m => {
                    if (m.questions) {
                        totalQuestions += m.questions.length;
                        completedQuestions += m.questions.filter(q => q.completed).length;
                    }
                });
            }
        });

        return totalQuestions === 0 ? 0 : Math.round((completedQuestions / totalQuestions) * 100);
    };

    // Redirect to login if not authenticated (wait for auth to finish loading first)
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);

    // Load subjects
    useEffect(() => {
        const loadData = async () => {
            // Wait for auth to finish loading
            if (authLoading) {
                return;
            }

            // Don't load data if not authenticated
            if (!isAuthenticated || !currentBranch) {
                setSubjectsLoading(false);
                return;
            }

            try {
                setSubjectsLoading(true);
                const subjectsRes = await subjectAPI.getSubjectsByBranch(currentBranch, cycle);
                setSubjects(subjectsRes.data);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setSubjectsLoading(false);
            }
        };

        loadData();
    }, [authLoading, isAuthenticated, currentBranch, cycle]);

    const handleSubjectToggle = useCallback((subjectId) => {
        setExpandedSubjects((prev) => ({
            ...prev,
            [subjectId]: !prev[subjectId]
        }));
    }, []);

    const handleQuestionToggle = useCallback(async (data) => {
        try {
            await subjectAPI.markQuestionCompleted(data);

            setSubjects((prevSubjects) => prevSubjects.map((subject) => {
                if (subject._id === data.subjectId) {
                    const updatedModules = subject.modules.map((module) => {
                        if (module.moduleNumber === data.moduleNumber) {
                            const updatedQuestions = module.questions.map((question) => {
                                if (question._id === data.questionId) {
                                    return { ...question, completed: !question.completed };
                                }
                                return question;
                            });
                            return { ...module, questions: updatedQuestions };
                        }
                        return module;
                    });
                    return { ...subject, modules: updatedModules };
                }
                return subject;
            }));
        } catch (error) {
            console.error('Error updating question:', error);
        }
    }, []);

    const overallProgress = useMemo(() => calculateProgress(subjects), [subjects]);

    const filteredSubjectsList = useMemo(() => subjects
        .filter((subject) => {
            const term = debouncedSearch.trim().toLowerCase();
            if (!term) return true;
            return (
                subject.name.toLowerCase().includes(term) ||
                (subject.code || '').toLowerCase().includes(term)
            );
        })
        .map((subject, index) => {
            const isPremium = user?.subscription === 'askplus' || user?.role === 'premium' || user?.isAdmin;
            const isLocked = index > 0 && !isPremium;
            return (
                <SubjectCard
                    key={subject._id}
                    subject={subject}
                    expanded={expandedSubjects[subject._id] || false}
                    onToggle={handleSubjectToggle}
                    onQuestionToggle={handleQuestionToggle}
                    theme={theme}
                    isLocked={isLocked}
                />
            );
        }), [subjects, debouncedSearch, expandedSubjects, user, theme, handleSubjectToggle, handleQuestionToggle]);

    useEffect(() => {
        const derived = deriveBranchFromUSN(user?.usn) || toUiBranch(user?.currentBranch) || '';
        const next = branchOverride || derived;
        if (next && next !== currentBranch) setCurrentBranch(next);
    }, [branchOverride, currentBranch, user?.currentBranch, user?.usn]);

    const handleBranchOverrideChange = (nextBranch) => {
        const value = (nextBranch || '').toString();
        setBranchOverride(value);
        try {
            if (value) localStorage.setItem('branchOverride', value);
            else localStorage.removeItem('branchOverride');
        } catch {
            // ignore
        }
        if (value) setCurrentBranch(value);
    };







    return (
        <div className={`flex min-h-screen ${isLightMode ? 'bg-white text-slate-900' : 'bg-primary-950 text-secondary-100'}`}>
            {/* Sidebar */}
            <Sidebar
                currentBranch={currentBranch}
                cycle={cycle}
                branchOverride={branchOverride}
                onBranchOverrideChange={handleBranchOverrideChange}
                showProfile={showProfileModal}
                onProfileClick={() => setShowProfileModal(true)}
                subjectSearch={subjectSearch}
                onSubjectSearchChange={setSubjectSearch}
                isCollapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
            />

            {/* Main Content - No margin on mobile, left margin on desktop */}
            <div
                className={`transition-all duration-300 w-full
                    ${sidebarCollapsed
                        ? 'sm:ml-20 sm:w-[calc(100%-5rem)]'
                        : 'sm:ml-64 sm:w-[calc(100%-16rem)]'
                    }`}
            >
                {/* Top Bar */}
                <TopBar progress={overallProgress} branch={currentBranch} sidebarCollapsed={sidebarCollapsed} theme={theme} />

                {/* Content Area - Add top padding on mobile for hamburger button */}
                <div className={`mt-24 p-4 sm:p-6 lg:p-8 ${isLightMode ? 'bg-white' : 'bg-primary-950'}`}>
                    <div className="w-full">
                        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div
                                    className={`flex rounded-lg p-1 border ${isLightMode
                                        ? 'bg-slate-100 border-slate-200'
                                        : 'bg-slate-800/40 border-white/10'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setCycle('P')}
                                        className={`min-h-11 px-4 py-2 text-xs font-semibold rounded-md transition flex-1 sm:flex-none ${cycle === 'P'
                                            ? isLightMode
                                                ? 'bg-white text-slate-900'
                                                : 'bg-white text-slate-900'
                                            : isLightMode
                                                ? 'text-slate-600 hover:text-slate-900'
                                                : 'text-slate-200 hover:text-white'
                                            }`}
                                    >
                                        P Cycle
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCycle('C')}
                                        className={`min-h-11 px-4 py-2 text-xs font-semibold rounded-md transition flex-1 sm:flex-none ${cycle === 'C'
                                            ? isLightMode
                                                ? 'bg-white text-slate-900'
                                                : 'bg-white text-slate-900'
                                            : isLightMode
                                                ? 'text-slate-600 hover:text-slate-900'
                                                : 'text-slate-200 hover:text-white'
                                            }`}
                                    >
                                        C Cycle
                                    </button>
                                </div>
                                {subjectsLoading && (
                                    <div className="ml-2 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>

                            <div className="relative w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setShowBranchPicker((v) => !v)}
                                    className={`w-full min-h-11 px-4 rounded-full border text-xs font-semibold flex items-center justify-between gap-2 transition ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        : 'border-white/10 bg-slate-900/30 text-secondary-200 hover:bg-slate-900/50'
                                        }`}
                                >
                                    <span className="truncate">
                                        {branchOverride
                                            ? `${branchOverride}`
                                            : `${deriveBranchFromUSN(user?.usn) || currentBranch || ''}`}
                                    </span>
                                    <svg
                                        className={`w-4 h-4 transition-transform flex-shrink-0 ${showBranchPicker ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>

                                {showBranchPicker && (
                                    <div
                                        className={`absolute right-0 left-0 sm:left-auto z-20 mt-2 sm:w-72 rounded-xl border shadow-xl overflow-hidden ${isLightMode
                                            ? 'border-slate-200 bg-white'
                                            : 'border-white/10 bg-dark-100'
                                            }`}
                                    >
                                        <div className="max-h-64 overflow-y-auto">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleBranchOverrideChange('');
                                                    setShowBranchPicker(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm transition ${!branchOverride
                                                    ? 'font-semibold text-purple-700'
                                                    : isLightMode
                                                        ? 'text-slate-800'
                                                        : 'text-secondary-200'
                                                    } ${isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/10'}`}
                                            >
                                                Auto (from USN)
                                            </button>
                                            {BRANCHES.map((b) => (
                                                <button
                                                    key={b.code}
                                                    type="button"
                                                    onClick={() => {
                                                        handleBranchOverrideChange(b.code);
                                                        setShowBranchPicker(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm transition ${branchOverride === b.code
                                                        ? 'font-semibold text-purple-700'
                                                        : isLightMode
                                                            ? 'text-slate-800'
                                                            : 'text-secondary-200'
                                                        } ${isLightMode ? 'hover:bg-slate-50' : 'hover:bg-white/10'}`}
                                                >
                                                    {b.code} - {b.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Subjects List (stacked) */}
                        {subjectsLoading ? (
                            <SubjectsSkeleton isLightMode={isLightMode} />
                        ) : subjects.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-primary-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C6.5 6.253 2 10.58 2 15.97m0 0h20m-20 0C2 21.419 6.5 25.747 12 25.747m0 0c5.5 0 10-4.328 10-9.777m0 0V6.253m0 13C22 21.419 17.5 25.747 12 25.747m0-25.494C6.5 1.759 2 6.087 2 11.476m20 0C22 6.087 17.5 1.759 12 1.759m0 0C6.5 1.759 2 6.087 2 11.476" />
                                </svg>
                                <p className="text-secondary-400 font-semibold">No subjects found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredSubjectsList}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {/* Profile Modal - Lazy Loaded */}
            <Suspense fallback={null}>
                {showProfileModal && (
                    <ProfileModal
                        show={showProfileModal}
                        onClose={() => setShowProfileModal(false)}
                        user={user}
                        updateUser={updateUser}
                        subjects={subjects}
                        overallProgress={overallProgress}
                        theme={theme}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default DashboardPage;

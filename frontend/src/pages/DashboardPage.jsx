import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import SubjectCard from '../components/SubjectCard';
import StatsCards from '../components/StatsCards';
import { subjectAPI } from '../services/api';
import { BRANCHES, deriveBranchFromUSN, toBackendBranch, toUiBranch } from '../utils/constants';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
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
    const [pageLoading, setPageLoading] = useState(true);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const subjectsCacheRef = useRef({});

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

    const overallProgress = useMemo(() => {
        const totalQuestions = subjects.reduce(
            (sum, s) => sum + s.modules.reduce((mSum, m) => mSum + m.questions.length, 0),
            0
        );
        const completedQuestions = subjects.reduce(
            (sum, s) =>
                sum +
                s.modules.reduce((mSum, m) => mSum + m.questions.filter((q) => q.completed).length, 0),
            0
        );
        return totalQuestions === 0 ? 0 : Math.round((completedQuestions / totalQuestions) * 100);
    }, [subjects]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Load subjects
    useEffect(() => {
        const loadData = async () => {
            // Don't load data if not authenticated
            if (!isAuthenticated || !currentBranch) {
                setPageLoading(false);
                return;
            }

            try {
                const cacheKey = `${currentBranch}_${cycle}`;
                const cached = subjectsCacheRef.current[cacheKey];
                if (cached) {
                    setSubjects(cached);
                    setSubjectsLoading(false);
                    setPageLoading(false);
                    return;
                }

                setSubjectsLoading(true);
                const subjectsRes = await subjectAPI.getSubjectsByBranch(currentBranch, cycle);
                subjectsCacheRef.current[cacheKey] = subjectsRes.data;
                setSubjects(subjectsRes.data);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setSubjectsLoading(false);
                setPageLoading(false);
            }
        };

        loadData();
    }, [isAuthenticated, currentBranch, cycle]);

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

    const handleSubjectToggle = (subjectId) => {
        setExpandedSubjects((prev) => ({
            ...prev,
            [subjectId]: !prev[subjectId]
        }));
    };

    const handleQuestionToggle = async (data) => {
        try {
            await subjectAPI.markQuestionCompleted(data);

            // Update local state
            const updatedSubjects = subjects.map((subject) => {
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
            });

            setSubjects(updatedSubjects);
        } catch (error) {
            console.error('Error updating question:', error);
        }
    };

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-primary-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-700 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-secondary-400 font-semibold">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex min-h-screen ${isLightMode ? 'bg-white text-slate-900' : 'bg-primary-950 text-secondary-100'}`}>
            {/* Sidebar */}
            <Sidebar
                currentBranch={currentBranch}
                branchOverride={branchOverride}
                onBranchOverrideChange={handleBranchOverrideChange}
                showProfile={showProfileModal}
                onProfileClick={() => setShowProfileModal(true)}
                subjectSearch={subjectSearch}
                onSubjectSearchChange={setSubjectSearch}
                isCollapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
            />

            {/* Main Content */}
            <div
                className={`transition-all duration-300 ml-0 w-full ${sidebarCollapsed
                        ? 'sm:ml-20 sm:w-[calc(100%-5rem)]'
                        : 'sm:ml-64 sm:w-[calc(100%-16rem)]'
                    }`}
            >
                {/* Top Bar */}
                <TopBar progress={overallProgress} branch={currentBranch} sidebarCollapsed={sidebarCollapsed} theme={theme} />

                {/* Content Area */}
                <div className={`mt-24 p-4 sm:p-6 lg:p-8 ${isLightMode ? 'bg-white' : 'bg-primary-950'}`}>
                    <div className="w-full">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`flex rounded-lg p-1 border ${isLightMode
                                            ? 'bg-slate-100 border-slate-200'
                                            : 'bg-slate-800/40 border-white/10'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setCycle('P')}
                                        className={`min-h-11 px-3 py-2 text-xs font-semibold rounded-md transition ${cycle === 'P'
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
                                        className={`min-h-11 px-3 py-2 text-xs font-semibold rounded-md transition ${cycle === 'C'
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

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowBranchPicker((v) => !v)}
                                    className={`min-h-11 px-3 rounded-full border text-xs font-semibold flex items-center gap-2 transition ${isLightMode
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
                                        className={`w-4 h-4 transition-transform ${showBranchPicker ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                                    </svg>
                                </button>

                                {showBranchPicker && (
                                    <div
                                        className={`absolute right-0 z-20 mt-2 w-72 rounded-xl border shadow-xl overflow-hidden ${isLightMode
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
                        {subjects.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-primary-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C6.5 6.253 2 10.58 2 15.97m0 0h20m-20 0C2 21.419 6.5 25.747 12 25.747m0 0c5.5 0 10-4.328 10-9.777m0 0V6.253m0 13C22 21.419 17.5 25.747 12 25.747m0-25.494C6.5 1.759 2 6.087 2 11.476m20 0C22 6.087 17.5 1.759 12 1.759m0 0C6.5 1.759 2 6.087 2 11.476" />
                                </svg>
                                <p className="text-secondary-400 font-semibold">No subjects found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {subjects
                                    .filter((subject) => {
                                        const term = subjectSearch.trim().toLowerCase();
                                        if (!term) return true;
                                        return (
                                            subject.name.toLowerCase().includes(term) ||
                                            (subject.code || '').toLowerCase().includes(term)
                                        );
                                    })
                                    .map((subject) => (
                                        <SubjectCard
                                            key={subject._id}
                                            subject={subject}
                                            expanded={expandedSubjects[subject._id] || false}
                                            onToggle={handleSubjectToggle}
                                            onQuestionToggle={handleQuestionToggle}
                                            theme={theme}
                                        />
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`${isLightMode ? 'bg-white' : 'bg-dark-100'} rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
                        <div className={`p-6 md:p-8 border-b ${isLightMode ? 'border-gray-100' : 'border-white/10'}`}>
                            <div className="flex items-center justify-between">
                                <h2 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-secondary-100'}`}>Profile & Progress</h2>
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className={isLightMode ? 'text-gray-500 hover:text-gray-700' : 'text-secondary-400 hover:text-secondary-200'}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 overflow-y-auto">
                            <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
                                {/* Left: basic profile info */}
                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-600 mb-1">USN</p>
                                        <p className="font-bold text-gray-900">{user?.usn}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-600 mb-1">Email</p>
                                        <p className="font-bold text-gray-900">{user?.email}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-600 mb-1">Current Branch</p>
                                        <p className="font-bold text-gray-900">{currentBranch}</p>
                                    </div>
                                </div>

                                {/* Right: stats + heatmap previously on dashboard */}
                                <div className="space-y-4">
                                    <StatsCards subjects={subjects} progress={overallProgress} />
                                </div>
                            </div>

                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="w-full mt-6 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;

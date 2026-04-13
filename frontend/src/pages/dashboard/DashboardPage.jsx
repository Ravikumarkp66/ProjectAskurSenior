import React, { useEffect, useMemo, useState, Suspense, lazy, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth, useDebounce } from '../../utils/hooks';
import SubjectCard from '../../components/SubjectCard';
import { subjectAPI } from '../../services/api';
import { BRANCHES, deriveBranchFromUSN, toUiBranch } from '../../utils/constants';

const ProfileModal = lazy(() => import('../../components/ProfileModal'));

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
    const { setDashboardState, theme, isLightMode } = useOutletContext();
    const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
    
    const [subjects, setSubjects] = useState([]);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [subjectsLoading, setSubjectsLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showBranchPicker, setShowBranchPicker] = useState(false);
    
    // Internal dashboard logic
    const [currentBranch, setCurrentBranch] = useState(
        deriveBranchFromUSN(user?.usn) || toUiBranch(user?.currentBranch) || 'CS'
    );
    const [cycle, setCycle] = useState('P');
    const [subjectSearch] = useState(''); // This could be linked to layout search if needed

    useEffect(() => {
        // Sync vital stats to Layout
        setDashboardState(prev => ({
            ...prev,
            currentBranch,
            cycle,
            progress: calculateProgress(subjects)
        }));
    }, [currentBranch, cycle, subjects, setDashboardState]);

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

    // Load subjects
    useEffect(() => {
        const loadData = async () => {
            if (authLoading || !isAuthenticated) return;
            try {
                setSubjectsLoading(true);
                const subjectsRes = await subjectAPI.getSubjectsByBranch(currentBranch, cycle);
                setSubjects(subjectsRes.data);
            } catch (error) {
                console.error('Error loading subjects:', error);
            } finally {
                setSubjectsLoading(false);
            }
        };
        loadData();
    }, [authLoading, isAuthenticated, currentBranch, cycle]);

    const handleQuestionToggle = useCallback(async (data) => {
        // Optimistic update
        setSubjects((prev) => prev.map((s) => {
            if (s._id !== data.subjectId) return s;
            return {
                ...s,
                modules: s.modules.map(m => {
                    if (m.moduleNumber !== data.moduleNumber) return m;
                    return {
                        ...m,
                        questions: m.questions.map(q => q._id === data.questionId ? { ...q, completed: !q.completed } : q)
                    };
                })
            };
        }));
        try {
            await subjectAPI.markQuestionCompleted(data);
        } catch (err) {
            console.error('Error updating question:', err);
        }
    }, []);

    const filteredSubjectsList = useMemo(() => subjects.map((subject) => (
        <SubjectCard
            key={subject._id}
            subject={subject}
            expanded={expandedSubjects[subject._id] || false}
            onToggle={(id) => setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }))}
            onQuestionToggle={handleQuestionToggle}
            theme={theme}
            isLocked={false}
        />
    )), [subjects, expandedSubjects, theme, handleQuestionToggle]);

    return (
        <div className="w-full">
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div
                    className={`flex rounded-xl p-1 border ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}
                >
                    <button
                        onClick={() => setCycle('P')}
                        className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${cycle === 'P' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        P Cycle
                    </button>
                    <button
                        onClick={() => setCycle('C')}
                        className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${cycle === 'C' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        C Cycle
                    </button>
                </div>

                <div className="relative group">
                    <button
                        onClick={() => setShowBranchPicker(!showBranchPicker)}
                        className={`px-6 py-3 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${isLightMode ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                        {currentBranch} Branch
                        <svg className={`w-4 h-4 transition-transform ${showBranchPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                        </svg>
                    </button>

                    {showBranchPicker && (
                        <div className={`absolute right-0 z-50 mt-2 w-56 rounded-2xl border shadow-2xl overflow-hidden ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#141416] border-white/10'}`}>
                            <div className="max-h-64 overflow-y-auto p-2 space-y-1 font-black uppercase tracking-widest text-[10px]">
                                {BRANCHES.map((b) => (
                                    <button
                                        key={b.code}
                                        onClick={() => { setCurrentBranch(b.code); setShowBranchPicker(false); }}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${currentBranch === b.code ? 'bg-purple-600/10 text-purple-400' : 'text-slate-500 hover:bg-white/5'}`}
                                    >
                                        {b.code} - {b.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {subjectsLoading ? (
                <SubjectsSkeleton isLightMode={isLightMode} />
            ) : subjects.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">No subjects found for this branch</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSubjectsList}
                </div>
            )}

            <Suspense fallback={null}>
                {showProfileModal && (
                    <ProfileModal
                        show={showProfileModal}
                        onClose={() => setShowProfileModal(false)}
                        user={user}
                        updateUser={updateUser}
                        subjects={subjects}
                        overallProgress={calculateProgress(subjects)}
                        theme={theme}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default DashboardPage;

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../utils/hooks';
import SubjectCard from '../../components/SubjectCard';
import { subjectAPI } from '../../services/api';
import { BRANCHES, deriveBranchFromUSN, toUiBranch } from '../../utils/constants';

/* ─── Skeleton ─────────────────────────────────────────────────── */
const SubjectsSkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-2xl animate-pulse"
                style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.08)' }} />
        ))}
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   SUBJECTS PAGE
   Base theme support.
═══════════════════════════════════════════════════════════════════ */
const SubjectsPage = () => {
    const navigate  = useNavigate();
    const { theme } = useOutletContext() || {};
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [subjects,         setSubjects]         = useState([]);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [subjectsLoading,  setSubjectsLoading]  = useState(true);
    const [currentBranch,    setCurrentBranch]    = useState(
        () => deriveBranchFromUSN(user?.usn) || toUiBranch(user?.currentBranch) || 'CS'
    );
    const [cycle, setCycle] = useState('P');

    /* ── load subjects ── */
    const loadSubjects = useCallback(async () => {
        if (authLoading || !isAuthenticated) return;
        try {
            setSubjectsLoading(true);
            const res = await subjectAPI.getSubjectsByBranch(currentBranch, cycle);
            setSubjects(res.data || []);
        } catch (err) {
            console.error('Error loading subjects:', err);
            setSubjects([]);
        } finally {
            setSubjectsLoading(false);
        }
    }, [authLoading, isAuthenticated, currentBranch, cycle]);

    useEffect(() => { loadSubjects(); }, [loadSubjects]);

    const handleQuestionToggle = useCallback(async (data) => {
        setSubjects(prev => prev.map(s => {
            if (s._id !== data.subjectId) return s;
            return {
                ...s,
                modules: s.modules.map(m => {
                    if (m.moduleNumber !== data.moduleNumber) return m;
                    return {
                        ...m,
                        questions: m.questions.map(q =>
                            q._id === data.questionId ? { ...q, completed: !q.completed } : q
                        ),
                    };
                }),
            };
        }));
        try { await subjectAPI.markQuestionCompleted(data); }
        catch (err) { console.error('Error updating question:', err); }
    }, []);

    /* ── filter branches ── */
    const branchOptions = BRANCHES?.map(b => ({
        value: b.code || b.value || b,
        label: b.name || b.label || b
    })) || [];

    return (
        <div className="w-full space-y-6">

            {/* ── Page header ── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)' }}>
                        <svg className="w-4 h-4" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-white"
                        style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
                        Subjects
                    </h1>
                </div>
                <p className="text-sm ml-11" style={{ color: 'rgba(148,163,184,0.5)' }}>
                    Browse and track your subject question progress.
                </p>
            </motion.div>

            {/* ── Branch + Cycle filter bar ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07, duration: 0.25 }}
                className="flex flex-wrap items-center gap-3"
            >
                {/* Branch selector */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(139,92,246,0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <select
                        value={currentBranch}
                        onChange={e => setCurrentBranch(e.target.value)}
                        className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
                        style={{ color: '#e2e8f0' }}
                    >
                        {branchOptions.length > 0
                            ? branchOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)
                            : ['CS','IS','EC','EE','ME','CV'].map(b => <option key={b} value={b}>{b}</option>)
                        }
                    </select>
                </div>

                {/* Cycle pill toggle */}
                <div className="flex rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(139,92,246,0.15)' }}>
                    {['P', 'C'].map(c => (
                        <button
                            key={c}
                            onClick={() => setCycle(c)}
                            className="px-4 py-2 text-xs font-bold transition-all duration-150"
                            style={{
                                background: cycle === c ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.04)',
                                color: cycle === c ? '#c4b5fd' : 'rgba(100,116,139,0.7)',
                                borderRight: c === 'P' ? '1px solid rgba(139,92,246,0.15)' : 'none',
                            }}
                        >
                            {c === 'P' ? 'Physics Cycle' : 'Chemistry Cycle'}
                        </button>
                    ))}
                </div>

                {/* Subject count badge */}
                {!subjectsLoading && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(139,92,246,0.1)', color: 'rgba(139,92,246,0.7)', border: '1px solid rgba(139,92,246,0.18)' }}>
                        {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                    </span>
                )}
            </motion.div>

            {/* ── Subject list ── */}
            <AnimatePresence mode="wait">
                {subjectsLoading ? (
                    <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <SubjectsSkeleton />
                    </motion.div>
                ) : subjects.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl"
                            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                            📚
                        </div>
                        <p className="text-sm font-medium text-white mb-1">No subjects found</p>
                        <p className="text-xs" style={{ color: 'rgba(148,163,184,0.45)' }}>
                            Try selecting a different branch or cycle.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        {subjects.map((subject, i) => (
                            <motion.div
                                key={subject._id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <SubjectCard
                                    subject={subject}
                                    expanded={!!expandedSubjects[subject._id]}
                                    onToggle={() => setExpandedSubjects(prev => ({
                                        ...prev,
                                        [subject._id]: !prev[subject._id],
                                    }))}
                                    onQuestionToggle={handleQuestionToggle}
                                    theme={theme}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubjectsPage;

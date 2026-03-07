import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleAccordion from './ModuleAccordion';
import CIECalculatorModal from './CIECalculatorPanel';
import './ComingSoonButton.css';
import ProgressBar from './ProgressBar';
import { calculateSubjectProgress } from '../utils/constants';
import { getCIEResult } from '../utils/cieEngine';

const SubjectCard = ({ subject: initialSubject, expanded, onToggle, onQuestionToggle, theme = 'light', isLocked }) => {
    const navigate = useNavigate();
    const [subject, setSubject] = useState(initialSubject);
    const [view, setView] = useState('all');
    const [showCIECalculator, setShowCIECalculator] = useState(false);
    const [cieResult, setCieResult] = useState(() => getCIEResult(subject?.code || subject?.name));
    const isLightMode = theme === 'light';
    // Every subject is now considered available - removing Coming Soon logic
    const _code = (subject?.code ?? '').toString().toUpperCase().trim();
    const [revisionIds, setRevisionIds] = useState(() => {
        try {
            const raw = localStorage.getItem('revisionQuestionIds');
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });
    const progress = calculateSubjectProgress(subject.modules);
    const totalQuestions = subject.modules.reduce((sum, m) => sum + m.questions.length, 0);
    const completedQuestions = subject.modules.reduce(
        (sum, m) => sum + m.questions.filter((q) => q.completed).length,
        0
    );

    // Update subject and CIE result when prop changes
    useEffect(() => {
        setSubject(initialSubject);
        setCieResult(getCIEResult(initialSubject?.code || initialSubject?.name));
    }, [initialSubject]);

    // Listen for global CIE updates
    useEffect(() => {
        const handleUpdate = (e) => {
            const { subjectCode, cleared } = e.detail;
            if (subjectCode === (subject?.code || subject?.name)) {
                if (cleared) {
                    setCieResult(null);
                } else {
                    setCieResult(getCIEResult(subjectCode));
                }
            }
        };

        window.addEventListener('cieResultsUpdated', handleUpdate);
        return () => window.removeEventListener('cieResultsUpdated', handleUpdate);
    }, [subject?.code, subject?.name]);

    // Handle notes upload - update module's notesKey locally
    const handleNotesUploaded = (moduleNumber, s3Key) => {
        setSubject(prev => ({
            ...prev,
            modules: prev.modules.map(m =>
                m.moduleNumber === moduleNumber
                    ? { ...m, notesKey: s3Key }
                    : m
            )
        }));
    };

    useEffect(() => {
        try {
            localStorage.setItem('revisionQuestionIds', JSON.stringify(revisionIds));
        } catch {
            // ignore
        }
    }, [revisionIds]);

    const revisionCountForSubject = useMemo(() => {
        const set = new Set(revisionIds);
        return subject.modules.reduce((sum, m) => sum + m.questions.filter((q) => set.has(q._id)).length, 0);
    }, [revisionIds, subject.modules]);

    const modulesToShow = useMemo(() => {
        if (view !== 'revision') return subject.modules;
        const set = new Set(revisionIds);
        return subject.modules.filter((m) => m.questions.some((q) => set.has(q._id)));
    }, [revisionIds, subject.modules, view]);

    const toggleRevision = (questionId) => {
        setRevisionIds((prev) => {
            if (prev.includes(questionId)) return prev.filter((id) => id !== questionId);
            return [...prev, questionId];
        });
    };

    const handleViewContent = (e) => {
        e.stopPropagation();
        navigate(`/subject/${subject._id}/content`);
    };

    const handleTakeQuiz = (e) => {
        e.stopPropagation();
        // Map subject codes to quiz IDs
        const quizMap = {
            'CC03_CC04': 'balake-kannada',
            // Add more subject code to quiz mappings here
        };
        const quizId = quizMap[_code];
        if (quizId) {
            navigate(`/quiz/${quizId}`);
        }
    };

    // Check if quiz is available for this subject
    const hasQuiz = ['CC03_CC04'].includes(_code);

    return (
        <div className="mb-4">
            <div
                className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'
                    } rounded-lg border overflow-hidden shadow-sm transition h-full hover:shadow-md hover:scale-[1.01] ${isLocked ? 'border-purple-500/30' : ''
                    }`}
            >
                <button
                    onClick={() => onToggle(subject._id)}
                    className={`w-full px-4 sm:px-6 py-4 min-h-11 transition flex flex-col sm:flex-row sm:items-center items-start sm:justify-between gap-3 sm:gap-6 ${isLightMode ? 'bg-white hover:bg-slate-50' : 'bg-dark-100 hover:bg-dark-50'
                        }`}
                >
                    <div className="flex-1 text-left">
                        <h3 className={`text-lg font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>{subject.name}</h3>
                        <p className={`text-sm mt-1 flex items-center gap-2 ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                            {subject.code}
                        </p>
                        {/* UPGRADE_SECTION_HIDDEN: Uncomment to restore lock text on gated subjects
                        {isLocked && (
                            <p className={`text-[11px] font-medium mt-1.5 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`}>
                                Limited Access – Upgrade to unlock all modules
                            </p>
                        )}
                        */}
                    </div>

                    <div className="sm:mr-4 flex items-center gap-2">
                        {/* CIE Badge or Credits badge */}
                        {cieResult ? (
                            <>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-black ${cieResult.isEligible
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    }`}>
                                    CIE {cieResult.cie}/{cieResult.cieMax ?? 50}
                                </span>
                                <span className="text-[10px] text-white/30 font-medium">{subject.credits}cr</span>
                            </>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                                {subject.credits} credits
                            </span>
                        )}
                    </div>

                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 sm:gap-8">
                        <div className={`flex flex-col gap-2 w-full sm:w-auto sm:min-w-[160px]`}>
                            <ProgressBar progress={progress} height={12} theme={theme} />
                            <p className="text-xs text-slate-500 text-right">
                                {completedQuestions}/{totalQuestions}
                            </p>
                        </div>

                        {/* UPGRADE_SECTION_HIDDEN: Uncomment to restore lock icon for gated subjects
                        {isLocked ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 border border-purple-500/30 text-purple-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        ) : (
                        */}
                        <svg
                            className={`w-6 h-6 text-primary-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                        </svg>
                        {/* )} */}
                    </div>
                </button>

                {expanded && (
                    <div
                        className={`p-6 border-t ${isLightMode ? 'border-slate-200 bg-white' : 'border-primary-700 bg-dark-200'
                            }`}
                    >
                        {/* Action Buttons */}
                        <div className="mb-6 space-y-3">
                            {/* CIE Calculator Button → opens Modal */}
                            {/* UPGRADE_SECTION_HIDDEN: Original locked version — restore when subscription returns
                            isLocked navigates to /subscription, shows lock icon and "Upgrade Required" badge
                            */}
                            <button
                                type="button"
                                onClick={e => {
                                    e.stopPropagation();
                                    setShowCIECalculator(!showCIECalculator);
                                }}
                                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition group ${
                                    isLightMode
                                        ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:border-violet-400 hover:shadow-md'
                                        : 'bg-gradient-to-r from-violet-600/10 to-purple-600/10 border-violet-500/30 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${isLightMode ? 'bg-violet-100' : 'bg-violet-600/20'}`}>
                                        <svg className={`w-5 h-5 ${isLightMode ? 'text-violet-600' : 'text-violet-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="text-left relative">
                                        <h4 className={`font-semibold text-sm flex items-center gap-2 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                            Analyze CIE
                                        </h4>
                                        <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                            {showCIECalculator
                                                ? 'Close Analyzer'
                                                : cieResult
                                                    ? `Score: ${cieResult.cie}/${cieResult.cieMax ?? 50} · ${cieResult.isEligible ? 'Eligible ✓' : 'Not Eligible ✗'}`
                                                    : 'Tap to analyze eligibility & calculate CIE'}
                                        </p>
                                    </div>
                                </div>
                                <svg className={`w-4 h-4 transition-transform ${showCIECalculator ? 'rotate-90' : ''} ${isLightMode ? 'text-violet-500' : 'text-violet-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* CIE Calculator Modal (Rendered inside SubjectCard but will be fixed via CSS) */}
                            {showCIECalculator && (
                                <CIECalculatorModal
                                    subject={subject}
                                    onCIESaved={(calc) => setCieResult(calc)}
                                    onClose={() => setShowCIECalculator(false)}
                                />
                            )}
                            {/* Study Materials Button */}
                            <button
                                onClick={handleViewContent}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition group ${isLightMode
                                    ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-400 hover:shadow-md'
                                    : 'bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-purple-500/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${isLightMode ? 'bg-purple-100' : 'bg-purple-600/20'
                                        }`}>
                                        <svg className={`w-6 h-6 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <h4 className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                            Study Materials
                                        </h4>
                                        <p className={`text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                            Notes, PYQs, Question Banks & Syllabus
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${isLightMode ? 'bg-white/80' : 'bg-white/5'
                                        }`}>
                                        <span className={`text-xs font-medium ${isLightMode ? 'text-green-600' : 'text-green-400'}`}>Notes</span>
                                        <span className={`text-xs ${isLightMode ? 'text-slate-300' : 'text-secondary-600'}`}>•</span>
                                        <span className={`text-xs font-medium ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`}>PYQs</span>
                                        <span className={`text-xs ${isLightMode ? 'text-slate-300' : 'text-secondary-600'}`}>•</span>
                                        <span className={`text-xs font-medium ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>Q-Banks</span>
                                        <span className={`text-xs ${isLightMode ? 'text-slate-300' : 'text-secondary-600'}`}>•</span>
                                        <span className={`text-xs font-medium ${isLightMode ? 'text-orange-600' : 'text-orange-400'}`}>Syllabus</span>
                                    </div>
                                    <svg className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Take Quiz Button */}
                            {hasQuiz && (
                                <button
                                    onClick={handleTakeQuiz}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition group ${isLightMode
                                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400 hover:shadow-md'
                                        : 'bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border-emerald-500/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${isLightMode ? 'bg-emerald-100' : 'bg-emerald-600/20'
                                            }`}>
                                            <svg className={`w-6 h-6 ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <h4 className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                                Take Quiz
                                            </h4>
                                            <p className={`text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                                Test your knowledge with MCQs
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${isLightMode ? 'bg-white/80' : 'bg-white/5'
                                            }`}>
                                            <span className={`text-xs font-medium ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}>100 Questions</span>
                                        </div>
                                        <svg className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            )}
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <h4 className={`text-sm font-semibold ${isLightMode ? 'text-gray-700' : 'text-secondary-300'}`}>Modules</h4>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`flex rounded-lg p-1 border ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/40 border-white/10'
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setView('all')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${view === 'all'
                                                ? isLightMode
                                                    ? 'bg-white text-gray-700'
                                                    : 'bg-white text-slate-900'
                                                : isLightMode
                                                    ? 'text-gray-700 hover:text-gray-900'
                                                    : 'text-slate-200 hover:text-white'
                                                }`}
                                        >
                                            All Qns
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setView('revision')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${view === 'revision'
                                                ? isLightMode
                                                    ? 'bg-white text-gray-700'
                                                    : 'bg-white text-slate-900'
                                                : isLightMode
                                                    ? 'text-gray-700 hover:text-gray-900'
                                                    : 'text-slate-200 hover:text-white'
                                                }`}
                                        >
                                            Revision
                                        </button>
                                    </div>
                                    <span className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                        {revisionCountForSubject} marked
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {modulesToShow.length === 0 ? (
                                    <div
                                        className={`rounded-lg border px-4 py-3 ${isLightMode
                                            ? 'border-slate-200 bg-slate-50'
                                            : 'border-white/10 bg-slate-900/30'
                                            }`}
                                    >
                                        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}>
                                            No revision questions marked in this subject yet.
                                        </p>
                                    </div>
                                ) : (
                                    modulesToShow.map((module, index) => (
                                        <ModuleAccordion
                                            key={module._id}
                                            module={module}
                                            subject={subject}
                                            onQuestionToggle={onQuestionToggle}
                                            view={view}
                                            revisionIds={revisionIds}
                                            onToggleRevision={toggleRevision}
                                            theme={theme}
                                            onNotesUploaded={handleNotesUploaded}
                                            isLockedModule={isLocked && index >= 2}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(SubjectCard);

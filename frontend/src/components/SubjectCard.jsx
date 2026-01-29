import React, { useEffect, useMemo, useState } from 'react';
import ModuleAccordion from './ModuleAccordion';
import './ComingSoonButton.css';
import ProgressBar from './ProgressBar';
import { calculateSubjectProgress } from '../utils/constants';

const SubjectCard = ({ subject, expanded, onToggle, onQuestionToggle, theme = 'light' }) => {
    const [view, setView] = useState('all');
    const isLightMode = theme === 'light';
    // Show "Coming Soon" for all subjects except the explicitly allowed list
    const _code = (subject?.code ?? '').toString().toUpperCase().trim();
    const alwaysAvailable = new Set([
        'APC', 'APS', 'ACE', 'ACM', 'ETC13', 'PLC5', 'ESCO6', 'ESCO7', 'ESCO9',
        'PSC1', 'PSC5', 'PSC6', 'CC03', 'CC04', 'CC08'
    ]);
    const isComingSoon = !_code || !alwaysAvailable.has(_code);
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

    return (
        <div
            className={`${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'
                } rounded-lg border overflow-hidden mb-4 shadow-sm hover:shadow-md transition`}
        >
            <button
                onClick={() => onToggle(subject._id)}
                className={`w-full px-4 sm:px-6 py-4 min-h-11 transition flex flex-col sm:flex-row sm:items-center items-start sm:justify-between gap-3 sm:gap-6 ${isLightMode ? 'bg-white hover:bg-slate-50' : 'bg-dark-100 hover:bg-dark-50'
                    }`}
            >
                <div className="flex-1 text-left">
                    <h3 className={`text-lg font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>{subject.name}</h3>
                    <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>{subject.code}</p>
                </div>

                <div className="sm:mr-4">
                    {isComingSoon ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wide text-amber-950 border border-amber-200/60 bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.22)]">
                            <span className="mr-1.5 h-2 w-2 rounded-full coming-soon-dot" />
                            Coming Soon
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {subject.credits} credits
                        </span>
                    )}
                </div>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 sm:gap-8">
                    <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[160px]">
                        <ProgressBar progress={progress} height={12} theme={theme} />
                        <p className="text-xs text-slate-500 text-right">
                            {completedQuestions}/{totalQuestions}
                        </p>
                    </div>

                    <svg
                        className={`w-6 h-6 text-primary-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                    </svg>
                </div>
            </button>

            {expanded && (
                <div
                    className={`p-6 border-t ${isLightMode ? 'border-slate-200 bg-white' : 'border-primary-700 bg-dark-200'
                        }`}
                >
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
                                modulesToShow.map((module) => (
                                    <ModuleAccordion
                                        key={module._id}
                                        module={module}
                                        subject={subject}
                                        onQuestionToggle={onQuestionToggle}
                                        view={view}
                                        revisionIds={revisionIds}
                                        onToggleRevision={toggleRevision}
                                        theme={theme}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectCard;

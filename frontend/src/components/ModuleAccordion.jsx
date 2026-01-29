import React, { useMemo, useState } from 'react';
import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import { calculateModuleProgress } from '../utils/constants';

const ModuleAccordion = ({
    module,
    subject,
    onQuestionToggle,
    view = 'all',
    revisionIds = [],
    onToggleRevision,
    theme = 'light'
}) => {
    const [expanded, setExpanded] = useState(false);
    const isLightMode = theme === 'light';
    const progress = calculateModuleProgress(module.questions);
    const completed = module.questions.filter((q) => q.completed).length;
    const total = module.questions.length;

    const questionsToShow = useMemo(() => {
        if (view !== 'revision') return module.questions;
        const set = new Set(revisionIds);
        return module.questions.filter((q) => set.has(q._id));
    }, [module.questions, revisionIds, view]);

    return (
        <div
            className={`border rounded-lg mb-3 overflow-hidden shadow-sm ${
                isLightMode ? 'border-slate-200 bg-white' : 'border-white/10 bg-dark-100'
            }`}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full px-4 py-3 min-h-11 transition flex flex-col sm:flex-row sm:items-center items-start sm:justify-between gap-3 ${
                    isLightMode ? 'bg-white hover:bg-slate-50' : 'bg-dark-100 hover:bg-dark-50'
                }`}
            >
                <div className="w-full sm:flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <span className={`font-semibold block ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>{module.title}</span>
                    </div>

                    <div className="mt-2 sm:hidden">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <ProgressBar progress={progress} height={10} theme={theme} />
                            </div>
                            <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${
                                    isLightMode
                                        ? 'text-purple-700 bg-purple-100 border-purple-300'
                                        : 'text-purple-200 bg-purple-600/20 border-purple-400/30'
                                }`}
                            >
                                {completed}/{total}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                                isLightMode
                                    ? 'border-slate-200 bg-white text-slate-500 hover:text-purple-700 hover:border-purple-300'
                                    : 'border-white/10 bg-white/5 text-secondary-300 hover:text-purple-200 hover:border-purple-400/40'
                            }`}
                            title="Articles: coming soon"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                                <path d="M14 3v3h3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                                <path d="M8 11h8M8 15h8M8 19h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                                isLightMode
                                    ? 'border-slate-200 bg-white text-slate-500 hover:text-purple-700 hover:border-purple-300'
                                    : 'border-white/10 bg-white/5 text-secondary-300 hover:text-purple-200 hover:border-purple-400/40'
                            }`}
                            title="Notes: coming soon"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 3.5H14C14.5523 3.5 15 3.94772 15 4.5V16.5L12.5 15L10 16.5L7.5 15L5 16.5V4.5C5 3.94772 5.44772 3.5 6 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M7 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M7 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                                isLightMode
                                    ? 'border-slate-200 bg-white text-slate-500 hover:text-purple-700 hover:border-purple-300'
                                    : 'border-white/10 bg-white/5 text-secondary-300 hover:text-purple-200 hover:border-purple-400/40'
                            }`}
                            title="FAQs: coming soon"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 15a4 4 0 0 1-4 4H9l-5 2V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                                <path d="M9.5 9.25a2.5 2.5 0 1 1 3.5 2.3c-.9.35-1.25.75-1.25 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M11.75 16h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="hidden sm:block w-1/4 min-w-[120px]">
                        <ProgressBar progress={progress} height={10} theme={theme} />
                    </div>

                    <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            isLightMode
                                ? 'text-purple-700 bg-purple-100 border-purple-300'
                                : 'text-purple-200 bg-purple-600/20 border-purple-400/30'
                        }`}
                    >
                        {completed}/{total}
                    </span>
                    <svg
                        className={`w-5 h-5 text-primary-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                    </svg>
                </div>
            </button>

            {expanded && (
                <div className={`p-4 border-t ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-dark-50 border-white/10'}`}>
                    <div className="space-y-3">
                        {questionsToShow.map((question) => (
                            <QuestionCard
                                key={question._id}
                                question={question}
                                isRevision={revisionIds.includes(question._id)}
                                onToggleRevision={() => onToggleRevision?.(question._id)}
                                onToggle={() =>
                                    onQuestionToggle({
                                        subjectId: subject._id,
                                        moduleNumber: module.moduleNumber,
                                        questionId: question._id
                                    })
                                }
                                theme={theme}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleAccordion;

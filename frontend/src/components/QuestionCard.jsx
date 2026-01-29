import React from 'react';
import { motion } from 'framer-motion';

const difficultyColors = {
    Easy: 'bg-emerald-900/70 text-emerald-300 border border-emerald-500/40',
    Medium: 'bg-amber-900/70 text-amber-300 border border-amber-500/40',
    Hard: 'bg-rose-900/70 text-rose-300 border border-rose-500/40'
};

const QuestionCard = ({ question, onToggle, isRevision = false, onToggleRevision, theme = 'light' }) => {
    const difficulty = question.difficulty || 'Medium';
    const completed = !!question.completed;
    const isLightMode = theme === 'light';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`group flex items-start gap-3 rounded-2xl border p-3 shadow-sm hover:shadow-md ${
                isLightMode ? 'border-slate-200 bg-white' : 'border-white/10 bg-dark-100'
            } ${completed ? (isLightMode ? 'ring-1 ring-emerald-400/60 bg-emerald-50' : 'ring-1 ring-emerald-400/40 bg-emerald-900/10') : ''}`}
        >
            <button
                onClick={onToggle}
                className={`mt-1 flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                    completed
                        ? 'border-emerald-400 bg-emerald-500 text-slate-900'
                        : isLightMode
                            ? 'border-slate-300 bg-white text-slate-600 group-hover:border-emerald-400'
                            : 'border-slate-500/70 bg-slate-900 text-slate-300 group-hover:border-emerald-400'
                }`}
            >
                {completed && (
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 10.5L8.5 14L15 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p
                        className={`text-sm font-medium ${
                            completed
                                ? isLightMode
                                    ? 'text-slate-600 line-through'
                                    : 'text-secondary-400 line-through'
                                : isLightMode
                                    ? 'text-slate-700'
                                    : 'text-secondary-200'
                        }`}
                    >
                        {question.title}
                    </p>
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            difficultyColors[difficulty] || difficultyColors.Medium
                        }`}
                    >
                        {difficulty}
                    </span>
                </div>
                {question.description && (
                    <p className={`mt-1 text-xs line-clamp-2 ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>{question.description}</p>
                )}

                <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                        onClick={onToggle}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            completed
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : isLightMode
                                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                                    : 'bg-slate-800/80 text-slate-100 hover:bg-slate-700/90'
                        }`}
                    >
                        {completed ? 'Completed' : 'Mark Completed'}
                    </button>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => onToggleRevision?.()}
                            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                isRevision
                                    ? isLightMode
                                        ? 'border-purple-300 bg-purple-100 text-purple-700'
                                        : 'border-purple-400/30 bg-purple-600/20 text-purple-200'
                                    : isLightMode
                                        ? 'border-slate-200 bg-white text-slate-500 hover:text-purple-700 hover:border-purple-300'
                                        : 'border-white/10 bg-white/5 text-secondary-300 hover:text-purple-200 hover:border-purple-400/30'
                            }`}
                            title={isRevision ? 'Marked for revision' : 'Mark for revision'}
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill={isRevision ? 'currentColor' : 'none'}
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M10 2.75l2.282 4.623 5.106.742-3.694 3.602.872 5.086L10 14.915 5.434 16.803l.872-5.086L2.612 8.115l5.106-.742L10 2.75z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                                isLightMode
                                    ? 'border-slate-200 bg-white text-slate-500 hover:text-sky-600 hover:border-sky-300'
                                    : 'border-white/10 bg-white/5 text-secondary-300 hover:text-sky-300 hover:border-sky-300/30'
                            }`}
                            title="Notes (coming soon)"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    x="4"
                                    y="4"
                                    width="12"
                                    height="12"
                                    rx="2"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M7 8H13"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M7 11H11"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default QuestionCard;

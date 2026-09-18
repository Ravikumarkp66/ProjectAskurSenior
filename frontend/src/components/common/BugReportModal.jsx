import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bug, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../services/api/apiClient';

const PROBLEM_TYPES = [
    'UI / Design',
    'Feature not working',
    'Performance',
    'Login / Account',
    'Academic data',
    'Other'
];

const BugReportModal = ({ isOpen, onClose, initialProblemType = 'Other' }) => {
    const { isDark } = useTheme();
    const [problemType, setProblemType] = useState(initialProblemType);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setProblemType(initialProblemType);
            setTitle('');
            setDescription('');
            setSubmitted(false);
        }
    }, [isOpen, initialProblemType]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Please enter a short description');
            return;
        }
        if (!description.trim()) {
            toast.error('Please provide a brief explanation');
            return;
        }

        try {
            setSubmitting(true);
            const pageUrl = typeof window !== 'undefined' ? window.location.href : 'https://askursenior.in';
            await apiClient.post('/bugs', {
                title: title.trim(),
                description: description.trim(),
                problemType,
                pageUrl
            });

            setSubmitted(true);
            toast.success('Bug report submitted. Thank you!');
            setTimeout(() => {
                onClose();
            }, 1800);
        } catch (error) {
            console.error('Failed to submit bug report:', error);
            const msg = error.response?.data?.error || 'Failed to submit bug report. Please try again.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden z-10 ${
                            isDark
                                ? 'bg-[#0B0D14] border-slate-800/90 text-slate-100 shadow-purple-950/20'
                                : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/10'
                        }`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between px-6 py-4 border-b ${
                            isDark ? 'border-slate-800/80' : 'border-slate-100'
                        }`}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                                    <Bug size={16} strokeWidth={2.2} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold tracking-tight">Report a Problem</h2>
                                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Found something broken? Tell us what happened.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                                }`}
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Body */}
                        {submitted ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <CheckCircle2 size={28} />
                                </div>
                                <h3 className="text-base font-bold">Report Received!</h3>
                                <p className={`text-xs max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Thanks for helping improve AskUrSenior. Our academic engineering team has logged this issue.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Problem Type Grid */}
                                <div>
                                    <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Problem Category
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {PROBLEM_TYPES.map((type) => {
                                            const isSelected = problemType === type;
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setProblemType(type)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                                                        isSelected
                                                            ? (isDark
                                                                ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm'
                                                                : 'bg-purple-50 border-purple-500 text-purple-700 font-semibold shadow-sm')
                                                            : (isDark
                                                                ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                                                                : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Short Description */}
                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Short Description <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. CIE calculation tab gives NaN on semester 4"
                                        maxLength={180}
                                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-all outline-none ${
                                            isDark
                                                ? 'bg-slate-900/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10'
                                        }`}
                                    />
                                </div>

                                {/* Detailed Description */}
                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Details & Steps <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Explain what happened, what you expected, and steps to reproduce..."
                                        maxLength={3000}
                                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-all outline-none resize-none ${
                                            isDark
                                                ? 'bg-slate-900/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10'
                                        }`}
                                    />
                                </div>

                                {/* Footer & Action */}
                                <div className="pt-2 flex items-center justify-between">
                                    <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Context & URL automatically attached
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                                                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                            }`}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 size={13} className="animate-spin" />
                                                    <span>Submitting...</span>
                                                </>
                                            ) : (
                                                <span>Submit Bug Report</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BugReportModal;

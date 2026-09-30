import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bug, ArrowLeft, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api/apiClient';
import Navbar from '../../components/navbar';

const PROBLEM_TYPES = [
    'UI / Design',
    'Feature not working',
    'Performance',
    'Login / Account',
    'Academic data',
    'Other'
];

const BugReportPage = () => {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [problemType, setProblemType] = useState('Other');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const isPlusUser = Boolean(user?.access?.hasPlusAccess || user?.access?.plan === 'PLUS' || user?.isPlus);

    useEffect(() => {
        if (user?.email) {
            setContactEmail(user.email);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Please enter a short description');
            return;
        }
        if (!description.trim()) {
            toast.error('Please provide details');
            return;
        }

        try {
            setSubmitting(true);
            const pageUrl = typeof window !== 'undefined' ? window.location.href : 'https://askursenior.in';
            await apiClient.post('/bugs', {
                title: title.trim(),
                description: description.trim(),
                problemType,
                pageUrl,
                contactEmail: user ? user.email : (contactEmail.trim() || undefined)
            });

            setSubmitted(true);
            toast.success('Bug report submitted. Thank you!');
        } catch (error) {
            console.error('Failed to submit bug report:', error);
            const msg = error.response?.data?.error || 'Failed to submit report. Please try again.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen pt-20 pb-16 px-4 transition-colors ${
            isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>
            <Navbar />
            <div className="max-w-xl mx-auto space-y-6">
                {/* Back Link */}
                <button
                    onClick={() => navigate(-1)}
                    className={`inline-flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors ${
                        isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                </button>

                {/* Header */}
                <div className={`p-6 rounded-2xl border ${
                    isDark ? 'bg-[#0B0D14] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                            <Bug size={20} strokeWidth={2.2} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Bug Report</h1>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Found something broken? Tell us what happened and we'll look into it.
                            </p>
                        </div>
                    </div>

                    {submitted ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <CheckCircle2 size={28} />
                            </div>
                            <h2 className="text-base font-bold">Report Submitted Successfully</h2>
                            <p className={`text-xs max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Thank you for reporting! We track all student bug reports directly in our engineering cycle.
                            </p>
                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-all cursor-pointer"
                                >
                                    Submit Another Report
                                </button>
                                <Link
                                    to="/account"
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                        isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                                    }`}
                                >
                                    Go to Account
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
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
                                                            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                                                            : 'bg-purple-50 border-purple-500 text-purple-700 font-semibold')
                                                        : (isDark
                                                            ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

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
                                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                                        isDark
                                            ? 'bg-slate-900/80 border-slate-800 text-slate-100 focus:border-purple-500'
                                            : 'bg-white border-slate-200 text-slate-900 focus:border-purple-600'
                                    }`}
                                />
                            </div>

                            {/* Guest Email Field */}
                            {!user && (
                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Your Email <span className="text-slate-400 font-normal">(optional, so we can reply to you)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        placeholder="e.g. yourname@gmail.com"
                                        maxLength={100}
                                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                                            isDark
                                                ? 'bg-slate-900/80 border-slate-800 text-slate-100 focus:border-purple-500'
                                                : 'bg-white border-slate-200 text-slate-900 focus:border-purple-600'
                                        }`}
                                    />
                                </div>
                            )}

                            {/* Logged in student badge */}
                            {user && (
                                <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                                    isDark
                                        ? 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                                        : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}>
                                    <div className="flex items-center gap-1.5 truncate">
                                        <span className="font-semibold text-slate-900 dark:text-slate-200 truncate">
                                            {user.name || user.email}
                                        </span>
                                        {user.usn && <span className="text-slate-400">({user.usn})</span>}
                                    </div>
                                    {isPlusUser ? (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 shrink-0 flex items-center gap-1">
                                            <Sparkles size={10} />
                                            <span>Plus</span>
                                        </span>
                                    ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                                            Student
                                        </span>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Detailed Description <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    rows={5}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Explain what happened, steps to reproduce, and what you expected..."
                                    maxLength={3000}
                                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all resize-none ${
                                        isDark
                                            ? 'bg-slate-900/80 border-slate-800 text-slate-100 focus:border-purple-500'
                                            : 'bg-white border-slate-200 text-slate-900 focus:border-purple-600'
                                    }`}
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <span>Submit Bug Report</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BugReportPage;

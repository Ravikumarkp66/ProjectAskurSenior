import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ShieldCheck, 
    Check, 
    Sparkles, 
    Info, 
    ArrowRight
} from 'lucide-react';

const FacultyFeedbackIntroModal = ({ 
    faculty, 
    isOpen, 
    onClose, 
    onContinue, 
    isLightMode = false 
}) => {
    if (!isOpen || !faculty) return null;

    const handleContinueClick = (e) => {
        // Trigger Native Browser Fullscreen API directly in click gesture
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn("Fullscreen request prevented:", err);
                });
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } catch (err) {
            console.warn("Fullscreen API call warning:", err);
        }

        if (onContinue) {
            onContinue(e);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-lg">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
                        isLightMode
                            ? 'bg-white border-slate-200 text-slate-900'
                            : 'bg-[#0f111a] border-purple-500/30 text-white'
                    }`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#141824]/90 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                                <Sparkles className="w-5 h-5 text-amber-300" />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-white tracking-tight">
                                    Share your experience
                                </h2>
                                <p className="text-xs text-purple-300 font-semibold">
                                    {faculty.name} • {faculty.department || 'GENERAL'} Department
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 space-y-5 text-xs text-slate-300 leading-relaxed overflow-y-auto">
                        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200 flex items-start gap-3">
                            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <p className="font-semibold">
                                Your feedback is completely voluntary. You are not required to review this faculty.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-white font-medium">
                                Please share your genuine experience. This is different from formal college/faculty feedback collected by your institution.
                            </p>

                            <p>
                                Your response will be visible to the AskUrSenior community as anonymous feedback. Your personal identity will not be shown publicly.
                            </p>

                            <p className="italic text-slate-400">
                                Please answer based on your own experience rather than what others have told you. Honest feedback helps make faculty insights more useful for everyone.
                            </p>
                        </div>

                        {/* Privacy Reassurance Card */}
                        <div className="p-4 rounded-2xl border bg-black/40 border-white/10 space-y-2.5">
                            <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Privacy Protection
                            </span>

                            <div className="grid grid-cols-1 gap-2 text-xs font-semibold text-slate-300 pt-1">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Your name will not be displayed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Your USN will not be displayed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Your email will not be displayed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Your identity will remain private</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                                    <span>Only your anonymous academic context (Subject, Role, Semester) may be shown</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-xs font-bold text-purple-300 pt-1">
                            Your experience can contribute to better faculty insights.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-5 border-t border-white/10 bg-[#141824]/90 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-extrabold text-slate-300 transition-all text-center"
                        >
                            Maybe Later
                        </button>

                        <button
                            type="button"
                            onClick={handleContinueClick}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 transition-all"
                        >
                            <span>Continue to Feedback</span>
                            <ArrowRight className="w-4 h-4 text-amber-300" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FacultyFeedbackIntroModal;

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/api';
import { useTheme } from '../context/ThemeContext';

/* ═══════════════════════════════════════════════════════════════════
   MODAL SHELL FOR FEEDBACK DIALOG
═══════════════════════════════════════════════════════════════════ */
const ModalShell = ({ isLightMode, title, onClose, children }) => createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <button 
            type="button" 
            className="absolute inset-0 bg-black/65"
            onClick={onClose} 
            aria-label="Close"
            style={{ backdropFilter: 'blur(4px)' }} 
        />
        <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
            className={`relative w-full max-w-lg rounded-2xl border shadow-2xl ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-[#07041a] text-[#c4b5fd]'}`}
            style={!isLightMode ? { boxShadow: '0 0 60px rgba(139,92,246,0.2)' } : {}}
        >
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                <h2 className="text-sm font-bold text-white">{title}</h2>
                <button type="button" onClick={onClose}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${isLightMode ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="px-5 py-4">{children}</div>
        </motion.div>
    </div>,
    document.body
);

const SubjectFooter = ({ onHome, onTrack, isCollapsed, isHomeActive, isTrackActive }) => {
    const { isDark, toggleTheme } = useTheme();
    const isLightMode = !isDark;

    // Feedback dialog states
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackError, setFeedbackError] = useState('');
    const [feedbackStats, setFeedbackStats] = useState({ total: 0, avgRating: 0 });
    const [latestFeedback, setLatestFeedback] = useState(null);
    const [feedbackMetaLoading, setFeedbackMetaLoading] = useState(false);

    const closeFeedbackModal = () => {
        setShowFeedbackModal(false);
        setFeedbackSubmitting(false);
        setFeedbackError('');
    };

    const loadFeedbackMeta = async () => {
        setFeedbackMetaLoading(true);
        try {
            const [sR, lR] = await Promise.all([
                apiClient.get('/feedback/stats'),
                apiClient.get('/feedback/me/latest')
            ]);
            setFeedbackStats(sR?.data?.stats || { total: 0, avgRating: 0 });
            setLatestFeedback(lR?.data?.item || null);
        } catch (e) {
            console.error('Failed to load feedback stats', e);
        } finally {
            setFeedbackMetaLoading(false);
        }
    };

    const submitFeedback = async () => {
        if (!feedbackRating || feedbackSubmitting) return;
        setFeedbackSubmitting(true);
        setFeedbackError('');
        try {
            await apiClient.post('/feedback', { 
                rating: feedbackRating, 
                message: feedbackMessage?.trim() || undefined 
            });
            setFeedbackRating(0);
            setFeedbackMessage('');
            await loadFeedbackMeta();
            closeFeedbackModal();
        } catch (e) {
            setFeedbackError(e?.response?.data?.error || 'Failed to submit feedback');
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleFeedbackClick = () => {
        setFeedbackError('');
        setFeedbackRating(0);
        setFeedbackMessage('');
        loadFeedbackMeta();
        setShowFeedbackModal(true);
    };

    if (isCollapsed) {
        return null;
    }

    return (
        <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--sidebar-border)',
            background: 'transparent',
        }}>
            {/* TakeUForward-Inspired Horizontal Dock */}
            <div className="dock-container" style={{
                background: 'var(--dock-bg)',
                borderColor: 'var(--dock-border)',
            }}>
                {/* Plus */}
                <button
                    onClick={onHome}
                    className={`dock-item ${isHomeActive ? 'active' : ''}`}
                    title="Plus"
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="dock-label">Plus</span>
                </button>

                {/* Track */}
                <button
                    onClick={onTrack}
                    className={`dock-item ${isTrackActive ? 'active' : ''}`}
                    title="Track Academics"
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="dock-label">Track</span>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="dock-item"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDark ? (
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M21 12h-2.25m-13.5 0H3m22.06 6.14l-1.59-1.59m-12.38-12.38l-1.59-1.59M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    )}
                    <span className="dock-label">Theme</span>
                </button>

                {/* Feedback */}
                <button
                    onClick={handleFeedbackClick}
                    className="dock-item"
                    title="Feedback"
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    <span className="dock-label">Feedback</span>
                </button>
            </div>

            {/* Portal-rendered Modal */}
            <AnimatePresence>
                {showFeedbackModal && (
                    <ModalShell isLightMode={isLightMode} title="Feedback" onClose={closeFeedbackModal}>
                        <div className="space-y-4">
                            <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-secondary-200'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="font-semibold text-slate-400">Average rating</div>
                                    <div className="font-extrabold text-amber-400">{feedbackMetaLoading ? '...' : `${feedbackStats.avgRating}/5`}</div>
                                </div>
                                <div className={`mt-1 text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>{feedbackMetaLoading ? 'Loading...' : `${feedbackStats.total} total feedbacks`}</div>
                            </div>
                            <div className={`rounded-xl border px-3 py-2 ${isLightMode ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                                <div className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Your last feedback</div>
                                {!latestFeedback ? <div className={`mt-2 text-sm ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}>No feedback yet.</div> : (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>{latestFeedback?.createdAt ? new Date(latestFeedback.createdAt).toLocaleString() : ''}</div>
                                            <div className="text-sm font-extrabold text-amber-500">{latestFeedback.rating}/5</div>
                                        </div>
                                        <div className={`mt-2 text-sm whitespace-pre-wrap ${isLightMode ? 'text-slate-700' : 'text-secondary-200'}`}>{latestFeedback.message || 'No message'}</div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Rating</p>
                                <div className="mt-2 flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map(v => (
                                        <button 
                                            key={v} 
                                            type="button" 
                                            onClick={() => setFeedbackRating(v)}
                                            className={`h-10 w-10 rounded-xl border text-lg font-extrabold transition cursor-pointer ${feedbackRating >= v ? 'bg-amber-500/10 border-amber-400/20 text-amber-300' : 'bg-white/5 border-white/10 text-secondary-500 hover:bg-white/10'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                                <p className={`mt-2 text-xs ${isLightMode ? 'text-gray-500' : 'text-secondary-500'}`}>{feedbackRating ? `You selected ${feedbackRating}/5` : 'Select a rating'}</p>
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Message (optional)</p>
                                <textarea 
                                    value={feedbackMessage} 
                                    onChange={e => setFeedbackMessage(e.target.value)} 
                                    rows={4} 
                                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60 px-3 py-2 text-sm outline-none" 
                                    placeholder="Tell us what you liked..." 
                                />
                            </div>
                            {feedbackError && <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>{feedbackError}</div>}
                            <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={closeFeedbackModal} className={`h-10 rounded-xl px-4 text-sm font-semibold transition cursor-pointer ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'}`} disabled={feedbackSubmitting}>Cancel</button>
                                <button type="button" onClick={submitFeedback} className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition cursor-pointer ${feedbackRating && !feedbackSubmitting ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-600/40 cursor-not-allowed'}`} disabled={!feedbackRating || feedbackSubmitting}>{feedbackSubmitting ? 'Submitting...' : 'Submit'}</button>
                            </div>
                        </div>
                    </ModalShell>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubjectFooter;

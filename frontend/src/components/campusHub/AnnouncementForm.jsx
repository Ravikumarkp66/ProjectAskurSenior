import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { campusHubAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['exam', 'placement', 'circular', 'update'];
const PRIORITIES = ['low', 'medium', 'high'];

const Label = ({ children }) => (
    <label className="block text-[11px] font-semibold text-[#8B949E] uppercase tracking-widest mb-1.5">
        {children}
    </label>
);

const inputClass = "w-full px-3.5 py-2.5 rounded-lg bg-[#0D1117] border border-[#21262D] text-[#E6EDF3] placeholder-[#8B949E]/50 text-sm focus:border-[#7C3AED]/60 focus:ring-1 focus:ring-[#7C3AED]/30 outline-none transition-colors";

/**
 * AnnouncementForm — admin-only modal to post a new campus announcement.
 */
const AnnouncementForm = ({ onClose, onCreated }) => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'exam',
        priority: 'medium',
        isPinned: false,
        expiresAt: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            setError('Title and description are required.');
            return;
        }
        setLoading(true); setError('');
        try {
            const payload = {
                title:       form.title.trim(),
                description: form.description.trim(),
                category:    form.category,
                priority:    form.priority,
                isPinned:    form.isPinned,
                expiresAt:   form.expiresAt || undefined,
            };
            const res = await campusHubAPI.createAnnouncement(payload);
            toast.success('Announcement posted!');
            onCreated(res.data);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to post announcement.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                    className="relative w-full max-w-lg bg-[#161B22] border border-[#21262D] rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262D]">
                        <div>
                            <h2 className="text-base font-bold text-[#E6EDF3]">New Announcement</h2>
                            <p className="text-xs text-[#8B949E] mt-0.5">Only you (admin) can post announcements</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B949E] hover:text-white hover:bg-[#21262D] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
                        {error && (
                            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <div>
                            <Label>Title *</Label>
                            <input className={inputClass} placeholder="e.g. Semester exam schedule announced"
                                value={form.title} onChange={e => set('title', e.target.value)} />
                        </div>

                        <div>
                            <Label>Description *</Label>
                            <textarea className={`${inputClass} resize-none`} rows={4}
                                placeholder="Full announcement details…"
                                value={form.description} onChange={e => set('description', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Category *</Label>
                                <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c} className="bg-[#161B22]">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <select className={inputClass} value={form.priority} onChange={e => set('priority', e.target.value)}>
                                    {PRIORITIES.map(p => (
                                        <option key={p} value={p} className="bg-[#161B22]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label>Expires at (optional)</Label>
                            <input type="date" className={inputClass}
                                value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
                        </div>

                        {/* Pin toggle */}
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <div
                                onClick={() => set('isPinned', !form.isPinned)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${form.isPinned ? 'bg-[#7C3AED]' : 'bg-[#21262D]'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPinned ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                            <span className="text-sm text-[#E6EDF3]">Pin this announcement</span>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Posting…' : 'Post Announcement'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AnnouncementForm;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MENTORSHIP_TOPICS = [
    'Placements',
    'Academics',
    'Projects',
    'Internships',
    'Resume Review',
    'Career Guidance',
    'Higher Studies',
    'Other'
];

const MentorshipModal = ({ isOpen, onClose, initialTopic }) => {
    const [topic, setTopic] = useState(initialTopic || 'Placements');
    const [description, setDescription] = useState('');
    const [urgency, setUrgency] = useState('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error("Please provide a description");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/mentorship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ topic, description, urgency })
            });

            if (!res.ok) throw new Error("Failed to submit request");

            toast.success("Mentorship request submitted successfully!");
            onClose();
            setDescription(''); // reset
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[#0a0a0f] border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-blue-600/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                <GraduationCap className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-base tracking-wide">
                                    Request Mentorship
                                </h3>
                                <p className="text-slate-400 text-xs">Connect with a senior mentor 1:1</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Topic</label>
                            <select
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                            >
                                {MENTORSHIP_TOPICS.map(t => (
                                    <option key={t} value={t} className="bg-[#0a0a0f]">{t}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What exactly do you need help with?"
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Urgency</label>
                            <div className="flex gap-3">
                                {['Low', 'Medium', 'High'].map(u => (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => setUrgency(u)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                            urgency === u 
                                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {u}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !description.trim()}
                            className="w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MentorshipModal;

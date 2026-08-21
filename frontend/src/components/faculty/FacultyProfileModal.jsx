import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Star, 
    BookOpen, 
    MapPin, 
    Mail, 
    ThumbsUp, 
    MessageSquare, 
    Sparkles, 
    Send,
    CheckCircle2,
    BarChart2,
    GraduationCap
} from 'lucide-react';

const FacultyProfileModal = ({ faculty, isOpen, onClose, isLightMode = false, onAddReview }) => {
    const [newReviewText, setNewReviewText] = useState('');
    const [userRating, setUserRating] = useState(5);
    const [selectedTag, setSelectedTag] = useState('Friendly');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    if (!isOpen || !faculty) return null;

    const handleAddReview = (e) => {
        e.preventDefault();
        if (!newReviewText.trim()) return;

        if (onAddReview) {
            onAddReview(faculty.id || faculty._id, {
                rating: userRating,
                comment: newReviewText.trim(),
                tag: selectedTag
            });
        }

        setNewReviewText('');
        setHasSubmitted(true);
        setTimeout(() => setHasSubmitted(false), 4000);
    };

    // Generate Initials from name
    const getInitials = (name = '') => {
        const cleanName = name.replace(/Dr\.|Prof\.|Mr\.|Mrs\.|Ms\./gi, '').trim();
        const parts = cleanName.split(' ').filter(Boolean);
        if (parts.length === 0) return 'FC';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const reviewsList = faculty.reviews || [];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
                        isLightMode
                            ? 'bg-white border-slate-200 text-slate-900'
                            : 'bg-[#0f172a] border-white/10 text-white'
                    }`}
                >
                    {/* Modal Header */}
                    <div className="sticky top-0 z-20 flex items-center justify-between p-5 border-b backdrop-blur-xl bg-slate-900/80 border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                <GraduationCap className="w-5 h-5" />
                            </span>
                            <div>
                                <h2 className="text-lg font-bold text-white">Faculty Profile</h2>
                                <p className="text-xs text-slate-400">Student feedback & teaching metrics</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Top Profile Hero Section (Initials monogram, no stock photos) */}
                        <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center sm:items-start gap-6 ${
                            isLightMode ? 'bg-purple-50/50 border-purple-100' : 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/20'
                        }`}>
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 border-2 border-purple-500/40 flex items-center justify-center text-white font-black text-3xl shadow-xl shrink-0">
                                {getInitials(faculty.name)}
                            </div>
                            <div className="flex-1 text-center sm:text-left space-y-2">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        {faculty.department || 'GENERAL'} Department
                                    </span>
                                    {faculty.experienceYears && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {faculty.experienceYears} Years Exp.
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{faculty.name}</h1>
                                <p className="text-purple-300 font-medium">{faculty.designation || 'Faculty Member'}</p>

                                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
                                    {faculty.officeLocation && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-purple-400" />
                                            {faculty.officeLocation}
                                        </span>
                                    )}
                                    {faculty.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3.5 h-3.5 text-purple-400" />
                                            {faculty.email}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Overall Score Badge */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 min-w-[120px]">
                                <div className="flex items-center gap-1 text-2xl font-black text-amber-400">
                                    <Star className="w-6 h-6 fill-amber-400" />
                                    {faculty.rating || 5.0}
                                </div>
                                <span className="text-xs text-slate-400 mt-1">{reviewsList.length} Reviews</span>
                            </div>
                        </div>

                        {/* Teaching Metrics */}
                        {faculty.metrics && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-purple-400" />
                                    Teaching Perception Metrics
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Object.entries(faculty.metrics).map(([key, val]) => {
                                        const labels = {
                                            clarity: 'Conceptual Clarity',
                                            gradingFairness: 'Grading Fairness',
                                            accessibility: 'Doubt Clearing & Availability',
                                            strictness: 'Strictness / Attendance',
                                            practicalFocus: 'Practical & Lab Focus'
                                        };
                                        return (
                                            <div key={key} className="p-4 rounded-xl border bg-white/5 border-white/5 space-y-2">
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-slate-300">{labels[key] || key}</span>
                                                    <span className="text-purple-400 font-bold">{val}%</span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${val}%` }}
                                                        transition={{ duration: 0.8 }}
                                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Subjects Taught */}
                        <div className="space-y-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-purple-400" />
                                Courses & Electives Taught
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {faculty.subjects && faculty.subjects.length > 0 ? (
                                    faculty.subjects.map((sub, i) => (
                                        <span key={i} className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-semibold">
                                            {sub}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-slate-500 italic">No subjects added yet</span>
                                )}
                            </div>
                        </div>

                        {/* Student Reviews Section */}
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-purple-400" />
                                    Student Reviews ({reviewsList.length})
                                </h3>
                            </div>

                            {/* Add Anonymous Review Form */}
                            <form onSubmit={handleAddReview} className="p-4 rounded-2xl border bg-slate-900/60 border-purple-500/20 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5" /> Write Anonymous Review
                                    </span>
                                    {/* Rating selector */}
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => setUserRating(star)}
                                                className="p-1 hover:scale-110 transition-transform"
                                            >
                                                <Star className={`w-4 h-4 ${star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    value={newReviewText}
                                    onChange={(e) => setNewReviewText(e.target.value)}
                                    placeholder="Share teaching style insights, lab tips, or exam guidance (Anonymous)..."
                                    className="w-full p-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 resize-none h-20"
                                />

                                <div className="flex items-center justify-between">
                                    <select
                                        value={selectedTag}
                                        onChange={(e) => setSelectedTag(e.target.value)}
                                        className="bg-black/30 border border-white/10 text-xs text-purple-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                                    >
                                        <option value="Friendly">Friendly</option>
                                        <option value="Best Mentor">Best Mentor</option>
                                        <option value="Easy Scoring">Easy Scoring</option>
                                        <option value="Strict">Strict</option>
                                        <option value="Lab Faculty">Lab Faculty</option>
                                    </select>

                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
                                    >
                                        <Send className="w-3.5 h-3.5" /> Submit Review
                                    </button>
                                </div>

                                {hasSubmitted && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 pt-1">
                                        <CheckCircle2 className="w-4 h-4" /> Review submitted successfully!
                                    </div>
                                )}
                            </form>

                            {/* Reviews list */}
                            {reviewsList.length > 0 ? (
                                <div className="space-y-3">
                                    {reviewsList.map((rev, index) => (
                                        <div key={rev.id || index} className="p-4 rounded-xl border bg-white/5 border-white/5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white">{rev.author || 'Anonymous Student'}</span>
                                                    <span className="text-[10px] text-slate-400">• {rev.date || 'Recently'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                    <span className="text-xs font-bold text-amber-400">{rev.rating || 5}</span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-300">{rev.comment}</p>

                                            <div className="flex items-center justify-between pt-2 text-xs">
                                                <div className="flex flex-wrap gap-1">
                                                    {rev.tags && rev.tags.map((t, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-semibold">
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                    <span>Helpful ({rev.helpfulCount || 0})</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-xs text-slate-400 italic">
                                    No reviews yet for this faculty member. Be the first to share a review above!
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FacultyProfileModal;

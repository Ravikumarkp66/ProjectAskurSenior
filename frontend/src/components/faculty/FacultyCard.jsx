import React from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Sparkles } from 'lucide-react';

const FacultyCard = ({ faculty, isLightMode = false, onViewProfile }) => {
    // Generate Initials from name (e.g. Dr. R. Aparna -> RA)
    const getInitials = (name = '') => {
        const cleanName = name.replace(/Dr\.|Prof\.|Mr\.|Mrs\.|Ms\./gi, '').trim();
        const parts = cleanName.split(' ').filter(Boolean);
        if (parts.length === 0) return 'FC';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Colorful status dot helper (🟢 Green, 🟣 Purple, 🟠 Amber)
    const getTagDot = (tag = '', index = 0) => {
        const t = tag.toLowerCase();
        if (t.includes('practical') || t.includes('friendly') || t.includes('lab') || t.includes('teaching')) {
            return <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />;
        }
        if (t.includes('mentor') || t.includes('helpful') || t.includes('guidance')) {
            return <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 shadow-[0_0_6px_rgba(192,132,252,0.8)]" />;
        }
        if (t.includes('fair') || t.includes('strict') || t.includes('scoring') || t.includes('evaluation')) {
            return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />;
        }
        const dots = [
            <span key="g" className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />,
            <span key="p" className="w-2 h-2 rounded-full bg-purple-400 shrink-0 shadow-[0_0_6px_rgba(192,132,252,0.8)]" />,
            <span key="a" className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
        ];
        return dots[index % dots.length];
    };

    const hasReviews = (faculty.reviewCount || 0) > 0;
    const recommendPercent = faculty.metrics?.accessibility || 92;

    // Use default tags if reviews exist but tags empty
    const displayTags = (faculty.tags && faculty.tags.length > 0)
        ? faculty.tags.slice(0, 3)
        : (hasReviews ? ['Practical Teaching', 'Helpful Mentor', 'Fair Evaluation'] : []);

    return (
        <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`group relative flex flex-col justify-between rounded-[22px] p-6 border transition-all duration-300 shadow-xl overflow-hidden ${
                isLightMode
                    ? 'bg-white border-slate-200/80 hover:border-purple-300 hover:shadow-purple-500/10 text-slate-900'
                    : 'bg-[#0D1322] border-white/10 hover:border-purple-500/40 hover:shadow-purple-500/15 text-white'
            }`}
        >
            {/* Soft Ambient Purple Glow on Hover */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div>
                {/* TOP ROW: Initial Avatar + Department Chip */}
                <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
                    {/* Rounded Square Avatar */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 via-indigo-600/20 to-purple-900/30 flex items-center justify-center text-purple-300 font-extrabold text-lg shadow-sm group-hover:border-purple-500/60 transition-colors shrink-0">
                        {getInitials(faculty.name)}
                    </div>

                    {/* Department Chip */}
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-sm">
                        {faculty.department || 'GENERAL'}
                    </span>
                </div>

                {/* MIDDLE: Faculty Name & Designation */}
                <div className="mb-4 relative z-10">
                    <h3 className={`text-xl font-bold tracking-tight line-clamp-1 group-hover:text-purple-300 transition-colors ${
                        isLightMode ? 'text-slate-900' : 'text-white'
                    }`}>
                        {faculty.name}
                    </h3>
                    <p className={`text-xs font-medium mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {faculty.designation || 'Faculty Member'}
                    </p>
                </div>

                {/* STATISTICS ROW */}
                <div className="mb-5 py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/5 relative z-10 flex items-center gap-2 text-xs">
                    {hasReviews ? (
                        <div className="flex items-center gap-2 font-medium text-slate-300 flex-wrap">
                            <div className="flex items-center gap-1 text-amber-400 font-extrabold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{faculty.rating || '4.7'}</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-300 font-semibold">{faculty.reviewCount} Reviews</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-400 font-semibold">{recommendPercent}% Recommend</span>
                        </div>
                    ) : (
                        <span className="text-xs font-medium text-slate-400 italic">No reviews yet</span>
                    )}
                </div>

                {/* INSIGHTS SECTION: Known For */}
                <div className="mb-6 relative z-10">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Known For</span>
                    </div>

                    {hasReviews || (displayTags && displayTags.length > 0) ? (
                        <div className="flex flex-wrap gap-2">
                            {displayTags.map((tag, idx) => (
                                <div
                                    key={idx}
                                    className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                                        isLightMode
                                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                                            : 'bg-white/5 border-white/10 text-slate-200'
                                    }`}
                                >
                                    {getTagDot(tag, idx)}
                                    <span>{tag}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic font-medium py-1">
                            No community insights available yet.
                        </p>
                    )}
                </div>
            </div>

            {/* CTA BUTTON: View Insights */}
            <div className="pt-2 relative z-10">
                <button
                    onClick={() => onViewProfile(faculty)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 hover:shadow-purple-500/40 transition-all duration-200 active:scale-[0.98] group/btn"
                >
                    <span>View Insights</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
};

export default FacultyCard;

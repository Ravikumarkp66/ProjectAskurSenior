import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, MessageSquareQuote } from 'lucide-react';
import { testimonialAPI } from '../../services/api';

const RenderStars = ({ rating = 5 }) => {
    const starCount = Math.min(5, Math.max(1, Math.round(rating)));
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                        i < starCount
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600 fill-slate-800'
                    }`}
                />
            ))}
        </div>
    );
};

const TestimonialCard = ({ item }) => {
    if (!item) return null;

    return (
        <div className="w-[280px] xs:w-[320px] sm:w-[380px] shrink-0 p-4 sm:p-5 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] hover:border-[#D1D5DB] dark:hover:border-[#3E4451] transition-colors duration-150 shadow-none flex flex-col justify-between group relative overflow-hidden">
            <div>
                {/* Header: Masked Email & Verified Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-medium text-[#4B5563] dark:text-[#A1A1AA] font-mono tracking-tight truncate max-w-[190px]">
                        {item.email || 'student****@sit.ac.in'}
                    </span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] dark:bg-[#14532D]/30 dark:border-[#166534] dark:text-[#4ADE80] text-[10px] font-medium shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-[#16A34A] dark:text-[#4ADE80]" />
                        <span>Verified SIT Student</span>
                    </div>
                </div>

                {/* Rating Stars */}
                <div className="mb-3">
                    <RenderStars rating={item.rating} />
                </div>

                {/* Review Text */}
                <p className="text-[#374151] dark:text-[#D1D5DB] text-xs sm:text-sm leading-relaxed font-normal italic line-clamp-4 relative z-10">
                    "{item.review}"
                </p>
            </div>
        </div>
    );
};

const TestimonialsSection = ({ data }) => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (data && data.isVisible === false) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        testimonialAPI.getRandom(24)
            .then(res => {
                if (isMounted && res.data?.data) {
                    setTestimonials(res.data.data);
                }
            })
            .catch(err => {
                console.error('Failed to fetch testimonials:', err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [data]);

    if ((data && data.isVisible === false) || loading || testimonials.length === 0) {
        return null;
    }

    const row1 = testimonials.slice(0, 12);
    const row2 = testimonials.slice(12, 24).length > 0 ? testimonials.slice(12, 24) : testimonials.slice(0, 12);

    return (
        <section id="testimonials" className="py-20 relative bg-transparent border-b border-[#E5E7EB] dark:border-[#292E37] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10 mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] text-xs font-medium uppercase tracking-wider mb-3">
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    <span>Real SIT Student Feedback</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight mb-2">
                    {data?.sectionTitle || 'What Students Say About AskUrSenior'}
                </h2>
                <p className="text-[#4B5563] dark:text-[#A1A1AA] text-sm font-normal max-w-2xl mx-auto">
                    {data?.subtitle || 'Real, unedited feedback shared by SITians across branches and semesters.'}
                </p>
            </div>

            {/* Marquee Containers */}
            <div className="space-y-4 relative z-10 overflow-hidden">
                {/* Row 1: Leftward infinite scroll */}
                <div className="flex overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-white dark:from-[#0F1115] to-transparent z-20 pointer-events-none" />
                    <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-white dark:from-[#0F1115] to-transparent z-20 pointer-events-none" />

                    <div className="animate-marquee gap-4 pr-4">
                        {row1.concat(row1).map((item, idx) => (
                            <TestimonialCard key={`r1-${idx}`} item={item} />
                        ))}
                    </div>
                </div>

                {/* Row 2: Rightward infinite scroll */}
                <div className="flex overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-white dark:from-[#0F1115] to-transparent z-20 pointer-events-none" />
                    <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-white dark:from-[#0F1115] to-transparent z-20 pointer-events-none" />

                    <div className="animate-marquee-reverse gap-4 pr-4">
                        {row2.concat(row2).map((item, idx) => (
                            <TestimonialCard key={`r2-${idx}`} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;

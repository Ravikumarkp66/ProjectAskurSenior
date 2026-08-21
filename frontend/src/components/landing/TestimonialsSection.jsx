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
        <div className="w-[280px] xs:w-[320px] sm:w-[380px] shrink-0 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.05] transition-all duration-300 backdrop-blur-md shadow-xl flex flex-col justify-between group relative overflow-hidden">
            {/* Ambient subtle glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div>
                {/* Header: Masked Email & Verified Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-slate-300 font-mono tracking-tight truncate max-w-[190px]">
                        {item.email || 'student****@sit.ac.in'}
                    </span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Verified SIT Student</span>
                    </div>
                </div>

                {/* Rating Stars */}
                <div className="mb-3">
                    <RenderStars rating={item.rating} />
                </div>

                {/* Review Text */}
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal italic line-clamp-4 relative z-10">
                    "{item.review}"
                </p>
            </div>
        </div>
    );
};

const TestimonialsSection = ({ data }) => {
    if (data && data.isVisible === false) return null;

    const [testimonials, setTestimonials] = useState(data?.testimonials || []);
    const [loading, setLoading] = useState(!data?.testimonials || data.testimonials.length === 0);

    useEffect(() => {
        if (data?.testimonials && data.testimonials.length > 0) {
            setTestimonials(data.testimonials);
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

    if (loading || testimonials.length === 0) {
        return null;
    }

    // Select 12 items for each row to ensure an ultra-smooth, slow marquee glide
    const row1 = testimonials.slice(0, 12);
    const row2 = testimonials.slice(12, 24).length > 0 ? testimonials.slice(12, 24) : testimonials.slice(0, 12);

    return (
        <section id="testimonials" className="py-20 relative bg-[#030712] overflow-hidden">
            {/* Ambient Background Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10 mb-12 text-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    <span>Real SIT Student Feedback</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight mb-3">
                    {data?.sectionTitle || 'What Students Say About AskUrSenior'}
                </h2>
                <p className="text-slate-400 text-base font-normal max-w-2xl mx-auto">
                    {data?.subtitle || 'Real, unedited feedback shared by SITians across branches and semesters.'}
                </p>
            </div>

            {/* Marquee Containers */}
            <div className="space-y-6 relative z-10 overflow-hidden">
                {/* Row 1: Leftward infinite scroll */}
                <div className="flex overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#040814] to-transparent z-20 pointer-events-none" />
                    <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#040814] to-transparent z-20 pointer-events-none" />

                    <div className="animate-marquee gap-5 pr-5">
                        {row1.concat(row1).map((item, idx) => (
                            <TestimonialCard key={`r1-${idx}`} item={item} />
                        ))}
                    </div>
                </div>

                {/* Row 2: Rightward infinite scroll */}
                <div className="flex overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#040814] to-transparent z-20 pointer-events-none" />
                    <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#040814] to-transparent z-20 pointer-events-none" />

                    <div className="animate-marquee-reverse gap-5 pr-5">
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

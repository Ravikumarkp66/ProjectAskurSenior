import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Check, ShieldCheck, HelpCircle, ArrowRight, BookOpen, 
    Briefcase, Star, MapPin, Calculator, LayoutDashboard, UserCheck, 
    BarChart3, Compass, Users, ChevronDown, Tag, Heart, MessageSquareQuote, 
    CheckCircle2, XCircle, AlertCircle, Info, Lock
} from 'lucide-react';

import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import SubscriptionModal from '../components/pricing/SubscriptionModal';
import { subscriptionAPI } from '../services/api';

const defaultTestimonials = [
    { name: 'Vishal K.', branch: 'Computer Science', review: 'AskUrSenior Plus saved my 3rd sem CIE test preparation. The Ask+ AI and organized branch PYQs are insanely accurate.' },
    { name: 'R. Gajendra', branch: 'Mechanical Engineering', review: 'The attendance tracker and CIE analyzer keep me from getting N-Co warnings. Totally worth ₹199 for the semester.' },
    { name: 'Patil Shubham', branch: 'Information Science', review: 'Everything built natively for SIT. No random irrelevant materials like other apps.' }
];

const defaultPricingFaqs = [
    { question: 'Why is AskUrSenior Plus sold on a per-semester basis?', answer: 'Engineering is a semester-based journey where academic requirements change every 5-6 months. Rather than charging expensive lifetime fees, we offer affordable semester plans so you only pay while you actively benefit.' },
    { question: 'What happens after my semester plan ends?', answer: 'Your account automatically reverts to AskUrSenior Free. You will never lose access to your study materials, saved notes, or core calculators.' },
    { question: 'Is there any auto-renewal charge on my bank account?', answer: 'No. We do not use hidden auto-debits or forced recurring subscriptions. You decide if and when you want to manually renew your pass.' },
    { question: 'What features are included in the current V3 version?', answer: 'You get immediate access to all existing V3 features: Personalized Dashboard, Attendance Tracker, Timetable, Ask+ AI RAG assistant, Roadmaps, CIE Analyzer, and Senior Mentorship.' },
    { question: 'Can I apply student discount coupons?', answer: 'Yes! Freshers, campus ambassadors, and festival offer codes can be applied in the coupon box to get instant discounts.' },
    { question: 'Is there a refund policy?', answer: 'Yes, we offer a 3-day hassle-free refund guarantee if you encounter any technical issues with your Plus activation.' }
];

const PricingPage = () => {
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Coupon state
    const [couponInput, setCouponInput] = useState('');
    const [activeCoupon, setActiveCoupon] = useState(null);
    const [couponMsg, setCouponMsg] = useState('');

    // FAQ Accordion state
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    useEffect(() => {
        let isMounted = true;
        subscriptionAPI.getPublicPage()
            .then(res => {
                if (isMounted && res.data?.data) {
                    setPageData(res.data.data);
                    if (res.data.data.pageTitle) {
                        document.title = res.data.data.pageTitle;
                    }
                }
            })
            .catch(err => {
                console.error('Failed to fetch public subscription page, using fallback view:', err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponInput.trim()) return;

        const currentPlanCode = pageData?.plans?.[0]?.code || 'SEM_1';

        try {
            const res = await subscriptionAPI.validateCoupon(couponInput, currentPlanCode);
            if (res.data?.success && res.data?.data) {
                setActiveCoupon(res.data.data);
                setCouponMsg(`✅ ${res.data.data.code} applied! Saved ₹${res.data.data.discountAmount}`);
            }
        } catch (err) {
            setActiveCoupon(null);
            setCouponMsg(`❌ ${err.response?.data?.message || 'Invalid coupon code'}`);
        }
    };

    const openCheckoutModal = (plan) => {
        setSelectedPlan(plan || pageData?.plans?.[0] || { name: 'AskUrSenior Plus', price: 199, code: 'SEM_1' });
        setIsModalOpen(true);
    };

    const plans = pageData?.plans && pageData.plans.length > 0 
        ? pageData.plans 
        : [{ code: 'SEM_1', name: 'AskUrSenior Plus', price: 199, originalPrice: 399, currency: 'INR', duration: 1, durationUnit: 'semester', badge: 'Recommended', isPopular: true }];

    const features = pageData?.features || [];
    const freeFeatures = features.filter(f => f.tier === 'free' || f.tier === 'both');
    const plusFeatures = features.filter(f => f.tier === 'plus' || f.tier === 'both');

    return (
        <div className="flex flex-col min-h-screen bg-[#030712] font-outfit text-slate-200">
            <Navbar />

            <main className="flex-1 relative z-10">
                
                {/* ─────────────────────────────────────────────────────────
                    SECTION 1 — HERO
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 sm:py-28 px-6 relative overflow-hidden text-center">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

                    <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider"
                        >
                            <Sparkles size={14} />
                            <span>Transparent Academic Membership</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-tight"
                        >
                            Invest in Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400">College Journey.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-slate-400 text-base sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed"
                        >
                            AskUrSenior Plus is designed for students who want a smarter, more organized and personalized academic experience throughout their engineering journey at SIT.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-wrap items-center justify-center gap-4 pt-4"
                        >
                            <button
                                onClick={() => openCheckoutModal(plans[0])}
                                className="px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-base shadow-xl shadow-purple-600/30 hover:shadow-purple-500/50 transition-all flex items-center gap-2 group"
                            >
                                <span>Unlock AskUrSenior Plus</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <a
                                href="#comparison"
                                className="px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 font-bold text-base transition-all"
                            >
                                Compare Free vs Plus
                            </a>
                        </motion.div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 2 — OUR PROMISE
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="text-center max-w-3xl mx-auto space-y-3">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                                "Our Promise Will Never Change"
                            </h2>
                            <p className="text-purple-400 font-semibold text-base sm:text-lg">
                                Every student deserves access to essential academic resources.
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
                            <h3 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
                                <CheckCircle2 className="text-emerald-400" size={22} />
                                <span>Always Free Core Features</span>
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                                {[
                                    'Study Materials', 'Interview Experiences', 'Faculty Ratings',
                                    'Campus Explorer', 'Marketplace', 'Lost & Found',
                                    'CGPA Calculator', 'SGPA Calculator', 'Blogs'
                                ].map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                            <Check size={16} />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-200">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-center text-slate-400 text-sm font-medium pt-2">
                                These core academic resources will always remain 100% free for every student at SIT.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 3 — WHY ASKURSENIOR PLUS EXISTS
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                                Why Introduce AskUrSenior Plus?
                            </h2>
                            <p className="text-slate-400 text-base max-w-xl mx-auto">
                                Building a sustainable, high-quality platform requires long-term commitment.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { title: 'Server Infrastructure', desc: 'Fast, secure hosting & database bandwidth.' },
                                { title: 'AI Services', desc: 'Ask+ RAG query credits & custom model fine-tuning.' },
                                { title: 'Resource QA', desc: 'Verifying study materials & senior interview logs.' },
                                { title: 'Community Support', desc: 'Weekly senior sessions & feature maintenance.' }
                            ].map((pillar, idx) => (
                                <div key={idx} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                                    <h4 className="font-bold text-white text-base">{pillar.title}</h4>
                                    <p className="text-xs text-slate-400">{pillar.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-center">
                            <p className="text-purple-300 text-sm sm:text-base font-semibold">
                                "We introduced Plus not to lock learning. We introduced it so we can sustainably build better tools for students."
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 4 — FREE vs PLUS COMPARISON
                ───────────────────────────────────────────────────────── */}
                <section id="comparison" className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-5xl mx-auto space-y-12">
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                                Free vs AskUrSenior Plus
                            </h2>
                            <p className="text-slate-400 text-sm sm:text-base">
                                Choose the tier that matches your academic goals.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Card 1: Free */}
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-8">
                                <div className="space-y-4">
                                    <div className="inline-flex px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase">
                                        AskUrSenior Free
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Essential Resources</h3>
                                    <p className="text-xs text-slate-400">Perfect for students who need essential academic resources.</p>
                                    <div className="pt-4 space-y-2 text-sm text-slate-300">
                                        {[
                                            'Study Materials & PYQs', 'Interview Experiences', 'Faculty Ratings',
                                            'Campus Explorer', 'Marketplace & Lost & Found', 'CGPA & SGPA Calculator', 'Blog Guides'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <Check size={16} className="text-slate-400 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Plus */}
                            <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/20 via-white/[0.03] to-purple-950/30 border border-purple-500/40 relative shadow-2xl flex flex-col justify-between space-y-8">
                                <div className="space-y-4">
                                    <div className="inline-flex px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold uppercase">
                                        AskUrSenior Plus (Recommended)
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Complete Companion</h3>
                                    <p className="text-xs text-slate-300">Perfect for students who want a complete academic companion.</p>

                                    <div className="pt-4 space-y-2 text-sm text-slate-200">
                                        {[
                                            'Everything in Free Plan',
                                            'Personalized Dashboard & Timetable',
                                            'SIT 85% Attendance Tracker',
                                            'Ask+ AI Assistant (SIT RAG)',
                                            'Academic Roadmaps & Contribution Heatmap',
                                            'CIE Analyzer & Year Back Predictor',
                                            'Senior Mentorship & Weekly Sessions',
                                            'Leaderboards, Streaks & Daily Tasks'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <Check size={16} className="text-purple-400 shrink-0" />
                                                <span className="font-semibold">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => openCheckoutModal(plans[0])}
                                    className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Get Plus Access (₹{plans[0]?.price || 199})</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 5 — PREMIUM FEATURES EXPLAINED
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="text-center max-w-3xl mx-auto space-y-3">
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                                Why Each Feature Exists
                            </h2>
                            <p className="text-slate-400 text-sm sm:text-base">
                                We build features to solve real engineering student problems at SIT.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feat, idx) => (
                                <div key={feat.code || idx} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/20 transition-all space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-white text-base">{feat.title}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            feat.tier === 'free' ? 'bg-slate-800 text-slate-400' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        }`}>
                                            {feat.tier === 'free' ? 'Free' : 'Plus'}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                                            <span className="font-bold">Problem: </span>{feat.problem}
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                                            <span className="font-bold">Solution: </span>{feat.solution}
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                            <span className="font-bold">Benefit: </span>{feat.benefit}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 6 & 7 — TRANSPARENCY & VERSION COMMITMENT
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-5xl mx-auto space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Complete Transparency */}
                            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <ShieldCheck className="text-purple-400" size={24} />
                                    <span>What You're Paying For</span>
                                </h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Every premium feature shown on this page already exists, already works, already has been built, and is available immediately after purchase.
                                </p>

                                <div className="space-y-4 text-xs">
                                    <div className="space-y-2">
                                        <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Included:</span>
                                        {['Existing Premium V3 Features', 'Bug Fixes & Maintenance', 'Performance Optimization', 'Server Stability Updates'].map((inc, i) => (
                                            <div key={i} className="flex items-center gap-2 text-slate-200">
                                                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                                <span>{inc}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                        <span className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">Not Included:</span>
                                        {['Future Major Versions (V4, V5)', 'Future Major Standalone Modules', 'Unbuilt Features'].map((exc, i) => (
                                            <div key={i} className="flex items-center gap-2 text-slate-400">
                                                <XCircle size={14} className="text-rose-400 shrink-0" />
                                                <span>{exc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Version Commitment */}
                            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 space-y-6 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <Lock className="text-purple-400" size={24} />
                                        <span>Our Version Commitment</span>
                                    </h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        When students subscribe, they purchase access to the premium features available in the current version (V3).
                                    </p>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Future major versions (V4, V5) may introduce entirely new capabilities and updated pricing. We believe students should pay for software that already exists today—not promises about unbuilt software.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                                    🔒 Clear commitment: 100% honest software delivery.
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 8 & 9 — SEMESTER PLAN & FUTURE PHILOSOPHY
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-5xl mx-auto space-y-8 text-center">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                            Why Don't We Offer Lifetime Plans?
                        </h2>

                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 max-w-3xl mx-auto space-y-4 text-left">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Engineering is a semester-based journey where academic requirements change every semester. Most premium tools are only valuable during active college semesters.
                            </p>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                                Rather than selling expensive lifetime plans that students may never fully use after graduation, we provide affordable semester-wise plans (₹199 / semester). You only pay for the period in which you genuinely benefit.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 10 — PRICING PLAN CARD
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-xl mx-auto">
                        <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/30 via-white/[0.04] to-purple-950/40 border-2 border-purple-500/50 shadow-2xl text-center space-y-6">
                            <span className="px-3.5 py-1 rounded-full bg-purple-600 text-white text-xs font-bold uppercase tracking-wider">
                                {plans[0]?.badge || 'Best Value for SIT Students'}
                            </span>

                            <div>
                                <h3 className="text-3xl font-extrabold text-white">{plans[0]?.name || 'AskUrSenior Plus'}</h3>
                                <div className="pt-4 flex items-baseline justify-center gap-2">
                                    <span className="text-5xl font-black text-white">₹{plans[0]?.price || 199}</span>
                                    <span className="text-slate-400 text-sm">/ {plans[0]?.durationUnit || 'Semester'}</span>
                                </div>
                                {plans[0]?.originalPrice && (
                                    <p className="text-xs text-slate-500 line-through pt-1">Regular Price ₹{plans[0].originalPrice}</p>
                                )}
                            </div>

                            <button
                                onClick={() => openCheckoutModal(plans[0])}
                                className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-base shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
                            >
                                <span>Unlock AskUrSenior Plus</span>
                                <ArrowRight size={18} />
                            </button>

                            <p className="text-xs text-slate-400 font-medium">
                                Instant access to all current V3 premium features.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 11 — DISCOUNTS & COUPONS
                ───────────────────────────────────────────────────────── */}
                <section className="py-16 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6 text-center">
                        <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                            <Tag className="text-purple-400" size={20} />
                            <span>Student Discounts & Coupons</span>
                        </h3>
                        <p className="text-slate-400 text-xs sm:text-sm">
                            Eligible students can apply launch, referral, or campus ambassador coupon codes.
                        </p>

                        <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <input
                                type="text"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                placeholder="Enter coupon code (e.g. SITFIRSTYEAR)"
                                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-sm font-mono uppercase focus:outline-none focus:border-purple-500"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all"
                            >
                                Validate
                            </button>
                        </form>

                        {couponMsg && (
                            <p className={`text-xs font-semibold ${activeCoupon ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {couponMsg}
                            </p>
                        )}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 12 — FOUNDER NOTE
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/5 space-y-8">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <img
                                src="https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/DocScanner+Apr+20%2C+2022+9-12+AM_LE_upscale_prime_cleanup.jpg"
                                alt="Ravikumar KP"
                                className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-500/30 shrink-0"
                            />
                            <div className="text-center sm:text-left space-y-1">
                                <h3 className="text-2xl font-bold text-white">A Note From the Founder</h3>
                                <p className="text-purple-400 text-xs font-semibold">Ravikumar KP • Founder, AskUrSenior</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal border-t border-white/5 pt-6">
                            <p>Hi, I'm Ravikumar KP, an Information Science and Engineering student at Siddaganga Institute of Technology.</p>
                            <p>The platform was built to solve the exact problems I personally faced during engineering—scattered study notes, unclear exam requirements, and lack of senior guidance.</p>
                            <p>For two years, the platform has remained free. <strong className="text-white">The essentials will always remain free.</strong></p>
                            <p>AskUrSenior Plus exists to help us continue building better tools while staying completely transparent about what students receive. Every feature you pay for already exists. Every promise we make is one we keep.</p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 13 — STUDENT TESTIMONIALS
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-6xl mx-auto space-y-10">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-extrabold text-white">What SIT Students Say</h2>
                            <p className="text-slate-400 text-xs sm:text-sm">Real reviews from engineering students at Siddaganga Institute of Technology.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {defaultTestimonials.map((t, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                                    <p className="text-xs text-slate-300 italic">"{t.review}"</p>
                                    <div className="pt-2 border-t border-white/5 text-xs">
                                        <div className="font-bold text-white">{t.name}</div>
                                        <div className="text-slate-500">{t.branch}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 14 — PRICING FAQ ACCORDION
                ───────────────────────────────────────────────────────── */}
                <section className="py-20 px-6 relative bg-[#030712] overflow-hidden">
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-extrabold text-white">Subscription FAQs</h2>
                            <p className="text-slate-400 text-xs sm:text-sm">Answers to common questions about AskUrSenior Plus.</p>
                        </div>

                        <div className="space-y-4">
                            {defaultPricingFaqs.map((faq, idx) => {
                                const isOpen = openFaqIndex === idx;
                                return (
                                    <div key={idx} className="rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden">
                                        <button
                                            onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                                            className="w-full p-5 flex items-center justify-between text-left font-semibold text-white text-sm sm:text-base"
                                        >
                                            <span>{faq.question}</span>
                                            <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-400' : 'text-slate-500'}`} />
                                        </button>
                                        {isOpen && (
                                            <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 border-t border-white/5">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 15 — FINAL CTA
                ───────────────────────────────────────────────────────── */}
                <section className="py-24 px-6 relative bg-[#030712] text-center overflow-hidden">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-white">
                            Ready to Make Your College Journey Smarter?
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base">
                            Join students who want a smarter, more organized and personalized academic journey.
                        </p>
                        <button
                            onClick={() => openCheckoutModal(plans[0])}
                            className="px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-base shadow-xl shadow-purple-600/30 transition-all inline-flex items-center gap-2"
                        >
                            <span>Unlock AskUrSenior Plus</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </section>

            </main>

            <Footer />

            {/* Subscription Confirmation Modal */}
            <SubscriptionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                plan={selectedPlan}
            />
        </div>
    );
};

export default PricingPage;

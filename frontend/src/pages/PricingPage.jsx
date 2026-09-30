import React, { useState, useEffect } from 'react';
import { 
    Check, ShieldCheck, ArrowRight, ChevronDown, Sparkles, Zap
} from 'lucide-react';

import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import SubscriptionModal from '../components/pricing/SubscriptionModal';
import { subscriptionAPI } from '../services/api';

const defaultPricingFaqs = [
    // ── FEATURE FAQS (Academic Utilities) ──
    {
        category: 'features',
        categoryLabel: 'Academic Utilities',
        question: 'What do I get in Smart Attendance, Section Timetables & Daily Schedule?',
        answer: 'You get full section-wise timetable synchronization and lab-batch filtering (B1/B2/B3). It automatically enforces SIT\'s 85% attendance rule, calculates your safe bunk count ("Can Miss"), runs a shortage recovery equation planner, displays today\'s upcoming classes in real-time, and tracks your daily subject attendance streaks.'
    },
    {
        category: 'features',
        categoryLabel: 'Academic Utilities',
        question: 'How do the CIE Analyzer and SEE Target Mark Forecaster work?',
        answer: 'The CIE Analyzer handles autonomous 50-mark normalization using Best-of-N test calculations and IPCC theory/lab split ratios. It then calculates the exact SEE exam marks required to achieve your target semester grades (O, A+, A, B) alongside credit-weighted SGPA and CGPA calculators.'
    },
    {
        category: 'features',
        categoryLabel: 'Academic Utilities',
        question: 'What do the Branch Change Predictor, Eligibility Checker & Year-Back Auditor provide?',
        answer: 'The Branch Change Predictor analyzes your current CGPA against official SIT branch cutoffs to calculate statistical shift odds and live CGPA gap (Δ). The Eligibility Checker audits your pre-exam dual compliance (85% attendance + 20 CIE marks), flags year-back risks, and generates credit deficit recovery pathways.'
    },
    {
        category: 'features',
        categoryLabel: 'Academic Utilities',
        question: 'What is included in the Coding Playground & College Labset Environment?',
        answer: 'An in-browser Monaco IDE environment supporting C, C++, Java, and Python. It includes official college lab manual problem sets with automated test case validation, optimal reference implementations, custom inputs/outputs, and an interactive lab exam countdown timer.'
    },
    {
        category: 'features',
        categoryLabel: 'Academic Utilities',
        question: 'What study materials, solved PYQs, and 1-credit subject quizzes are included?',
        answer: 'You receive curated SIT & VTU subject lecture notes, solved Previous Year Questions (PYQs) with senior editorial proofs and KaTeX mathematical formulas, module completion checklists, quizzes for 1-credit NCMC and AEC subjects, and curated engineering roadmaps.'
    },
    {
        category: 'features',
        categoryLabel: 'Academic Utilities',
        question: 'How do Senior Placement Experiences, Campus Map & the 4-Year Journey work?',
        answer: 'You gain access to verified senior placement interview experiences with company-specific OA patterns and round breakdowns, an interactive SIT campus map with building and room locators, and a 4-year academic contribution heatmap on your personalized command dashboard.'
    },

    // ── PLATFORM & ACCESS FAQS ──
    {
        category: 'platform',
        categoryLabel: 'Platform & Access',
        question: 'What is the duration of my AskUrSenior Plus plan?',
        answer: 'Your plan provides full access to all Plus features for the entire duration of the active semester from the day of activation.'
    },
    {
        category: 'platform',
        categoryLabel: 'Platform & Access',
        question: 'Is Plus access a one-time semester payment or a recurring subscription?',
        answer: 'Your Plus access is a one-time payment for your semester. There are zero automatic renewals, zero recurring credit card charges, and no hidden fees. You always decide manually if and when you wish to purchase for future semesters.'
    },
    {
        category: 'platform',
        categoryLabel: 'Platform & Access',
        question: 'What happens when my Plus semester access ends?',
        answer: 'Your account seamlessly returns to AskUrSenior Free. Your free study materials, solved PYQs, notes, and WhatsApp Community access remain active forever with zero loss of saved notes.'
    },
    {
        category: 'platform',
        categoryLabel: 'Platform & Access',
        question: 'Are new features added during the semester included in my active plan?',
        answer: 'Yes. Important new features and academic improvements introduced to AskUrSenior Plus during your active semester are automatically included at no additional cost.'
    },
    {
        category: 'platform',
        categoryLabel: 'Platform & Access',
        question: 'Is the WhatsApp Community included with Free or Plus?',
        answer: 'The WhatsApp Community is open to all students for academic doubt-solving and peer discussions. Both Free and Plus users can freely participate in the community.'
    }
];

const PricingPage = () => {
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // FAQ state
    const [openFaqIndex, setOpenFaqIndex] = useState(0);
    const [faqCategory, setFaqCategory] = useState('all');

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

    const openCheckoutModal = (plan) => {
        setSelectedPlan(plan || pageData?.plans?.[0] || { name: 'AskUrSenior Plus', price: 199, code: 'SEM_1' });
        setIsModalOpen(true);
    };

    const plans = pageData?.plans && pageData.plans.length > 0 
        ? pageData.plans 
        : [{ code: 'SEM_1', name: 'AskUrSenior Plus', price: 199, originalPrice: 399, currency: 'INR', duration: 1, durationUnit: 'semester', badge: 'Recommended', isPopular: true }];

    const scrollToPricing = (e) => {
        e.preventDefault();
        const element = document.getElementById('pricing');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const filteredFaqs = faqCategory === 'all'
        ? defaultPricingFaqs
        : defaultPricingFaqs.filter(faq => faq.category === faqCategory);

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#0F1115] text-[#111827] dark:text-[#F3F4F6] font-sans antialiased transition-colors duration-150">
            <Navbar />

            <main className="flex-1">
                
                {/* ─────────────────────────────────────────────────────────
                    SECTION 1 — HERO SECTION (ASKURSENIOR STRIKE LAUNCH)
                ───────────────────────────────────────────────────────── */}
                <section className="pt-20 pb-16 sm:pt-24 sm:pb-20 px-4 sm:px-6 text-center">
                    <div className="max-w-3xl mx-auto space-y-6">
                        
                        {/* Launch Status Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] text-[12px] font-semibold tracking-wide uppercase">
                            <Zap size={13} className="text-[#7C3AED] dark:text-[#A78BFA] fill-current" />
                            <span>ASKURSENIOR STRIKE • PLUS LAUNCH</span>
                        </div>

                        {/* Page Heading: Strike Launch */}
                        <h1 className="text-[32px] sm:text-[42px] md:text-[48px] leading-[38px] sm:leading-[50px] font-extrabold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                            AskUrSenior Strike Launches <span className="text-[#7C3AED] dark:text-[#A78BFA]">Plus Features</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-[15px] sm:text-[17px] leading-[24px] sm:leading-[28px] text-[#4B5563] dark:text-[#9CA3AF] max-w-2xl mx-auto font-normal">
                            AskUrSenior Strike brings together your complete academic toolkit for SIT. Manage attendance, calculate CIE & target SEE marks, practice lab coding, and navigate branch changes with confidence.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xs sm:max-w-none mx-auto">
                            <a
                                href="#pricing"
                                onClick={scrollToPricing}
                                className="w-full sm:w-auto h-11 px-7 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-none hover:translate-y-[-1px]"
                            >
                                <span>Explore Plus</span>
                                <ArrowRight size={16} />
                            </a>

                            <a
                                href="#pricing"
                                onClick={scrollToPricing}
                                className="w-full sm:w-auto h-11 px-7 rounded-[6px] bg-white dark:bg-[#15181D] border border-[#D1D5DB] dark:border-[#292E37] text-[#111827] dark:text-[#F3F4F6] hover:bg-[#F8FAFC] dark:hover:bg-[#1B1F26] hover:border-[#9CA3AF] dark:hover:border-[#4B5563] font-medium text-[14px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-none"
                            >
                                <span>See What's Free</span>
                                <ChevronDown size={16} className="text-[#6B7280] dark:text-[#9CA3AF]" />
                            </a>
                        </div>

                        {/* Trust Badges with Micro-Chips */}
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
                            <div className="flex items-center gap-1.5 font-medium">
                                <ShieldCheck size={14} className="text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
                                <span>Built specifically for SIT curriculum</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <Check size={14} className="text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
                                <span>One semester full access</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <Check size={14} className="text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
                                <span>Zero automatic renewals</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 2 — TWO-COLUMN PRICING & COMPARISON BLOCK
                ───────────────────────────────────────────────────────── */}
                <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6">
                    <div className="max-w-5xl mx-auto space-y-10">
                        
                        {/* Section Header */}
                        <div className="text-center max-w-2xl mx-auto space-y-2">
                            <span className="text-[12px] font-bold tracking-wider text-[#7C3AED] dark:text-[#A78BFA] uppercase">
                                THE ACADEMIC COMPARISON
                            </span>
                            <h2 className="text-[24px] sm:text-[28px] leading-[32px] font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                                Start Free. Upgrade When You Need More.
                            </h2>
                            <p className="text-[14px] sm:text-[15px] leading-[22px] text-[#4B5563] dark:text-[#9CA3AF]">
                                Free gives you the community and essential resources. Plus provides the complete academic toolkit to actively manage your semester.
                            </p>
                        </div>

                        {/* 2-Column Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            
                            {/* LEFT COLUMN: ASKURSENIOR FREE (5 Cols on LG) */}
                            <div className="lg:col-span-5 p-6 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] flex flex-col justify-between space-y-6 shadow-none">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[20px] font-bold text-[#111827] dark:text-[#F3F4F6]">
                                                AskUrSenior Free
                                            </h3>
                                            <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-[#1B1F26] text-[#4B5563] dark:text-[#A1A1AA] border border-[#E5E7EB] dark:border-[#292E37] text-[11px] font-semibold uppercase tracking-wide">
                                                Always Free
                                            </span>
                                        </div>
                                        <p className="text-[13px] leading-[20px] text-[#6B7280] dark:text-[#9CA3AF]">
                                            Essential study resources and campus network accessible to every student at SIT.
                                        </p>
                                    </div>

                                    {/* Free Features List with Clean Typography */}
                                    <div className="space-y-3.5 pt-1">
                                        <div className="flex items-start gap-3 p-2.5 rounded-[6px] bg-[#F8FAFC] dark:bg-[#1B1F26] border border-[#E5E7EB]/70 dark:border-[#292E37]">
                                            <div className="w-5 h-5 rounded-full bg-[#F0FDF4] dark:bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={13} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6]">Study Materials & Notes</div>
                                                <div className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">Official syllabus notes & reference PDFs</div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-2.5 rounded-[6px] bg-[#F8FAFC] dark:bg-[#1B1F26] border border-[#E5E7EB]/70 dark:border-[#292E37]">
                                            <div className="w-5 h-5 rounded-full bg-[#F0FDF4] dark:bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={13} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6]">Solved Previous Year Questions (PYQs)</div>
                                                <div className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">Previous exam papers with step-by-step solutions</div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-2.5 rounded-[6px] bg-[#F8FAFC] dark:bg-[#1B1F26] border border-[#E5E7EB]/70 dark:border-[#292E37]">
                                            <div className="w-5 h-5 rounded-full bg-[#F0FDF4] dark:bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={13} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6]">WhatsApp Community & Doubt Solving</div>
                                                <div className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">Peer discussions and academic help from seniors</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-[#E5E7EB] dark:border-[#292E37]">
                                    {/* Free Price Hero */}
                                    <div className="p-3.5 rounded-[6px] bg-[#F8FAFC] dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] flex items-center justify-between">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-[26px] font-bold text-[#111827] dark:text-[#F3F4F6]">₹0</span>
                                            <span className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF] font-normal">/ forever</span>
                                        </div>
                                        <span className="text-[12px] text-[#16A34A] font-semibold">
                                            No payment required
                                        </span>
                                    </div>

                                    <div className="w-full py-2.5 px-3 rounded-[6px] bg-[#F8FAFC] dark:bg-[#1B1F26] text-[#6B7280] dark:text-[#9CA3AF] text-[12px] font-medium text-center border border-[#E5E7EB] dark:border-[#292E37]">
                                        Default access for all registered students
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: ASKURSENIOR PLUS (7 Cols on LG — Modern SaaS Presentation) */}
                            <div className="lg:col-span-7 p-6 rounded-lg bg-white dark:bg-[#15181D] border-2 border-[#7C3AED] dark:border-[#8B5CF6] flex flex-col justify-between space-y-6 shadow-none relative">
                                <div className="space-y-5">
                                    {/* Header & Recommended Badge */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-[22px] font-bold text-[#111827] dark:text-[#F3F4F6] flex items-center gap-2">
                                                <span>AskUrSenior Plus</span>
                                            </h3>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED] text-white text-[11px] font-semibold uppercase tracking-wider">
                                                <Sparkles size={12} />
                                                <span>Recommended</span>
                                            </span>
                                        </div>
                                        <p className="text-[13px] font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                                            Your complete academic toolkit for your semester
                                        </p>
                                    </div>

                                    {/* 16 Features — Modern SaaS Grouped Grid with High Contrast */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                        
                                        {/* Item 1 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Attendance Tracker with Timetable for Each Section & Analysis
                                            </span>
                                        </div>

                                        {/* Item 2 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Today's Classes Tracking
                                            </span>
                                        </div>

                                        {/* Item 3 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Streaks for All Subjects & Days
                                            </span>
                                        </div>

                                        {/* Item 4 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                CIE Analyzer
                                            </span>
                                        </div>

                                        {/* Item 5 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Branch Change Predictor
                                            </span>
                                        </div>

                                        {/* Item 6 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Year Back Predictor
                                            </span>
                                        </div>

                                        {/* Item 7 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Eligibility Checker
                                            </span>
                                        </div>

                                        {/* Item 8 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                CGPA / SGPA Calculator
                                            </span>
                                        </div>

                                        {/* Item 9 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Coding Playground for College Labset Programs (C, C++, Java, Python)
                                            </span>
                                        </div>

                                        {/* Item 10 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Roadmaps
                                            </span>
                                        </div>

                                        {/* Item 11 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Quiz for 1-Credit Subjects
                                            </span>
                                        </div>

                                        {/* Item 12 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Senior Interview Experiences
                                            </span>
                                        </div>

                                        {/* Item 13 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Campus Map
                                            </span>
                                        </div>

                                        {/* Item 14 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                4 Years Journey Heatmap
                                            </span>
                                        </div>

                                        {/* Item 15 */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] leading-tight">
                                                Personalized Dashboard
                                            </span>
                                        </div>

                                        {/* Item 16 & Free Bundle */}
                                        <div className="flex items-start gap-2 p-1.5 rounded-[4px] hover:bg-[#FAF5FF]/60 dark:hover:bg-[#1B1F26] transition-colors sm:col-span-2 pt-2 border-t border-[#E5E7EB] dark:border-[#292E37]">
                                            <div className="w-4 h-4 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/30 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <div className="text-[13px] leading-tight">
                                                <span className="font-bold text-[#111827] dark:text-[#F3F4F6]">Plus Everything in Free: </span>
                                                <span className="text-[#4B5563] dark:text-[#9CA3AF] font-normal">Materials, Solved PYQs & WhatsApp Community</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* The Important Promise Banner with Distinct SaaS Look */}
                                    <div className="p-3 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#6D28D9] dark:text-[#DDD6FE] flex items-start gap-2.5 leading-relaxed">
                                        <Sparkles size={15} className="text-[#7C3AED] dark:text-[#A78BFA] shrink-0 mt-0.5" />
                                        <span className="font-medium">
                                            Important new features added to AskUrSenior Plus during your active plan are included at no extra cost.
                                        </span>
                                    </div>
                                </div>

                                {/* Plus Price & CTA Section (BELOW FEATURES) */}
                                <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#292E37] space-y-3">
                                    {/* Primary Price Focal Point (The ONLY prominent price on the page) */}
                                    <div className="p-4 rounded-[6px] bg-[#F8FAFC] dark:bg-[#1B1F26] border border-[#E5E7EB] dark:border-[#292E37] flex flex-col sm:flex-row items-center justify-between gap-2">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[32px] sm:text-[36px] font-extrabold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                                                ₹{plans[0]?.price || 199}
                                            </span>
                                            <span className="text-[#6B7280] dark:text-[#9CA3AF] font-semibold text-[14px]">
                                                / {plans[0]?.durationUnit?.toLowerCase() || 'semester'}
                                            </span>
                                        </div>
                                        <div className="text-right text-[12px] text-[#4B5563] dark:text-[#9CA3AF] font-semibold">
                                            One semester access • Zero auto-renewal
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openCheckoutModal(plans[0])}
                                        className="w-full h-11 px-5 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-none hover:translate-y-[-1px]"
                                    >
                                        <span>Unlock AskUrSenior Plus</span>
                                        <ArrowRight size={16} />
                                    </button>
                                    <p className="text-center text-[12px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">
                                        Everything currently available in Plus is included.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 3 — TRUST, ACCESS & PLAN TERMS
                ───────────────────────────────────────────────────────── */}
                <section className="py-16 sm:py-20 px-4 sm:px-6">
                    <div className="max-w-5xl mx-auto space-y-10">
                        
                        {/* Section Header */}
                        <div className="text-center max-w-2xl mx-auto space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 text-[#7C3AED] dark:text-[#A78BFA] text-[12px] font-semibold uppercase border border-[#E9D5FF] dark:border-[#7C3AED]/30">
                                <ShieldCheck size={14} className="text-[#7C3AED] dark:text-[#A78BFA]" />
                                <span>YOUR PLAN, CLEARLY EXPLAINED</span>
                            </div>
                            <h2 className="text-[24px] sm:text-[28px] leading-[32px] font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                                Simple Terms. No Surprises.
                            </h2>
                            <p className="text-[14px] sm:text-[15px] leading-[22px] text-[#4B5563] dark:text-[#9CA3AF]">
                                Everything you need to know about your semester access, renewal terms, and account transition.
                            </p>
                        </div>

                        {/* 4 Value Cards Grid with Modern SaaS Look */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            
                            <div className="p-5 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] space-y-2.5 shadow-none">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 text-[12px] font-bold text-[#7C3AED] dark:text-[#A78BFA] border border-[#E9D5FF] dark:border-[#7C3AED]/30">
                                    01
                                </span>
                                <h3 className="font-bold text-[#111827] dark:text-[#F3F4F6] text-[15px]">One Semester Access</h3>
                                <p className="text-[13px] leading-[20px] text-[#4B5563] dark:text-[#9CA3AF]">
                                    Your semester plan fee covers your complete semester toolkit from activation to semester completion.
                                </p>
                            </div>

                            <div className="p-5 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] space-y-2.5 shadow-none">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 text-[12px] font-bold text-[#7C3AED] dark:text-[#A78BFA] border border-[#E9D5FF] dark:border-[#7C3AED]/30">
                                    02
                                </span>
                                <h3 className="font-bold text-[#111827] dark:text-[#F3F4F6] text-[15px]">Zero Auto-Renewal</h3>
                                <p className="text-[13px] leading-[20px] text-[#4B5563] dark:text-[#9CA3AF]">
                                    No recurring credit card charges or hidden subscriptions. You decide when to purchase.
                                </p>
                            </div>

                            <div className="p-5 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] space-y-2.5 shadow-none">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 text-[12px] font-bold text-[#7C3AED] dark:text-[#A78BFA] border border-[#E9D5FF] dark:border-[#7C3AED]/30">
                                    03
                                </span>
                                <h3 className="font-bold text-[#111827] dark:text-[#F3F4F6] text-[15px]">Free Resources Stay Free</h3>
                                <p className="text-[13px] leading-[20px] text-[#4B5563] dark:text-[#9CA3AF]">
                                    When your Plus semester ends, your notes, PYQs, and WhatsApp Community access remain active.
                                </p>
                            </div>

                            <div className="p-5 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] space-y-2.5 shadow-none">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 text-[12px] font-bold text-[#7C3AED] dark:text-[#A78BFA] border border-[#E9D5FF] dark:border-[#7C3AED]/30">
                                    04
                                </span>
                                <h3 className="font-bold text-[#111827] dark:text-[#F3F4F6] text-[15px]">Manual Renewal</h3>
                                <p className="text-[13px] leading-[20px] text-[#4B5563] dark:text-[#9CA3AF]">
                                    You can manually purchase Plus again for subsequent semesters whenever you need it.
                                </p>
                            </div>

                        </div>

                        {/* Reassurance Callout Box */}
                        <div className="max-w-2xl mx-auto p-4 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-center">
                            <p className="text-[13px] sm:text-[14px] font-semibold text-[#6D28D9] dark:text-[#DDD6FE]">
                                No hidden recurring charges. You have 100% control over when to renew.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────────────────
                    SECTION 4 — CATEGORIZED FAQ ACCORDION (SECTION-WISE)
                ───────────────────────────────────────────────────────── */}
                <section className="py-16 sm:py-20 px-4 sm:px-6">
                    <div className="max-w-3xl mx-auto space-y-8">
                        
                        {/* Section Header */}
                        <div className="text-center space-y-2">
                            <span className="text-[12px] font-bold tracking-wider text-[#7C3AED] dark:text-[#A78BFA] uppercase">
                                FREQUENTLY ASKED QUESTIONS
                            </span>
                            <h2 className="text-[24px] sm:text-[28px] leading-[32px] font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                                Everything You Need to Know
                            </h2>
                            <p className="text-[14px] leading-[22px] text-[#4B5563] dark:text-[#9CA3AF]">
                                Detailed answers regarding academic tools, platform capabilities, and semester access.
                            </p>
                        </div>

                        {/* Category Filter Tabs */}
                        <div className="flex items-center justify-center gap-2 p-1 max-w-md mx-auto rounded-[8px] bg-[#F8FAFC] dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37]">
                            <button
                                onClick={() => { setFaqCategory('all'); setOpenFaqIndex(0); }}
                                className={`flex-1 py-1.5 px-3 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
                                    faqCategory === 'all'
                                        ? 'bg-white dark:bg-[#1B1F26] text-[#7C3AED] dark:text-[#A78BFA] shadow-sm border border-[#E5E7EB] dark:border-[#7C3AED]/30'
                                        : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                                }`}
                            >
                                All FAQs
                            </button>
                            <button
                                onClick={() => { setFaqCategory('features'); setOpenFaqIndex(0); }}
                                className={`flex-1 py-1.5 px-3 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
                                    faqCategory === 'features'
                                        ? 'bg-white dark:bg-[#1B1F26] text-[#7C3AED] dark:text-[#A78BFA] shadow-sm border border-[#E5E7EB] dark:border-[#7C3AED]/30'
                                        : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                                }`}
                            >
                                Feature FAQs
                            </button>
                            <button
                                onClick={() => { setFaqCategory('platform'); setOpenFaqIndex(0); }}
                                className={`flex-1 py-1.5 px-3 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
                                    faqCategory === 'platform'
                                        ? 'bg-white dark:bg-[#1B1F26] text-[#7C3AED] dark:text-[#A78BFA] shadow-sm border border-[#E5E7EB] dark:border-[#7C3AED]/30'
                                        : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                                }`}
                            >
                                Platform FAQs
                            </button>
                        </div>

                        {/* FAQ List */}
                        <div className="space-y-3">
                            {filteredFaqs.map((faq, index) => {
                                const isOpen = openFaqIndex === index;
                                return (
                                    <div 
                                        key={index}
                                        className="rounded-[6px] border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] overflow-hidden transition-colors duration-150 hover:border-[#7C3AED]/30 dark:hover:border-[#8B5CF6]/30"
                                    >
                                        <button
                                            onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                            className="w-full py-4 px-5 text-left flex items-start justify-between gap-4 font-bold text-[#111827] dark:text-[#F3F4F6] text-[14px] sm:text-[15px] hover:bg-[#FAF5FF]/40 dark:hover:bg-[#1B1F26] transition-colors duration-150 cursor-pointer"
                                        >
                                            <div className="space-y-1 pr-2">
                                                <span className="inline-block text-[10.5px] font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA] mb-0.5">
                                                    {faq.categoryLabel}
                                                </span>
                                                <div className={`leading-snug ${isOpen ? 'text-[#7C3AED] dark:text-[#A78BFA]' : ''}`}>
                                                    {faq.question}
                                                </div>
                                            </div>
                                            <ChevronDown 
                                                size={16} 
                                                className={`text-[#6B7280] dark:text-[#9CA3AF] shrink-0 mt-1 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#7C3AED] dark:text-[#A78BFA]' : ''}`} 
                                            />
                                        </button>
                                        {isOpen && (
                                            <div className="px-5 pb-4 pt-1 text-[13px] sm:text-[14px] leading-[22px] text-[#4B5563] dark:text-[#9CA3AF] border-t border-[#E5E7EB] dark:border-[#292E37] bg-[#FAF5FF]/20 dark:bg-[#1B1F26]/40 font-normal">
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
                    SECTION 5 — FINAL CTA SECTION
                ───────────────────────────────────────────────────────── */}
                <section className="py-16 sm:py-20 px-4 sm:px-6 text-center">
                    <div className="max-w-2xl mx-auto space-y-5">
                        
                        <span className="text-[12px] font-bold tracking-wider text-[#7C3AED] dark:text-[#A78BFA] uppercase">
                            ASKURSENIOR PLUS
                        </span>

                        <h2 className="text-[28px] sm:text-[34px] md:text-[38px] leading-[34px] sm:leading-[42px] font-extrabold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                            Ready to Make Your Semester Easier?
                        </h2>

                        <p className="text-[15px] leading-[24px] text-[#4B5563] dark:text-[#9CA3AF] max-w-lg mx-auto">
                            Get the complete AskUrSenior Plus toolkit for your semester, built around the way SIT students actually study and manage academics.
                        </p>

                        <div className="pt-2 flex flex-col items-center justify-center gap-2">
                            <button
                                onClick={() => openCheckoutModal(plans[0])}
                                className="h-11 px-8 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-none hover:translate-y-[-1px]"
                            >
                                <span>Unlock AskUrSenior Plus</span>
                                <ArrowRight size={16} />
                            </button>
                            <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">
                                No automatic renewal. You decide when to renew.
                            </p>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer Component */}
            <Footer />

            {/* Dynamic Checkout & Subscription Modal */}
            <SubscriptionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                plan={selectedPlan}
                onSuccess={() => {
                    window.location.reload();
                }}
            />
        </div>
    );
};

export default PricingPage;

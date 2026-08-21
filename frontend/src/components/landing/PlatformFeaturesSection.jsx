import React, { useState } from 'react';
import {
    BookOpen, Briefcase, Building, Sparkles, Activity, Users,
    FileText, HelpCircle, Award, Edit3, Layers, Calculator,
    TrendingUp, PieChart, CheckCircle, Star, UserCheck, CheckSquare,
    Compass, GitBranch, AlertTriangle, BookMarked, MapPin, Search,
    ShoppingBag, Cpu, Layout, Flag, Zap, List, Trophy, MessageCircle,
    Headphones
} from 'lucide-react';

const iconMap = {
    BookOpen, Briefcase, Building, Sparkles, Activity, Users,
    FileText, HelpCircle, Award, Edit3, Layers, Calculator,
    TrendingUp, PieChart, CheckCircle, Star, UserCheck, CheckSquare,
    Compass, GitBranch, AlertTriangle, BookMarked, MapPin, Search,
    ShoppingBag, Cpu, Layout, Flag, Zap, List, Trophy, MessageCircle,
    Headphones
};

const defaultCategories = [
    {
        title: 'Academics',
        slug: 'academics',
        icon: 'BookOpen',
        features: [
            { title: 'Study Materials', slug: 'study-materials', shortDescription: 'Curated subject notes uploaded by toppers and seniors.', icon: 'FileText', badge: 'Popular' },
            { title: 'PYQs', slug: 'pyqs', shortDescription: 'Previous years semester question papers sorted by scheme.', icon: 'HelpCircle', badge: 'Essential' },
            { title: 'SEE Papers', slug: 'see-papers', shortDescription: 'Semester End Examination past papers with answer guides.', icon: 'Award' },
            { title: 'Internal Papers', slug: 'internal-papers', shortDescription: 'Test 1, Test 2, and Test 3 internal exam question archives.', icon: 'Edit3' },
            { title: 'Question Banks', slug: 'question-banks', shortDescription: 'Module-wise important questions compiled by faculty.', icon: 'Layers' },
            { title: 'Faculty Ratings', slug: 'faculty-ratings', shortDescription: 'Anonymous teaching style insights and guidance.', icon: 'Star' },
            { title: 'Department Ratings', slug: 'department-ratings', shortDescription: 'Departmental lab facilities and course difficulty insights.', icon: 'Building' }
        ]
    },
    {
        title: 'Tools',
        slug: 'tools',
        icon: 'Calculator',
        features: [
            { title: 'CGPA Calculator', slug: 'cgpa-calculator', shortDescription: 'Instant accurate CGPA calculation according to SIT credit policy.', icon: 'Calculator', badge: 'Tool' },
            { title: 'SGPA Calculator', slug: 'sgpa-calculator', shortDescription: 'Calculate SGPA per semester with custom credit inputs.', icon: 'TrendingUp' },
            { title: 'CIE Analyzer', slug: 'cie-analyzer', shortDescription: 'Analyze required SEE marks based on your internal test marks.', icon: 'PieChart' },
            { title: 'Eligibility Checker', slug: 'eligibility-checker', shortDescription: 'Check placement cutoff and credit eligibility criteria.', icon: 'CheckSquare' },
            { title: 'Year Back Predictor', slug: 'year-back-predictor', shortDescription: 'Credit check tool to avoid academic year back risks.', icon: 'AlertTriangle' },
            { title: 'Branch Change Predictor', slug: 'branch-change-predictor', shortDescription: 'Analyze historical cutoff trends for 1st-year branch change.', icon: 'GitBranch' },
            { title: 'Attendance Tracker', slug: 'attendance-tracker', shortDescription: 'Track subject attendance percentages and safe bunk margin.', icon: 'CheckCircle' }
        ]
    },
    {
        title: 'Placements',
        slug: 'placements',
        icon: 'Briefcase',
        features: [
            { title: 'Interview Experiences', slug: 'interview-experiences', shortDescription: 'Real interview questions and rounds shared by placed seniors.', icon: 'UserCheck', badge: 'Verified' },
            { title: 'Company Cutoffs', slug: 'company-cutoffs', shortDescription: 'CGPA and branch eligibility cutoffs for visiting campus recruiters.', icon: 'CheckSquare' }
        ]
    },
    {
        title: 'Campus',
        slug: 'campus',
        icon: 'Building',
        features: [
            { title: 'Campus Map', slug: 'campus-map', shortDescription: 'Interactive map of blocks, canteens, hostels, and auditoriums.', icon: 'MapPin', badge: '3D Interactive' },
            { title: 'Lost & Found', slug: 'lost-and-found', shortDescription: 'Campus-wide portal to report and locate missing belongings.', icon: 'Search' },
            { title: 'Marketplace', slug: 'marketplace', shortDescription: 'Buy, sell, or exchange used textbooks, drafters, and equipment.', icon: 'ShoppingBag' },
            { title: 'Blogs', slug: 'blogs', shortDescription: 'Student articles, campus news, and academic survival guides.', icon: 'BookMarked' }
        ]
    },
    {
        title: 'AI',
        slug: 'ai',
        icon: 'Sparkles',
        features: [
            { title: 'Ask+ Chatbot (RAG)', slug: 'ask-plus-chatbot', shortDescription: 'Instant answers to academic syllabus and SIT query questions.', icon: 'Cpu', badge: 'AI Assistant' }
        ]
    },
    {
        title: 'Productivity',
        slug: 'productivity',
        icon: 'Activity',
        features: [
            { title: 'Personalized Dashboard', slug: 'personalized-dashboard', shortDescription: 'Single dashboard showing enrolled courses, schedule, and notes.', icon: 'Layout' },
            { title: '4-Year Academic Journey', slug: '4-year-academic-journey', shortDescription: 'Visual milestone roadmap from 1st sem to graduation.', icon: 'Flag' },
            { title: 'Streak System', slug: 'streak-system', shortDescription: 'Build daily study habits with active revision streaks.', icon: 'Zap' },
            { title: 'To-do List', slug: 'to-do-list', shortDescription: 'Prioritize assignments, lab submissions, and exam prep tasks.', icon: 'List' },
            { title: 'Leaderboard', slug: 'leaderboard', shortDescription: 'Gamified student rank based on academic contributions.', icon: 'Trophy' }
        ]
    },
    {
        title: 'Community',
        slug: 'community',
        icon: 'Users',
        features: [
            { title: 'WhatsApp Community', slug: 'whatsapp-community', shortDescription: 'Official year-wise WhatsApp groups for verified updates.', icon: 'MessageCircle', badge: 'Active' },
            { title: 'Student Support', slug: 'student-support', shortDescription: 'Direct chat assistance for academic and technical queries.', icon: 'Headphones' }
        ]
    }
];

const RenderIcon = ({ name, className = "w-4 h-4" }) => {
    const IconComponent = iconMap[name] || Sparkles;
    return <IconComponent className={className} />;
};

const PlatformFeaturesSection = ({ data }) => {
    if (data && data.isVisible === false) return null;

    const rawCategories = data?.featureCategories && data.featureCategories.length > 0
        ? data.featureCategories
        : defaultCategories;

    const categories = [...rawCategories].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Default to the first category (Academics)
    const [activeSlug, setActiveSlug] = useState('academics');

    const activeCategory = categories.find(c => c.slug === activeSlug) || categories[0];
    const displayedCategories = activeCategory ? [activeCategory] : categories;

    return (
        <section id="features" className="py-14 px-6 relative bg-[#030712] overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Platform Features</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-outfit tracking-tight mb-2">
                        {data?.sectionTitle || 'Everything You Need in One Platform'}
                    </h2>
                    <p className="text-slate-400 text-sm font-normal">
                        {data?.sectionSubtitle || 'Discover features built specifically for SIT academic curriculum and campus ecosystem.'}
                    </p>
                </div>

                {/* Category Navigation Tabs starting from Academics */}
                <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none snap-x snap-mandatory touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0">
                    {categories.map((cat) => {
                        const isActive = activeSlug === cat.slug;
                        return (
                            <button
                                key={cat.slug}
                                onClick={() => setActiveSlug(cat.slug)}
                                className={`snap-start min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 touch-manipulation ${
                                    isActive
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-[1.02]'
                                        : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/5'
                                }`}
                            >
                                <RenderIcon name={cat.icon} className="w-4 h-4" />
                                <span>{cat.title}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Features Display for Selected Category */}
                <div className="space-y-8">
                    {displayedCategories.map((category) => {
                        const sortedFeatures = (category.features || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

                        return (
                            <div key={category.slug} className="space-y-4">
                                <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                                    <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-300">
                                        <RenderIcon name={category.icon} className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white font-outfit">{category.title}</h3>
                                    <span className="text-xs text-slate-500">({sortedFeatures.length} features)</span>
                                </div>

                                {/* 1 column on mobile, 2 on sm, 3 on md */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {sortedFeatures.map((feature) => (
                                        <div
                                            key={feature.slug || feature.title}
                                            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 active:bg-white/[0.05] transition-all flex items-start gap-3.5"
                                        >
                                            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0 mt-0.5">
                                                <RenderIcon name={feature.icon} className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                                    <h4 className="text-sm font-semibold text-white tracking-tight truncate">
                                                        {feature.title}
                                                    </h4>
                                                    {feature.badge && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                                            {feature.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {feature.shortDescription && (
                                                    <p className="text-xs text-slate-400 font-normal leading-relaxed line-clamp-2">
                                                        {feature.shortDescription}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default PlatformFeaturesSection;

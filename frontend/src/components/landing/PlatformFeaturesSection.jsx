import React, { useState } from 'react';
import {
    BookOpen, Briefcase, Building, Sparkles, Activity, Users,
    FileText, HelpCircle, Award, Edit3, Layers, Calculator,
    TrendingUp, PieChart, CheckCircle, Star, UserCheck, CheckSquare,
    Compass, GitBranch, AlertTriangle, BookMarked, MapPin, Search,
    ShoppingBag, Cpu, Layout, Flag, Zap, List, Trophy, MessageCircle,
    Headphones, Code, Calendar, Check
} from 'lucide-react';

const iconMap = {
    BookOpen, Briefcase, Building, Sparkles, Activity, Users,
    FileText, HelpCircle, Award, Edit3, Layers, Calculator,
    TrendingUp, PieChart, CheckCircle, Star, UserCheck, CheckSquare,
    Compass, GitBranch, AlertTriangle, BookMarked, MapPin, Search,
    ShoppingBag, Cpu, Layout, Flag, Zap, List, Trophy, MessageCircle,
    Headphones, Code, Calendar, Check
};

const defaultCategories = [
    {
        title: 'Academics',
        slug: 'academics',
        icon: 'BookOpen',
        features: [
            { title: 'Study Materials & Notes', slug: 'study-materials', shortDescription: 'Curated subject notes & reference PDFs uploaded by toppers.', icon: 'FileText', badge: 'Popular' },
            { title: 'Solved SEE PYQs', slug: 'pyqs', shortDescription: 'Previous years semester exam question papers with step-by-step solutions.', icon: 'HelpCircle', badge: 'Essential' },
            { title: 'Question Banks', slug: 'question-banks', shortDescription: 'Module-wise important questions compiled with model answer keys.', icon: 'Layers' },
            { title: '1-Credit Quizzes', slug: '1-credit-quizzes', shortDescription: 'Targeted quizzes for 1-credit NCMC and AEC subjects.', icon: 'Award' },
            { title: 'Curated Roadmaps', slug: 'roadmaps', shortDescription: 'Semester-by-semester engineering and branch survival guides.', icon: 'Compass' },
            { title: 'Faculty & Department Ratings', slug: 'faculty-ratings', shortDescription: 'Anonymous teaching style insights, lab evaluations, and elective tips.', icon: 'Star' }
        ]
    },
    {
        title: 'Academic Tools',
        slug: 'tools',
        icon: 'Calculator',
        features: [
            { title: 'Smart Attendance Tracker', slug: 'attendance-tracker', shortDescription: 'Section timetable sync, lab batch filter & safe bunk ("Can Miss") equation.', icon: 'CheckCircle', badge: 'Plus' },
            { title: 'Today\'s Classes Tracker', slug: 'todays-classes', shortDescription: 'Real-time schedule of upcoming lectures and lab batches.', icon: 'Calendar', badge: 'Plus' },
            { title: 'CIE 50-Mark Analyzer', slug: 'cie-analyzer', shortDescription: 'Best-of-N normalization and IPCC theory/lab split calculators.', icon: 'PieChart', badge: 'Plus' },
            { title: 'SEE Target Grade Forecaster', slug: 'see-forecaster', shortDescription: 'Calculate required SEE marks to achieve target semester grades.', icon: 'TrendingUp', badge: 'Plus' },
            { title: 'CGPA & SGPA Calculator', slug: 'cgpa-calculator', shortDescription: 'Instant accurate calculations calibrated to SIT choice-based credit policies.', icon: 'Calculator' },
            { title: 'Branch Change Predictor', slug: 'branch-change-predictor', shortDescription: 'Analyze historical department cutoffs and live CGPA gap (Δ).', icon: 'GitBranch', badge: 'Plus' },
            { title: 'Year Back & Eligibility Checker', slug: 'eligibility-checker', shortDescription: 'Pre-exam dual compliance audit (85% attendance + 20 CIE) & deficit pathways.', icon: 'AlertTriangle', badge: 'Plus' }
        ]
    },
    {
        title: 'Lab & Coding',
        slug: 'lab-coding',
        icon: 'Code',
        features: [
            { title: 'Monaco Coding Playground', slug: 'coding-playground', shortDescription: 'In-browser editor supporting C, C++, Java, and Python.', icon: 'Code', badge: 'Interactive' },
            { title: 'College Labset Programs', slug: 'labset-programs', shortDescription: 'Official SIT lab manual problems with automated test case validation.', icon: 'Layers', badge: 'Verified' }
        ]
    },
    {
        title: 'Placements',
        slug: 'placements',
        icon: 'Briefcase',
        features: [
            { title: 'Senior Interview Experiences', slug: 'interview-experiences', shortDescription: 'Real interview rounds, technical questions & OA patterns from placed seniors.', icon: 'UserCheck', badge: 'Verified' },
            { title: 'Company Cutoffs', slug: 'company-cutoffs', shortDescription: 'CGPA and branch eligibility cutoffs for visiting campus recruiters.', icon: 'CheckSquare' }
        ]
    },
    {
        title: 'Campus & Community',
        slug: 'campus',
        icon: 'Building',
        features: [
            { title: 'Interactive Campus Map', slug: 'campus-map', shortDescription: 'Interactive 2D/3D map of blocks, departments, canteens, and auditoriums.', icon: 'MapPin', badge: '3D Interactive' },
            { title: 'WhatsApp Community', slug: 'whatsapp-community', shortDescription: 'Official SIT student community for real-time peer doubt solving.', icon: 'MessageCircle', badge: 'Active' },
            { title: 'Personalized Command Dashboard', slug: 'dashboard', shortDescription: 'Central hub tracking your streak habits, today\'s classes & 4-year journey.', icon: 'Layout' },
            { title: 'Lost & Found Portal', slug: 'lost-and-found', shortDescription: 'Campus-wide portal to quickly reconnect lost items with their owners.', icon: 'Search' }
        ]
    }
];

const RenderIcon = ({ name, className = "w-4 h-4" }) => {
    const IconComponent = iconMap[name] || Sparkles;
    return <IconComponent className={className} />;
};

const PlatformFeaturesSection = ({ data }) => {
    // Default to the first category (Academics)
    const [activeSlug, setActiveSlug] = useState('academics');

    if (data && data.isVisible === false) return null;

    const rawCategories = data?.featureCategories && data.featureCategories.length > 0
        ? data.featureCategories
        : defaultCategories;

    const categories = [...rawCategories].sort((a, b) => (a.order || 0) - (b.order || 0));

    const activeCategory = categories.find(c => c.slug === activeSlug) || categories[0];
    const displayedCategories = activeCategory ? [activeCategory] : categories;

    return (
        <section id="features" className="py-16 px-6 relative bg-transparent border-b border-[#E5E7EB] dark:border-[#292E37]">
            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] text-xs font-medium uppercase tracking-wider mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Platform Features</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight mb-2">
                        {data?.sectionTitle || 'Everything You Need in One Platform'}
                    </h2>
                    <p className="text-[#4B5563] dark:text-[#A1A1AA] text-sm font-normal">
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
                                className={`snap-start min-h-[36px] px-3.5 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors duration-150 flex items-center gap-2 touch-manipulation cursor-pointer border ${
                                    isActive
                                        ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                                        : 'bg-white dark:bg-[#15181D] text-[#374151] dark:text-[#D1D5DB] hover:text-[#111827] dark:hover:text-[#F3F4F6] border-[#E5E7EB] dark:border-[#292E37]'
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
                                <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E7EB] dark:border-[#292E37]">
                                    <div className="p-1.5 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 text-[#7C3AED] dark:text-[#A78BFA]">
                                        <RenderIcon name={category.icon} className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[#111827] dark:text-[#F3F4F6]">{category.title}</h3>
                                    <span className="text-xs text-[#6B7280] dark:text-[#71717A]">({sortedFeatures.length} features)</span>
                                </div>

                                {/* 1 column on mobile, 2 on sm, 3 on md */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {sortedFeatures.map((feature) => (
                                        <div
                                            key={feature.slug || feature.title}
                                            className="p-4 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] hover:border-[#D1D5DB] dark:hover:border-[#3E4451] transition-colors flex items-start gap-3.5 shadow-none"
                                        >
                                            <div className="p-2 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 text-[#7C3AED] dark:text-[#A78BFA] border border-[#E9D5FF] dark:border-[#7C3AED]/30 shrink-0 mt-0.5">
                                                <RenderIcon name={feature.icon} className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                                    <h4 className="text-sm font-semibold text-[#111827] dark:text-[#F3F4F6] tracking-tight truncate">
                                                        {feature.title}
                                                    </h4>
                                                    {feature.badge && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF5FF] dark:bg-[#581C87]/20 text-[#7C3AED] dark:text-[#DDD6FE] border border-[#E9D5FF] dark:border-[#7C3AED]/30 shrink-0">
                                                            {feature.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {feature.shortDescription && (
                                                    <p className="text-xs text-[#4B5563] dark:text-[#A1A1AA] font-normal leading-relaxed line-clamp-2">
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

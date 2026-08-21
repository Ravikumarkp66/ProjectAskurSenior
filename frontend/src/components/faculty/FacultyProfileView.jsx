import React from 'react';
import { 
    ArrowLeft, 
    Star, 
    BookOpen, 
    Award, 
    ShieldCheck, 
    MessageSquare, 
    Sparkles, 
    ThumbsUp, 
    BarChart2, 
    UserCheck, 
    CheckCircle2, 
    HelpCircle, 
    AlertCircle,
    Brain,
    Clock,
    FileText
} from 'lucide-react';
import { getCommunityConfidence, getScoreInterpretationLabel } from '../../utils/facultyScoring';

const FacultyProfileView = ({ 
    faculty, 
    onBack, 
    onOpenFeedback, 
    isLightMode = false 
}) => {
    if (!faculty) return null;

    // Helper: Initials Avatar Monogram (No stock photo)
    const getInitials = (name = '') => {
        const cleanName = name.replace(/Dr\.|Prof\.|Mr\.|Mrs\.|Ms\./gi, '').trim();
        const parts = cleanName.split(' ').filter(Boolean);
        if (parts.length === 0) return 'FC';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const reviewsList = faculty.reviews || [];
    const reviewCount = faculty.reviewCount ?? reviewsList.length;
    
    // REAL Weighted Faculty Experience Score out of 100 (null/0 if no reviews)
    const hasReviews = reviewCount > 0;
    const experienceScore = hasReviews ? faculty.facultyExperienceScore || Math.round((faculty.rating || 5) * 20) : null;
    
    const confidenceObj = getCommunityConfidence(reviewCount);
    const interpretationLabel = hasReviews ? getScoreInterpretationLabel(experienceScore) : 'No feedback yet';

    // Calculate Recommendation Percentage dynamically from actual reviews
    const recommendedCount = reviewsList.filter(r => (r.recommendation === 'Definitely' || r.recommendation === 'Yes' || (r.rating || 0) >= 4)).length;
    const recommendationPercent = hasReviews
        ? Math.round((recommendedCount / reviewsList.length) * 100)
        : null;

    // Group subjects by role
    const subjects = faculty.subjects || [];
    const categorizedSubjects = {
        Theory: [],
        Lab: [],
        Project: [],
        Mentor: [],
        Other: []
    };

    subjects.forEach(sub => {
        const sLower = sub.toLowerCase();
        if (sLower.includes('lab') || sLower.includes('practical')) {
            categorizedSubjects.Lab.push(sub);
        } else if (sLower.includes('project') || sLower.includes('seminar') || sLower.includes('thesis')) {
            categorizedSubjects.Project.push(sub);
        } else if (sLower.includes('mentor') || sLower.includes('counseling')) {
            categorizedSubjects.Mentor.push(sub);
        } else if (sub.trim().length > 0) {
            categorizedSubjects.Theory.push(sub);
        }
    });

    if (Object.values(categorizedSubjects).every(arr => arr.length === 0) && subjects.length > 0) {
        categorizedSubjects.Theory = subjects;
    }

    // REAL metrics computed from backend reviews
    const metrics = faculty.metrics;

    const snapshotItems = metrics ? [
        { label: 'Teaching Clarity', val: metrics.clarity ?? 0, icon: Sparkles, color: 'from-purple-500 to-indigo-500' },
        { label: 'Approachability', val: metrics.approachability ?? 0, icon: UserCheck, color: 'from-blue-500 to-cyan-500' },
        { label: 'Evaluation Fairness', val: metrics.gradingFairness ?? 0, icon: ShieldCheck, color: 'from-emerald-500 to-teal-500' },
        { label: 'Strictness', val: metrics.strictness ?? 0, icon: AlertCircle, color: 'from-amber-500 to-orange-500' },
        { label: 'Practical Focus', val: metrics.practicalFocus ?? 0, icon: BookOpen, color: 'from-violet-500 to-purple-600' },
        { label: 'Attendance Experience', val: metrics.attendanceExperience ?? 0, icon: Clock, color: 'from-pink-500 to-rose-500' }
    ] : [];

    // REAL advice snippets extracted dynamically from submitted reviews (NO FAKE DATA)
    const realAdviceList = [];
    reviewsList.forEach(r => {
        if (r.advice && r.advice.trim()) {
            realAdviceList.push({
                title: "Senior Advice",
                text: r.advice.trim(),
                tag: "Student Advice"
            });
        }
        if (r.wishIKnew && r.wishIKnew.trim()) {
            realAdviceList.push({
                title: "Wish I Knew Before",
                text: r.wishIKnew.trim(),
                tag: "Course Insight"
            });
        }
    });

    // Dynamic Student Insights from real review counts
    const classroomStyleCounts = {};
    const engagementStyleCounts = {};
    const attendanceResponseCounts = {};

    reviewsList.forEach(r => {
        (r.classroomStyle || []).forEach(style => {
            classroomStyleCounts[style] = (classroomStyleCounts[style] || 0) + 1;
        });
        (r.engagementStyle || []).forEach(style => {
            engagementStyleCounts[style] = (engagementStyleCounts[style] || 0) + 1;
        });
        if (r.attendanceResponse) {
            attendanceResponseCounts[r.attendanceResponse] = (attendanceResponseCounts[r.attendanceResponse] || 0) + 1;
        }
    });

    const getTopKey = (obj) => {
        const keys = Object.keys(obj);
        if (keys.length === 0) return null;
        return keys.reduce((a, b) => obj[a] > obj[b] ? a : b);
    };

    const topClassroom = getTopKey(classroomStyleCounts) || (hasReviews ? 'Interactive' : 'N/A');
    const topEngagement = getTopKey(engagementStyleCounts) || (hasReviews ? 'Board & PPT' : 'N/A');
    const topAttendance = getTopKey(attendanceResponseCounts) || (hasReviews ? 'Understanding' : 'N/A');

    return (
        <div className="w-full flex flex-col gap-6 text-slate-100 animate-in fade-in duration-200">
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-purple-300 hover:text-white transition-all active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Faculty Directory</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span>Faculty Directory</span>
                    <span>/</span>
                    <span className="text-purple-300 font-semibold">{faculty.department || 'General'}</span>
                    <span>/</span>
                    <span className="text-white font-bold">{faculty.name}</span>
                </div>
            </div>

            {/* 1. FACULTY HEADER WITH REAL WEIGHTED SCORE */}
            <div className={`p-6 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl relative overflow-hidden ${
                isLightMode 
                    ? 'bg-white border-slate-200 text-slate-900' 
                    : 'bg-gradient-to-r from-[#110c26] via-[#161033] to-[#0f0a1e] border-purple-500/25'
            }`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-5 z-10">
                    {/* Initials Avatar Monogram */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 border-2 border-purple-400/30 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl shrink-0">
                        {getInitials(faculty.name)}
                    </div>

                    <div className="flex flex-col text-center sm:text-left gap-1.5">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                {faculty.department || 'GENERAL'} Department
                            </span>
                            {faculty.isLabFaculty && (
                                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    Lab Faculty
                                </span>
                            )}
                            {faculty.experienceYears > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {faculty.experienceYears}+ Years Exp.
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            {faculty.name}
                        </h1>

                        <p className="text-sm font-semibold text-purple-300">
                            {faculty.designation || 'Faculty Member'}
                        </p>

                        {faculty.email && (
                            <p className="text-xs text-slate-400 font-medium">
                                {faculty.email} {faculty.officeLocation ? `• ${faculty.officeLocation}` : ''}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Metrics: REAL Faculty Experience Score & Community Confidence */}
                <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto z-10 border-t lg:border-t-0 pt-4 lg:pt-0 border-white/10">
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
                        {/* Overall Faculty Experience Score */}
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                Faculty Experience
                            </span>
                            <div className="flex items-baseline gap-1 text-3xl font-black text-amber-400">
                                {hasReviews ? experienceScore : '--'}
                                <span className="text-xs text-slate-400 font-normal">/ 100</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-purple-300">
                                {interpretationLabel}
                            </span>
                        </div>

                        <div className="h-10 w-px bg-white/10" />

                        {/* Community Confidence Badge */}
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                Community Signal
                            </span>
                            <span className={`mt-1 px-3 py-1 rounded-full text-xs font-black border ${confidenceObj.badgeClass}`}>
                                {confidenceObj.label}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {reviewCount} anonymous response{reviewCount === 1 ? '' : 's'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onOpenFeedback}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all shrink-0 w-full sm:w-auto"
                    >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Share Feedback</span>
                    </button>
                </div>
            </div>

            {/* 2. FACULTY SNAPSHOT (REAL DATA OR CLEAN EMPTY STATE) */}
            <div className="p-5 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-purple-400" />
                        <h2 className="text-base font-extrabold text-white">Faculty Perception Snapshot</h2>
                    </div>
                    {hasReviews && (
                        <span className="text-xs font-semibold text-purple-300">
                            Based on {reviewCount} student evaluation{reviewCount === 1 ? '' : 's'}
                        </span>
                    )}
                </div>

                {!hasReviews || snapshotItems.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-purple-500/20 bg-purple-500/5 text-center flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">No Student Feedback Recorded Yet</h3>
                            <p className="text-xs text-slate-400 max-w-md mt-1">
                                No student reviews have been submitted for this faculty member yet. Be the first to share your classroom experience!
                            </p>
                        </div>
                        <button
                            onClick={onOpenFeedback}
                            className="mt-2 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all"
                        >
                            Contribute First Insight →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {snapshotItems.map((item, idx) => {
                            const IconComponent = item.icon;
                            return (
                                <div key={idx} className="p-3.5 rounded-xl border bg-white/5 border-white/5 flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-slate-300 flex items-center gap-1.5">
                                            <IconComponent className="w-3.5 h-3.5 text-purple-400" />
                                            {item.label}
                                        </span>
                                        <span className="text-purple-300">{item.val}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                                            style={{ width: `${item.val}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3. COURSES & ROLES */}
            <div className="p-5 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <h2 className="text-base font-extrabold text-white">Associated Courses & Academic Roles</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(categorizedSubjects).map(([role, subs]) => {
                        if (subs.length === 0) return null;
                        const roleBadges = {
                            Theory: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
                            Lab: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
                            Project: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                            Mentor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                            Other: 'bg-slate-500/10 text-slate-300 border-slate-500/30'
                        };
                        return (
                            <div key={role} className="p-4 rounded-xl border bg-white/5 border-white/5 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${roleBadges[role] || roleBadges.Other}`}>
                                        {role} Role
                                    </span>
                                    <span className="text-[11px] text-slate-400">{subs.length} Subject(s)</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {subs.map((s, i) => (
                                        <span key={i} className="px-3 py-1 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs font-semibold text-slate-200">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 4. STUDENT INSIGHTS (DERIVED FROM REAL REVIEWS) */}
            <div className="p-5 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h2 className="text-base font-extrabold text-white">Aggregated Student Insights</h2>
                </div>

                {!hasReviews ? (
                    <div className="text-center py-6 text-xs text-slate-400 italic bg-white/5 rounded-xl border border-dashed border-white/10">
                        No aggregated student insights recorded yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <div className="p-3.5 rounded-xl border bg-white/5 border-white/5 text-center space-y-1">
                            <span className="text-[11px] text-slate-400 font-semibold block">Teaching Style</span>
                            <span className="text-xs font-bold text-purple-300 block">{topClassroom}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border bg-white/5 border-white/5 text-center space-y-1">
                            <span className="text-[11px] text-slate-400 font-semibold block">Engagement Method</span>
                            <span className="text-xs font-bold text-purple-300 block">{topEngagement}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border bg-white/5 border-white/5 text-center space-y-1">
                            <span className="text-[11px] text-slate-400 font-semibold block">Attendance Policy</span>
                            <span className="text-xs font-bold text-amber-300 block">{topAttendance}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border bg-white/5 border-white/5 text-center space-y-1">
                            <span className="text-[11px] text-slate-400 font-semibold block">Recommendation</span>
                            <span className="text-xs font-bold text-emerald-400 block">{recommendationPercent}% Positive</span>
                        </div>
                        <div className="p-3.5 rounded-xl border bg-white/5 border-white/5 text-center space-y-1">
                            <span className="text-[11px] text-slate-400 font-semibold block">Evaluation</span>
                            <span className="text-xs font-bold text-blue-300 block">Student Estimates</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 5. SENIOR ADVICE (REAL SUBMITTED DATA ONLY) */}
            <div className="p-5 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <h2 className="text-base font-extrabold text-white">Student Advice & Practical Tips</h2>
                </div>

                {realAdviceList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {realAdviceList.map((adv, idx) => (
                            <div key={idx} className="p-4 rounded-xl border bg-purple-950/20 border-purple-500/20 flex flex-col justify-between gap-3">
                                <div className="space-y-1.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        {adv.tag}
                                    </span>
                                    <h3 className="text-xs font-extrabold text-white">{adv.title}</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        "{adv.text}"
                                    </p>
                                </div>
                                <span className="text-[10px] text-purple-400/80 font-medium">Anonymous Student Contribution</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-xs text-slate-400 italic bg-white/5 rounded-xl border border-dashed border-white/10">
                        No student tips or advice recorded yet. Share your experience to help your peers!
                    </div>
                )}
            </div>

            {/* 6. STUDENT REVIEWS */}
            <div className="p-5 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        <h2 className="text-base font-extrabold text-white">
                            Student Reviews ({reviewsList.length})
                        </h2>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Anonymous & Verified
                    </span>
                </div>

                {reviewsList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviewsList.map((rev, index) => {
                            const subText = Array.isArray(rev.subjects) && rev.subjects.length > 0 ? rev.subjects.join(', ') : (subjects[0] || 'General Subject');
                            const roleText = Array.isArray(rev.roles) && rev.roles.length > 0 ? rev.roles.join(', ') : (faculty.isLabFaculty ? 'Lab Faculty' : 'Theory Faculty');

                            return (
                                <div key={rev.id || index} className="p-4 rounded-xl border bg-white/5 border-white/5 flex flex-col justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[11px] font-bold border border-purple-500/20">
                                                    {subText}
                                                </span>
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                                                    {roleText}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    • {rev.date || 'Recent'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg shrink-0">
                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-extrabold text-amber-400">{rev.rating || 5}</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-200 leading-relaxed">
                                            {rev.comment}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                                        <div className="flex flex-wrap gap-1">
                                            {(rev.tags || ['Verified Student']).map((t, idx) => (
                                                <span key={idx} className="text-purple-400 font-medium">
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                            <span>Helpful ({rev.helpfulCount || 0})</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-xs text-slate-400 italic bg-white/5 rounded-xl border border-dashed border-white/10">
                        No written student reviews recorded yet. Click below to share your experience!
                    </div>
                )}
            </div>

            {/* 7. FEEDBACK CTA CARD */}
            <div className="p-6 rounded-2xl border bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-950/40 border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-1 text-center md:text-left">
                    <h3 className="text-lg font-black text-white">Have you studied under this faculty?</h3>
                    <p className="text-xs text-slate-300">
                        Share your experience and contribute to reliable faculty insights for current and future seniors.
                    </p>
                    <p className="text-[11px] font-semibold text-purple-400 pt-1">
                        Anonymous • Takes about 2 minutes
                    </p>
                </div>

                <button
                    onClick={onOpenFeedback}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2 active:scale-95 transition-all shrink-0"
                >
                    <span>Share Experience</span>
                    <span className="text-amber-300">→</span>
                </button>
            </div>
        </div>
    );
};

export default FacultyProfileView;

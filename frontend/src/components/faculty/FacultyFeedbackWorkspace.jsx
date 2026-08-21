import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, 
    Sparkles, 
    BookOpen, 
    Award, 
    ShieldCheck, 
    UserCheck, 
    Search, 
    Check, 
    Info, 
    ArrowRight, 
    Users, 
    Clock, 
    Monitor, 
    PenTool, 
    ShieldAlert, 
    AlertCircle, 
    Send,
    Maximize2,
    Save
} from 'lucide-react';
import { calculateSubmissionScore } from '../../utils/facultyScoring';

const FacultyFeedbackWorkspace = ({ 
    faculty, 
    onExit, 
    onViewInsights, 
    onReturnToDirectory, 
    onSubmitReview, 
    isLightMode = false 
}) => {
    const facultyId = faculty?.id || faculty?._id || faculty?.facultyId;

    // Exit confirmation modal state
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Track native browser Fullscreen API state
    const [isFullscreenActive, setIsFullscreenActive] = useState(!!document.fullscreenElement);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreenActive(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const handleResumeFullscreen = () => {
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => console.warn(err));
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            }
        } catch (e) {}
    };

    const handleExitFullscreen = () => {
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.warn(err));
            }
        } catch (e) {}
    };

    // Available subjects from faculty dataset
    const availableSubjects = useMemo(() => {
        if (!faculty) return ['General Subject'];
        if (Array.isArray(faculty.subjects) && faculty.subjects.length > 0) {
            return faculty.subjects;
        }
        return ['Data Structures', 'Database Management', 'Object Oriented Programming', 'Operating Systems', 'Web Technology'];
    }, [faculty]);

    // SECTION 01: YOUR EXPERIENCE
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectSearch, setSubjectSearch] = useState('');

    const roleOptions = [
        { id: 'Theory Faculty', label: 'Theory Faculty', icon: BookOpen },
        { id: 'Lab Faculty', label: 'Lab Faculty', icon: Award },
        { id: 'Project Guide', label: 'Project Guide', icon: Sparkles },
        { id: 'Proctor / Mentor', label: 'Proctor / Mentor', icon: UserCheck },
        { id: 'HOD', label: 'HOD', icon: ShieldCheck }
    ];
    const [selectedRoles, setSelectedRoles] = useState([]);

    // SECTION 02: INSIDE THE CLASSROOM
    const classroomOptions = [
        { id: 'Interactive', label: 'Interactive', icon: Users },
        { id: 'Very strict about time / discipline', label: 'Very strict about time / discipline', icon: ShieldAlert },
        { id: 'Boring / difficult to stay engaged', label: 'Boring / difficult to stay engaged', icon: Clock },
        { id: 'Mostly one-way teaching', label: 'Mostly one-way teaching', icon: Monitor }
    ];
    const [selectedClassroom, setSelectedClassroom] = useState([]);

    const engagementOptions = [
        { id: 'PPT / Slides', label: 'PPT / Slides', icon: Monitor },
        { id: 'Pen & Board', label: 'Pen & Board', icon: PenTool },
        { id: 'Chalk & Board', label: 'Chalk & Board', icon: BookOpen }
    ];
    const [selectedEngagement, setSelectedEngagement] = useState([]);

    // SECTION 03: STUDENT EXPERIENCE
    const performanceOptions = [
        'No noticeable difference',
        'Tends to favor high-performing students',
        'Tends to favor students who are struggling',
        'Treats high-performing students more strictly',
        'Treats struggling students more strictly',
        'Treats students differently based on marks / academic performance',
        "I haven't noticed / Not sure"
    ];
    const [selectedPerformanceTreatment, setSelectedPerformanceTreatment] = useState([]);

    const singledOutOptions = [
        "No, I haven't noticed this",
        'Sometimes',
        'Frequently',
        'Yes, but only in specific situations',
        "I haven't noticed / Not sure"
    ];
    const [selectedSingledOut, setSelectedSingledOut] = useState('');

    const approachabilityOptions = [
        'Very approachable',
        'Usually approachable',
        'Sometimes approachable',
        'Often difficult to reach',
        'Almost never available',
        'Tends to neglect students',
        'Never tried approaching'
    ];
    const [selectedApproachability, setSelectedApproachability] = useState('');

    // SECTION 04: MARKS & EVALUATION
    const [cieMarks, setCieMarks] = useState(null);
    const [isCieNotSure, setIsCieNotSure] = useState(false);

    const [internalMarks, setInternalMarks] = useState(null);
    const [isInternalNotSure, setIsInternalNotSure] = useState(false);

    const [quizMarks, setQuizMarks] = useState(null);
    const [isQuizNotSure, setIsQuizNotSure] = useState(false);

    // SECTION 05: ATTENDANCE EXPERIENCE
    const attendanceOptions = [
        'Usually understanding',
        'Sometimes understanding',
        'Strict about the attendance requirement',
        'Considered genuine reasons on a case-by-case basis',
        'Usually did not make exceptions',
        'I never experienced this situation',
        'Not sure'
    ];
    const [selectedAttendanceResponse, setSelectedAttendanceResponse] = useState('');

    // SECTION 06: YOUR TAKE
    const [wishIKnew, setWishIKnew] = useState('');
    const [advice, setAdvice] = useState('');

    // SECTION 07: FINAL VERDICT
    const suggestOptions = [
        'Definitely',
        'Yes',
        'Depends on the student',
        'Probably not',
        'No'
    ];
    const [selectedSuggest, setSelectedSuggest] = useState('');

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Local Storage Draft Autosave & Restore
    const draftStorageKey = `faculty_feedback_draft_${facultyId}`;

    useEffect(() => {
        if (!facultyId) return;
        try {
            const savedDraft = localStorage.getItem(draftStorageKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.selectedSubjects) setSelectedSubjects(parsed.selectedSubjects);
                if (parsed.selectedRoles) setSelectedRoles(parsed.selectedRoles);
                if (parsed.selectedClassroom) setSelectedClassroom(parsed.selectedClassroom);
                if (parsed.selectedEngagement) setSelectedEngagement(parsed.selectedEngagement);
                if (parsed.selectedPerformanceTreatment) setSelectedPerformanceTreatment(parsed.selectedPerformanceTreatment);
                if (parsed.selectedSingledOut !== undefined) setSelectedSingledOut(parsed.selectedSingledOut);
                if (parsed.selectedApproachability !== undefined) setSelectedApproachability(parsed.selectedApproachability);
                if (parsed.cieMarks !== undefined) setCieMarks(parsed.cieMarks);
                if (parsed.isCieNotSure !== undefined) setIsCieNotSure(parsed.isCieNotSure);
                if (parsed.internalMarks !== undefined) setInternalMarks(parsed.internalMarks);
                if (parsed.isInternalNotSure !== undefined) setIsInternalNotSure(parsed.isInternalNotSure);
                if (parsed.quizMarks !== undefined) setQuizMarks(parsed.quizMarks);
                if (parsed.isQuizNotSure !== undefined) setIsQuizNotSure(parsed.isQuizNotSure);
                if (parsed.selectedAttendanceResponse !== undefined) setSelectedAttendanceResponse(parsed.selectedAttendanceResponse);
                if (parsed.wishIKnew) setWishIKnew(parsed.wishIKnew);
                if (parsed.advice) setAdvice(parsed.advice);
                if (parsed.selectedSuggest !== undefined) setSelectedSuggest(parsed.selectedSuggest);
            }
        } catch (e) {}
    }, [facultyId]);

    // Autosave on state changes
    useEffect(() => {
        if (!facultyId || isSubmitted) return;
        try {
            const draftObj = {
                selectedSubjects,
                selectedRoles,
                selectedClassroom,
                selectedEngagement,
                selectedPerformanceTreatment,
                selectedSingledOut,
                selectedApproachability,
                cieMarks,
                isCieNotSure,
                internalMarks,
                isInternalNotSure,
                quizMarks,
                isQuizNotSure,
                selectedAttendanceResponse,
                wishIKnew,
                advice,
                selectedSuggest
            };
            localStorage.setItem(draftStorageKey, JSON.stringify(draftObj));
        } catch (e) {}
    }, [
        facultyId, isSubmitted, selectedSubjects, selectedRoles, selectedClassroom,
        selectedEngagement, selectedPerformanceTreatment, selectedSingledOut,
        selectedApproachability, cieMarks, isCieNotSure, internalMarks,
        isInternalNotSure, quizMarks, isQuizNotSure, selectedAttendanceResponse,
        wishIKnew, advice, selectedSuggest
    ]);

    // Multi-select toggle helper
    const toggleArrayOption = (currentList, setList, item) => {
        if (currentList.includes(item)) {
            setList(currentList.filter(i => i !== item));
        } else {
            setList([...currentList, item]);
        }
    };

    // Calculate dynamic progress out of 12 questions
    const answeredCount = useMemo(() => {
        let count = 0;
        if (selectedSubjects.length > 0) count++;
        if (selectedRoles.length > 0) count++;
        if (selectedClassroom.length > 0) count++;
        if (selectedEngagement.length > 0) count++;
        if (selectedPerformanceTreatment.length > 0) count++;
        if (selectedSingledOut !== '') count++;
        if (selectedApproachability !== '') count++;
        if (isCieNotSure || cieMarks !== null) count++;
        if (selectedAttendanceResponse !== '') count++;
        if (wishIKnew.trim().length > 0) count++;
        if (advice.trim().length > 0) count++;
        if (selectedSuggest !== '') count++;
        return count;
    }, [
        selectedSubjects, selectedRoles, selectedClassroom, selectedEngagement,
        selectedPerformanceTreatment, selectedSingledOut, selectedApproachability,
        cieMarks, isCieNotSure, selectedAttendanceResponse, wishIKnew, advice, selectedSuggest
    ]);

    const progressPercentage = Math.round((answeredCount / 12) * 100);

    // Browser navigation / tab reload guard
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isSubmitted && answeredCount > 0) {
                const message = "Your answers are saved below and u can review afterwards!";
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isSubmitted, answeredCount]);

    // Validation before submission
    const isFormValid = selectedSubjects.length > 0 && selectedRoles.length > 0 && selectedClassroom.length > 0 && selectedEngagement.length > 0 && selectedSuggest !== '';

    const handleExitClick = () => {
        if (!isSubmitted && answeredCount > 0) {
            setShowExitConfirm(true);
        } else {
            handleExitFullscreen();
            onExit();
        }
    };

    const handleConfirmExit = () => {
        setShowExitConfirm(false);
        handleExitFullscreen();
        onExit();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsSubmitting(true);

        const rawData = {
            subjects: selectedSubjects,
            roles: selectedRoles,
            classroomStyle: selectedClassroom,
            engagementStyle: selectedEngagement,
            performanceTreatment: selectedPerformanceTreatment,
            singledOut: selectedSingledOut,
            approachability: selectedApproachability,
            cieMarks: isCieNotSure ? null : cieMarks,
            internalMarks: isInternalNotSure ? null : internalMarks,
            quizMarks: isQuizNotSure ? null : quizMarks,
            attendanceResponse: selectedAttendanceResponse,
            wishIKnew: wishIKnew.trim(),
            advice: advice.trim(),
            recommendation: selectedSuggest
        };

        const calculatedScore = calculateSubmissionScore(rawData);

        const feedbackData = {
            ...rawData,
            submissionScore: calculatedScore,
            comment: advice.trim() || wishIKnew.trim() || `Recommendation: ${selectedSuggest}`,
            rating: selectedSuggest === 'Definitely' || selectedSuggest === 'Yes' ? 5 : selectedSuggest === 'Depends on the student' ? 3 : 2
        };

        try {
            if (onSubmitReview) {
                await onSubmitReview(facultyId, feedbackData);
            }
            localStorage.removeItem(draftStorageKey);
            setIsSubmitted(true);
        } catch (err) {
            console.error("Error submitting feedback:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAvailableSubjects = availableSubjects.filter(s => 
        s.toLowerCase().includes(subjectSearch.trim().toLowerCase())
    );

    if (!faculty) return null;

    return (
        <div className="w-full flex flex-col gap-6 text-slate-100 animate-in fade-in duration-200 relative">
            {/* ESC EXITED FULLSCREEN NOTIFICATION BANNER */}
            {!isFullscreenActive && !isSubmitted && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200 text-xs shadow-lg">
                    <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Feedback mode was exited. Your answers are saved below and u can review afterwards!</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResumeFullscreen}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Resume Fullscreen</span>
                        </button>
                        <button
                            onClick={handleExitClick}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10"
                        >
                            Save & Exit
                        </button>
                    </div>
                </div>
            )}

            {/* EXIT CONFIRMATION MODAL */}
            <AnimatePresence>
                {showExitConfirm && (
                    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f111a] border border-purple-500/30 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center shadow-2xl"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                                <Save className="w-6 h-6" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-base font-black text-white">Are you sure you want to exit?</h3>
                                <p className="text-xs text-amber-300 font-semibold leading-relaxed">
                                    Your answers are saved below and u can review afterwards!
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    Your progress is saved locally. You can resume this feedback session whenever you return.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex-1 shadow-lg shadow-purple-600/30"
                                >
                                    Continue Feedback
                                </button>
                                <button
                                    onClick={handleConfirmExit}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-extrabold text-xs border border-white/10 flex-1"
                                >
                                    Save & Exit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* FEEDBACK HEADER */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl ${
                isLightMode 
                    ? 'bg-white border-slate-200 text-slate-900' 
                    : 'bg-gradient-to-r from-[#110c26] via-[#161033] to-[#0f0a1e] border-purple-500/25'
            }`}>
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                        <Sparkles className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-white">
                            Faculty Experience Feedback
                        </h1>
                        <p className="text-xs font-semibold text-purple-300">
                            {faculty.name} • {faculty.department || 'GENERAL'} Department
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                    <div className="text-left sm:text-right">
                        <p className="text-xs font-semibold text-slate-300">
                            Anonymous • Voluntary • About 2–3 minutes
                        </p>
                    </div>

                    <button
                        onClick={handleExitClick}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95 shrink-0"
                    >
                        Exit Feedback
                    </button>
                </div>
            </div>

            {/* PROGRESS INDICATOR (Sticky Top Bar) */}
            {!isSubmitted && (
                <div className="sticky top-0 z-20 px-5 py-3 rounded-2xl border bg-[#0d091f]/95 backdrop-blur-md border-white/10 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-white">Faculty Feedback</span>
                        <div className="w-32 sm:w-48 h-2 rounded-full bg-slate-800 overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                    <span className="text-xs font-bold text-purple-300 font-mono">
                        {answeredCount} / 12 answered
                    </span>
                </div>
            )}

            {/* POST-SUBMISSION SUCCESS STATE */}
            {isSubmitted ? (
                <div className="p-10 rounded-2xl border bg-[#0d091f]/90 border-purple-500/20 text-center flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-emerald-500 border-2 border-emerald-400/40 flex items-center justify-center text-white shadow-2xl">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-2 max-w-md">
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            Thanks for sharing your experience.
                        </h2>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            Your feedback has been recorded anonymously and contributes to community faculty insights.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Voluntary
                        </span>
                        <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Anonymous
                        </span>
                        <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Your identity is kept private
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 w-full max-w-md">
                        <button
                            onClick={() => { handleExitFullscreen(); onViewInsights(); }}
                            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <span>View Faculty Insights</span>
                            <ArrowRight className="w-4 h-4 text-amber-300" />
                        </button>

                        <button
                            onClick={() => { handleExitFullscreen(); onReturnToDirectory(); }}
                            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-extrabold text-sm transition-all"
                        >
                            Return to Faculty Directory
                        </button>
                    </div>
                </div>
            ) : (
                /* ONE LONG CONTINUOUS SCROLLABLE FORM */
                <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-12">
                    {/* 01 · YOUR EXPERIENCE */}
                    <div className="p-6 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-6">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-black">
                                01
                            </span>
                            <h2 className="text-base font-extrabold text-white">Your Experience</h2>
                        </div>

                        {/* Q1: What did this faculty teach you? */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-extrabold text-white flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-purple-400" />
                                    What did this faculty teach you?
                                </label>
                                <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                                    Select all subjects that apply
                                </span>
                            </div>

                            {availableSubjects.length > 3 && (
                                <div className="relative max-w-sm">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={subjectSearch}
                                        onChange={e => setSubjectSearch(e.target.value)}
                                        placeholder="Search subjects..."
                                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                                {filteredAvailableSubjects.map((sub, idx) => {
                                    const isSelected = selectedSubjects.includes(sub);
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => toggleArrayOption(selectedSubjects, setSelectedSubjects, sub)}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all active:scale-95 ${
                                                isSelected
                                                    ? 'bg-purple-600/30 border-purple-400 text-purple-100 shadow-md shadow-purple-900/40'
                                                    : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                                                isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-slate-600'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                            <span>{sub}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Q2: What role did this faculty play for you? */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-extrabold text-white flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-purple-400" />
                                    What role did this faculty play for you?
                                </label>
                                <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                                    Select all that apply
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
                                {roleOptions.map((role) => {
                                    const IconComponent = role.icon;
                                    const isSelected = selectedRoles.includes(role.id);
                                    return (
                                        <button
                                            type="button"
                                            key={role.id}
                                            onClick={() => toggleArrayOption(selectedRoles, setSelectedRoles, role.id)}
                                            className={`p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all active:scale-95 ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-400 text-white shadow-lg shadow-purple-950/50'
                                                    : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-xl border ${
                                                isSelected ? 'bg-purple-500 text-white border-purple-400' : 'bg-white/5 text-purple-400 border-white/10'
                                            }`}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-extrabold">{role.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 02 · INSIDE THE CLASSROOM */}
                    <div className="p-6 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-6">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-black">
                                02
                            </span>
                            <h2 className="text-base font-extrabold text-white">Inside the Classroom</h2>
                        </div>

                        {/* Q3: What was the class actually like? */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-extrabold text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-400" />
                                    What was the class actually like?
                                </label>
                                <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                                    Select all that apply
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {classroomOptions.map((opt) => {
                                    const IconComponent = opt.icon;
                                    const isSelected = selectedClassroom.includes(opt.id);
                                    return (
                                        <button
                                            type="button"
                                            key={opt.id}
                                            onClick={() => toggleArrayOption(selectedClassroom, setSelectedClassroom, opt.id)}
                                            className={`p-3.5 rounded-2xl border text-xs font-extrabold text-left flex items-center justify-between transition-all active:scale-95 ${
                                                isSelected
                                                    ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-900/40'
                                                    : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl border ${
                                                    isSelected ? 'bg-purple-500 text-white border-purple-400' : 'bg-white/5 text-purple-400 border-white/10'
                                                }`}>
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                <span>{opt.label}</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-slate-600'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Q4: How does this faculty usually engage the class? */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-extrabold text-white flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-purple-400" />
                                    How does this faculty usually engage the class?
                                </label>
                                <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                                    Select all that apply
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                {engagementOptions.map((opt) => {
                                    const IconComponent = opt.icon;
                                    const isSelected = selectedEngagement.includes(opt.id);
                                    return (
                                        <button
                                            type="button"
                                            key={opt.id}
                                            onClick={() => toggleArrayOption(selectedEngagement, setSelectedEngagement, opt.id)}
                                            className={`p-3.5 rounded-2xl border text-xs font-extrabold text-left flex items-center justify-between transition-all active:scale-95 ${
                                                isSelected
                                                    ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-900/40'
                                                    : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl border ${
                                                    isSelected ? 'bg-purple-500 text-white border-purple-400' : 'bg-white/5 text-purple-400 border-white/10'
                                                }`}>
                                                    <IconComponent className="w-4 h-4" />
                                                </div>
                                                <span>{opt.label}</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-slate-600'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 03 · STUDENT EXPERIENCE */}
                    <div className="p-6 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-6">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-black">
                                03
                            </span>
                            <h2 className="text-base font-extrabold text-white">Student Experience</h2>
                        </div>

                        {/* Q5: Academic performance treatment */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-extrabold text-white leading-snug">
                                    5. Based on your experience, have you noticed any difference in how this faculty treats students based on their academic performance?
                                </label>
                                <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20 shrink-0 ml-2">
                                    Select all that apply
                                </span>
                            </div>

                            <div className="space-y-2 pt-1">
                                {performanceOptions.map((opt, idx) => {
                                    const isSelected = selectedPerformanceTreatment.includes(opt);
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => toggleArrayOption(selectedPerformanceTreatment, setSelectedPerformanceTreatment, opt)}
                                            className={`w-full p-3.5 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all active:scale-95 ${
                                                isSelected
                                                    ? 'bg-purple-600/30 border-purple-400 text-white'
                                                    : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <span>{opt}</span>
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-slate-600'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Q6: Singled Out */}
                        <div className="space-y-3 pt-2">
                            <label className="text-sm font-extrabold text-white block leading-snug">
                                6. Based on your experience, does this faculty tend to single out or repeatedly target particular students?
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {singledOutOptions.map((opt, idx) => {
                                    const isSelected = selectedSingledOut === opt;
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => setSelectedSingledOut(opt)}
                                            className={`p-3.5 rounded-xl border text-xs font-semibold text-left flex items-center gap-3 transition-all ${
                                                isSelected
                                                    ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                                                    : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-600'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            <span>{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Q7: Approachability */}
                        <div className="space-y-3 pt-2">
                            <label className="text-sm font-extrabold text-white block">
                                7. How approachable is this faculty when you need help?
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {approachabilityOptions.map((opt, idx) => {
                                    const isSelected = selectedApproachability === opt;
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => setSelectedApproachability(opt)}
                                            className={`p-3.5 rounded-xl border text-xs font-semibold text-left flex items-center gap-3 transition-all ${
                                                isSelected
                                                    ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                                                    : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-600'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            <span>{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 04 · MARKS & EVALUATION */}
                    <div className="p-6 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-6">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-black">
                                04
                            </span>
                            <h2 className="text-base font-extrabold text-white">Marks & Evaluation</h2>
                        </div>

                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
                            <Info className="w-4 h-4 text-purple-400 shrink-0" />
                            <span>Share your best estimate. You can choose 'Not sure' if you don't remember. Student-reported estimates are not official statistics.</span>
                        </div>

                        {/* Q8A: Average CIE Marks (0-50) */}
                        <div className="p-4 rounded-2xl border bg-white/5 border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-extrabold text-white block">
                                        Average CIE marks (0–50)
                                    </label>
                                    <span className="text-[11px] text-slate-400 font-medium">Your best estimate</span>
                                </div>

                                <label className="flex items-center gap-2 text-xs font-bold text-purple-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isCieNotSure}
                                        onChange={e => {
                                            setIsCieNotSure(e.target.checked);
                                            if (e.target.checked) setCieMarks(null);
                                        }}
                                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Not sure</span>
                                </label>
                            </div>

                            {!isCieNotSure && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-purple-300">{cieMarks !== null ? `${cieMarks} / 50` : 'Not set (drag slider)'}</span>
                                        <span className="text-slate-400">{cieMarks !== null ? `${Math.round((cieMarks / 50) * 100)}%` : '--'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={cieMarks !== null ? cieMarks : 35}
                                        onChange={e => setCieMarks(Number(e.target.value))}
                                        className="w-full h-2 rounded-lg bg-slate-800 accent-purple-500 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Q8B: Average Internal Marks (0-50) */}
                        <div className="p-4 rounded-2xl border bg-white/5 border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-extrabold text-white block">
                                        Average Internal marks (0–50)
                                    </label>
                                    <span className="text-[11px] text-slate-400 font-medium">Your best estimate</span>
                                </div>

                                <label className="flex items-center gap-2 text-xs font-bold text-purple-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isInternalNotSure}
                                        onChange={e => {
                                            setIsInternalNotSure(e.target.checked);
                                            if (e.target.checked) setInternalMarks(null);
                                        }}
                                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Not sure</span>
                                </label>
                            </div>

                            {!isInternalNotSure && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-purple-300">{internalMarks !== null ? `${internalMarks} / 50` : 'Not set (drag slider)'}</span>
                                        <span className="text-slate-400">{internalMarks !== null ? `${Math.round((internalMarks / 50) * 100)}%` : '--'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={internalMarks !== null ? internalMarks : 35}
                                        onChange={e => setInternalMarks(Number(e.target.value))}
                                        className="w-full h-2 rounded-lg bg-slate-800 accent-purple-500 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Q8C: Average Quiz Marks (0-20) */}
                        <div className="p-4 rounded-2xl border bg-white/5 border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-extrabold text-white block">
                                        Average Quiz marks (0–20)
                                    </label>
                                    <span className="text-[11px] text-slate-400 font-medium">Your best estimate</span>
                                </div>

                                <label className="flex items-center gap-2 text-xs font-bold text-purple-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isQuizNotSure}
                                        onChange={e => {
                                            setIsQuizNotSure(e.target.checked);
                                            if (e.target.checked) setQuizMarks(null);
                                        }}
                                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span>Not sure</span>
                                </label>
                            </div>

                            {!isQuizNotSure && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-purple-300">{quizMarks !== null ? `${quizMarks} / 20` : 'Not set (drag slider)'}</span>
                                        <span className="text-slate-400">{quizMarks !== null ? `${Math.round((quizMarks / 20) * 100)}%` : '--'}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="20"
                                        value={quizMarks !== null ? quizMarks : 14}
                                        onChange={e => setQuizMarks(Number(e.target.value))}
                                        className="w-full h-2 rounded-lg bg-slate-800 accent-purple-500 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 05 · ATTENDANCE EXPERIENCE */}
                    <div className="p-6 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-6">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-black">
                                05
                            </span>
                            <h2 className="text-base font-extrabold text-white">Attendance Experience</h2>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-extrabold text-white block leading-snug">
                                9. If your attendance was around 83% due to a genuine reason, how did this faculty generally respond?
                            </label>
                            <div className="space-y-2 pt-1">
                                {attendanceOptions.map((opt, idx) => {
                                    const isSelected = selectedAttendanceResponse === opt;
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => setSelectedAttendanceResponse(opt)}
                                            className={`w-full p-3.5 rounded-xl border text-xs font-semibold text-left flex items-center gap-3 transition-all ${
                                                isSelected
                                                    ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                                                    : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-600'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            <span>{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 06 · YOUR TAKE */}
                    <div className="p-6 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-6">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-black">
                                06
                            </span>
                            <h2 className="text-base font-extrabold text-white">Your Take</h2>
                        </div>

                        {/* Q10: Wish I knew */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-extrabold text-white">
                                    10. One thing I wish I knew before taking this faculty was...
                                </label>
                                <span className="text-[11px] text-slate-400 font-mono">
                                    {wishIKnew.length} / 250
                                </span>
                            </div>
                            <textarea
                                maxLength={250}
                                value={wishIKnew}
                                onChange={e => setWishIKnew(e.target.value)}
                                placeholder="Something you wish you had known before taking this faculty..."
                                className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 resize-none h-24"
                            />
                        </div>

                        {/* Q11: My advice */}
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-extrabold text-white">
                                    11. My advice would be...
                                </label>
                                <span className="text-[11px] text-slate-400 font-mono">
                                    {advice.length} / 250
                                </span>
                            </div>
                            <textarea
                                maxLength={250}
                                value={advice}
                                onChange={e => setAdvice(e.target.value)}
                                placeholder="What would you tell another student based on your experience?"
                                className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 resize-none h-24"
                            />
                        </div>
                    </div>

                    {/* 07 · FINAL VERDICT */}
                    <div className="p-6 rounded-2xl border bg-[#0d091f]/80 border-white/10 flex flex-col gap-6">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-black">
                                07
                            </span>
                            <h2 className="text-base font-extrabold text-white">Final Verdict</h2>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-extrabold text-white block">
                                12. Would you suggest this faculty to another student?
                            </label>
                            <p className="text-xs text-slate-400">
                                This becomes the primary recommendation metric for the faculty profile.
                            </p>
                            <div className="space-y-2 pt-2">
                                {suggestOptions.map((opt, idx) => {
                                    const isSelected = selectedSuggest === opt;
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => setSelectedSuggest(opt)}
                                            className={`w-full p-3.5 rounded-xl border text-xs font-extrabold text-left flex items-center justify-between transition-all ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-400 text-white shadow-lg'
                                                    : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <span>{opt}</span>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-600'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* SUBMISSION CARD */}
                    <div className="p-6 rounded-2xl border bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-purple-950/40 border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                        <div className="space-y-1.5 text-center sm:text-left">
                            <h3 className="text-lg font-black text-white">Ready to share your experience?</h3>
                            <p className="text-xs text-slate-300">
                                Your response is anonymous and contributes to community faculty insights.
                            </p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                <span className="text-[11px] font-semibold text-purple-300">✓ Voluntary</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-[11px] font-semibold text-purple-300">✓ Anonymous</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-[11px] font-semibold text-purple-300">✓ Identity kept private</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !isFormValid}
                            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-40 transition-all shrink-0 w-full sm:w-auto"
                        >
                            <Send className="w-4 h-4" />
                            <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
                            <ArrowRight className="w-4 h-4 text-amber-300" />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default FacultyFeedbackWorkspace;

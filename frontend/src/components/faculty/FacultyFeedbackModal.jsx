import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft, 
    ShieldCheck, 
    Sparkles, 
    BookOpen, 
    UserCheck, 
    Award, 
    MessageSquare, 
    Search,
    AlertCircle,
    Check,
    Info,
    ArrowRight
} from 'lucide-react';

const FacultyFeedbackModal = ({ 
    faculty, 
    isOpen, 
    onClose, 
    onSubmitReview, 
    onViewInsights,
    onReturnToDirectory,
    isLightMode = false 
}) => {
    const facultyId = faculty?.id || faculty?._id || faculty?.facultyId;

    // Active Step (1 to 8)
    const [step, setStep] = useState(1);

    // Q1: Subjects (Multi-select)
    const availableSubjects = useMemo(() => {
        if (!faculty) return ['General Subject'];
        if (Array.isArray(faculty.subjects) && faculty.subjects.length > 0) {
            return faculty.subjects;
        }
        return ['Data Structures', 'Database Management', 'Object Oriented Programming', 'Operating Systems', 'Web Technology'];
    }, [faculty]);

    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectSearch, setSubjectSearch] = useState('');

    // Q2: Roles (Multi-select)
    const roleOptions = [
        { id: 'Theory Faculty', label: 'Theory Faculty', icon: BookOpen },
        { id: 'Lab Faculty', label: 'Lab Faculty', icon: Award },
        { id: 'Project Guide', label: 'Project Guide', icon: Sparkles },
        { id: 'Proctor / Mentor', label: 'Proctor / Mentor', icon: UserCheck },
        { id: 'HOD', label: 'HOD', icon: ShieldCheck }
    ];
    const [selectedRoles, setSelectedRoles] = useState([]);

    // Q3: Classroom experience (Multi-select)
    const classroomOptions = [
        'Interactive',
        'Very strict about time / discipline',
        'Boring / difficult to stay engaged',
        'Mostly one-way teaching'
    ];
    const [selectedClassroom, setSelectedClassroom] = useState([]);

    // Q4: Engagement method (Multi-select)
    const engagementOptions = [
        'PPT / Slides',
        'Pen & Board',
        'Chalk & Board'
    ];
    const [selectedEngagement, setSelectedEngagement] = useState([]);

    // Q5: Performance treatment (Multi-select)
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

    // Q6: Singled out (Single-select)
    const singledOutOptions = [
        "No, I haven't noticed this",
        'Sometimes',
        'Frequently',
        'Yes, but only in specific situations',
        "I haven't noticed / Not sure"
    ];
    const [selectedSingledOut, setSelectedSingledOut] = useState("No, I haven't noticed this");

    // Q7: Approachability (Single-select)
    const approachabilityOptions = [
        'Very approachable',
        'Usually approachable',
        'Sometimes approachable',
        'Often difficult to reach',
        'Almost never available',
        'Tends to neglect students',
        'Never tried approaching'
    ];
    const [selectedApproachability, setSelectedApproachability] = useState('Usually approachable');

    // Q8: Marks (Student-reported estimates)
    const [cieMarks, setCieMarks] = useState(40);
    const [isCieNotSure, setIsCieNotSure] = useState(false);

    const [internalMarks, setInternalMarks] = useState(42);
    const [isInternalNotSure, setIsInternalNotSure] = useState(false);

    const [quizMarks, setQuizMarks] = useState(16);
    const [isQuizNotSure, setIsQuizNotSure] = useState(false);

    // Q9: Attendance response (Single-select)
    const attendanceOptions = [
        'Usually understanding',
        'Sometimes understanding',
        'Strict about the attendance requirement',
        'Considered genuine reasons on a case-by-case basis',
        'Usually did not make exceptions',
        'I never experienced this situation',
        'Not sure'
    ];
    const [selectedAttendanceResponse, setSelectedAttendanceResponse] = useState('Considered genuine reasons on a case-by-case basis');

    // Q10: Wish I knew (Free-text max 250)
    const [wishIKnew, setWishIKnew] = useState('');

    // Q11: Advice (Free-text max 250)
    const [advice, setAdvice] = useState('');

    // Q12: Would suggest (Single-select)
    const suggestOptions = [
        'Definitely',
        'Yes',
        'Depends on the student',
        'Probably not',
        'No'
    ];
    const [selectedSuggest, setSelectedSuggest] = useState('Yes');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Default subject selection when availableSubjects loads
    useEffect(() => {
        if (availableSubjects.length > 0 && selectedSubjects.length === 0) {
            setSelectedSubjects([availableSubjects[0]]);
        }
    }, [availableSubjects]);

    // Local Storage Draft Autosave & Restore
    const draftStorageKey = `faculty_feedback_draft_${facultyId}`;

    useEffect(() => {
        if (!isOpen || !facultyId) return;
        try {
            const savedDraft = localStorage.getItem(draftStorageKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.selectedSubjects) setSelectedSubjects(parsed.selectedSubjects);
                if (parsed.selectedRoles) setSelectedRoles(parsed.selectedRoles);
                if (parsed.selectedClassroom) setSelectedClassroom(parsed.selectedClassroom);
                if (parsed.selectedEngagement) setSelectedEngagement(parsed.selectedEngagement);
                if (parsed.selectedPerformanceTreatment) setSelectedPerformanceTreatment(parsed.selectedPerformanceTreatment);
                if (parsed.selectedSingledOut) setSelectedSingledOut(parsed.selectedSingledOut);
                if (parsed.selectedApproachability) setSelectedApproachability(parsed.selectedApproachability);
                if (parsed.cieMarks !== undefined) setCieMarks(parsed.cieMarks);
                if (parsed.isCieNotSure !== undefined) setIsCieNotSure(parsed.isCieNotSure);
                if (parsed.internalMarks !== undefined) setInternalMarks(parsed.internalMarks);
                if (parsed.isInternalNotSure !== undefined) setIsInternalNotSure(parsed.isInternalNotSure);
                if (parsed.quizMarks !== undefined) setQuizMarks(parsed.quizMarks);
                if (parsed.isQuizNotSure !== undefined) setIsQuizNotSure(parsed.isQuizNotSure);
                if (parsed.selectedAttendanceResponse) setSelectedAttendanceResponse(parsed.selectedAttendanceResponse);
                if (parsed.wishIKnew) setWishIKnew(parsed.wishIKnew);
                if (parsed.advice) setAdvice(parsed.advice);
                if (parsed.selectedSuggest) setSelectedSuggest(parsed.selectedSuggest);
                if (parsed.step && parsed.step <= 7) setStep(parsed.step);
            }
        } catch (e) {
            console.error("Error restoring feedback draft:", e);
        }
    }, [isOpen, facultyId]);

    // Autosave on state changes
    useEffect(() => {
        if (!isOpen || !facultyId || step === 8) return;
        try {
            const draftObj = {
                step,
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
        isOpen, facultyId, step, selectedSubjects, selectedRoles, selectedClassroom,
        selectedEngagement, selectedPerformanceTreatment, selectedSingledOut,
        selectedApproachability, cieMarks, isCieNotSure, internalMarks,
        isInternalNotSure, quizMarks, isQuizNotSure, selectedAttendanceResponse,
        wishIKnew, advice, selectedSuggest
    ]);

    if (!isOpen || !faculty) return null;

    // Toggle multi-select helper
    const toggleArrayOption = (currentList, setList, item) => {
        if (currentList.includes(item)) {
            setList(currentList.filter(i => i !== item));
        } else {
            setList([...currentList, item]);
        }
    };

    // Step Validation Check
    const isCurrentStepValid = () => {
        if (step === 1) {
            return selectedSubjects.length > 0 && selectedRoles.length > 0;
        }
        if (step === 2) {
            return selectedClassroom.length > 0 && selectedEngagement.length > 0;
        }
        if (step === 3) {
            return selectedPerformanceTreatment.length > 0 && !!selectedSingledOut && !!selectedApproachability;
        }
        if (step === 4) {
            return true; // Estimates optional / validated
        }
        if (step === 5) {
            return !!selectedAttendanceResponse;
        }
        if (step === 6) {
            return true; // Short text fields optional or up to 250
        }
        if (step === 7) {
            return !!selectedSuggest;
        }
        return true;
    };

    const handleNext = () => {
        if (isCurrentStepValid() && step < 7) {
            setStep(step + 1);
        }
    };

    const handlePrev = () => {
        if (step > 1 && step < 8) {
            setStep(step - 1);
        }
    };

    const handleSubmitJourney = async () => {
        if (!isCurrentStepValid()) return;
        setIsSubmitting(true);

        const feedbackData = {
            subjects: selectedSubjects,
            roles: selectedRoles,
            classroomStyle: selectedClassroom,
            engagementStyle: selectedEngagement,
            performanceTreatment: selectedPerformanceTreatment,
            singledOut: selectedSingledOut,
            approachability: selectedApproachability,
            cieMarks: isCieNotSure ? null : Number(cieMarks),
            internalMarks: isInternalNotSure ? null : Number(internalMarks),
            quizMarks: isQuizNotSure ? null : Number(quizMarks),
            attendanceResponse: selectedAttendanceResponse,
            wishIKnew: wishIKnew.trim(),
            advice: advice.trim(),
            recommendation: selectedSuggest,
            comment: advice.trim() || wishIKnew.trim() || `Recommendation: ${selectedSuggest}`,
            rating: selectedSuggest === 'Definitely' || selectedSuggest === 'Yes' ? 5 : selectedSuggest === 'Depends on the student' ? 3 : 2
        };

        try {
            if (onSubmitReview) {
                await onSubmitReview(facultyId, feedbackData);
            }
            // Clear local draft upon success
            localStorage.removeItem(draftStorageKey);
            setStep(8); // Move to final confirmation screen
        } catch (err) {
            console.error("Error submitting faculty feedback journey:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        onClose();
    };

    // Filtered subjects for search
    const filteredAvailableSubjects = availableSubjects.filter(s => 
        s.toLowerCase().includes(subjectSearch.trim().toLowerCase())
    );

    // Microcopy Titles & Headers for all 7 steps
    const stepConfigs = [
        {
            number: '01',
            microcopy: "Let's start with your experience.",
            title: "What did this faculty teach you?"
        },
        {
            number: '02',
            microcopy: "What's the classroom really like?",
            title: "What's the class actually like?"
        },
        {
            number: '03',
            microcopy: "How did you experience the faculty as a student?",
            title: "What's your experience as a student?"
        },
        {
            number: '04',
            microcopy: "Let's talk about evaluation.",
            title: "About the marks you received..."
        },
        {
            number: '05',
            microcopy: "How was attendance in practice?",
            title: "What's the attendance experience?"
        },
        {
            number: '06',
            microcopy: "Now, your honest take.",
            title: "Your experience"
        },
        {
            number: '07',
            microcopy: "One last thing.",
            title: "Your overall take"
        }
    ];

    const currentConfig = stepConfigs[step - 1] || stepConfigs[0];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/80 backdrop-blur-lg">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    transition={{ duration: 0.22 }}
                    className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col min-h-[580px] max-h-[92vh] ${
                        isLightMode
                            ? 'bg-white border-slate-200 text-slate-900'
                            : 'bg-[#0b0c16] border-purple-500/25 text-white'
                    }`}
                >
                    {/* TOP BAR: Header & Exit */}
                    <div className="px-6 py-4 border-b border-white/10 bg-[#101222]/90 backdrop-blur-md flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-white tracking-tight">
                                    Faculty Experience Feedback
                                </h3>
                                <p className="text-xs text-purple-300 font-medium">
                                    {faculty.name} • {faculty.department || 'GENERAL'} Department
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            aria-label="Exit feedback journey"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* PROGRESS BAR TRACKER (Steps 1 to 7) */}
                    {step <= 7 && (
                        <div className="px-6 py-3 border-b border-white/5 bg-[#0e101d] flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-purple-400 text-sm">
                                        0{step} <span className="text-slate-500 font-normal text-xs">/ 08</span>
                                    </span>
                                    <span className="text-slate-300 font-bold hidden sm:inline">
                                        {currentConfig.title}
                                    </span>
                                </div>
                                <span className="text-[11px] text-purple-300/80 font-medium italic">
                                    Your anonymous experience contributes to the college community.
                                </span>
                            </div>

                            {/* Animated Visual Progress Bar */}
                            <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 rounded-full"
                                    initial={{ width: `${((step - 1) / 7) * 100}%` }}
                                    animate={{ width: `${(step / 7) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* SCROLLABLE MAIN CONTENT AREA */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* STEP 08: CONFIRMATION SCREEN */}
                        {step === 8 ? (
                            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-200">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-emerald-500 border-2 border-emerald-400/40 flex items-center justify-center text-white shadow-2xl">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>

                                <div className="space-y-2 max-w-md">
                                    <h2 className="text-2xl font-black text-white tracking-tight">
                                        Thanks for sharing your experience.
                                    </h2>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                        Your anonymous feedback contributes to more reliable faculty insights and helps students make informed academic decisions.
                                    </p>
                                </div>

                                {/* Trust Badges */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                    <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Anonymous
                                    </span>
                                    <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Your identity is not shown publicly
                                    </span>
                                    <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Contributes to community insights
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 w-full max-w-md">
                                    <button
                                        onClick={() => {
                                            handleClose();
                                            if (onViewInsights) onViewInsights();
                                        }}
                                        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    >
                                        <span>View Faculty Insights</span>
                                        <ArrowRight className="w-4 h-4 text-amber-300" />
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleClose();
                                            if (onReturnToDirectory) onReturnToDirectory();
                                        }}
                                        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-extrabold text-sm transition-all"
                                    >
                                        Return to Faculty Directory
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* STEPS 1 TO 7 QUESTIONNAIRE FLOW */
                            <div className="space-y-6 animate-in fade-in duration-200">
                                {/* Step Microcopy Banner */}
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                                        {currentConfig.microcopy}
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                        {currentConfig.title}
                                    </h2>
                                </div>

                                {/* STEP 01 · YOUR EXPERIENCE */}
                                {step === 1 && (
                                    <div className="space-y-6">
                                        {/* Q1: Searchable Subject Selector */}
                                        <div className="space-y-3 p-4 rounded-2xl border bg-white/5 border-white/10">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-extrabold text-white">
                                                    1. What did this faculty teach you?
                                                </label>
                                                <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                                                    Select all subjects that apply
                                                </span>
                                            </div>

                                            {/* Search input if multiple subjects */}
                                            {availableSubjects.length > 3 && (
                                                <div className="relative">
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

                                            {/* Subject Chips */}
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {filteredAvailableSubjects.map((sub, idx) => {
                                                    const isSelected = selectedSubjects.includes(sub);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={idx}
                                                            onClick={() => toggleArrayOption(selectedSubjects, setSelectedSubjects, sub)}
                                                            className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all active:scale-95 ${
                                                                isSelected
                                                                    ? 'bg-purple-600/30 border-purple-500 text-purple-100 shadow-md shadow-purple-900/40'
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

                                        {/* Q2: Role Multi-Select Cards */}
                                        <div className="space-y-3 p-4 rounded-2xl border bg-white/5 border-white/10">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-extrabold text-white">
                                                    2. What role did this faculty play for you?
                                                </label>
                                                <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                                                    Select all that apply
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                                                {roleOptions.map((role) => {
                                                    const Icon = role.icon;
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
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-xs font-extrabold">{role.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 02 · INSIDE THE CLASSROOM */}
                                {step === 2 && (
                                    <div className="space-y-6">
                                        {/* Q3: Class Experience */}
                                        <div className="space-y-3 p-4 rounded-2xl border bg-white/5 border-white/10">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-extrabold text-white">
                                                    3. What was the class actually like?
                                                </label>
                                                <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                                                    Select all that apply
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                {classroomOptions.map((opt, idx) => {
                                                    const isSelected = selectedClassroom.includes(opt);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={idx}
                                                            onClick={() => toggleArrayOption(selectedClassroom, setSelectedClassroom, opt)}
                                                            className={`p-3.5 rounded-xl border text-xs font-extrabold text-left flex items-center justify-between transition-all active:scale-95 ${
                                                                isSelected
                                                                    ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-900/40'
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

                                        {/* Q4: Engagement Method */}
                                        <div className="space-y-3 p-4 rounded-2xl border bg-white/5 border-white/10">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-extrabold text-white">
                                                    4. How does this faculty usually engage the class?
                                                </label>
                                                <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                                                    Select all that apply
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                                {engagementOptions.map((opt, idx) => {
                                                    const isSelected = selectedEngagement.includes(opt);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={idx}
                                                            onClick={() => toggleArrayOption(selectedEngagement, setSelectedEngagement, opt)}
                                                            className={`p-3.5 rounded-xl border text-xs font-extrabold text-center flex items-center justify-between transition-all active:scale-95 ${
                                                                isSelected
                                                                    ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-900/40'
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
                                    </div>
                                )}

                                {/* STEP 03 · STUDENT EXPERIENCE */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        {/* Q5: Performance Treatment (Multi-select) */}
                                        <div className="space-y-3 p-4 rounded-2xl border bg-white/5 border-white/10">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-extrabold text-white">
                                                    5. Have you noticed any difference in how this faculty treats students based on academic performance?
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
                                                            className={`w-full p-3 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all active:scale-95 ${
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

                                        {/* Q6: Singled Out (Single-select) */}
                                        <div className="space-y-3 p-4 rounded-2xl border bg-white/5 border-white/10">
                                            <label className="text-sm font-extrabold text-white block">
                                                6. Does this faculty tend to single out or repeatedly target particular students?
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                {singledOutOptions.map((opt, idx) => {
                                                    const isSelected = selectedSingledOut === opt;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={idx}
                                                            onClick={() => setSelectedSingledOut(opt)}
                                                            className={`p-3 rounded-xl border text-xs font-semibold text-left flex items-center gap-2.5 transition-all ${
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

                                        {/* Q7: Approachability (Single-select) */}
                                        <div className="space-y-3 p-4 rounded-2xl border bg-white/5 border-white/10">
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
                                                            className={`p-3 rounded-xl border text-xs font-semibold text-left flex items-center gap-2.5 transition-all ${
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
                                )}

                                {/* STEP 04 · MARKS & EVALUATION */}
                                {step === 4 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
                                            <Info className="w-4 h-4 text-purple-400 shrink-0" />
                                            <span>Student-reported estimates. These values represent student experiences and are not official institutional statistics.</span>
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
                                                        onChange={e => setIsCieNotSure(e.target.checked)}
                                                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span>Not sure</span>
                                                </label>
                                            </div>

                                            {!isCieNotSure && (
                                                <div className="space-y-2 pt-2">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-purple-300">{cieMarks} / 50</span>
                                                        <span className="text-slate-400">{Math.round((cieMarks / 50) * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="50"
                                                        value={cieMarks}
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
                                                        onChange={e => setIsInternalNotSure(e.target.checked)}
                                                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span>Not sure</span>
                                                </label>
                                            </div>

                                            {!isInternalNotSure && (
                                                <div className="space-y-2 pt-2">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-purple-300">{internalMarks} / 50</span>
                                                        <span className="text-slate-400">{Math.round((internalMarks / 50) * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="50"
                                                        value={internalMarks}
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
                                                        onChange={e => setIsQuizNotSure(e.target.checked)}
                                                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span>Not sure</span>
                                                </label>
                                            </div>

                                            {!isQuizNotSure && (
                                                <div className="space-y-2 pt-2">
                                                    <div className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-purple-300">{quizMarks} / 20</span>
                                                        <span className="text-slate-400">{Math.round((quizMarks / 20) * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="20"
                                                        value={quizMarks}
                                                        onChange={e => setQuizMarks(Number(e.target.value))}
                                                        className="w-full h-2 rounded-lg bg-slate-800 accent-purple-500 cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 05 · ATTENDANCE */}
                                {step === 5 && (
                                    <div className="space-y-6">
                                        <div className="space-y-3 p-4 rounded-2xl border bg-white/5 border-white/10">
                                            <label className="text-sm font-extrabold text-white block">
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
                                                            className={`w-full p-3 rounded-xl border text-xs font-semibold text-left flex items-center gap-2.5 transition-all ${
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
                                )}

                                {/* STEP 06 · YOUR EXPERIENCE */}
                                {step === 6 && (
                                    <div className="space-y-6">
                                        {/* Q10: Wish I knew */}
                                        <div className="space-y-2 p-4 rounded-2xl border bg-white/5 border-white/10">
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
                                        <div className="space-y-2 p-4 rounded-2xl border bg-white/5 border-white/10">
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
                                )}

                                {/* STEP 07 · FINAL VERDICT */}
                                {step === 7 && (
                                    <div className="space-y-6">
                                        <div className="space-y-3 p-4 rounded-2xl border bg-white/5 border-white/10">
                                            <label className="text-sm font-extrabold text-white block">
                                                12. Would you suggest this faculty to another student?
                                            </label>
                                            <p className="text-xs text-slate-400">
                                                This becomes the main recommendation metric for the faculty profile.
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
                                )}
                            </div>
                        )}
                    </div>

                    {/* BOTTOM NAVIGATION ACTIONS (Steps 1 to 7) */}
                    {step <= 7 && (
                        <div className="px-6 py-4 border-t border-white/10 bg-[#101222]/90 flex items-center justify-between shrink-0">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-extrabold text-slate-300 flex items-center gap-1.5 transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>Back</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-extrabold text-rose-400 transition-all"
                                >
                                    Exit
                                </button>
                            )}

                            {step < 7 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!isCurrentStepValid()}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-40 transition-all"
                                >
                                    <span>Continue</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmitJourney}
                                    disabled={isSubmitting || !isCurrentStepValid()}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-purple-600/30 disabled:opacity-40 transition-all"
                                >
                                    <span>{isSubmitting ? 'Submitting...' : 'Submit Experience'}</span>
                                    <ArrowRight className="w-4 h-4 text-amber-300" />
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FacultyFeedbackModal;

import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CalendarDays, AlertCircle, Check, Award, BookOpenCheck, ChevronDown, User, BarChart2, Sparkles, BookOpen
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiV2 } from '../services/authService';
import SubjectMultiSelect from '../components/common/SubjectMultiSelect';

/* ═══════════════════════════════════════════════════════════════════
   SUBJECT REGISTRATION PAGE (LIGHT & DARK THEME RESPONSIVE WORKSPACE)
═══════════════════════════════════════════════════════════════════ */
const SubjectRegistrationPage = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // Theme Hook Context
    const themeContext = useTheme();
    const isDark = themeContext ? themeContext.isDark : true;

    // Dynamic Academic Profile Data
    const [studentProfile, setStudentProfile] = useState(null);

    // Active Section Tab State ('registration' | 'overview')
    const [activeSection, setActiveSection] = useState('registration');

    // Selected Semester Number (Defaults to student's current semester from user profile)
    const currentStudentSemester = studentProfile?.semester || user?.semester ? Number(studentProfile?.semester || user?.semester) : 1;
    const [selectedSemester, setSelectedSemester] = useState(currentStudentSemester);

    // Custom Bounded Semester Dropdown State & Ref
    const [semDropdownOpen, setSemDropdownOpen] = useState(false);
    const semDropdownRef = useRef(null);

    // Click Outside Listener for Custom Semester Dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (semDropdownRef.current && !semDropdownRef.current.contains(e.target)) {
                setSemDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Curriculum & Registered Subjects State for Selected Semester
    const [curriculumSubjects, setCurriculumSubjects] = useState([]);
    const [registeredSubjects, setRegisteredSubjects] = useState([]);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState(new Set());
    const [lastSavedTimestamp, setLastSavedTimestamp] = useState(null);

    // Cumulative Registered Credits Map Across All Semesters ({ 1: 9, 2: 20, ... })
    const [semesterCreditsMap, setSemesterCreditsMap] = useState({});

    // Save & Error States
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // In-memory Semester Cache for instant 0ms switching
    const semesterCacheRef = useRef({});

    /* ─── 1. FETCH PROFILE & INITIAL CUMULATIVE CREDITS ACROSS ALL SEMESTERS ─ */
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const res = await apiV2.getMe();
                const profileObj = res?.data?.data?.student || res?.data?.data || user;
                setStudentProfile(profileObj);
                if (profileObj?.semester) {
                    setSelectedSemester(Number(profileObj.semester));
                }

                // Fetch registered subjects across semesters 1..8 to compute cumulative degree credits
                const totalSemCount = profileObj?.totalSemesters || 8;
                const semPromises = Array.from({ length: totalSemCount }, (_, i) => apiV2.getRegisteredSubjects(i + 1));
                const results = await Promise.allSettled(semPromises);
                
                const initialMap = {};
                results.forEach((rRes, idx) => {
                    const semNum = idx + 1;
                    if (rRes.status === 'fulfilled' && rRes.value?.data?.data) {
                        const regList = rRes.value.data.data;
                        const semCredits = regList.reduce((sum, r) => sum + (r.registeredCredits ?? r.subject?.credits ?? 0), 0);
                        initialMap[semNum] = semCredits;
                    }
                });
                setSemesterCreditsMap(initialMap);
            } catch (err) {
                console.warn('[SubjectRegistration] Initial fetch warning:', err);
                setStudentProfile(user);
            }
        };

        fetchInitialData();
    }, [user]);

    /* ─── 2. SILENT BACKGROUND FETCH FOR SELECTED SEMESTER ────────────── */
    useEffect(() => {
        const loadSemesterDataSilently = async () => {
            setErrorMessage('');

            // 1. Instant Cache Hit: If cached, load state immediately (0ms UI latency)
            const cached = semesterCacheRef.current[selectedSemester];
            if (cached) {
                setCurriculumSubjects(cached.curriculum || []);
                setRegisteredSubjects(cached.registered || []);
                setSelectedSubjectIds(new Set(cached.selectedIds || []));
            }

            // 2. Silent Background Fetch (no loading screen or UI reloading message)
            try {
                const [currRes, regRes] = await Promise.allSettled([
                    apiV2.getAcademicSubjects(selectedSemester),
                    apiV2.getRegisteredSubjects(selectedSemester)
                ]);

                let fetchedCurriculum = [];
                if (currRes.status === 'fulfilled' && currRes.value?.data?.data) {
                    fetchedCurriculum = currRes.value.data.data;
                }

                let fetchedRegistered = [];
                let fetchedSelectedIds = new Set();
                let semSavedCredits = 0;
                if (regRes.status === 'fulfilled' && regRes.value?.data?.data) {
                    fetchedRegistered = regRes.value.data.data;
                    fetchedRegistered.forEach(r => {
                        if (r.subject?._id) fetchedSelectedIds.add(r.subject._id);
                        else if (r.subject) fetchedSelectedIds.add(r.subject);
                    });

                    semSavedCredits = fetchedRegistered.reduce((sum, r) => sum + (r.registeredCredits ?? r.subject?.credits ?? 0), 0);

                    if (fetchedRegistered.length > 0 && fetchedRegistered[0].updatedAt) {
                        setLastSavedTimestamp(new Date(fetchedRegistered[0].updatedAt).toLocaleString());
                    }
                }

                // Update state silently in background
                setCurriculumSubjects(fetchedCurriculum);
                setRegisteredSubjects(fetchedRegistered);
                setSelectedSubjectIds(fetchedSelectedIds);

                // Sync cumulative credits map
                setSemesterCreditsMap(prev => ({
                    ...prev,
                    [selectedSemester]: semSavedCredits
                }));

                // Update cache
                semesterCacheRef.current[selectedSemester] = {
                    curriculum: fetchedCurriculum,
                    registered: fetchedRegistered,
                    selectedIds: Array.from(fetchedSelectedIds)
                };
            } catch (err) {
                console.error('[SubjectRegistration] Silent load error:', err);
            }
        };

        loadSemesterDataSilently();
    }, [selectedSemester]);

    /* ─── DYNAMIC SEMESTER LIST ─────────────────────────────────────────── */
    const totalProgramSemesters = studentProfile?.totalSemesters || 8;
    const availableSemesters = useMemo(() => {
        return Array.from({ length: totalProgramSemesters }, (_, i) => {
            const semNum = i + 1;
            return {
                semesterNumber: semNum,
                yearOfStudy: Math.ceil(semNum / 2),
                isCurrent: semNum === currentStudentSemester
            };
        });
    }, [totalProgramSemesters, currentStudentSemester]);

    /* ─── LIVE COMPUTED CALCULATIONS ─────────────────────────────────────── */
    const liveSelectedSubjectsList = useMemo(() => {
        return curriculumSubjects.filter(s => selectedSubjectIds.has(s._id));
    }, [curriculumSubjects, selectedSubjectIds]);

    const activeSemesterLiveCredits = useMemo(() => {
        return liveSelectedSubjectsList.reduce((sum, s) => sum + (s.credits || 0), 0);
    }, [liveSelectedSubjectsList]);

    const TOTAL_REQUIRED_CREDITS = studentProfile?.totalRequiredCredits || studentProfile?.scheme?.totalCredits || 160;

    const overallDegreeRegisteredCredits = useMemo(() => {
        let total = 0;
        for (let sem = 1; sem <= totalProgramSemesters; sem++) {
            if (sem === selectedSemester) {
                total += activeSemesterLiveCredits;
            } else {
                total += (semesterCreditsMap[sem] || 0);
            }
        }
        return total;
    }, [semesterCreditsMap, selectedSemester, activeSemesterLiveCredits, totalProgramSemesters]);

    const creditProgressPercentage = Math.min(100, Math.round((overallDegreeRegisteredCredits / TOTAL_REQUIRED_CREDITS) * 100));

    const totalSelectedCount = selectedSubjectIds.size;

    const hasUnsavedChanges = useMemo(() => {
        const cached = semesterCacheRef.current[selectedSemester];
        const initialIds = new Set(cached?.selectedIds || registeredSubjects.map(r => r.subject?._id || r.subject));
        if (initialIds.size !== selectedSubjectIds.size) return true;
        for (let id of selectedSubjectIds) {
            if (!initialIds.has(id)) return true;
        }
        return false;
    }, [selectedSubjectIds, registeredSubjects, selectedSemester]);

    /* ─── HANDLER: TOGGLE MULTI-SELECT ─────────────────────────────────── */
    const handleSubjectSelectionChange = (nextSelectedIdsSet) => {
        setSelectedSubjectIds(nextSelectedIdsSet);
        setSaveSuccess(false);

        const liveCredits = curriculumSubjects
            .filter(s => nextSelectedIdsSet.has(s._id))
            .reduce((sum, s) => sum + (s.credits || 0), 0);

        setSemesterCreditsMap(prev => ({
            ...prev,
            [selectedSemester]: liveCredits
        }));
    };

    /* ─── HANDLER: SAVE REGISTRATION TO BACKEND ────────────────────────── */
    const handleSaveRegistration = async () => {
        if (selectedSubjectIds.size === 0) {
            setErrorMessage('Please select at least one subject to register.');
            return;
        }

        setIsSaving(true);
        setErrorMessage('');
        setSaveSuccess(false);

        try {
            const subjectIdsArray = Array.from(selectedSubjectIds);
            const payload = {
                semester: selectedSemester,
                subjectIds: subjectIdsArray
            };

            const response = await apiV2.saveRegisteredSubjects(payload);

            if (response.data?.success || response.status === 200 || response.status === 201) {
                setSaveSuccess(true);
                const nowStr = new Date().toLocaleString();
                setLastSavedTimestamp(nowStr);

                const regList = liveSelectedSubjectsList.map(s => ({
                    subject: s,
                    registeredCredits: s.credits,
                    updatedAt: new Date().toISOString()
                }));

                setRegisteredSubjects(regList);

                semesterCacheRef.current[selectedSemester] = {
                    curriculum: curriculumSubjects,
                    registered: regList,
                    selectedIds: subjectIdsArray
                };

                setTimeout(() => setSaveSuccess(false), 4000);
            } else {
                throw new Error(response.data?.message || 'Failed to save subject registration.');
            }
        } catch (err) {
            console.error('[SubjectRegistration] Save error:', err);
            setErrorMessage(err?.response?.data?.message || err.message || 'An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const getSafeString = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            return val.name || val.shortName || val.code || val.label || val.title || '';
        }
        return String(val);
    };

    const studentBranchName = getSafeString(studentProfile?.branch)
        || getSafeString(studentProfile?.branchName)
        || getSafeString(user?.branchName)
        || getSafeString(user?.branch)
        || 'N/A';

    const studentCollegeName = getSafeString(studentProfile?.college)
        || getSafeString(studentProfile?.collegeName)
        || getSafeString(user?.collegeName)
        || getSafeString(user?.college)
        || 'Siddaganga Institute of Technology';

    const studentSchemeName = getSafeString(studentProfile?.scheme)
        || getSafeString(studentProfile?.schemeName)
        || getSafeString(user?.schemeName)
        || getSafeString(user?.scheme)
        || 'N/A';

    const studentUsn = getSafeString(studentProfile?.usn) || getSafeString(user?.usn) || 'N/A';
    const studentName = getSafeString(studentProfile?.name) || getSafeString(user?.name) || 'N/A';

    // SVG Circular Donut calculations
    const svgRadius = 48;
    const svgCircumference = 2 * Math.PI * svgRadius; // ~301.59
    const strokeDashoffset = svgCircumference - (creditProgressPercentage / 100) * svgCircumference;

    /* ─── BEFORE UNLOAD WARNING LISTENER ───────────────────────────────── */
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved subject changes. Are you sure you want to leave without saving?';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const renderRegistrationSection = () => (
        <div className="flex flex-col gap-5 w-full">
            
            {/* FLOATING UNSAVED CHANGES ALERT BANNER */}
            {hasUnsavedChanges && (
                <div className="sticky top-4 z-40 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-amber-500/20 border border-amber-500/40 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 text-amber-200 text-xs sm:text-sm font-bold">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-amber-400 shrink-0" />
                        <span>You have unsaved subject changes! Save now to prevent losing your selections.</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveRegistration}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-purple-600 to-amber-500 hover:from-amber-400 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5 shrink-0 cursor-pointer transition-all scale-105"
                    >
                        {isSaving ? 'Saving...' : 'Save Registration'}
                    </button>
                </div>
            )}

            {/* SEARCHABLE MULTI-SELECT PICKER */}
            <div className="flex flex-col gap-1.5">
                <span className={`text-[11px] font-extrabold tracking-wider uppercase ${
                    isDark ? 'text-purple-400' : 'text-purple-600'
                }`}>
                    CHOOSE SUBJECTS FOR SEMESTER {selectedSemester}
                </span>
                <SubjectMultiSelect
                    subjects={curriculumSubjects}
                    selectedIds={selectedSubjectIds}
                    onChange={handleSubjectSelectionChange}
                    placeholder="Search or select subjects..."
                />
            </div>

            {/* ALERTS */}
            {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-300 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {saveSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Registration saved — {totalSelectedCount} subjects · {activeSemesterLiveCredits} credits</span>
                </div>
            )}

            {/* LAST EDITED TIMESTAMP */}
            <div className="flex items-center justify-between">
                <span className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Last edited: <strong className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{lastSavedTimestamp || 'Not saved yet'}</strong>
                </span>
            </div>

            {/* LIVE REGISTERED SUBJECTS PREVIEW (DESKTOP TABLE + MOBILE COMPACT CARDS) */}
            <div className={`rounded-2xl overflow-hidden shadow-lg border ${
                isDark ? 'bg-[#0F0926] border-white/10' : 'bg-white border-purple-100 shadow-purple-900/5'
            }`}>
                <div className={`p-4 border-b flex items-center justify-between ${
                    isDark ? 'border-white/10' : 'border-slate-100 bg-slate-50/50'
                }`}>
                    <h3 className={`text-sm font-extrabold m-0 flex items-center gap-2 ${
                        isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                        <BookOpen size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                        Registered Subjects (Sem {selectedSemester})
                    </h3>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Live Selection Preview
                    </span>
                </div>

                {liveSelectedSubjectsList.length === 0 ? (
                    <div className={`p-8 text-center text-xs sm:text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No subjects selected yet for Semester {selectedSemester}. Click the selector above to choose your subjects.
                    </div>
                ) : (
                    <>
                        {/* Desktop Web Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className={`border-b ${
                                        isDark ? 'bg-white/[0.03] border-white/10 text-slate-400' : 'bg-slate-100/60 border-slate-200 text-slate-600'
                                    }`}>
                                        <th className="p-3.5 px-4 font-bold">Sl No</th>
                                        <th className="p-3.5 px-4 font-bold">Code</th>
                                        <th className="p-3.5 px-4 font-bold">Subject Name</th>
                                        <th className="p-3.5 px-4 font-bold text-right">Credits</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liveSelectedSubjectsList.map((subj, idx) => (
                                        <tr key={subj._id} className={`border-b ${
                                            isDark ? 'border-white/[0.04] text-slate-200 hover:bg-white/[0.02]' : 'border-slate-100 text-slate-800 hover:bg-purple-50/30'
                                        }`}>
                                            <td className={`p-3.5 px-4 font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td className={`p-3.5 px-4 font-mono font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                                {subj.code}
                                            </td>
                                            <td className="p-3.5 px-4 font-bold">
                                                {subj.name}
                                            </td>
                                            <td className={`p-3.5 px-4 text-right font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                {subj.credits ?? 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Compact Cards List */}
                        <div className="sm:hidden p-3 space-y-2.5">
                            {liveSelectedSubjectsList.map((subj, idx) => (
                                <div key={subj._id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                    isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
                                }`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`text-[10px] font-bold shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            #{String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <div className="min-w-0">
                                            <div className={`font-mono text-xs font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                                {subj.code}
                                            </div>
                                            <div className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                                {subj.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-md border font-extrabold text-xs shrink-0 ${
                                        isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    }`}>
                                        {subj.credits ?? 0} Cr
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {liveSelectedSubjectsList.length > 0 && (
                    <div className={`p-3 px-4.5 border-t flex items-center justify-end text-xs ${
                        isDark ? 'bg-white/[0.02] border-white/10 text-slate-400' : 'bg-slate-50/50 border-slate-100 text-slate-600'
                    }`}>
                        <span>Semester {selectedSemester} Credits: <strong className={`text-sm ml-1.5 font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{activeSemesterLiveCredits} Credits</strong></span>
                    </div>
                )}
            </div>
        </div>
    );

    const renderOverviewSection = () => (
        <div className="flex flex-col gap-5 w-full">
            {/* CREDITS REGISTERED DONUT CHART CARD */}
            <div className={`rounded-2xl p-6 flex flex-col items-center justify-between gap-5 shadow-lg border ${
                isDark ? 'bg-[#0F0926] border-purple-500/20' : 'bg-white border-purple-100 shadow-purple-900/5'
            }`}>
                <div className="w-full flex items-center justify-between">
                    <span className={`text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 ${
                        isDark ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                        <Award size={15} /> DEGREE CREDITS PROGRESS
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                        isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}>
                        {creditProgressPercentage}% Completed
                    </span>
                </div>

                {/* SVG CIRCULAR DONUT CHART */}
                <div className="relative w-36 h-36 flex items-center justify-center my-2">
                    <svg width="144" height="144" viewBox="0 0 110 110" className="rotate-[-90deg]">
                        <circle
                            cx="55"
                            cy="55"
                            r={svgRadius}
                            stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(139, 92, 246, 0.12)'}
                            strokeWidth="9"
                            fill="none"
                        />
                        <circle
                            cx="55"
                            cy="55"
                            r={svgRadius}
                            stroke="url(#overviewDonutGrad)"
                            strokeWidth="9"
                            strokeDasharray={svgCircumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="none"
                            className="transition-all duration-700 ease-in-out"
                        />
                        <defs>
                            <linearGradient id="overviewDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className={`text-xl font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {overallDegreeRegisteredCredits} / {TOTAL_REQUIRED_CREDITS}
                        </span>
                        <span className={`text-[11px] font-bold mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            degree credits
                        </span>
                        <span className={`text-xs font-extrabold mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {creditProgressPercentage}%
                        </span>
                    </div>
                </div>

                <p className={`text-xs text-center m-0 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Cumulative credit registration progress tracked across all semesters towards your 160-credit degree requirements.
                </p>
            </div>

            {/* ACADEMIC PROFILE CARD */}
            <div className={`rounded-2xl p-6 flex flex-col gap-4 shadow-lg border ${
                isDark ? 'bg-[#0F0926] border-white/10' : 'bg-white border-purple-100 shadow-purple-900/5'
            }`}>
                <span className={`text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 ${
                    isDark ? 'text-purple-400' : 'text-purple-600'
                }`}>
                    <User size={15} /> ACADEMIC PROFILE
                </span>

                <div className="flex flex-col gap-3 mt-1">
                    <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Student Name</span>
                        <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{studentName}</span>
                    </div>

                    <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />

                    <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>USN</span>
                        <span className={`text-xs font-bold font-mono ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{studentUsn}</span>
                    </div>

                    <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />

                    <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>College</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{studentCollegeName}</span>
                    </div>

                    <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />

                    <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Branch & Scheme</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{studentBranchName} · Scheme {studentSchemeName}</span>
                    </div>

                    <div className={`h-px ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />

                    <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Semester</span>
                        <span className={`text-xs font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Semester {currentStudentSemester}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`w-full min-h-screen font-['Outfit',sans-serif] p-4 sm:p-6 lg:p-8 flex flex-col items-center gap-6 box-border transition-colors duration-200 ${
            isDark ? 'bg-[#050505] text-[#F1F5F9]' : 'bg-slate-50 text-slate-900'
        }`}>
            
            {/* 1. TOP CENTER PAGE HEADER */}
            <div className="w-full max-w-3xl flex flex-col items-center text-center gap-2">
                <h1 className={`text-2xl sm:text-3xl font-black m-0 tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                }`}>
                    Subject Registration
                </h1>
                <p className={`text-xs sm:text-sm m-0 leading-relaxed max-w-md ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                    Set up the subjects you're taking this semester and track your overall degree progress.
                </p>

                {/* TOP CENTER SEMESTER SELECTOR DROPDOWN (CONSTRAINED 100% WITHIN MOBILE VIEW) */}
                <div ref={semDropdownRef} className="relative w-full max-w-[280px] mx-auto flex flex-col items-center gap-1.5 mt-3">
                    <label className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                        <CalendarDays size={13} /> SELECT SEMESTER
                    </label>

                    {/* Trigger Button */}
                    <button
                        type="button"
                        onClick={() => setSemDropdownOpen(prev => !prev)}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                            isDark 
                                ? 'bg-[#0F0926] border border-purple-500/40 hover:border-purple-500/80 text-white shadow-lg shadow-purple-950/40' 
                                : 'bg-white border border-purple-200 hover:border-purple-400 text-slate-900 shadow-md shadow-purple-900/10'
                        }`}
                    >
                        <span className="truncate">
                            Semester {selectedSemester} {availableSemesters.find(s => s.semesterNumber === selectedSemester)?.isCurrent ? '(Current)' : ''}
                        </span>
                        <ChevronDown size={16} className={`transition-transform duration-200 shrink-0 ml-1.5 ${isDark ? 'text-purple-400' : 'text-purple-600'} ${semDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Custom Bounded Dropdown Menu */}
                    <AnimatePresence>
                        {semDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className={`absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-xl p-1.5 max-h-60 overflow-y-auto w-full box-border border ${
                                    isDark 
                                        ? 'bg-[#0F0926] border-purple-500/40 shadow-2xl shadow-black/90' 
                                        : 'bg-white border-purple-200 shadow-xl shadow-purple-900/15'
                                }`}
                            >
                                {availableSemesters.map(sem => {
                                    const isSelected = selectedSemester === sem.semesterNumber;
                                    return (
                                        <button
                                            key={sem.semesterNumber}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSemester(sem.semesterNumber);
                                                setSemDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                                                isSelected
                                                    ? (isDark 
                                                        ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-950/60 border border-purple-400/80' 
                                                        : 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/30 border border-purple-600')
                                                    : (isDark 
                                                        ? 'text-slate-300 hover:text-white hover:bg-white/5 font-medium' 
                                                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold')
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>Semester {sem.semesterNumber}</span>
                                                {isSelected && <Check size={14} className="text-white shrink-0" strokeWidth={3} />}
                                            </div>
                                            {sem.isCurrent && (
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                                    isSelected
                                                        ? 'bg-white/20 text-white border border-white/30'
                                                        : (isDark ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200')
                                                }`}>
                                                    Current
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 2-SECTION TOGGLE NAVIGATION TABS (MOBILE ONLY < 768px) */}
                <div className={`md:hidden w-full max-w-md grid grid-cols-2 gap-2 p-1.5 rounded-2xl mt-4 border ${
                    isDark ? 'bg-[#0F0926] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                    <button
                        onClick={() => setActiveSection('registration')}
                        className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            activeSection === 'registration'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                                : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.03]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                        }`}
                    >
                        <BookOpenCheck size={16} />
                        <span>Subject Registration</span>
                    </button>

                    <button
                        onClick={() => setActiveSection('overview')}
                        className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            activeSection === 'overview'
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                                : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.03]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                        }`}
                    >
                        <BarChart2 size={16} />
                        <span>Overview & Credits</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}

            {/* MOBILE VIEW (< 768px): Single section based on activeSection tab */}
            <div className="block md:hidden w-full max-w-4xl mt-2">
                {activeSection === 'registration' ? renderRegistrationSection() : renderOverviewSection()}
            </div>

            {/* DESKTOP / WEB VIEW (>= 768px): Dual Column Layout (Registration Left, Overview & Profile Right Stacked) */}
            <div className="hidden md:grid grid-cols-12 gap-6 w-full max-w-6xl mt-4 items-start">
                {/* Left Column: Subject Registration */}
                <div className="col-span-7 lg:col-span-7">
                    {renderRegistrationSection()}
                </div>

                {/* Right Column: Overview (Credits Progress + Academic Profile Stacked Vertically) */}
                <div className="col-span-5 lg:col-span-5">
                    {renderOverviewSection()}
                </div>
            </div>

        </div>
    );
};

export default SubjectRegistrationPage;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Calculator,
    ShieldCheck,
    ArrowRight,
    RefreshCw,
    Pencil,
    Check,
    AlertCircle,
    RotateCcw,
    Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiV2 } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';
import {
    getSubjectEvaluationConfig,
    calculateCieMarks,
    evaluateAcademicEligibility
} from '../../../utils/cieEligibilityEngine';
import AcademicToolModal from '../AcademicToolModal';
import SubjectCombobox from './SubjectCombobox';
import MarksEntrySheet from './MarksEntrySheet';
import CIEResultSection from './CIEResultSection';
import EligibilityAuditSection from './EligibilityAuditSection';
import SEETargetCard from './SEETargetCard';
import UnsavedChangesDialog from './UnsavedChangesDialog';

// Realistic pre-filled demo subjects for free & non-logged-in users (Zero DB/API calls)
const DUMMY_CIE_SUBJECTS = [
    {
        registeredSubjectId: 'demo-cie-1',
        subjectId: 'demo-cie-1',
        subjectCode: '21CS42',
        subjectName: 'Design and Analysis of Algorithms',
        category: 'Integrated Professional Core Course',
        evaluationType: 'IPCC',
        credits: 4,
        semester: 4,
        attendancePercentage: 84.8,
        rawMarks: {
            test1: 42,
            test2: 44,
            quiz1: 17,
            quiz2: 18,
            assignment1: 18,
            assignment2: 19,
            labRecord: 315,
            labTest: 13.5
        }
    },
    {
        registeredSubjectId: 'demo-cie-2',
        subjectId: 'demo-cie-2',
        subjectCode: '21CS43',
        subjectName: 'Operating Systems',
        category: 'Theory Course',
        evaluationType: 'THEORY_ONLY',
        credits: 3,
        semester: 4,
        attendancePercentage: 88.0,
        rawMarks: {
            test1: 40,
            test2: 43,
            quiz1: 16,
            quiz2: 19,
            assignment1: 17,
            assignment2: 18
        }
    },
    {
        registeredSubjectId: 'demo-cie-3',
        subjectId: 'demo-cie-3',
        subjectCode: '21CSL46',
        subjectName: 'Microcontroller & Embedded Systems Lab',
        category: 'Laboratory Course',
        evaluationType: 'LAB_ONLY',
        credits: 1.5,
        semester: 4,
        attendancePercentage: 92.0,
        rawMarks: {
            labRecord: 325,
            labTest: 14.0
        }
    }
];

const DUMMY_ATTENDANCE_MAP = {
    'demo-cie-1': 84.8,
    '21cs42': 84.8,
    'demo-cie-2': 88.0,
    '21cs43': 88.0,
    'demo-cie-3': 92.0,
    '21csl46': 92.0
};

// Extract and normalize attendance map by ID, code, and subject name
function extractAttendanceMap(source) {
    const map = {};
    if (!source) return map;
    if (Array.isArray(source)) {
        source.forEach((sub) => {
            const id = (sub.subjectId || sub.registeredSubjectId || sub._id || '').toString();
            const code = (sub.subjectCode || sub.customCode || sub.code || '').toString().toLowerCase();
            const name = (sub.subjectName || sub.customName || sub.name || '').toString().toLowerCase();
            const pct = sub.analytics?.percentage ?? sub.percentage ?? sub.attendancePercentage;
            if (pct !== undefined && pct !== null && !isNaN(Number(pct))) {
                const num = Number(pct);
                if (id) map[id] = num;
                if (code) map[code] = num;
                if (name) map[name] = num;
            }
        });
    } else if (typeof source === 'object') {
        Object.entries(source).forEach(([k, v]) => {
            if (v !== undefined && v !== null && !isNaN(Number(v))) {
                map[k] = Number(v);
            }
        });
    }
    return map;
}

// Fetch any attendance already cached from the Attendance section
function getStoredAttendanceMap() {
    try {
        const localRaw = localStorage.getItem('aus_attendance_cache');
        const sessionRaw = sessionStorage.getItem('aus_attendance_overview');
        const fromLocal = localRaw ? JSON.parse(localRaw) : null;
        const fromSession = sessionRaw ? JSON.parse(sessionRaw) : null;
        return {
            ...extractAttendanceMap(fromSession),
            ...extractAttendanceMap(fromLocal)
        };
    } catch (err) {
        return {};
    }
}

export default function CIEEligibilityTool({
    isOpen,
    onClose,
    initialSubjectId = null,
    initialSubjects = []
}) {
    const { user, hasPlusAccess, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLockedAction = useCallback(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location.pathname } });
        } else {
            navigate('/pricing');
        }
    }, [isAuthenticated, navigate, location]);

    // Pre-seed subjects if provided to guarantee INSTANT 0ms modal opening
    const hasInitial = hasPlusAccess && Array.isArray(initialSubjects) && initialSubjects.length > 0;

    // Top-level flow state
    const [step, setStep] = useState('entry'); // 'entry' | 'result'
    const [isLoading, setIsLoading] = useState(!hasPlusAccess ? false : !hasInitial);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState(null);

    // Subject data
    const [subjects, setSubjects] = useState(() => {
        if (hasInitial) return initialSubjects;
        if (!hasPlusAccess) return DUMMY_CIE_SUBJECTS;
        return [];
    });
    const [selectedSubject, setSelectedSubject] = useState(() => {
        if (hasInitial) return initialSubjects[0];
        if (!hasPlusAccess) return DUMMY_CIE_SUBJECTS[0];
        return null;
    });

    // Pre-seed attendance map directly from Attendance Section persistent caches
    const [attendanceMap, setAttendanceMap] = useState(() => {
        if (!hasPlusAccess) return DUMMY_ATTENDANCE_MAP;
        return getStoredAttendanceMap();
    });
    const [activeBacklogs, setActiveBacklogs] = useState(0);

    // Attendance verification state
    const [includeAttendance, setIncludeAttendance] = useState(true);
    const [customAttendance, setCustomAttendance] = useState(() => {
        if (!hasPlusAccess) return '84.8';
        return '';
    });

    // Marks and validation state
    const [rawMarks, setRawMarks] = useState(() => {
        if (hasInitial && initialSubjects[0]?.rawMarks) {
            return { ...initialSubjects[0].rawMarks };
        }
        if (!hasPlusAccess) {
            return { ...DUMMY_CIE_SUBJECTS[0].rawMarks };
        }
        return {};
    });
    const [errors, setErrors] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

    // Calculation result state
    const [cieResult, setCieResult] = useState(null);
    const [eligibilityResult, setEligibilityResult] = useState(null);

    // Fetch initial data (instantaneous pre-seed + non-blocking background hydration)
    const loadAcademicData = useCallback(async () => {
        if (!hasPlusAccess) {
            setSubjects(DUMMY_CIE_SUBJECTS);
            let target = DUMMY_CIE_SUBJECTS[0];
            if (initialSubjectId) {
                const match = DUMMY_CIE_SUBJECTS.find(
                    (s) => s.registeredSubjectId === initialSubjectId || s.subjectId === initialSubjectId
                );
                if (match) target = match;
            }
            setSelectedSubject(target);
            setRawMarks({ ...(target.rawMarks || {}) });
            setAttendanceMap(DUMMY_ATTENDANCE_MAP);
            setCustomAttendance(String(target.attendancePercentage || 84.8));
            setIsLoading(false);
            setLoadError(null);
            setIsDirty(false);
            return;
        }

        const hasExisting = Array.isArray(initialSubjects) && initialSubjects.length > 0;
        if (!hasExisting) {
            setIsLoading(true);
        }
        setLoadError(null);

        // 1. Fetch registered subjects & saved CIE records
        try {
            const ciePromise = apiV2.getCieDashboard().catch(() => null);
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 3000));
            const cieRes = await Promise.race([ciePromise, timeoutPromise]);

            let subjectList = [];
            if (cieRes?.data?.success && Array.isArray(cieRes.data.data?.subjects) && cieRes.data.data.subjects.length > 0) {
                subjectList = cieRes.data.data.subjects;
            } else if (hasExisting) {
                subjectList = initialSubjects;
            } else {
                const regRes = await apiV2.getRegisteredSubjects().catch(() => null);
                if (regRes?.data?.data && Array.isArray(regRes.data.data) && regRes.data.data.length > 0) {
                    subjectList = regRes.data.data;
                }
            }

            // Fallback: Fetch authoritative curriculum subjects if no student-registered subjects found
            if (subjectList.length === 0) {
                const curRes = await apiV2.getAcademicSubjects(user?.semester).catch(() => null);
                if (curRes?.data?.data && Array.isArray(curRes.data.data) && curRes.data.data.length > 0) {
                    subjectList = curRes.data.data.map(s => ({
                        ...s,
                        subjectId: s._id || s.id,
                        registeredSubjectId: s._id || s.id,
                        subjectCode: s.code || s.subjectCode,
                        subjectName: s.name || s.subjectName,
                        credits: s.credits,
                        category: s.category || s.type || 'Curriculum Subject'
                    }));
                }
            }

            if (subjectList.length > 0) {
                setSubjects(subjectList);

                let target = subjectList[0];
                if (initialSubjectId) {
                    const match = subjectList.find(
                        (s) =>
                            s.registeredSubjectId === initialSubjectId ||
                            s.subjectId === initialSubjectId ||
                            s._id === initialSubjectId ||
                            s.id === initialSubjectId
                    );
                    if (match) target = match;
                }
                setSelectedSubject(target);
                setRawMarks({ ...(target.rawMarks || {}) });
                setIsDirty(false);
            }
        } catch (err) {
            console.error('[CIEEligibilityTool] Load error:', err);
            if (!hasExisting) {
                setLoadError('Unable to load subjects. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }

        // 2. Fetch attendance from Attendance Section asynchronously in the background & KEEP IT
        try {
            const [attRes, progRes] = await Promise.allSettled([
                apiV2.getAttendanceDashboard().catch(() => null),
                apiV2.getSubjectProgress().catch(() => null)
            ]);

            const combinedSubjects = [];
            if (attRes.status === 'fulfilled' && attRes.value?.data?.success) {
                const list = attRes.value.data.data?.subjects || attRes.value.data.data?.records || [];
                if (Array.isArray(list)) combinedSubjects.push(...list);
            }
            if (progRes.status === 'fulfilled' && progRes.value?.data?.success) {
                const list = progRes.value.data.data || [];
                if (Array.isArray(list)) combinedSubjects.push(...list);
            }

            if (combinedSubjects.length > 0) {
                const fetchedMap = extractAttendanceMap(combinedSubjects);
                setAttendanceMap((prev) => {
                    const merged = { ...prev, ...fetchedMap };
                    try {
                        localStorage.setItem('aus_attendance_cache', JSON.stringify(merged));
                        sessionStorage.setItem('aus_attendance_overview', JSON.stringify(combinedSubjects));
                    } catch (storageErr) {}
                    return merged;
                });
            }
        } catch (attErr) {
            console.warn('[CIEEligibilityTool] Attendance background query skipped:', attErr.message);
        }
    }, [initialSubjectId, initialSubjects]);

    // Listen to live attendance updates from the Attendance section
    useEffect(() => {
        const handleLiveAttendanceUpdate = () => {
            const stored = getStoredAttendanceMap();
            if (Object.keys(stored).length > 0) {
                setAttendanceMap((prev) => ({ ...prev, ...stored }));
            }
        };
        window.addEventListener('attendance-updated', handleLiveAttendanceUpdate);
        return () => window.removeEventListener('attendance-updated', handleLiveAttendanceUpdate);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadAcademicData();
            setStep('entry');
            setErrors({});
            setIsDirty(false);
            setShowDiscardPrompt(false);
        }
    }, [isOpen, loadAcademicData]);

    // Derived subject config
    const currentConfig = useMemo(() => {
        return getSubjectEvaluationConfig(selectedSubject);
    }, [selectedSubject]);

    // Handle switching subjects
    const handleSelectSubject = (subj) => {
        setSelectedSubject(subj);
        setRawMarks({ ...(subj.rawMarks || {}) });
        setErrors({});
        setIsDirty(false);
        setStep('entry');
    };

    // Handle single mark field input
    const handleMarkChange = (fieldId, valueStr, maxRaw) => {
        setIsDirty(true);
        let val = valueStr === '' ? null : Number(valueStr);
        let errorMsg = null;

        if (val !== null) {
            if (isNaN(val)) {
                errorMsg = 'Enter a valid mark';
            } else if (val < 0) {
                errorMsg = 'Marks cannot be negative';
            } else if (val > maxRaw) {
                errorMsg = `Maximum allowed is ${maxRaw}`;
            }
        }

        setErrors((prev) => ({
            ...prev,
            [fieldId]: errorMsg
        }));

        setRawMarks((prev) => ({
            ...prev,
            [fieldId]: val
        }));
    };

    // Handle manual attendance editing and KEEP IT in storage
    const handleAttendanceChange = (valStr) => {
        setCustomAttendance(valStr);
        setIsDirty(true);

        if (valStr !== '' && !isNaN(Number(valStr)) && selectedSubject) {
            const id = (selectedSubject.registeredSubjectId || selectedSubject.subjectId || selectedSubject._id || '').toString();
            const code = (selectedSubject.subjectCode || selectedSubject.customCode || selectedSubject.code || '').toString().toLowerCase();
            const name = (selectedSubject.subjectName || selectedSubject.customName || selectedSubject.name || '').toString().toLowerCase();
            const num = Number(valStr);

            setAttendanceMap((prev) => {
                const updated = {
                    ...prev,
                    ...(id ? { [id]: num } : {}),
                    ...(code ? { [code]: num } : {}),
                    ...(name ? { [name]: num } : {})
                };
                try {
                    localStorage.setItem('aus_attendance_cache', JSON.stringify(updated));
                } catch (e) {}
                return updated;
            });
        }
    };

    // Has errors
    const hasFieldErrors = useMemo(() => {
        return Object.values(errors).some((err) => !!err);
    }, [errors]);

    // Flatten all required subcomponents for the active evaluation configuration
    const flatRequiredRows = useMemo(() => {
        if (!currentConfig?.components) return [];
        const rows = [];
        Object.entries(currentConfig.components).forEach(([compKey, compConfig]) => {
            (compConfig.subComponents || []).forEach((sub) => {
                rows.push({
                    subId: sub.id,
                    name: sub.name,
                    compName: compConfig.name,
                    maxRaw: sub.maxRaw
                });
            });
        });
        return rows;
    }, [currentConfig]);

    // Count how many required mark fields have been entered with valid numbers
    const enteredMarksCount = useMemo(() => {
        return flatRequiredRows.filter((r) => {
            const val = rawMarks[r.subId];
            return val !== undefined && val !== null && val !== '' && !isNaN(Number(val));
        }).length;
    }, [flatRequiredRows, rawMarks]);

    const isAllMarksEntered = useMemo(() => {
        return flatRequiredRows.length > 0 && enteredMarksCount === flatRequiredRows.length;
    }, [flatRequiredRows, enteredMarksCount]);

    const isAttendanceValid = useMemo(() => {
        if (!includeAttendance) return true;
        if (customAttendance === '' || customAttendance === null || customAttendance === undefined) return false;
        const num = Number(customAttendance);
        return !isNaN(num) && num >= 0 && num <= 100;
    }, [includeAttendance, customAttendance]);

    const canProceedToCalculation = isAllMarksEntered && isAttendanceValid && !hasFieldErrors;

    // Find attendance for selected subject
    const selectedSubjectAttendance = useMemo(() => {
        if (!selectedSubject) return null;
        const id = (selectedSubject.registeredSubjectId || selectedSubject.subjectId || selectedSubject._id || '').toString();
        const code = (selectedSubject.subjectCode || selectedSubject.customCode || selectedSubject.code || '').toString().toLowerCase();
        const name = (selectedSubject.subjectName || selectedSubject.customName || selectedSubject.name || '').toString().toLowerCase();
        return attendanceMap[id] ?? attendanceMap[code] ?? attendanceMap[name] ?? selectedSubject.attendancePercentage ?? null;
    }, [selectedSubject, attendanceMap]);

    // Keep customAttendance in sync when subject changes
    useEffect(() => {
        if (selectedSubjectAttendance !== null && selectedSubjectAttendance !== undefined) {
            setCustomAttendance(String(selectedSubjectAttendance));
        } else {
            setCustomAttendance('');
        }
    }, [selectedSubjectAttendance]);

    // Calculate CIE & Automatic Eligibility (STRICT VALIDATION: Do not proceed if required fields are missing)
    const handleCalculate = async () => {
        if (!currentConfig) return;

        // 1. Guard against empty / incomplete required fields
        const missing = flatRequiredRows.filter((r) => {
            const val = rawMarks[r.subId];
            return val === undefined || val === null || val === '' || isNaN(Number(val));
        });

        if (missing.length > 0) {
            const newErrors = { ...errors };
            missing.forEach((r) => {
                newErrors[r.subId] = 'Required';
            });
            setErrors(newErrors);

            if (missing.length === flatRequiredRows.length) {
                toast.error('Please enter marks for all required components before calculating.');
            } else {
                toast.error(`Please enter marks for all required fields (${missing.length} remaining).`);
            }
            return; // DO NOT PROCEED TO CALCULATION SECTION!
        }

        // 2. Guard against missing or invalid attendance when verification is enabled
        if (includeAttendance) {
            if (customAttendance === '' || isNaN(Number(customAttendance))) {
                toast.error('Please enter an attendance percentage or disable attendance verification.');
                return; // DO NOT PROCEED TO CALCULATION SECTION!
            }
            const attNum = Number(customAttendance);
            if (attNum < 0 || attNum > 100) {
                toast.error('Attendance percentage must be between 0% and 100%.');
                return; // DO NOT PROCEED TO CALCULATION SECTION!
            }
        }

        // 3. Guard against any other invalid field entries
        if (hasFieldErrors) {
            toast.error('Please fix invalid marks before proceeding to calculation.');
            return; // DO NOT PROCEED TO CALCULATION SECTION!
        }

        // All required fields verified — calculate and proceed to result view
        const calculated = calculateCieMarks(rawMarks, currentConfig);
        setCieResult(calculated);

        const attValue = (includeAttendance && customAttendance !== '' && !isNaN(Number(customAttendance)))
            ? Number(customAttendance)
            : (includeAttendance && selectedSubjectAttendance !== null)
                ? Number(selectedSubjectAttendance)
                : null;

        const eligibility = evaluateAcademicEligibility({
            cieResult: calculated,
            config: currentConfig,
            attendance: attValue,
            includeAttendance,
            backlogs: activeBacklogs,
            minAttendanceThreshold: 75
        });
        setEligibilityResult(eligibility);

        // Transition to result view
        setStep('result');

        // Persist to backend if registeredSubjectId exists and user has Plus
        if (hasPlusAccess) {
            const regSubId = selectedSubject?.registeredSubjectId || selectedSubject?._id;
            if (regSubId) {
                setIsSaving(true);
                try {
                    await apiV2.saveCieRecord({
                        registeredSubjectId: regSubId,
                        semester: selectedSubject.semester || 1,
                        rawMarks
                    });
                    setIsDirty(false);
                } catch (saveErr) {
                    console.warn('[CIEEligibilityTool] Auto-save skipped:', saveErr.message);
                } finally {
                    setIsSaving(false);
                }
            }
        }
    };

    // Close attempt handler
    const handleRequestClose = () => {
        if (isDirty) {
            setShowDiscardPrompt(true);
        } else {
            onClose();
        }
    };

    const confirmDiscardAndClose = () => {
        setShowDiscardPrompt(false);
        setIsDirty(false);
        onClose();
    };

    const selectedName = selectedSubject
        ? (selectedSubject.subjectName || selectedSubject.customName || selectedSubject.name)
        : '';
    const selectedCode = selectedSubject
        ? (selectedSubject.subjectCode || selectedSubject.customCode || selectedSubject.code)
        : '';

    // Render footer buttons depending on step
    const renderFooter = () => {
        if (isLoading || loadError || !selectedSubject) return null;

        if (step === 'entry') {
            return (
                <>
                    <button
                        type="button"
                        onClick={handleRequestClose}
                        className="px-3.5 py-1.5 rounded text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={!canProceedToCalculation}
                        onClick={handleCalculate}
                        title={
                            !isAllMarksEntered
                                ? `Enter all required components (${flatRequiredRows.length - enteredMarksCount} remaining) to calculate`
                                : !isAttendanceValid
                                    ? 'Enter valid attendance percentage (0-100%) to calculate'
                                    : hasFieldErrors
                                        ? 'Fix invalid marks before calculating'
                                        : 'Calculate CIE & Academic Eligibility'
                        }
                        className="px-4 py-1.5 rounded text-xs font-mono font-bold text-white dark:text-slate-950 bg-purple-600 dark:bg-slate-100 hover:bg-purple-700 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                        <span>Calculate CIE & Eligibility</span>
                        <ArrowRight size={13} />
                    </button>
                </>
            );
        }

        return (
            <>
                <button
                    type="button"
                    onClick={() => setStep('entry')}
                    className="px-3.5 py-1.5 rounded text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                    <Pencil size={12} />
                    <span>Edit marks</span>
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 rounded text-xs font-mono font-bold text-white dark:text-slate-950 bg-purple-600 dark:bg-slate-100 hover:bg-purple-700 dark:hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                    <Check size={13} />
                    <span>Done</span>
                </button>
            </>
        );
    };

    return (
        <>
            <AcademicToolModal
                isOpen={isOpen}
                onClose={onClose}
                onRequestClose={handleRequestClose}
                isDirty={isDirty}
                title="CIE & Eligibility"
                subtitle="Continuous Internal Evaluation and academic eligibility verification"
                subjectBadge={selectedCode ? `${selectedCode} · ${selectedName}` : null}
                icon={Calculator}
                footer={renderFooter()}
            >
                {/* 1. Loading State */}
                {isLoading && (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 font-mono">
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-purple-600 dark:border-t-slate-200 animate-spin" />
                        <span className="text-xs">Loading course evaluation rules...</span>
                    </div>
                )}

                {/* 2. Error State */}
                {!isLoading && loadError && (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-center px-4 font-mono">
                        <div className="w-9 h-9 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <AlertCircle size={18} />
                        </div>
                        <p className="text-xs text-rose-600 dark:text-rose-300 max-w-sm m-0">
                            {loadError}
                        </p>
                        <button
                            type="button"
                            onClick={loadAcademicData}
                            className="mt-1 px-3.5 py-1.5 rounded text-xs font-mono font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                            <RefreshCw size={12} />
                            <span>Retry</span>
                        </button>
                    </div>
                )}

                {/* 3. Empty Subjects State */}
                {!isLoading && !loadError && subjects.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-center px-4 font-mono">
                        <div className="w-9 h-9 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                            <Calculator size={18} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 m-0 uppercase tracking-wide">No Subjects Found</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm m-0 font-sans">
                            No curriculum subjects found for your branch and semester. Please verify your academic profile details.
                        </p>
                    </div>
                )}

                {/* 4. Active Workspace */}
                {!isLoading && !loadError && subjects.length > 0 && (
                    <div className="space-y-5">
                        {/* Step A: Subject Selector */}
                        <SubjectCombobox
                            subjects={subjects}
                            selectedSubject={selectedSubject}
                            onSelectSubject={handleSelectSubject}
                            disabled={step === 'result'}
                        />

                        {/* Step B: Marks Entry View */}
                        {step === 'entry' && (
                            <div className="animate-in fade-in duration-100">
                                <MarksEntrySheet
                                    evalConfig={currentConfig}
                                    rawMarks={rawMarks}
                                    errors={errors}
                                    onChangeMark={handleMarkChange}
                                    hasSavedData={Boolean(selectedSubject?.rawMarks && Object.keys(selectedSubject.rawMarks).length > 0)}
                                    includeAttendance={includeAttendance}
                                    onToggleAttendance={setIncludeAttendance}
                                    attendanceValue={customAttendance}
                                    onChangeAttendance={handleAttendanceChange}
                                    attendanceThreshold={75}
                                    readOnly={!hasPlusAccess}
                                    onLockedClick={handleLockedAction}
                                />
                            </div>
                        )}

                        {/* Step C: Unified Result View (CIE + Eligibility + SEE Target) */}
                        {step === 'result' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                {/* 1. CIE Result Score & Breakdown */}
                                <CIEResultSection
                                    cieResult={cieResult}
                                    evalConfig={currentConfig}
                                />

                                {/* 2. Automatic Eligibility Audit */}
                                <EligibilityAuditSection
                                    eligibilityResult={eligibilityResult}
                                />

                                {/* 3. SEE Target Forecast (Only for courses with SEE) */}
                                <SEETargetCard
                                    currentCie={cieResult?.totalCie || 0}
                                    maxCie={cieResult?.maxCie || 50}
                                    hasSee={currentConfig?.hasSee !== false}
                                    isLocked={!hasPlusAccess}
                                    onLockedClick={handleLockedAction}
                                />
                            </div>
                        )}
                    </div>
                )}
            </AcademicToolModal>

            {/* Unsaved Changes Confirmation Modal */}
            <UnsavedChangesDialog
                isOpen={showDiscardPrompt}
                onKeepEditing={() => setShowDiscardPrompt(false)}
                onDiscard={confirmDiscardAndClose}
            />
        </>
    );
}

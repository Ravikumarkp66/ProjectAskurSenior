import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    Lock,
    ChevronDown,
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    User,
    GraduationCap,
    Building2,
    BookOpen,
    Phone
} from 'lucide-react';
import { authAPI, lookupAPI, branchAPI } from '../services/api';
import { useAuth } from '../utils/hooks';
import { useTheme } from '../context/ThemeContext';
import { ASLogo } from '../components/Logo';
import ThemeToggle from '../components/navbar/ThemeToggle';
import { INDIAN_COLLEGES, DEFAULT_COLLEGE } from '../constants/indianColleges';
import {
    normalizeName,
    validateName,
    normalizeUsn,
    validateUsn
} from '../utils/userValidation';

const getCollegeFromEmail = (email) => {
    if (!email) return null;
    const lower = email.toLowerCase().trim();
    if (lower.endsWith('@sit.ac.in')) return 'Siddaganga Institute of Technology';
    if (lower.endsWith('@rvce.edu.in')) return 'R.V. College of Engineering';
    if (lower.endsWith('@msrit.edu') || lower.endsWith('@msrit.edu.in')) return 'Ramaiah Institute of Technology';
    if (lower.endsWith('@bmsce.ac.in')) return 'B.M.S. College of Engineering';
    if (lower.endsWith('@dsce.edu.in')) return 'Dayananda Sagar College of Engineering';
    if (lower.endsWith('@pes.edu')) return 'PES College of Engineering, Mandya';
    if (lower.endsWith('@jssateb.ac.in')) return 'JSS Academy of Technical Education';
    if (lower.endsWith('@sjce.ac.in')) return 'Sri Jayachamarajendra College of Engineering';
    if (lower.endsWith('@nie.ac.in')) return 'The National Institute of Engineering';
    if (lower.endsWith('@bit-bangalore.edu.in')) return 'Bangalore Institute of Technology';
    return null;
};

/* ─── Ambient Subtle SaaS Background ────────────────────────────── */
const BgAtmosphere = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute inset-0 bg-[#F8FAFC] dark:bg-[#080B14] transition-colors duration-300" />
        <div
            className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[130px] opacity-35 dark:opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }}
        />
        <div
            className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[130px] opacity-25 dark:opacity-15 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }}
        />
        {/* Subtle engineering dot grid */}
        <div
            className="absolute inset-0 opacity-[0.3] dark:opacity-[0.2]"
            style={{
                backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
                backgroundSize: '28px 28px'
            }}
        />
    </div>
);

/* ─── Modern SaaS Field Wrapper ─────────────────────────────────── */
const FormField = ({
    label,
    optional = false,
    locked = false,
    isValid = false,
    helperNote,
    children,
    className = ''
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 tracking-[0.01em] flex items-center gap-1.5">
                    <span>{label}</span>
                    {locked && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" title="Non-editable field" />
                    )}
                </label>
                {optional && (
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wider">
                        Optional
                    </span>
                )}
                {isValid && !locked && (
                    <span className="text-[12px] font-semibold text-emerald-500 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                )}
            </div>
            {children}
            {helperNote && (
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight pl-0.5">
                    {helperNote}
                </p>
            )}
        </div>
    );
};

const inputCls = 'w-full px-3.5 h-[46px] rounded-xl bg-slate-50/70 dark:bg-[#131722] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 focus:bg-white dark:focus:bg-[#151a27] transition-all text-[14px] font-medium disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-slate-100/70 dark:disabled:bg-white/[0.03] disabled:border-slate-200/80 dark:disabled:border-white/[0.06] disabled:text-slate-500 dark:disabled:text-slate-400';
const selectCls = `${inputCls} cursor-pointer appearance-none pr-10`;

const decodeJwtPayload = (jwtStr) => {
    if (!jwtStr || typeof jwtStr !== 'string' || !jwtStr.includes('.')) return null;
    try {
        const parts = jwtStr.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const buildGradYears = () => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1, y + 2, y + 3, y + 4, y + 5];
};

const dedupeSchemes = (schemes) => {
    const seen = new Map();
    schemes.forEach(s => {
        const m = s.name?.match(/20\d\d/) || s.year?.toString().match(/20\d\d/);
        if (m && !seen.has(m[0])) seen.set(m[0], s);
    });
    return Array.from(seen.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, s]) => ({ _id: s._id, label: year }));
};

const branchCodeMap = {
    'CS': 'CSE', 'IS': 'ISE', 'EC': 'ECE', 'EE': 'EEE',
    'ME': 'MECH', 'CV': 'CIVIL', 'AI': 'AIML', 'AM': 'AIML',
    'DS': 'DS', 'CB': 'CSBS', 'BT': 'BT'
};

/* ═══════════════════════════════════════════════════════════════════
   COMPLETE PROFILE — Canonical User Onboarding
═══════════════════════════════════════════════════════════════════ */
const CompleteProfilePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user } = useAuth();
    const { isDark } = useTheme();

    // Step state: 1 = Identity & Institution, 2 = Academic Setup
    const [step, setStep] = useState(1);

    // Resolve verified email (from state, storage, token, or auth user)
    const verifiedEmail = useMemo(() => {
        let email = location.state?.email || location.state?.prefilled?.email || '';

        if (!email) {
            try {
                const raw = sessionStorage.getItem('registrationPrefilled') || localStorage.getItem('registrationPrefilled');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    email = parsed.email || email;
                }
            } catch (e) {}
        }

        if (!email) {
            email = sessionStorage.getItem('registrationEmail') || localStorage.getItem('registrationEmail') || '';
        }

        if (!email) {
            const token = location.state?.registrationToken ||
                sessionStorage.getItem('registrationToken') ||
                localStorage.getItem('registrationToken') ||
                localStorage.getItem('token');
            const decoded = decodeJwtPayload(token);
            if (decoded?.email) {
                email = decoded.email;
            }
        }

        if (!email && user?.email) {
            email = user.email;
        }

        return (email || '').trim().toLowerCase();
    }, [location.state, user]);

    // Check if college email is used (e.g. @sit.ac.in)
    const emailDetectedCollege = useMemo(() => {
        return getCollegeFromEmail(verifiedEmail);
    }, [verifiedEmail]);

    const isCollegeLocked = !!emailDetectedCollege;

    const prefilledData = useMemo(() => {
        let p = location.state?.prefilled || null;
        if (!p) {
            try {
                const raw = sessionStorage.getItem('registrationPrefilled') || localStorage.getItem('registrationPrefilled');
                if (raw) p = JSON.parse(raw);
            } catch (e) {}
        }
        if (!p && user) {
            p = {
                name: user.name || '',
                usn: user.usn || '',
                college: user.collegeName || user.college || '',
                branch: user.branch?._id || user.branch || '',
                scheme: user.scheme?._id || user.scheme || '',
                semester: user.semester ? String(user.semester) : '',
                dob: user.dob ? (typeof user.dob === 'string' ? user.dob.split('T')[0] : new Date(user.dob).toISOString().split('T')[0]) : '',
                phone: user.phone || '',
                graduationYear: user.graduationYear ? String(user.graduationYear) : '',
            };
        }
        return p || {};
    }, [location.state, user]);

    // Form fields start prefilled from existing student data if available
    const [form, setForm] = useState(() => ({
        name: prefilledData.name || '',
        usn: prefilledData.usn || '',
        college: prefilledData.college || emailDetectedCollege || DEFAULT_COLLEGE,
        branch: prefilledData.branch || '',
        scheme: prefilledData.scheme || '',
        semester: prefilledData.semester || '1',
        graduationYear: prefilledData.graduationYear || '',
        phone: prefilledData.phone || '',
        dob: prefilledData.dob || '',
    }));

    const [userEmail, setUserEmail] = useState(verifiedEmail);
    const [branches, setBranches] = useState([]);
    const [rawSchemes, setRawSchemes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const dedupedSchemes = useMemo(() => dedupeSchemes(rawSchemes), [rawSchemes]);
    const gradYears = buildGradYears();

    useEffect(() => {
        if (verifiedEmail) {
            setUserEmail(verifiedEmail);
            const col = getCollegeFromEmail(verifiedEmail);
            if (col) {
                setForm(p => ({ ...p, college: col }));
            }
        }
    }, [verifiedEmail]);

    useEffect(() => {
        if (prefilledData && Object.keys(prefilledData).length > 0) {
            setForm(prev => ({
                ...prev,
                name: prev.name || prefilledData.name || '',
                usn: prev.usn || prefilledData.usn || '',
                college: prev.college || prefilledData.college || emailDetectedCollege || DEFAULT_COLLEGE,
                branch: prev.branch || prefilledData.branch || '',
                scheme: prev.scheme || prefilledData.scheme || '',
                semester: (prev.semester && prev.semester !== '1') ? prev.semester : (prefilledData.semester || '1'),
                graduationYear: prev.graduationYear || prefilledData.graduationYear || '',
                phone: prev.phone || prefilledData.phone || '',
                dob: prev.dob || prefilledData.dob || '',
            }));
        }
    }, [prefilledData, emailDetectedCollege]);

    /* Load branches + schemes */
    useEffect(() => {
        const load = async () => {
            try {
                const [bRes, sRes] = await Promise.all([
                    branchAPI.getPublic(),
                    lookupAPI.getSchemes(),
                ]);
                const filtered = (bRes.data || []).filter(
                    b => !b.name?.toLowerCase().includes('common')
                );
                setBranches(filtered);
                setRawSchemes(sRes.data || []);
            } catch (e) {
                console.error('[CompleteProfile] Failed to load lookup data:', e);
            }
        };
        load();
    }, []);

    const resolveSchemeForGradYear = (gradYear, availableSchemes) => {
        const yearNum = parseInt(gradYear, 10) || 2027;
        const targetKey = yearNum > 2028 ? '2025' : '2022';
        const found = (availableSchemes || []).find(s => 
            s.name?.startsWith(targetKey) || s.name === targetKey || s.label?.startsWith(targetKey)
        );
        return found ? found._id : (availableSchemes?.[0]?._id || '');
    };

    useEffect(() => {
        if (dedupedSchemes.length > 0) {
            setForm(prev => {
                let gradYear = prev.graduationYear;
                if (!gradYear && prev.usn) {
                    const match = normalizeUsn(prev.usn).match(/^([1-4])([A-Z]{2})([0-9]{2})/);
                    if (match) {
                        gradYear = String(2000 + parseInt(match[3], 10) + 4);
                    }
                }
                const autoSchemeId = resolveSchemeForGradYear(gradYear || 2027, dedupedSchemes);
                return { ...prev, scheme: autoSchemeId };
            });
        }
    }, [dedupedSchemes, form.graduationYear, form.usn]);

    useEffect(() => {
        if (branches.length > 0) {
            setForm(prev => {
                if (prev.branch) return prev;
                if (prev.usn) {
                    const match = normalizeUsn(prev.usn).match(/^([1-4])([A-Z]{2})([0-9]{2})([A-Z]{2,3})([0-9]{3})$/);
                    if (match) {
                        const branchCode = match[4];
                        const shortName = branchCodeMap[branchCode] || branchCode;
                        const matched = branches.find(b => 
                            b.shortName?.toUpperCase() === shortName.toUpperCase() || 
                            b.name?.toUpperCase().includes(shortName.toUpperCase())
                        );
                        if (matched) return { ...prev, branch: matched._id };
                    }
                }
                return prev;
            });
        }
    }, [branches]);

    const onChange = (key, val) => {
        setForm(p => ({ ...p, [key]: val }));
        setError('');
    };

    const handleNameChange = (e) => {
        const raw = e.target.value.toLowerCase();
        onChange('name', raw);
    };

    const handleNameBlur = () => {
        if (form.name) {
            onChange('name', normalizeName(form.name));
        }
    };

    const autoDeriveFromUsn = (upperUsn, currentForm) => {
        const vtuRegex = /^([1-4])([A-Z]{2})([0-9]{2})([A-Z]{2,3})([0-9]{3})$/;
        const match = upperUsn.match(vtuRegex);
        if (!match) return { ...currentForm, usn: upperUsn };

        const [_, regionDigit, collegeCode, yearCode, branchCode, rollCode] = match;
        const admissionYear = 2000 + parseInt(yearCode, 10);
        const graduationYear = admissionYear + 4;

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        let semesterEstimate = 1;
        const yearsDiff = currentYear - admissionYear;
        if (currentMonth >= 7 || currentMonth === 0) {
            semesterEstimate = yearsDiff * 2 + 1;
        } else {
            semesterEstimate = yearsDiff * 2;
        }
        semesterEstimate = Math.max(1, Math.min(8, semesterEstimate));

        const updates = { ...currentForm, usn: upperUsn };

        // Set graduation year & semester
        updates.graduationYear = String(graduationYear);
        updates.semester = String(semesterEstimate);

        // Auto-match branch if not set
        if (!currentForm.branch && branches.length > 0) {
            const shortName = branchCodeMap[branchCode] || branchCode;
            const matchedBranch = branches.find(b => 
                b.shortName?.toUpperCase() === shortName.toUpperCase() || 
                b.name?.toUpperCase().includes(shortName.toUpperCase())
            );
            if (matchedBranch) {
                updates.branch = matchedBranch._id;
            }
        }

        // Auto-match scheme based on graduation year
        const autoSchemeId = resolveSchemeForGradYear(graduationYear, dedupedSchemes);
        if (autoSchemeId) {
            updates.scheme = autoSchemeId;
        }

        return updates;
    };

    const handleUsnChange = (e) => {
        const upper = normalizeUsn(e.target.value);
        setForm(prev => autoDeriveFromUsn(upper, prev));
        setError('');
    };

    const handleGradYearChange = (yearStr) => {
        if (!yearStr) {
            onChange('graduationYear', '');
            return;
        }
        const gradYear = parseInt(yearStr, 10);
        const admYear = gradYear - 4;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        let semesterEstimate = 1;
        const yearsDiff = currentYear - admYear;
        if (currentMonth >= 7 || currentMonth === 0) {
            semesterEstimate = yearsDiff * 2 + 1;
        } else {
            semesterEstimate = yearsDiff * 2;
        }
        semesterEstimate = Math.max(1, Math.min(8, semesterEstimate));

        const autoSchemeId = resolveSchemeForGradYear(yearStr, dedupedSchemes);

        setForm(p => ({
            ...p,
            graduationYear: yearStr,
            semester: String(semesterEstimate),
            scheme: autoSchemeId || p.scheme
        }));
        setError('');
    };

    const isNameValid = form.name.length > 0 && validateName(normalizeName(form.name));
    const isUsnValid = form.usn.length > 0 && validateUsn(normalizeUsn(form.usn));

    // Step 1 Validation
    const validateStep1 = () => {
        const cleanName = normalizeName(form.name);
        if (!cleanName) return 'Please enter your full name.';
        if (!validateName(cleanName)) return 'Name must contain only lowercase English letters and single spaces (2-50 characters, e.g. rahul kumar).';

        const cleanUsn = normalizeUsn(form.usn);
        if (!cleanUsn) return 'Please enter your USN.';
        if (!validateUsn(cleanUsn)) return 'Invalid USN format (e.g. 1SI23IS080).';

        if (!form.college || !form.college.trim()) return 'Please select or enter your college.';
        if (!form.branch) return 'Please select your academic branch.';

        return null;
    };

    // Full form validation
    const validate = () => {
        const step1Err = validateStep1();
        if (step1Err) return { error: step1Err, targetStep: 1 };

        if (!form.scheme) return { error: 'Please select your syllabus scheme.', targetStep: 2 };
        if (!form.semester || parseInt(form.semester, 10) < 1 || parseInt(form.semester, 10) > 8) {
            return { error: 'Please select your current semester (1 to 8).', targetStep: 2 };
        }
        if (!form.graduationYear) return { error: 'Please select your expected graduation year.', targetStep: 2 };

        // Check optional / required fields
        const missingFields = location.state?.missingFields || [];
        const isPhoneStrict = missingFields.includes('Phone');
        const isDobStrict = missingFields.includes('DOB');

        if (isDobStrict && !form.dob) {
            return { error: 'Please enter your date of birth.', targetStep: 2 };
        }
        if (isPhoneStrict && (!form.phone || form.phone.trim().length < 10)) {
            return { error: 'Please enter a valid 10-digit mobile phone number.', targetStep: 2 };
        }
        if (form.phone && form.phone.trim().length > 0 && form.phone.trim().length < 10) {
            return { error: 'Please enter a valid 10-digit mobile phone number.', targetStep: 2 };
        }

        return null;
    };

    const handleContinueStep1 = (e) => {
        if (e) e.preventDefault();
        const err = validateStep1();
        if (err) {
            setError(err);
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const valResult = validate();
        if (valResult) {
            setError(valResult.error);
            if (valResult.targetStep && valResult.targetStep !== step) {
                setStep(valResult.targetStep);
            }
            return;
        }

        setLoading(true);
        setError('');
        try {
            const currentRegToken = location.state?.registrationToken ||
                sessionStorage.getItem('registrationToken') ||
                localStorage.getItem('registrationToken');

            const cleanName = normalizeName(form.name);
            const cleanUsn = normalizeUsn(form.usn);

            if (currentRegToken) {
                const res = await authAPI.register({
                    registrationToken: currentRegToken,
                    name: cleanName,
                    usn: cleanUsn,
                    collegeName: form.college ? form.college.trim() : DEFAULT_COLLEGE,
                    branch: form.branch || undefined,
                    scheme: form.scheme || undefined,
                    semester: form.semester ? parseInt(form.semester, 10) : undefined,
                    graduationYear: form.graduationYear ? parseInt(form.graduationYear, 10) : undefined,
                    phone: form.phone ? form.phone.trim() : '',
                    dob: form.dob || undefined
                });

                const resData = res.data;
                const student = resData.data?.student || resData.student;
                const token = resData.data?.accessToken || resData.token;

                sessionStorage.removeItem('registrationToken');
                sessionStorage.removeItem('registrationPrefilled');
                sessionStorage.removeItem('registrationEmail');
                localStorage.removeItem('registrationToken');
                localStorage.removeItem('registrationEmail');

                login(student, token);
                navigate('/dashboard');
            } else {
                const res = await authAPI.completeGoogleRegistration({
                    name: cleanName,
                    usn: cleanUsn,
                    collegeName: form.college ? form.college.trim() : DEFAULT_COLLEGE,
                    branch: form.branch || undefined,
                    scheme: form.scheme || undefined,
                    semester: form.semester ? parseInt(form.semester, 10) : undefined,
                    graduationYear: form.graduationYear ? parseInt(form.graduationYear, 10) : undefined,
                    phone: form.phone ? form.phone.trim() : '',
                    dob: form.dob || undefined
                });
                const resData = res.data;
                const userOrStudent = resData.data?.student || resData.user || resData.student;
                const token = resData.data?.accessToken || resData.token;

                sessionStorage.removeItem('registrationToken');
                sessionStorage.removeItem('registrationPrefilled');
                sessionStorage.removeItem('registrationEmail');
                localStorage.removeItem('registrationToken');
                localStorage.removeItem('registrationEmail');

                login(userOrStudent, token);
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('[CompleteProfile] Registration error:', err);
            const msg = err?.response?.data?.message || err?.response?.data?.error || (err?.response?.data?.errors ? Object.values(err.response.data.errors).map(e => e.msg || e).join(', ') : 'Failed to complete profile. Please check your details and try again.');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
            <BgAtmosphere />

            {/* Quick Theme Switcher in top corner */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                <ThemeToggle />
            </div>

            {/* Main Centered 2-Step Card */}
            <div className="relative z-10 w-full max-w-[880px] my-auto">
                <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                    className="rounded-2xl sm:rounded-[24px] bg-white dark:bg-[#0F1420] border border-slate-200/90 dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.55)] text-slate-900 dark:text-white p-6 sm:p-8 md:p-9 transition-colors duration-200"
                >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/[0.06] mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] rounded-xl shadow-xs">
                                <ASLogo size={32} strokeColor={isDark ? '#F8FAFC' : '#1E293B'} />
                            </div>
                            <div>
                                <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Ask<span className="text-[#8B5CF6] font-extrabold">UR</span>Senior
                                </div>
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                                    Complete your profile
                                </h1>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Tell us a little about yourself to personalize your AskUrSenior experience.
                                </p>
                            </div>
                        </div>

                        {/* Verified Account Pill */}
                        {userEmail && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] text-xs font-medium text-slate-600 dark:text-slate-300 self-start sm:self-center">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
                                <span className="max-w-[200px] truncate" title={userEmail}>
                                    {userEmail}
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    Verified
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Progress Indicator */}
                    <div className="mb-7">
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                            {/* Step 1 Tab */}
                            <button
                                type="button"
                                onClick={() => { if (step === 2) setStep(1); }}
                                className={`flex items-center gap-2 transition-all cursor-pointer ${
                                    step === 1
                                        ? 'text-[#8B5CF6]'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                                    step === 1
                                        ? 'bg-[#8B5CF6] text-white shadow-xs'
                                        : isNameValid && isUsnValid
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-slate-100 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400'
                                }`}>
                                    {step > 1 && isNameValid && isUsnValid ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : '01'}
                                </span>
                                <span className="font-medium tracking-wide">Identity & Institution</span>
                            </button>

                            {/* Divider Line */}
                            <div className="flex-1 h-[2px] bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden mx-2">
                                <div
                                    className="h-full bg-[#8B5CF6] transition-all duration-300"
                                    style={{ width: step === 1 ? '50%' : '100%' }}
                                />
                            </div>

                            {/* Step 2 Tab */}
                            <button
                                type="button"
                                onClick={() => { if (step === 1 && !validateStep1()) setStep(2); }}
                                className={`flex items-center gap-2 transition-all ${
                                    step === 2
                                        ? 'text-[#8B5CF6]'
                                        : 'text-slate-400 dark:text-slate-500'
                                }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                                    step === 2
                                        ? 'bg-[#8B5CF6] text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-white/[0.08] text-slate-400 dark:text-slate-500'
                                }`}>
                                    02
                                </span>
                                <span className="font-medium tracking-wide">Academic Setup</span>
                            </button>
                        </div>
                    </div>

                    {/* Missing Fields Alert */}
                    {location.state?.missingFields && location.state.missingFields.length > 0 && (
                        <div className="flex items-start gap-2.5 p-3 mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[13px]">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-relaxed">
                                Missing required profile items: <strong>{location.state.missingFields.join(', ')}</strong>
                            </span>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2.5 p-3 mb-5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300 text-[13px]"
                        >
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-relaxed font-medium">{error}</span>
                        </motion.div>
                    )}

                    {/* Form Component */}
                    <form onSubmit={step === 1 ? handleContinueStep1 : handleSubmit}>
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.16 }}
                                    className="space-y-5"
                                >
                                    {/* 2-Column Grid for Step 1 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Column 1: Identity */}
                                        <div className="space-y-4">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pb-0.5">
                                                <User className="w-3.5 h-3.5 text-[#8B5CF6]" />
                                                <span>Personal Identity</span>
                                            </div>

                                            {/* Full Name */}
                                            <FormField
                                                label="Full Name"
                                                isValid={isNameValid}
                                            >
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={form.name}
                                                        onChange={handleNameChange}
                                                        onBlur={handleNameBlur}
                                                        placeholder="e.g. rahul kumar"
                                                        disabled={loading}
                                                        autoComplete="off"
                                                        className={`${inputCls} ${form.name && !isNameValid ? 'border-amber-500/60 focus:border-amber-500' : ''}`}
                                                    />
                                                    {isNameValid && (
                                                        <Check className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    )}
                                                </div>
                                            </FormField>

                                            {/* USN */}
                                            <FormField
                                                label="USN (University Seat Number)"
                                                isValid={isUsnValid}
                                            >
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={form.usn}
                                                        onChange={handleUsnChange}
                                                        placeholder="e.g. 1SI23IS080"
                                                        disabled={loading}
                                                        autoComplete="off"
                                                        className={`${inputCls} uppercase tracking-wider font-semibold ${form.usn && !isUsnValid ? 'border-amber-500/60 focus:border-amber-500' : ''}`}
                                                    />
                                                    {isUsnValid && (
                                                        <Check className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    )}
                                                </div>
                                            </FormField>
                                        </div>

                                        {/* Column 2: Institution */}
                                        <div className="space-y-4">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pb-0.5">
                                                <Building2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                                                <span>Institution</span>
                                            </div>

                                            {/* College */}
                                            <FormField
                                                label="College"
                                                locked={isCollegeLocked}
                                                helperNote={isCollegeLocked ? 'Verified automatically from institutional email' : undefined}
                                            >
                                                {isCollegeLocked ? (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={form.college}
                                                            disabled
                                                            className={inputCls}
                                                        />
                                                        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <select
                                                            value={form.college}
                                                            onChange={e => onChange('college', e.target.value)}
                                                            disabled={loading}
                                                            className={selectCls}
                                                        >
                                                            <option value="">Select College</option>
                                                            {INDIAN_COLLEGES.map(c => (
                                                                <option key={c} value={c} className="bg-white dark:bg-[#131722] text-slate-900 dark:text-white">
                                                                    {c}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                )}
                                            </FormField>

                                            {/* Branch */}
                                            <FormField
                                                label="Branch"
                                            >
                                                <div className="relative">
                                                    <select
                                                        value={form.branch}
                                                        onChange={e => onChange('branch', e.target.value)}
                                                        disabled={loading}
                                                        className={selectCls}
                                                    >
                                                        <option value="">Select Branch</option>
                                                        {branches.map(b => (
                                                            <option key={b._id} value={b._id} className="bg-white dark:bg-[#131722] text-slate-900 dark:text-white">
                                                                {b.name} {b.shortName ? `(${b.shortName})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </FormField>
                                        </div>
                                    </div>

                                    {/* Step 1 Actions */}
                                    <div className="pt-4 flex items-center justify-end">
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            type="submit"
                                            disabled={loading || !form.name || !form.usn}
                                            className="w-full sm:w-auto px-6 h-[46px] rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all font-semibold text-white shadow-[0_2px_12px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                        >
                                            <span>Continue to Academic Setup</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.16 }}
                                    className="space-y-5"
                                >
                                    {/* 2-Column Grid for Step 2 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Column 1: Academic Setup */}
                                        <div className="space-y-4">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pb-0.5">
                                                <GraduationCap className="w-3.5 h-3.5 text-[#8B5CF6]" />
                                                <span>Academic Details</span>
                                            </div>

                                            {/* Scheme (Locked) */}
                                            <FormField
                                                label="Scheme"
                                                locked
                                                helperNote="Automatically determined from your graduation year."
                                            >
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={
                                                            (() => {
                                                                const matched = dedupedSchemes.find(s => s._id === form.scheme || s.name === form.scheme);
                                                                if (matched) return `${matched.label || matched.name} Scheme`;
                                                                const gradYear = parseInt(form.graduationYear, 10);
                                                                return gradYear > 2028 ? '2025 Scheme' : '2022 Scheme';
                                                            })()
                                                        }
                                                        disabled
                                                        className={inputCls}
                                                    />
                                                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </FormField>

                                            {/* Semester & Graduation Year */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                <FormField label="Semester">
                                                    <div className="relative">
                                                        <select
                                                            value={form.semester}
                                                            onChange={e => onChange('semester', e.target.value)}
                                                            disabled={loading}
                                                            className={selectCls}
                                                        >
                                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                                                <option key={s} value={s} className="bg-white dark:bg-[#131722] text-slate-900 dark:text-white">
                                                                    Sem {s}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                </FormField>

                                                <FormField label="Graduation Year">
                                                    <div className="relative">
                                                        <select
                                                            value={form.graduationYear}
                                                            onChange={e => handleGradYearChange(e.target.value)}
                                                            disabled={loading}
                                                            className={selectCls}
                                                        >
                                                            <option value="">Year</option>
                                                            {gradYears.map(y => (
                                                                <option key={y} value={y} className="bg-white dark:bg-[#131722] text-slate-900 dark:text-white">
                                                                    {y}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                </FormField>
                                            </div>
                                        </div>

                                        {/* Column 2: Additional Info */}
                                        <div className="space-y-4">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pb-0.5">
                                                <BookOpen className="w-3.5 h-3.5 text-[#8B5CF6]" />
                                                <span>Contact & Personal</span>
                                            </div>

                                            {/* Mobile Number */}
                                            <FormField
                                                label="Mobile Number"
                                                optional
                                            >
                                                <div className="relative">
                                                    <input
                                                        type="tel"
                                                        value={form.phone}
                                                        onChange={e => onChange('phone', e.target.value)}
                                                        placeholder="e.g. 9876543210"
                                                        disabled={loading}
                                                        autoComplete="off"
                                                        className={inputCls}
                                                    />
                                                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </FormField>

                                            {/* Date of Birth */}
                                            <FormField
                                                label="Date of Birth"
                                                optional
                                            >
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={form.dob}
                                                        onChange={e => onChange('dob', e.target.value)}
                                                        disabled={loading}
                                                        className={inputCls}
                                                    />
                                                </div>
                                            </FormField>
                                        </div>
                                    </div>

                                    {/* Step 2 Actions */}
                                    <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setError(''); setStep(1); }}
                                            disabled={loading}
                                            className="w-full sm:w-auto px-4 h-[46px] rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300 transition-colors font-medium text-sm flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span>Back to Identity</span>
                                        </button>

                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            type="submit"
                                            disabled={loading}
                                            className="w-full sm:w-auto px-6 h-[46px] rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all font-semibold text-white shadow-[0_2px_12px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>Complete Profile</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>

                {/* Footer Security Note */}
                <p className="text-center text-[12px] text-slate-400 dark:text-slate-500 mt-4">
                    Your information is securely stored and used to personalize your AskUrSenior experience.
                </p>
            </div>
        </div>
    );
};

export default CompleteProfilePage;


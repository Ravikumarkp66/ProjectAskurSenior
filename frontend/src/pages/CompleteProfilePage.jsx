import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI, lookupAPI, branchAPI } from '../services/api';
import { useAuth } from '../utils/hooks';
import { ASLogo } from '../components/Logo';
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

/* ─── PCB mini background ────────────────────────────────────────── */
const BgGlow = () => (
    <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20"
            style={{ background: 'radial-gradient(circle,#8B5CF6,transparent)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-15"
            style={{ background: 'radial-gradient(circle,#6366F1,transparent)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#030305_95%)]" />
    </div>
);

/* ─── Field wrapper with validator indicator below ─────────────── */
const Field = ({ label, statusText, statusType = 'normal', children }) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-[13px] font-medium text-[#8A8F98] tracking-[0.02em]">
                    {label}
                </label>
            )}
            {children}
            {statusText && (
                <div className="text-[12px] pl-1 transition-colors flex items-center gap-1.5">
                    {statusType === 'valid' && (
                        <span className="text-emerald-400 font-medium">✓ {statusText}</span>
                    )}
                    {statusType === 'invalid' && (
                        <span className="text-amber-400 font-medium">{statusText}</span>
                    )}
                    {statusType === 'non-editable' && (
                        <span className="text-gray-500 font-normal">{statusText}</span>
                    )}
                    {statusType === 'normal' && (
                        <span className="text-gray-400 font-normal">{statusText}</span>
                    )}
                </div>
            )}
        </div>
    );
};

const inputCls = 'w-full px-4 h-[50px] rounded-[14px] bg-[#18191C] border border-white/[0.06] text-[#F3F4F6] placeholder-[#5F6672] focus:outline-none focus:border-[#8B5CF6] focus:ring-3 focus:ring-[#8B5CF6]/15 transition-all text-[15px] font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:border-white/[0.04] disabled:text-gray-400';
const selectCls = 'w-full px-4 h-[50px] rounded-[14px] bg-[#18191C] border border-white/[0.06] text-[#F3F4F6] focus:outline-none focus:border-[#8B5CF6] focus:ring-3 focus:ring-[#8B5CF6]/15 transition-all text-[15px] font-medium disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:border-white/[0.04] disabled:text-gray-400 cursor-pointer appearance-none';

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

/* ═══════════════════════════════════════════════════════════════════
   COMPLETE PROFILE — Canonical User Onboarding
═══════════════════════════════════════════════════════════════════ */
const CompleteProfilePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user } = useAuth();

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
        // Automatically convert to lowercase as user types without auto-completing
        const raw = e.target.value.toLowerCase();
        onChange('name', raw);
    };

    const handleNameBlur = () => {
        if (form.name) {
            onChange('name', normalizeName(form.name));
        }
    };

    const branchCodeMap = {
        'CS': 'CSE', 'IS': 'ISE', 'EC': 'ECE', 'EE': 'EEE',
        'ME': 'MECH', 'CV': 'CIVIL', 'AI': 'AIML', 'AM': 'AIML',
        'DS': 'DS', 'CB': 'CSBS', 'BT': 'BT'
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

    // Dynamic validator text for Name
    const getNameValidator = () => {
        if (!form.name) {
            return {
                text: 'Editable • Lowercase English letters and single spaces only (e.g. rahul kumar)',
                type: 'normal'
            };
        }
        if (isNameValid) {
            return {
                text: 'Editable • Name format is valid',
                type: 'valid'
            };
        }
        return {
            text: 'Editable • Only lowercase English letters and single spaces allowed (2-50 chars)',
            type: 'invalid'
        };
    };

    // Dynamic validator text for USN
    const getUsnValidator = () => {
        if (!form.usn) {
            return {
                text: 'Editable • Enter your official VTU USN (e.g. 1SI23IS080)',
                type: 'normal'
            };
        }
        if (isUsnValid) {
            return {
                text: 'Editable • USN format is valid',
                type: 'valid'
            };
        }
        return {
            text: 'Editable • Standard VTU USN format required (e.g. 1SI23IS080)',
            type: 'invalid'
        };
    };

    const nameVal = getNameValidator();
    const usnVal = getUsnValidator();

    const validate = () => {
        const cleanName = normalizeName(form.name);
        if (!cleanName) return 'Please enter your full name.';
        if (!validateName(cleanName)) return 'Name must contain only lowercase English letters and single spaces between words (2-50 characters, e.g. rahul kumar).';

        const cleanUsn = normalizeUsn(form.usn);
        if (!cleanUsn) return 'Please enter your USN.';
        if (!validateUsn(cleanUsn)) return 'Invalid USN format (e.g. 1SI23IS080).';

        if (!form.college || !form.college.trim()) return 'Please select or enter your college.';
        if (!form.branch) return 'Please select your academic branch.';
        if (!form.scheme) return 'Please select your syllabus scheme.';
        if (!form.semester || parseInt(form.semester, 10) < 1 || parseInt(form.semester, 10) > 8) return 'Please select your current semester (1 to 8).';
        if (!form.dob) return 'Please enter your date of birth.';
        if (!form.phone || form.phone.trim().length < 10) return 'Please enter a valid 10-digit mobile phone number.';
        if (!form.graduationYear) return 'Please select your expected graduation year.';

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }

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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <BgGlow />

            <div className="relative z-10 w-full max-w-[520px] transition-all duration-300">
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="rounded-[22px] bg-[#141416] border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-white overflow-hidden p-6 sm:p-8"
                >
                    {/* Brand Header */}
                    <div className="flex flex-col items-center text-center space-y-2 mb-6">
                        <div className="p-2.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl shadow-inner">
                            <ASLogo size={34} strokeColor="#f8fafc" />
                        </div>
                        <div className="text-lg font-bold text-white tracking-wide">
                            Ask<span className="text-[#8B5CF6] font-extrabold">UR</span>Senior
                        </div>
                        <div>
                            <h1 className="text-[24px] font-bold text-[#F5F5F5] tracking-tight mb-1">Complete your profile</h1>
                            <p className="text-[13px] text-[#8A8F98]">
                                Complete all required details to activate your student account.
                            </p>
                        </div>
                    </div>

                    {/* Missing Fields Alert */}
                    {location.state?.missingFields && location.state.missingFields.length > 0 && (
                        <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[13px]">
                            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="leading-relaxed">Please complete your required profile pieces: <strong>{location.state.missingFields.join(', ')}</strong></span>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-[13px]"
                        >
                            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="leading-relaxed">{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        
                        {/* 1. Verified Email (Non-editable) */}
                        <Field
                            label="Email Address"
                            statusText="Non-editable • Verified via Google identity / authentication code"
                            statusType="non-editable"
                        >
                            <input
                                type="text"
                                value={userEmail}
                                disabled
                                className={inputCls}
                            />
                        </Field>

                        {/* 2. Full Name (Editable, no autocomplete) */}
                        <Field
                            label="Full Name"
                            statusText={nameVal.text}
                            statusType={nameVal.type}
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
                                    className={`${inputCls} ${form.name && !isNameValid ? 'border-amber-500/50' : ''}`}
                                />
                                {isNameValid && (
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">
                                        ✓
                                    </span>
                                )}
                            </div>
                        </Field>

                        {/* 3. USN (Editable, no autocomplete) */}
                        <Field
                            label="USN (University Seat Number)"
                            statusText={usnVal.text}
                            statusType={usnVal.type}
                        >
                            <div className="relative">
                                <input
                                    type="text"
                                    value={form.usn}
                                    onChange={handleUsnChange}
                                    placeholder="e.g. 1SI23IS080"
                                    disabled={loading}
                                    autoComplete="off"
                                    className={`${inputCls} uppercase tracking-wider ${form.usn && !isUsnValid ? 'border-amber-500/50' : ''}`}
                                />
                                {isUsnValid && (
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">
                                        ✓
                                    </span>
                                )}
                            </div>
                        </Field>

                        {/* 4. College */}
                        <Field
                            label="College"
                            statusText={
                                isCollegeLocked
                                    ? 'Non-editable • Automatically completed from verified college email (@sit.ac.in)'
                                    : 'Editable • Select your institution'
                            }
                            statusType={isCollegeLocked ? 'non-editable' : 'normal'}
                        >
                            {isCollegeLocked ? (
                                <input
                                    type="text"
                                    value={form.college}
                                    disabled
                                    className={inputCls}
                                />
                            ) : (
                                <select
                                    value={form.college}
                                    onChange={e => onChange('college', e.target.value)}
                                    disabled={loading}
                                    className={selectCls}
                                >
                                    <option value="">Select College</option>
                                    {INDIAN_COLLEGES.map(c => (
                                        <option key={c} value={c} className="bg-[#1C1A27]">{c}</option>
                                    ))}
                                </select>
                            )}
                        </Field>

                        {/* 5. Branch */}
                        <Field
                            label="Branch"
                            statusText="Editable • Select your academic branch"
                            statusType="normal"
                        >
                            <select
                                value={form.branch}
                                onChange={e => onChange('branch', e.target.value)}
                                disabled={loading}
                                className={selectCls}
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b._id} value={b._id} className="bg-[#1C1A27]">
                                        {b.name} {b.shortName ? `(${b.shortName})` : ''}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* 6. Scheme (Auto-filled & Non-editable) */}
                        <Field
                            label="Scheme"
                            statusText="Non-editable • Auto-determined based on graduation year (2022 if ≤ 2028, 2025 if > 2028)"
                            statusType="non-editable"
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
                                    className={`${inputCls} bg-white/[0.02] opacity-80 cursor-not-allowed`}
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>
                        </Field>

                        {/* 7. Mobile & Date of Birth (2-Column Grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                                label="Mobile Number"
                                statusText="Editable • Optional"
                                statusType="normal"
                            >
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => onChange('phone', e.target.value)}
                                    placeholder="e.g. 9876543210"
                                    disabled={loading}
                                    autoComplete="off"
                                    className={inputCls}
                                />
                            </Field>

                            <Field
                                label="Date of Birth"
                                statusText="Editable • Optional"
                                statusType="normal"
                            >
                                <input
                                    type="date"
                                    value={form.dob}
                                    onChange={e => onChange('dob', e.target.value)}
                                    disabled={loading}
                                    className={inputCls}
                                />
                            </Field>
                        </div>

                        {/* 8. Semester & Expected Graduation Year (2-Column Grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                                label="Current Semester"
                                statusText="Editable • Select your current semester"
                                statusType="normal"
                            >
                                <select
                                    value={form.semester}
                                    onChange={e => onChange('semester', e.target.value)}
                                    disabled={loading}
                                    className={selectCls}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                        <option key={s} value={s} className="bg-[#1C1A27]">
                                            Semester {s}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Expected Graduation Year"
                                statusText="Editable • Year of graduation"
                                statusType="normal"
                            >
                                <select
                                    value={form.graduationYear}
                                    onChange={e => handleGradYearChange(e.target.value)}
                                    disabled={loading}
                                    className={selectCls}
                                >
                                    <option value="">Select Year</option>
                                    {gradYears.map(y => (
                                        <option key={y} value={y} className="bg-[#1C1A27]">{y}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading || !form.name || !form.usn}
                            className="w-full h-[50px] rounded-[14px] bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors font-semibold text-white shadow-[0_4px_20px_rgba(139,92,246,0.25)] flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Continue to Dashboard →</>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                <p className="text-center text-[12px] text-gray-500 mt-4">
                    All canonical profile fields are securely verified and required to activate your student account.
                </p>
            </div>
        </div>
    );
};

export default CompleteProfilePage;

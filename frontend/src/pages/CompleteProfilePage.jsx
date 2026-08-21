import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { authAPI, lookupAPI, branchAPI } from '../services/api';
import { useAuth } from '../utils/hooks';
import { ASLogo } from '../components/Logo';
import { INDIAN_COLLEGES, DEFAULT_COLLEGE } from '../constants/indianColleges';

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

/* ─── Field wrapper ──────────────────────────────────────────────── */
const Field = ({ label, hint, children }) => (
    <div className="space-y-1.5">
        {label && <label className="block text-[13px] font-medium text-[#8A8F98] tracking-[0.02em] mb-1.5">{label}</label>}
        {children}
        {hint && <p className="text-[12px] text-[#6B7280] pl-1">{hint}</p>}
    </div>
);

const inputCls  = 'w-full px-4 h-[52px] rounded-[14px] bg-[#18191C] border border-white/[0.06] text-[#F3F4F6] placeholder-[#5F6672] focus:outline-none focus:border-[#8B5CF6] focus:ring-3 focus:ring-[#8B5CF6]/15 transition-all text-[15px] font-medium disabled:opacity-50';
const selectCls = 'w-full px-4 h-[52px] rounded-[14px] bg-[#18191C] border border-white/[0.06] text-[#F3F4F6] focus:outline-none focus:border-[#8B5CF6] focus:ring-3 focus:ring-[#8B5CF6]/15 transition-all text-[15px] font-medium disabled:opacity-50 cursor-pointer appearance-none';

/* ─── Step dot ───────────────────────────────────────────────────── */
const StepDot = ({ active, done }) => (
    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${done ? 'bg-emerald-400' : active ? 'bg-[#8B5CF6]' : 'bg-white/10'}`} />
);

const buildGradYears = () => {
    const y = new Date().getFullYear();
    return [y + 1, y + 2, y + 3, y + 4, y + 5];
};

// Deduplicate schemes — show only year number e.g. "2022", "2025"
const dedupeSchemes = (schemes) => {
    const seen = new Map();
    schemes.forEach(s => {
        const m = s.name.match(/20\d\d/);
        if (m && !seen.has(m[0])) seen.set(m[0], s);
    });
    return Array.from(seen.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, s]) => ({ _id: s._id, label: year }));
};

/* ═══════════════════════════════════════════════════════════════════
   COMPLETE PROFILE — legacy first-time login (Google / OTP)
═══════════════════════════════════════════════════════════════════ */
const CompleteProfilePage = () => {
    const navigate  = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({
        name:           '',
        usn:            '',
        college:        DEFAULT_COLLEGE,  // pre-selected SIT
        branch:         '',               // ObjectId
        scheme:         '',               // ObjectId
        graduationYear: '',
        phone:          '',
    });

    const [branches,   setBranches]   = useState([]);
    const [rawSchemes, setRawSchemes] = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState('');

    const onChange = (key, val) => {
        setForm(p => ({ ...p, [key]: val }));
        setError('');
    };

    const dedupedSchemes = useMemo(() => dedupeSchemes(rawSchemes), [rawSchemes]);
    const gradYears      = buildGradYears();

    /* Load branches (from branches collection) + schemes */
    useEffect(() => {
        const load = async () => {
            try {
                const [bRes, sRes] = await Promise.all([
                    branchAPI.getPublic(),      // branches collection
                    lookupAPI.getSchemes(),
                ]);
                // Exclude "Common to All"
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

    const validate = () => {
        if (!form.name.trim() || form.name.trim().length < 2)
            return 'Please enter your full name (at least 2 characters).';
        if (!form.usn.trim() || !/^[a-z0-9]{8,12}$/i.test(form.usn.trim()))
            return 'Invalid USN format (8–12 alphanumeric characters).';
        if (!form.college.trim())
            return 'Please select your college.';
        if (!form.branch)
            return 'Please select your branch.';
        if (!form.scheme)
            return 'Please select your academic scheme.';
        if (!form.graduationYear)
            return 'Please select your expected graduation year.';
        if (!form.phone)
            return 'Please enter your mobile number.';
        if (!isValidPhoneNumber(form.phone))
            return 'Please enter a valid mobile number with country code.';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }

        setLoading(true);
        setError('');
        try {
            const res = await authAPI.completeGoogleRegistration({
                name:           form.name.trim(),
                usn:            form.usn.trim().toUpperCase(),
                username:       form.usn.trim().toLowerCase(),
                collegeName:    form.college.trim(),
                branch:         form.branch,
                scheme:         form.scheme,
                graduationYear: parseInt(form.graduationYear, 10),
                phone:          form.phone,
            });
            login(res.data.user, res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to complete profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isNameDone    = form.name.trim().length >= 2;
    const isUsnDone     = /^[a-z0-9]{8,12}$/i.test(form.usn.trim());
    const isDetailsDone = !!form.branch && !!form.scheme && !!form.graduationYear;
    const isPhoneDone   = !!form.phone && isValidPhoneNumber(form.phone || '');

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <BgGlow />

            <div className="relative z-10 w-full max-w-[800px] transition-all duration-300">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="rounded-[20px] bg-[#141416] border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white overflow-hidden p-7 sm:p-9"
                >
                    {/* Brand Header */}
                    <div onClick={() => { window.location.href = '/'; }} style={{ cursor: 'pointer' }}
                        className="flex flex-col items-center text-center space-y-3 mb-7 hover:opacity-90 transition-opacity">
                        <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                            <ASLogo size={38} strokeColor="#f8fafc" />
                        </div>
                        <div className="text-xl font-bold text-white">
                            Ask<span className="text-[#8B5CF6] font-extrabold">UR</span>Senior
                        </div>
                        <div>
                            <h1 className="text-[32px] font-bold text-[#F5F5F5] tracking-[-0.02em] mb-2">Complete your profile</h1>
                            <p className="text-base text-[#8A8F98]">
                                Help us personalize your academic experience.
                            </p>
                        </div>

                        {/* Progress dots */}
                        <div className="flex items-center gap-2 mt-1">
                            <StepDot done={isNameDone}    active={!isNameDone} />
                            <div className="w-5 h-px bg-white/10" />
                            <StepDot done={isUsnDone}     active={isNameDone && !isUsnDone} />
                            <div className="w-5 h-px bg-white/10" />
                            <StepDot done={isDetailsDone} active={isUsnDone && !isDetailsDone} />
                            <div className="w-5 h-px bg-white/10" />
                            <StepDot done={isPhoneDone}   active={isDetailsDone && !isPhoneDone} />
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 mb-5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm"
                        >
                            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        
                        {/* Two-Column Form Structure */}
                        <div className="flex flex-col md:flex-row gap-6 md:gap-0">
                            
                            {/* Left Column — Personal Details */}
                            <div className="flex-1 flex flex-col gap-4 md:pr-6">
                                <h2 className="text-[20px] font-semibold text-[#F5F5F5] tracking-[-0.02em] mb-1">
                                    Personal details
                                </h2>

                                {/* Full Name */}
                                <Field label="Full Name">
                                    <input type="text" value={form.name}
                                        onChange={e => onChange('name', e.target.value)}
                                        placeholder="Ravi Kumar" disabled={loading} className={inputCls} />
                                </Field>

                                {/* USN */}
                                <Field label="USN (University Seat Number)" hint="Found on your college ID card">
                                    <input type="text" value={form.usn}
                                        onChange={e => onChange('usn', e.target.value.toUpperCase())}
                                        placeholder="1SI23IS080" disabled={loading}
                                        className={`${inputCls} uppercase tracking-wider`} />
                                </Field>

                                {/* Mobile Number */}
                                <Field label="Mobile Number">
                                    <div className="v2-phone-wrapper">
                                        <PhoneInput international defaultCountry="IN"
                                            value={form.phone}
                                            onChange={val => onChange('phone', val || '')}
                                            disabled={loading} placeholder="+91 98765 43210" />
                                    </div>
                                </Field>
                            </div>

                            {/* Divider line */}
                            <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent self-stretch mx-1" />

                            {/* Right Column — Academic Details */}
                            <div className="flex-1 flex flex-col gap-4 md:pl-6">
                                <h2 className="text-[20px] font-semibold text-[#F5F5F5] tracking-[-0.02em] mb-1">
                                    Academic details
                                </h2>

                                {/* College */}
                                <Field label="College">
                                    <select value={form.college}
                                        onChange={e => onChange('college', e.target.value)}
                                        disabled={loading} className={selectCls}>
                                        <option value="">Select College</option>
                                        {INDIAN_COLLEGES.map(c => (
                                            <option key={c} value={c} className="bg-[#1C1A27]">{c}</option>
                                        ))}
                                    </select>
                                </Field>

                                {/* Branch */}
                                <Field label="Branch">
                                    <select value={form.branch}
                                        onChange={e => onChange('branch', e.target.value)}
                                        disabled={loading} className={selectCls}>
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b._id} value={b._id} className="bg-[#1C1A27]">
                                                {b.name} ({b.shortName})
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                {/* Academic Scheme */}
                                <Field label="Academic Scheme">
                                    <select value={form.scheme}
                                        onChange={e => onChange('scheme', e.target.value)}
                                        disabled={loading} className={selectCls}>
                                        <option value="">Select Scheme</option>
                                        {dedupedSchemes.map(s => (
                                            <option key={s._id} value={s._id} className="bg-[#1C1A27]">
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                {/* Expected Graduation Year */}
                                <Field label="Expected Graduation Year">
                                    <select value={form.graduationYear}
                                        onChange={e => onChange('graduationYear', e.target.value)}
                                        disabled={loading} className={selectCls}>
                                        <option value="">Select Year</option>
                                        {gradYears.map(y => (
                                            <option key={y} value={y} className="bg-[#1C1A27]">{y}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>
                        </div>

                        {/* Info card */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[11px] text-[#6B7280] leading-relaxed">
                                Your USN links you to the correct department, semester groups, and study materials.
                            </p>
                        </div>

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit" disabled={loading}
                            className="w-full h-[52px] rounded-[14px] bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors font-bold text-white shadow-[0_4px_20px_rgba(139,92,246,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                        >
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <>Get Started →</>
                            }
                        </motion.button>
                    </form>
                </motion.div>

                <p className="text-center text-[11px] text-slate-700 mt-4">
                    Your information is private and secure.
                </p>
            </div>
        </div>
    );
};

export default CompleteProfilePage;

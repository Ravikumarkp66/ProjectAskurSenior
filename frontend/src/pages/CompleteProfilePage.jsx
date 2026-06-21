import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { useAuth } from '../utils/hooks';
import { ASLogo } from '../components/Logo';

/* ─── PCB mini background (reused from login) ───────────────────── */
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

/* ─── Field ──────────────────────────────────────────────────────── */
const Field = ({ icon, label, value, onChange, placeholder, disabled, hint, children }) => (
    <div className="space-y-1.5">
        {label && <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{label}</label>}
        <div className="relative">
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    {icon}
                </div>
            )}
            {children ?? (
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 text-white placeholder-slate-600 focus:border-[#8B5CF6]/60 focus:ring-1 focus:ring-[#8B5CF6]/40 outline-none transition-all text-sm disabled:opacity-50`}
                />
            )}
        </div>
        {hint && <p className="text-[10px] text-slate-600 pl-1">{hint}</p>}
    </div>
);

/* ─── Steps indicator ────────────────────────────────────────────── */
const StepDot = ({ active, done }) => (
    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${done ? 'bg-emerald-400' : active ? 'bg-[#8B5CF6]' : 'bg-white/10'}`} />
);

/* ═══════════════════════════════════════════════════════════════════
   COMPLETE PROFILE  (Google first-time login)
═══════════════════════════════════════════════════════════════════ */
const CompleteProfilePage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ name: '', usn: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const onChange = (key, val) => {
        setForm(p => ({ ...p, [key]: val }));
        setError('');
    };

    const validate = () => {
        if (!form.name.trim() || form.name.trim().length < 2)
            return 'Please enter your full name (at least 2 characters).';
        if (!form.usn.trim())
            return 'USN is required.';
        if (!/^[a-z0-9]{4,15}$/i.test(form.usn.trim()))
            return 'Invalid USN format (4–15 alphanumeric characters).';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setLoading(true); setError('');
        try {
            const res = await authAPI.completeGoogleRegistration({
                name:     form.name.trim(),
                usn:      form.usn.trim().toUpperCase(),
                username: form.usn.trim().toLowerCase(),  // derive username from USN
                branch:   deriveBranch(form.usn) || 'CS',
            });
            login(res.data.user, res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to complete profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const deriveBranch = (usn) => {
        if (!usn || usn.length < 7) return '';
        const code = usn.substring(5, 7).toUpperCase();
        const map = {
            CS: 'CS', IS: 'IS', EC: 'EC', EE: 'EE', ME: 'ME',
            CV: 'CV', AI: 'AI', DS: 'DS', CB: 'CB', IT: 'IT',
        };
        return map[code] || '';
    };

    const detectedBranch = deriveBranch(form.usn);
    const isNameDone = form.name.trim().length >= 2;
    const isUsnDone  = form.usn.trim().length >= 4;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <BgGlow />

            <div className="relative z-10 w-full max-w-[420px]">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="rounded-[24px] bg-[#0d111d]/80 border border-purple-500/12 shadow-[0_0_60px_rgba(139,92,246,0.14)] backdrop-blur-2xl text-white overflow-hidden p-7 sm:p-9"
                >
                    {/* Brand */}
                    <div className="flex flex-col items-center text-center space-y-3 mb-8">
                        <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-2xl">
                            <ASLogo size={38} />
                        </div>
                        <div className="text-xl font-bold text-white">
                            Ask<span className="text-[#8B5CF6] font-extrabold">UR</span>Senior
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-white">
                                Almost there! 🎓
                            </h1>
                            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                Complete your profile to access your personalised dashboard.
                            </p>
                        </div>

                        {/* Progress dots */}
                        <div className="flex items-center gap-2 mt-1">
                            <StepDot done active={!isNameDone} />
                            <div className="w-6 h-px bg-white/10" />
                            <StepDot done={isNameDone} active={isNameDone && !isUsnDone} />
                            <div className="w-6 h-px bg-white/10" />
                            <StepDot done={isUsnDone && isNameDone} active={false} />
                        </div>
                    </div>

                    {/* Error */}
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <Field
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                            label="Full Name"
                            value={form.name}
                            onChange={e => onChange('name', e.target.value)}
                            placeholder="Ravi Kumar"
                            disabled={loading}
                        />

                        {/* USN */}
                        <Field
                            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>}
                            label="USN (University Seat Number)"
                            value={form.usn}
                            onChange={e => onChange('usn', e.target.value.toUpperCase())}
                            placeholder="VTM22CS001"
                            disabled={loading}
                            hint={detectedBranch ? `✓ Branch detected: ${detectedBranch}` : 'Found on your college ID card'}
                        />

                        {/* Info card */}
                        <div className="flex items-start gap-3 p-3 rounded-xl"
                            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.14)' }}>
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                Your USN automatically assigns you to the correct department, semester groups, and study materials.
                            </p>
                        </div>

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.01, boxShadow: '0 0 28px rgba(139,92,246,0.5)' }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] font-bold text-white shadow-[0_4px_20px_rgba(139,92,246,0.25)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
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

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/hooks';
import { authAPI } from '../services/api';
import { ASLogo } from '../components/Logo';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

/* ═══════════════════════════════════════════════════════════════════
   PCB BACKGROUND
═══════════════════════════════════════════════════════════════════ */
const PCBBackground = () => (
    <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.12)_0%,rgba(5,5,5,0)_70%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
            <defs>
                <filter id="pcb-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="pcb-chip-blur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" />
                </filter>
            </defs>
            <g filter="url(#pcb-chip-blur)">
                <rect x="785" y="365" width="350" height="350" rx="28" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.3" />
                <rect x="835" y="415" width="250" height="250" rx="16" stroke="#8B5CF6" strokeWidth="1.5" fill="none" opacity="0.25" />
                <rect x="895" y="475" width="130" height="130" rx="8" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.2" />
                {Array.from({ length: 10 }).map((_, i) => (
                    <g key={i} opacity="0.2">
                        <line x1={810 + i * 33} y1="335" x2={810 + i * 33} y2="365" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1={810 + i * 33} y1="715" x2={810 + i * 33} y2="745" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="755" y1={390 + i * 33} x2="785" y2={390 + i * 33} stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="1135" y1={390 + i * 33} x2="1165" y2={390 + i * 33} stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                ))}
            </g>
            <g stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.5">
                <path d="M 785 410 L 630 410 L 510 290 L 350 290 L 250 190 L 120 190" stroke="#e0f2fe" filter="url(#pcb-glow)" />
                <path d="M 1135 410 L 1290 410 L 1410 290 L 1570 290 L 1670 190" stroke="#e0f2fe" />
                <path d="M 785 670 L 630 670 L 510 790 L 350 790 L 230 910 L 100 910" stroke="#8B5CF6" filter="url(#pcb-glow)" />
                <path d="M 1135 670 L 1290 670 L 1410 790 L 1570 790 L 1690 910" stroke="#3b82f6" />
                <path d="M 630 410 L 550 490 L 380 490 L 310 560" opacity="0.3" />
                <path d="M 1290 410 L 1370 490 L 1540 490 L 1610 560" opacity="0.3" />
            </g>
            <g fill="#050505" strokeWidth="1.5">
                <circle cx="630" cy="410" r="4.5" stroke="#ffffff" />
                <circle cx="510" cy="290" r="4.5" stroke="#8B5CF6" filter="url(#pcb-glow)" />
                <circle cx="350" cy="290" r="4.5" stroke="#ffffff" />
                <circle cx="1290" cy="410" r="4.5" stroke="#ffffff" />
                <circle cx="1410" cy="290" r="4.5" stroke="#3b82f6" />
                <circle cx="630" cy="670" r="4.5" stroke="#8B5CF6" filter="url(#pcb-glow)" />
                <circle cx="1290" cy="670" r="4.5" stroke="#ffffff" />
                <circle cx="1410" cy="790" r="4.5" stroke="#8B5CF6" filter="url(#pcb-glow)" />
            </g>
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#030305_95%)]" />
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
═══════════════════════════════════════════════════════════════════ */
const ErrorBanner = ({ msg }) => msg ? (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{msg}</span>
    </motion.div>
) : null;

const PrimaryBtn = ({ children, loading, type = 'submit' }) => (
    <motion.button
        whileHover={{ scale: 1.01, boxShadow: '0 0 28px rgba(139,92,246,0.5)' }}
        whileTap={{ scale: 0.99 }}
        type={type}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] font-bold text-white shadow-[0_4px_20px_rgba(139,92,246,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
    >
        {loading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : children}
    </motion.button>
);

const Divider = () => (
    <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-white/5" />
        <span className="mx-4 text-xs font-black text-slate-600 tracking-wider">OR</span>
        <div className="flex-grow border-t border-white/5" />
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   SUCCESS SCREEN
═══════════════════════════════════════════════════════════════════ */
const SuccessScreen = ({ message }) => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden p-4">
        <PCBBackground />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-[420px] rounded-[24px] bg-[#0d111d]/75 border border-purple-500/20 shadow-[0_0_50px_rgba(139,92,246,0.15)] backdrop-blur-2xl text-white p-10 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div className="space-y-1">
                <h3 className="text-2xl font-bold">Welcome!</h3>
                <p className="text-slate-400 text-sm">{message}</p>
            </div>
            <div className="w-7 h-7 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </motion.div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
═══════════════════════════════════════════════════════════════════ */
const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading: authLoading, user } = useAuth();

    const [step,           setStep]           = useState('email'); // 'email' | 'otp'
    const [email,          setEmail]          = useState('');
    const [otp,            setOtp]            = useState(['', '', '', '', '', '']);
    const [timer,          setTimer]          = useState(58);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [loading,        setLoading]        = useState(false);
    const [error,          setError]          = useState('');
    const [isSuccess,      setIsSuccess]      = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showTerms,      setShowTerms]      = useState(false);
    const [showPrivacy,    setShowPrivacy]    = useState(false);

    const inputRefs = useRef([]);

    /* ── redirect if already authed ── */
    useEffect(() => {
        const hasPendingReg = sessionStorage.getItem('registrationToken') || localStorage.getItem('registrationToken');
        if (hasPendingReg) return; // Do not auto-redirect if user has pending profile registration

        if (!authLoading && isAuthenticated) {
            navigate(user?.registrationComplete === false ? '/complete-profile' : '/');
        }
    }, [navigate, isAuthenticated, authLoading, user]);

    /* ── OTP countdown ── */
    useEffect(() => {
        if (step !== 'otp' || timer <= 0) {
            if (timer <= 0) setResendDisabled(false);
            return;
        }
        const iv = setInterval(() => setTimer(p => p - 1), 1000);
        return () => clearInterval(iv);
    }, [step, timer]);

    /* ── URL param pre-fill ── */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const em = params.get('email');
        const otpParam = params.get('otp');
        if (em) setEmail(decodeURIComponent(em));
        if (otpParam?.length === 6) {
            setOtp(otpParam.split(''));
            setStep('otp');
            try { navigator.clipboard.writeText(otpParam); } catch { /* ignore */ }
        }
    }, []);

    /* ── helpers ── */
    const resetOtp = () => { setTimer(58); setResendDisabled(true); setOtp(['', '', '', '', '', '']); };
    const focusFirst = () => setTimeout(() => inputRefs.current[0]?.focus(), 80);

    const afterAuth = (userData, token, message) => {
        setIsSuccess(true);
        setSuccessMessage(message || 'Welcome!');
        login(userData, token);
        setTimeout(() => navigate(
            userData?.registrationComplete === false ? '/complete-profile' : '/'
        ), 1400);
    };

    /* ── OTP input handlers ── */
    const handleOtpChange = (val, idx) => {
        if (isNaN(val)) return;
        const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
        if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    };
    const handleOtpKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    };
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/[\s-]/g, '').slice(0, 6);
        if (!/^\d+$/.test(text)) return;
        const next = text.split('').concat(Array(6).fill('')).slice(0, 6);
        setOtp(next);
        inputRefs.current[Math.min(text.length, 5)]?.focus();
    };

    /* ── Google ── */
    const handleGoogleSuccess = async (accessToken) => {
        setLoading(true); setError('');
        try {
            const res = await authAPI.googleLogin(accessToken);
            const resData = res.data;
            const needsCompletion = resData.needsCompletion || resData.data?.registrationRequired || resData.registrationRequired;
            const regToken = resData.data?.registrationToken || resData.registrationToken;
            const prefilled = resData.data?.prefilled;
            const token = resData.token || resData.data?.accessToken;
            const u = resData.user || resData.data?.student;
            const message = resData.message || 'Signed in with Google!';

            if (needsCompletion && regToken) {
                const targetEmail = prefilled?.email || resData.data?.email || resData.email || '';
                // Wipe any old auth tokens to avoid ghost session sync
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                sessionStorage.setItem('registrationToken', regToken);
                localStorage.setItem('registrationToken', regToken);
                if (targetEmail) {
                    sessionStorage.setItem('registrationEmail', targetEmail);
                    localStorage.setItem('registrationEmail', targetEmail);
                }
                const fullPrefilled = { ...(prefilled || {}), email: targetEmail || prefilled?.email || '' };
                sessionStorage.setItem('registrationPrefilled', JSON.stringify(fullPrefilled));
                setIsSuccess(true);
                setSuccessMessage('Google verification successful! Completing your profile...');
                navigate('/complete-profile', { state: { registrationToken: regToken, prefilled: fullPrefilled, email: targetEmail } });
            } else if (token) {
                afterAuth(needsCompletion ? { ...(u || {}), registrationComplete: false } : u, token, message);
            } else if (needsCompletion) {
                const targetEmail = prefilled?.email || resData.data?.email || resData.email || '';
                // Wipe any old auth tokens
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (targetEmail) {
                    sessionStorage.setItem('registrationEmail', targetEmail);
                    localStorage.setItem('registrationEmail', targetEmail);
                }
                const fullPrefilled = { ...(prefilled || {}), email: targetEmail || prefilled?.email || '' };
                sessionStorage.setItem('registrationPrefilled', JSON.stringify(fullPrefilled));
                setIsSuccess(true);
                setSuccessMessage('Signed in! Let\'s complete your profile.');
                navigate('/complete-profile', { state: { prefilled: fullPrefilled, email: targetEmail } });
            }
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Google sign-in failed. Please try again.');
        } finally { setLoading(false); }
    };
    const triggerGoogle = useGoogleLogin({
        onSuccess: r => handleGoogleSuccess(r.access_token),
        onError: () => setError('Google sign-in failed.')
    });

    /* ── Send OTP ── */
    const handleSendOtp = async (e) => {
        e?.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.'); return;
        }
        setLoading(true); setError('');
        try {
            await authAPI.sendOtp(email);
            setStep('otp'); resetOtp(); focusFirst();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send code. Please try again.');
        } finally { setLoading(false); }
    };

    /* ── Verify OTP ── */
    const handleVerifyOtp = async (e) => {
        e?.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
        setLoading(true); setError('');
        try {
            const res = await authAPI.verifyOtp(email, code);
            const resData = res.data;
            const needsCompletion = resData.needsCompletion || resData.data?.registrationRequired || resData.registrationRequired;
            const regToken = resData.data?.registrationToken || resData.registrationToken;
            const prefilled = resData.data?.prefilled || { email };
            const token = resData.token || resData.data?.accessToken;
            const u = resData.user || resData.data?.student;
            const message = resData.message || 'Verified!';

            if (needsCompletion && regToken) {
                const targetEmail = email || prefilled?.email || '';
                // Wipe any old auth tokens to avoid ghost session sync
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                sessionStorage.setItem('registrationToken', regToken);
                localStorage.setItem('registrationToken', regToken);
                sessionStorage.setItem('registrationEmail', targetEmail);
                localStorage.setItem('registrationEmail', targetEmail);
                const fullPrefilled = { ...(prefilled || {}), email: targetEmail };
                sessionStorage.setItem('registrationPrefilled', JSON.stringify(fullPrefilled));
                setIsSuccess(true);
                setSuccessMessage('Code verified! Redirecting to complete your profile...');
                navigate('/complete-profile', { state: { registrationToken: regToken, prefilled: fullPrefilled, email: targetEmail } });
            } else if (token) {
                afterAuth(needsCompletion ? { ...(u || {}), registrationComplete: false } : u, token, message);
            } else if (needsCompletion) {
                const targetEmail = email || prefilled?.email || '';
                // Wipe any old auth tokens
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                sessionStorage.setItem('registrationEmail', targetEmail);
                localStorage.setItem('registrationEmail', targetEmail);
                const fullPrefilled = { ...(prefilled || {}), email: targetEmail };
                sessionStorage.setItem('registrationPrefilled', JSON.stringify(fullPrefilled));
                setIsSuccess(true);
                setSuccessMessage('Verified! Let\'s finish setting up your profile.');
                navigate('/complete-profile', { state: { prefilled: fullPrefilled, email: targetEmail } });
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Invalid or expired code.');
        } finally { setLoading(false); }
    };

    /* ── Resend OTP ── */
    const handleResend = async () => {
        setError(''); setLoading(true);
        try {
            await authAPI.sendOtp(email);
            resetOtp(); focusFirst();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend code.');
        } finally { setLoading(false); }
    };

    /* ── Back to email ── */
    const handleBack = () => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(''); };

    if (isSuccess) return <SuccessScreen message={successMessage} />;

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans p-4">
            <PCBBackground />

            <div className="relative w-full max-w-[420px] rounded-[24px] bg-[#0d111d]/80 border border-purple-500/12 shadow-[0_0_60px_rgba(139,92,246,0.12)] backdrop-blur-2xl text-white overflow-hidden p-6 sm:p-8 transition-all duration-300">

                {/* Close */}
                <button onClick={() => navigate('/')}
                    className="absolute top-5 right-5 p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <AnimatePresence mode="wait">

                    {/* ─── STEP: EMAIL ─────────────────────────────── */}
                    {step === 'email' && (
                        <motion.div key="email"
                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.22 }}
                            className="space-y-5">

                            {/* Brand */}
                            <div onClick={() => { window.location.href = '/'; }} style={{ cursor: 'pointer' }} className="flex flex-col items-center text-center space-y-3 hover:opacity-90 transition-opacity">
                                <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-2xl">
                                    <ASLogo size={40} />
                                </div>
                                <div className="text-xl font-bold text-white select-none">
                                    Ask<span className="text-[#8B5CF6] font-extrabold">UR</span>Senior
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-white">Welcome 👋</h2>
                                    <p className="text-slate-400 text-sm leading-relaxed max-w-[290px]">
                                        Enter your email — we'll send you a sign-in code.
                                    </p>
                                </div>
                            </div>

                            <ErrorBanner msg={error} />

                            {/* Email form */}
                            <form onSubmit={handleSendOtp} className="space-y-3">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(''); }}
                                        placeholder="your@college.edu"
                                        autoFocus
                                        required
                                        disabled={loading}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 text-white placeholder-slate-600 focus:border-[#8B5CF6]/60 focus:ring-1 focus:ring-[#8B5CF6]/40 outline-none transition-all text-sm disabled:opacity-50"
                                    />
                                </div>
                                <PrimaryBtn loading={loading}>Continue →</PrimaryBtn>
                            </form>

                            <Divider />

                            {/* Google */}
                            <motion.button
                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                type="button" onClick={() => triggerGoogle()} disabled={loading}
                                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-200 font-semibold transition-all disabled:opacity-50">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </motion.button>

                            {/* Session info */}
                            <div className="flex items-center justify-center gap-3 py-2 px-4 bg-white/5 border border-white/5 rounded-xl text-[10px] text-slate-500">
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />OTP: 7-Day Session</span>
                                <div className="w-px h-3 bg-white/10" />
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Google: 30-Day Session</span>
                            </div>

                            {/* Terms */}
                            <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                                By continuing, you agree to our{' '}
                                <button type="button" onClick={() => setShowTerms(true)} className="text-purple-400 font-semibold hover:underline">Terms</button>
                                {' '}and{' '}
                                <button type="button" onClick={() => setShowPrivacy(true)} className="text-purple-400 font-semibold hover:underline">Privacy Policy</button>.
                            </p>

                            <div className="text-center flex flex-col items-center gap-2">
                                <button onClick={() => navigate('/')} className="text-xs text-slate-500 hover:text-[#8B5CF6] transition-colors">
                                    Skip & go to <span className="text-[#8B5CF6] font-bold">Home</span>
                                </button>
                                <Link to="/admin/login" className="inline-flex items-center gap-1 text-[10px] text-slate-700 hover:text-[#8B5CF6] transition-colors">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Admin Portal
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── STEP: OTP ───────────────────────────────── */}
                    {step === 'otp' && (
                        <motion.div key="otp"
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.22 }}
                            className="space-y-6">

                            {/* Header */}
                            <div onClick={() => { window.location.href = '/'; }} style={{ cursor: 'pointer' }} className="flex flex-col items-center text-center space-y-3 hover:opacity-90 transition-opacity">
                                <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-2xl">
                                    <ASLogo size={40} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold tracking-tight text-white">Check your inbox 📬</h2>
                                    <p className="text-slate-400 text-sm mt-1.5">
                                        Code sent to{' '}
                                        <span className="text-slate-200 font-semibold">{email}</span>
                                    </p>
                                    <button type="button" onClick={handleBack}
                                        className="text-[#8B5CF6] text-xs font-bold hover:underline mt-0.5">
                                        Change email
                                    </button>
                                </div>
                            </div>

                            <ErrorBanner msg={error} />

                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                {/* OTP boxes */}
                                <div className="flex justify-between gap-2">
                                    {otp.map((digit, idx) => (
                                        <motion.input
                                            key={idx}
                                            initial={{ scale: 0.85, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            ref={el => (inputRefs.current[idx] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength="1"
                                            value={digit}
                                            onChange={e => handleOtpChange(e.target.value, idx)}
                                            onKeyDown={e => handleOtpKeyDown(e, idx)}
                                            onPaste={handleOtpPaste}
                                            disabled={loading}
                                            className="w-12 h-14 bg-black/40 border border-white/10 hover:border-white/20 text-center text-2xl font-black text-white rounded-xl focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] outline-none shadow-inner transition-all disabled:opacity-50"
                                        />
                                    ))}
                                </div>

                                {/* Resend */}
                                <div className="text-center">
                                    {resendDisabled ? (
                                        <p className="text-xs text-slate-500">
                                            Resend in <span className="text-[#8B5CF6] font-bold">{timer}s</span>
                                        </p>
                                    ) : (
                                        <button type="button" onClick={handleResend} disabled={loading}
                                            className="text-xs text-[#8B5CF6] font-bold hover:underline disabled:opacity-50">
                                            Resend Code
                                        </button>
                                    )}
                                </div>

                                <PrimaryBtn loading={loading}>Verify & Continue</PrimaryBtn>
                            </form>

                            <div className="text-center">
                                <button onClick={() => navigate('/')} className="text-xs text-slate-500 hover:text-[#8B5CF6] transition-colors">
                                    Skip & go to <span className="text-[#8B5CF6] font-bold">Home</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            <TermsModal   isOpen={showTerms}   onClose={() => setShowTerms(false)} />
            <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
        </div>
    );
};

export default LoginPage;

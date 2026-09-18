import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/hooks';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';
import { ASLogo } from '../components/Logo';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

/* ═══════════════════════════════════════════════════════════════════
   VISIBLE ENGINEERING CIRCUIT-BOARD / PCB BACKGROUND
═══════════════════════════════════════════════════════════════════ */
const PCBBackground = ({ isDark }) => {
    const traceSlate = isDark ? '#334155' : '#94A3B8';
    const traceViolet = isDark ? '#8B5CF6' : '#7C3AED';
    const traceIndigo = isDark ? '#6366F1' : '#4F46E5';
    const padFill = isDark ? '#080B14' : '#F8FAFC';
    const chipFill = isDark ? '#0D111C' : '#FFFFFF';
    const chipBorder = isDark ? '#1E293B' : '#CBD5E1';
    const textColor = isDark ? '#475569' : '#94A3B8';

    return (
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden bg-[#F8FAFC] dark:bg-[#080B14] transition-colors duration-200">
            {/* Subtle atmospheric corner gradients */}
            <div className="absolute top-0 left-0 w-[550px] h-[550px] bg-purple-500/[0.04] dark:bg-purple-500/[0.06] rounded-full blur-[130px]" />
            <div className="absolute bottom-0 right-0 w-[550px] h-[550px] bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] rounded-full blur-[130px]" />

            {/* Engineering Dot Matrix Grid */}
            <div 
                className="absolute inset-0 opacity-[0.25] dark:opacity-[0.35]"
                style={{
                    backgroundImage: isDark 
                        ? 'radial-gradient(#475569 1px, transparent 1px)'
                        : 'radial-gradient(#94A3B8 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Crisp, Detailed Vector Circuit Board Traces */}
            <svg 
                className="absolute inset-0 w-full h-full opacity-85 dark:opacity-75 transition-opacity" 
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1920 1080" 
                preserveAspectRatio="xMidYMid slice"
            >
                {/* ══════════ TOP-LEFT CIRCUIT BUS ══════════ */}
                <g stroke={traceSlate} strokeWidth="1.5" fill="none" opacity="0.85">
                    <path d="M 0 100 L 220 100 L 320 200 L 480 200 L 530 250 L 530 360" />
                    <path d="M 0 140 L 190 140 L 280 230 L 420 230 L 460 270 L 460 400" />
                    <path d="M 0 180 L 160 180 L 240 260 L 360 260" />
                    <path d="M 120 0 L 120 80 L 180 140 L 180 340 L 220 380 L 220 480" />
                    <path d="M 280 0 L 280 60 L 360 140 L 360 280 L 420 340" />
                    <path d="M 440 0 L 440 100 L 520 180 L 620 180" />
                </g>

                {/* Top-Left Violet Accent Buses */}
                <g stroke={traceViolet} strokeWidth="1.6" fill="none" opacity="0.9">
                    <path d="M 0 240 L 130 240 L 210 320 L 370 320 L 420 370 L 540 370" />
                    <path d="M 200 0 L 200 70 L 290 160 L 290 310 L 340 360 L 340 440" />
                </g>

                {/* Top-Left Solder Pads & Vias */}
                <g fill={padFill} strokeWidth="1.8">
                    <circle cx="320" cy="200" r="3.5" stroke={traceSlate} />
                    <circle cx="480" cy="200" r="3.5" stroke={traceViolet} />
                    <circle cx="530" cy="360" r="4.5" stroke={traceViolet} fill={traceViolet} fillOpacity="0.2" />
                    <circle cx="460" cy="400" r="4" stroke={traceSlate} />
                    <circle cx="360" cy="260" r="3.5" stroke={traceSlate} />
                    <circle cx="220" cy="480" r="4.5" stroke={traceIndigo} fill={traceIndigo} fillOpacity="0.2" />
                    <circle cx="420" cy="340" r="3.5" stroke={traceSlate} />
                    <circle cx="620" cy="180" r="4.5" stroke={traceViolet} />
                    <circle cx="540" cy="370" r="4" stroke={traceViolet} />
                    <circle cx="340" cy="440" r="4" stroke={traceIndigo} />
                </g>

                {/* Top-Left IC Package */}
                <g transform="translate(80, 290)">
                    <rect width="70" height="70" rx="6" fill={chipFill} stroke={chipBorder} strokeWidth="1.5" />
                    <circle cx="35" cy="35" r="16" stroke={traceSlate} strokeWidth="1" strokeDasharray="3 3" fill="none" />
                    <circle cx="14" cy="14" r="2" fill={traceViolet} />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <React.Fragment key={`ic-tl-${i}`}>
                            <line x1="-8" y1={12 + i * 11} x2="0" y2={12 + i * 11} stroke={traceSlate} strokeWidth="1.5" />
                            <line x1="70" y1={12 + i * 11} x2="78" y2={12 + i * 11} stroke={traceSlate} strokeWidth="1.5" />
                            <line x1={12 + i * 11} y1="-8" x2={12 + i * 11} y2="0" stroke={traceSlate} strokeWidth="1.5" />
                            <line x1={12 + i * 11} y1="70" x2={12 + i * 11} y2="78" stroke={traceSlate} strokeWidth="1.5" />
                        </React.Fragment>
                    ))}
                    <text x="35" y="38" textAnchor="middle" fill={textColor} fontSize="8" fontFamily="monospace" fontWeight="600">IC-01</text>
                </g>

                {/* ══════════ TOP-RIGHT CIRCUIT BUS ══════════ */}
                <g stroke={traceSlate} strokeWidth="1.5" fill="none" opacity="0.85">
                    <path d="M 1920 100 L 1700 100 L 1600 200 L 1440 200 L 1390 250 L 1390 360" />
                    <path d="M 1920 140 L 1730 140 L 1640 230 L 1500 230 L 1460 270 L 1460 400" />
                    <path d="M 1920 180 L 1760 180 L 1680 260 L 1560 260" />
                    <path d="M 1800 0 L 1800 80 L 1740 140 L 1740 340 L 1700 380 L 1700 480" />
                    <path d="M 1640 0 L 1640 60 L 1560 140 L 1560 280 L 1500 340" />
                    <path d="M 1480 0 L 1480 100 L 1400 180 L 1300 180" />
                </g>

                {/* Top-Right Violet Accent Buses */}
                <g stroke={traceViolet} strokeWidth="1.6" fill="none" opacity="0.9">
                    <path d="M 1920 240 L 1790 240 L 1710 320 L 1550 320 L 1500 370 L 1380 370" />
                    <path d="M 1720 0 L 1720 70 L 1630 160 L 1630 310 L 1580 360 L 1580 440" />
                </g>

                {/* Top-Right Solder Pads & Vias */}
                <g fill={padFill} strokeWidth="1.8">
                    <circle cx="1600" cy="200" r="3.5" stroke={traceSlate} />
                    <circle cx="1440" cy="200" r="3.5" stroke={traceViolet} />
                    <circle cx="1390" cy="360" r="4.5" stroke={traceViolet} fill={traceViolet} fillOpacity="0.2" />
                    <circle cx="1460" cy="400" r="4" stroke={traceSlate} />
                    <circle cx="1560" cy="260" r="3.5" stroke={traceSlate} />
                    <circle cx="1700" cy="480" r="4.5" stroke={traceIndigo} fill={traceIndigo} fillOpacity="0.2" />
                    <circle cx="1500" cy="340" r="3.5" stroke={traceSlate} />
                    <circle cx="1300" cy="180" r="4.5" stroke={traceViolet} />
                    <circle cx="1380" cy="370" r="4" stroke={traceViolet} />
                    <circle cx="1580" cy="440" r="4" stroke={traceIndigo} />
                </g>

                {/* Top-Right IC Package */}
                <g transform="translate(1770, 290)">
                    <rect width="70" height="70" rx="6" fill={chipFill} stroke={chipBorder} strokeWidth="1.5" />
                    <circle cx="35" cy="35" r="16" stroke={traceSlate} strokeWidth="1" strokeDasharray="3 3" fill="none" />
                    <circle cx="14" cy="14" r="2" fill={traceIndigo} />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <React.Fragment key={`ic-tr-${i}`}>
                            <line x1="-8" y1={12 + i * 11} x2="0" y2={12 + i * 11} stroke={traceSlate} strokeWidth="1.5" />
                            <line x1="70" y1={12 + i * 11} x2="78" y2={12 + i * 11} stroke={traceSlate} strokeWidth="1.5" />
                            <line x1={12 + i * 11} y1="-8" x2={12 + i * 11} y2="0" stroke={traceSlate} strokeWidth="1.5" />
                            <line x1={12 + i * 11} y1="70" x2={12 + i * 11} y2="78" stroke={traceSlate} strokeWidth="1.5" />
                        </React.Fragment>
                    ))}
                    <text x="35" y="38" textAnchor="middle" fill={textColor} fontSize="8" fontFamily="monospace" fontWeight="600">MCU-02</text>
                </g>

                {/* ══════════ BOTTOM-LEFT CIRCUIT BUS ══════════ */}
                <g stroke={traceSlate} strokeWidth="1.5" fill="none" opacity="0.85">
                    <path d="M 0 980 L 220 980 L 320 880 L 480 880 L 530 830 L 530 720" />
                    <path d="M 0 940 L 190 940 L 280 850 L 420 850 L 460 810 L 460 680" />
                    <path d="M 0 900 L 160 900 L 240 820 L 360 820" />
                    <path d="M 120 1080 L 120 1000 L 180 940 L 180 740 L 220 700 L 220 600" />
                    <path d="M 280 1080 L 280 1020 L 360 940 L 360 800 L 420 740" />
                    <path d="M 440 1080 L 440 980 L 520 900 L 620 900" />
                </g>

                {/* Bottom-Left Violet Accent Buses */}
                <g stroke={traceViolet} strokeWidth="1.6" fill="none" opacity="0.9">
                    <path d="M 0 840 L 130 840 L 210 760 L 370 760 L 420 710 L 540 710" />
                    <path d="M 200 1080 L 200 1010 L 290 920 L 290 770 L 340 720 L 340 640" />
                </g>

                {/* Bottom-Left Solder Pads & Vias */}
                <g fill={padFill} strokeWidth="1.8">
                    <circle cx="320" cy="880" r="3.5" stroke={traceSlate} />
                    <circle cx="480" cy="880" r="3.5" stroke={traceViolet} />
                    <circle cx="530" cy="720" r="4.5" stroke={traceViolet} fill={traceViolet} fillOpacity="0.2" />
                    <circle cx="460" cy="680" r="4" stroke={traceSlate} />
                    <circle cx="360" cy="820" r="3.5" stroke={traceSlate} />
                    <circle cx="220" cy="600" r="4.5" stroke={traceIndigo} fill={traceIndigo} fillOpacity="0.2" />
                    <circle cx="420" cy="740" r="3.5" stroke={traceSlate} />
                    <circle cx="620" cy="900" r="4.5" stroke={traceViolet} />
                    <circle cx="540" cy="710" r="4" stroke={traceViolet} />
                    <circle cx="340" cy="640" r="4" stroke={traceIndigo} />
                </g>

                {/* ══════════ BOTTOM-RIGHT CIRCUIT BUS ══════════ */}
                <g stroke={traceSlate} strokeWidth="1.5" fill="none" opacity="0.85">
                    <path d="M 1920 980 L 1700 980 L 1600 880 L 1440 880 L 1390 830 L 1390 720" />
                    <path d="M 1920 940 L 1730 940 L 1640 850 L 1500 850 L 1460 810 L 1460 680" />
                    <path d="M 1920 900 L 1760 900 L 1680 820 L 1560 820" />
                    <path d="M 1800 1080 L 1800 1000 L 1740 940 L 1740 740 L 1700 700 L 1700 600" />
                    <path d="M 1640 1080 L 1640 1020 L 1560 940 L 1560 800 L 1500 740" />
                    <path d="M 1480 1080 L 1480 980 L 1400 900 L 1300 900" />
                </g>

                {/* Bottom-Right Violet Accent Buses */}
                <g stroke={traceViolet} strokeWidth="1.6" fill="none" opacity="0.9">
                    <path d="M 1920 840 L 1790 840 L 1710 760 L 1550 760 L 1500 710 L 1380 710" />
                    <path d="M 1720 1080 L 1720 1010 L 1630 920 L 1630 770 L 1580 720 L 1580 640" />
                </g>

                {/* Bottom-Right Solder Pads & Vias */}
                <g fill={padFill} strokeWidth="1.8">
                    <circle cx="1600" cy="880" r="3.5" stroke={traceSlate} />
                    <circle cx="1440" cy="880" r="3.5" stroke={traceViolet} />
                    <circle cx="1390" cy="720" r="4.5" stroke={traceViolet} fill={traceViolet} fillOpacity="0.2" />
                    <circle cx="1460" cy="680" r="4" stroke={traceSlate} />
                    <circle cx="1560" cy="820" r="3.5" stroke={traceSlate} />
                    <circle cx="1700" cy="600" r="4.5" stroke={traceIndigo} fill={traceIndigo} fillOpacity="0.2" />
                    <circle cx="1500" cy="740" r="3.5" stroke={traceSlate} />
                    <circle cx="1300" cy="900" r="4.5" stroke={traceViolet} />
                    <circle cx="1380" cy="710" r="4" stroke={traceViolet} />
                    <circle cx="1580" cy="640" r="4" stroke={traceIndigo} />
                </g>

                {/* Technical Text Markings */}
                <g fill={textColor} fontSize="9" fontFamily="monospace" opacity="0.6">
                    <text x="50" y="80">BUS_TX [0..7]</text>
                    <text x="50" y="1020">PWR_RAIL +3.3V</text>
                    <text x="1800" y="80">SYS_CLK 48MHz</text>
                    <text x="1800" y="1020">GND_PLANE</text>
                </g>
            </svg>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
═══════════════════════════════════════════════════════════════════ */
const ErrorBanner = ({ msg }) => msg ? (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-medium">
        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{msg}</span>
    </motion.div>
) : null;

const PrimaryBtn = ({ children, loading, type = 'submit' }) => (
    <motion.button
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        type={type}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 font-bold text-white shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-sm select-none"
    >
        {loading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : children}
    </motion.button>
);

const Divider = () => (
    <div className="relative flex items-center py-0.5">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        <span className="mx-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">or</span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   SUCCESS SCREEN
═══════════════════════════════════════════════════════════════════ */
const SuccessScreen = ({ message, isDark }) => (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080B14] flex flex-col items-center justify-center relative overflow-hidden font-sans p-4">
        <PCBBackground isDark={isDark} />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-[400px] sm:max-w-[420px] rounded-2xl bg-white dark:bg-[#0D111C] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_10px_35px_-5px_rgba(15,23,42,0.06),0_0_1px_1px_rgba(15,23,42,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-slate-900 dark:text-white p-8 sm:p-10 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit">Welcome!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{message}</p>
            </div>
            <div className="w-6 h-6 border-2 border-purple-200 dark:border-purple-500/30 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin" />
        </motion.div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
═══════════════════════════════════════════════════════════════════ */
const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading: authLoading, user } = useAuth();
    const { isDark, toggleTheme } = useTheme();

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
    const handleBack = (e) => { 
        e?.preventDefault?.();
        e?.stopPropagation?.();
        setStep('email'); 
        setOtp(['', '', '', '', '', '']); 
        setError(''); 
    };

    if (isSuccess) return <SuccessScreen message={successMessage} isDark={isDark} />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080B14] flex flex-col items-center justify-center relative overflow-hidden font-sans p-4 sm:p-6 transition-colors duration-200">
            <PCBBackground isDark={isDark} />

            <div className="relative w-full max-w-[400px] sm:max-w-[420px] rounded-2xl bg-white dark:bg-[#0D111C] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_10px_35px_-5px_rgba(15,23,42,0.06),0_0_1px_1px_rgba(15,23,42,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-slate-900 dark:text-white overflow-hidden p-6 sm:p-8 transition-all duration-200">

                {/* Top Actions: Theme Switcher & Close */}
                <div className="absolute top-4 right-4 flex items-center gap-1">
                    <button 
                        onClick={toggleTheme} 
                        type="button"
                        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
                    >
                        {isDark ? (
                            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    <button 
                        onClick={() => navigate('/')} 
                        aria-label="Close and go to home"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <AnimatePresence mode="wait">

                    {/* ─── STEP: EMAIL ─────────────────────────────── */}
                    {step === 'email' && (
                        <motion.div key="email"
                            initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 16, opacity: 0 }} transition={{ duration: 0.2 }}
                            className="space-y-4 sm:space-y-5">

                            {/* Brand */}
                            <div className="flex flex-col items-center text-center space-y-2.5">
                                <button 
                                    type="button"
                                    onClick={() => navigate('/')} 
                                    className="flex flex-col items-center text-center space-y-2 cursor-pointer group focus:outline-none"
                                    aria-label="AskUrSenior Home"
                                >
                                    <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-200/80 dark:border-purple-500/25 rounded-2xl shadow-xs group-hover:scale-105 transition-transform">
                                        <ASLogo 
                                            size={36} 
                                            primaryColor={isDark ? "#FFFFFF" : "#0F172A"} 
                                            accentColor={isDark ? "#A855F7" : "#7C3AED"} 
                                        />
                                    </div>
                                    <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white select-none font-outfit">
                                        Ask<span className="text-purple-600 dark:text-purple-400 font-extrabold">UR</span>Senior
                                    </div>
                                </button>
                                <div className="space-y-1 pt-1">
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">Welcome 👋</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-[300px]">
                                        Enter your email — we'll send you a sign-in code.
                                    </p>
                                </div>
                            </div>

                            <ErrorBanner msg={error} />

                            {/* Email form */}
                            <form onSubmit={handleSendOtp} className="space-y-3.5">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
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
                                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-[#111624] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm disabled:opacity-50"
                                    />
                                </div>
                                <PrimaryBtn loading={loading}>Continue →</PrimaryBtn>
                            </form>

                            <Divider />

                            {/* Google */}
                            <button
                                type="button" onClick={() => triggerGoogle()} disabled={loading}
                                className="w-full flex items-center justify-center gap-2.5 py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111624] hover:bg-slate-50 dark:hover:bg-[#161C2E] active:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all disabled:opacity-50 shadow-xs cursor-pointer">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                                </svg>
                                <span>Continue with Google</span>
                            </button>

                            {/* Session info */}
                            <div className="flex items-center justify-center gap-3 py-2 px-3 bg-slate-50 dark:bg-[#111624]/70 border border-slate-200/80 dark:border-slate-800 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />OTP: 7-Day Session</span>
                                <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />Google: 30-Day Session</span>
                            </div>

                            {/* Terms */}
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                                By continuing, you agree to our{' '}
                                <button type="button" onClick={() => setShowTerms(true)} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Terms</button>
                                {' '}and{' '}
                                <button type="button" onClick={() => setShowPrivacy(true)} className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">Privacy Policy</button>.
                            </p>

                            <div className="text-center pt-0.5">
                                <button onClick={() => navigate('/')} className="text-xs text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors">
                                    Skip & go to <span className="text-purple-600 dark:text-purple-400 font-semibold">Home</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── STEP: OTP ───────────────────────────────── */}
                    {step === 'otp' && (
                        <motion.div key="otp"
                            initial={{ x: 16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -16, opacity: 0 }} transition={{ duration: 0.2 }}
                            className="space-y-5">

                            {/* Header */}
                            <div className="flex flex-col items-center text-center space-y-2.5">
                                <button 
                                    type="button"
                                    onClick={() => navigate('/')} 
                                    className="p-2.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-200/80 dark:border-purple-500/25 rounded-2xl shadow-xs cursor-pointer hover:scale-105 transition-transform focus:outline-none"
                                    aria-label="AskUrSenior Home"
                                >
                                    <ASLogo 
                                        size={36} 
                                        primaryColor={isDark ? "#FFFFFF" : "#0F172A"} 
                                        accentColor={isDark ? "#A855F7" : "#7C3AED"} 
                                    />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">Check your inbox 📬</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                                        Code sent to{' '}
                                        <span className="text-slate-900 dark:text-white font-semibold">{email}</span>
                                    </p>
                                    <button 
                                        type="button" 
                                        onClick={handleBack}
                                        className="text-purple-600 dark:text-purple-400 text-xs font-semibold hover:underline mt-1.5 inline-flex items-center gap-1 cursor-pointer focus:outline-none">
                                        ← Change email
                                    </button>
                                </div>
                            </div>

                            <ErrorBanner msg={error} />

                            <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-5">
                                {/* OTP boxes */}
                                <div className="flex justify-between gap-1.5 sm:gap-2">
                                    {otp.map((digit, idx) => (
                                        <motion.input
                                            key={idx}
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.04 }}
                                            ref={el => (inputRefs.current[idx] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength="1"
                                            value={digit}
                                            onChange={e => handleOtpChange(e.target.value, idx)}
                                            onKeyDown={e => handleOtpKeyDown(e, idx)}
                                            onPaste={handleOtpPaste}
                                            disabled={loading}
                                            className="w-11 sm:w-12 h-13 sm:h-14 bg-white dark:bg-[#111624] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-center text-xl sm:text-2xl font-bold text-slate-900 dark:text-white rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all disabled:opacity-50 shadow-xs"
                                        />
                                    ))}
                                </div>

                                {/* Resend */}
                                <div className="text-center">
                                    {resendDisabled ? (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Resend code in <span className="text-purple-600 dark:text-purple-400 font-bold">{timer}s</span>
                                        </p>
                                    ) : (
                                        <button type="button" onClick={handleResend} disabled={loading}
                                            className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline disabled:opacity-50">
                                            Resend Code
                                        </button>
                                    )}
                                </div>

                                <PrimaryBtn loading={loading}>Verify & Continue</PrimaryBtn>
                            </form>

                            <div className="text-center pt-0.5">
                                <button onClick={() => navigate('/')} className="text-xs text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors">
                                    Skip & go to <span className="text-purple-600 dark:text-purple-400 font-semibold">Home</span>
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

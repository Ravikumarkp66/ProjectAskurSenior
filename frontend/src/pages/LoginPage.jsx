import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldAlert, Check } from 'lucide-react';
import { useAuth } from '../utils/hooks';
import { authAPI } from '../services/api';
import { ASLogo } from '../components/Logo';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

// Premium PCB (Printed Circuit Board) Engineering-Themed Background
const PCBBackground = () => (
    <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden bg-[#050505]">
        {/* Subtle Navy Blue Ambient Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.12)_0%,rgba(5,5,5,0)_70%)]" />
        
        {/* SVG PCB Layout */}
        <svg
            className="absolute inset-0 w-full h-full opacity-[0.08]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
        >
            <defs>
                {/* Glow Filter */}
                <filter id="pcb-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Soft Blur for Chipset */}
                <filter id="pcb-chip-blur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" />
                </filter>
            </defs>

            {/* Central Processor Silhouette (placed behind the modal at 960, 540) */}
            <g filter="url(#pcb-chip-blur)">
                <rect x="785" y="365" width="350" height="350" rx="28" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.3" />
                <rect x="835" y="415" width="250" height="250" rx="16" stroke="#8B5CF6" strokeWidth="1.5" fill="none" opacity="0.25" />
                <rect x="895" y="475" width="130" height="130" rx="8" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.2" />
                
                {/* Pin connections */}
                {Array.from({ length: 10 }).map((_, i) => (
                    <g key={i} opacity="0.2">
                        <line x1={810 + i * 33} y1="335" x2={810 + i * 33} y2="365" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1={810 + i * 33} y1="715" x2={810 + i * 33} y2="745" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="755" y1={390 + i * 33} x2="785" y2={390 + i * 33} stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="1135" y1={390 + i * 33} x2="1165" y2={390 + i * 33} stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                ))}
            </g>

            {/* PCB Traces & Roadmap Connections */}
            <g stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.5">
                {/* Top-Left Branch (Career Path Roadmap) */}
                <path d="M 785 410 L 630 410 L 510 290 L 350 290 L 250 190 L 120 190" stroke="#e0f2fe" filter="url(#pcb-glow)" />
                {/* Top-Right Branch */}
                <path d="M 1135 410 L 1290 410 L 1410 290 L 1570 290 L 1670 190" stroke="#e0f2fe" />
                {/* Bottom-Left Branch */}
                <path d="M 785 670 L 630 670 L 510 790 L 350 790 L 230 910 L 100 910" stroke="#8B5CF6" filter="url(#pcb-glow)" />
                {/* Bottom-Right Branch */}
                <path d="M 1135 670 L 1290 670 L 1410 790 L 1570 790 L 1690 910" stroke="#3b82f6" />

                {/* Faint sub-pathways */}
                <path d="M 630 410 L 550 490 L 380 490 L 310 560" opacity="0.3" />
                <path d="M 1290 410 L 1370 490 L 1540 490 L 1610 560" opacity="0.3" />
                <path d="M 510 290 L 510 160 L 410 60" opacity="0.3" />
                <path d="M 1410 290 L 1410 160 L 1510 60" opacity="0.3" />
            </g>

            {/* Connection Points / Nodes */}
            <g fill="#050505" strokeWidth="1.5">
                {/* Roadmap Steps */}
                <circle cx="630" cy="410" r="4.5" stroke="#ffffff" />
                <circle cx="510" cy="290" r="4.5" stroke="#8B5CF6" filter="url(#pcb-glow)" />
                <circle cx="350" cy="290" r="4.5" stroke="#ffffff" />
                <circle cx="250" cy="190" r="4.5" stroke="#3b82f6" />

                <circle cx="630" cy="670" r="4.5" stroke="#8B5CF6" filter="url(#pcb-glow)" />
                <circle cx="510" cy="790" r="4.5" stroke="#ffffff" />
                <circle cx="350" cy="790" r="4.5" stroke="#3b82f6" />

                <circle cx="1290" cy="410" r="4.5" stroke="#ffffff" />
                <circle cx="1410" cy="290" r="4.5" stroke="#3b82f6" />
                <circle cx="1570" cy="290" r="4.5" stroke="#ffffff" />

                <circle cx="1290" cy="670" r="4.5" stroke="#ffffff" />
                <circle cx="1410" cy="790" r="4.5" stroke="#8B5CF6" filter="url(#pcb-glow)" />
            </g>

            {/* Faint Chip Architecture / Silhouettes */}
            <g fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.2">
                <rect x="1620" y="80" width="70" height="70" rx="6" />
                <line x1="1605" y1="95" x2="1620" y2="95" />
                <line x1="1605" y1="115" x2="1620" y2="115" />
                <line x1="1605" y1="135" x2="1620" y2="135" />
                <line x1="1690" y1="95" x2="1705" y2="95" />
                <line x1="1690" y1="115" x2="1705" y2="115" />
                <line x1="1690" y1="135" x2="1705" y2="135" />

                <rect x="180" y="820" width="50" height="50" rx="4" />
                <line x1="180" y1="805" x2="180" y2="820" />
                <line x1="200" y1="805" x2="200" y2="820" />
                <line x1="220" y1="805" x2="220" y2="820" />
                <line x1="180" y1="870" x2="180" y2="885" />
                <line x1="200" y1="870" x2="200" y2="885" />
                <line x1="220" y1="870" x2="220" y2="885" />
            </g>
        </svg>

        {/* Soft Vignette to focus center login card */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#030305_95%)] pointer-events-none" />
    </div>
);

const LoginPage = ({ initialMode = 'login' }) => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading: authLoading, user } = useAuth();
    
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState('email'); // 'email' | 'otp'
    const [timer, setTimer] = useState(58);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    
    const inputRefs = useRef([]);

    // Auto-redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            if (user?.registrationComplete === false) {
                navigate('/complete-profile');
            } else {
                navigate('/dashboard');
            }
        }
    }, [navigate, isAuthenticated, authLoading, user]);

    // Resend OTP Countdown Timer
    useEffect(() => {
        let interval = null;
        if (step === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setResendDisabled(false);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    // Handle URL parameters for automatic OTP autofill and copying
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        const otpParam = params.get('otp');
        
        if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
        }
        
        if (otpParam && otpParam.length === 6) {
            // Split OTP into array of 6 digits
            setOtp(otpParam.split(''));
            setStep('otp');
            
            // Attempt to copy code to clipboard to support easy copy-paste
            try {
                navigator.clipboard.writeText(otpParam);
            } catch (err) {
                console.warn('Clipboard write failed:', err);
            }
        }
    }, []);

    const handleGoogleLoginSuccess = async (accessToken) => {
        setLoading(true);
        setError('');
        try {
            const response = await authAPI.googleLogin(accessToken);
            const { token, user: userData, message, needsCompletion } = response.data;

            setIsSuccess(true);
            setSuccessMessage(message || 'Logged in with Google!');
            login(userData, token);

            setTimeout(() => {
                if (needsCompletion || userData?.registrationComplete === false) {
                    navigate('/complete-profile');
                } else {
                    navigate('/dashboard');
                }
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Google Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const triggerGoogleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => handleGoogleLoginSuccess(tokenResponse.access_token),
        onError: () => setError('Google Login Failed')
    });

    const handleSendOtp = async (e) => {
        e?.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await authAPI.sendOtp(email);
            setStep('otp');
            setTimer(58);
            setResendDisabled(true);
            // Auto focus first OTP field
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e?.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            setError('Please enter all 6 digits of the code.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await authAPI.verifyOtp(email, otpCode);
            const { token, user: userData, message, needsCompletion } = response.data;

            setIsSuccess(true);
            setSuccessMessage(message || 'Verified successfully!');
            login(userData, token);

            setTimeout(() => {
                if (needsCompletion || userData?.registrationComplete === false) {
                    navigate('/complete-profile');
                } else {
                    navigate('/dashboard');
                }
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid or expired verification code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setLoading(true);
        try {
            await authAPI.sendOtp(email);
            setTimer(58);
            setResendDisabled(true);
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend verification code.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (value, index) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/[\s-]/g, '').slice(0, 6);
        if (!/^\d+$/.test(text)) return;
        const newOtp = [...otp];
        for (let i = 0; i < text.length; i++) {
            newOtp[i] = text[i];
        }
        setOtp(newOtp);
        const focusIndex = Math.min(text.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleBackToEmail = () => {
        setStep('email');
        setOtp(['', '', '', '', '', '']);
        setError('');
    };

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: { scale: 1, opacity: 1 }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans p-4">
                <PCBBackground />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-full max-w-[420px] rounded-[24px] bg-[#0d111d]/75 border border-purple-500/20 shadow-[0_0_50px_rgba(139,92,246,0.15)] backdrop-blur-2xl text-white p-8 sm:p-10 flex flex-col items-center text-center space-y-6"
                >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Check className="w-8 h-8" strokeWidth={3} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight">Success!</h3>
                        <p className="text-slate-400 text-sm">{successMessage}</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans p-4">
            <PCBBackground />

            {/* Modal Container */}
            <div className="relative w-full max-w-[420px] rounded-[24px] bg-[#0d111d]/75 border border-purple-500/10 shadow-[0_0_50px_rgba(139,92,246,0.12)] backdrop-blur-2xl text-white overflow-hidden p-6 sm:p-8 transition-all duration-300">
                
                {/* Close button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-5 right-5 p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-200 cursor-pointer"
                    aria-label="Close"
                >
                    <X size={16} />
                </button>

                {/* Sliding Step Wrapper */}
                <AnimatePresence mode="wait">
                    {step === 'email' ? (
                        <motion.div
                            key="email"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="space-y-6"
                        >
                            {/* Brand Header */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-2xl shadow-inner shadow-purple-500/5">
                                    <ASLogo size={40} />
                                </div>
                                <div className="text-xl font-bold tracking-tight text-white select-none">
                                    Ask<span className="text-[#8B5CF6] font-extrabold">UR</span>Senior
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-extrabold tracking-tight text-white">
                                        Welcome 👋 Let's Get Started!
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed max-w-[320px]">
                                        Access roadmaps, analytics, study resources, and senior guidance.
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm text-center flex items-center justify-center gap-2"
                                >
                                    <ShieldAlert size={16} className="text-red-400 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            {/* Email Login Form */}
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="space-y-1">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 text-white placeholder-slate-500 focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/50 outline-none transition-all"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01, boxShadow: '0 0 25px rgba(139, 92, 246, 0.45)' }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] font-bold text-white shadow-[0_4px_20px_rgba(139,92,246,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Continue'
                                    )}
                                </motion.button>
                            </form>

                            {/* Divider */}
                            <div className="relative flex py-1 items-center">
                                <div className="flex-grow border-t border-white/5"></div>
                                <span className="flex-shrink mx-4 text-xs font-black text-slate-500 tracking-wider">OR</span>
                                <div className="flex-grow border-t border-white/5"></div>
                            </div>

                            {/* Google Button */}
                            <motion.button
                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => triggerGoogleLogin()}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-200 hover:text-white font-semibold transition-all cursor-pointer disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </motion.button>

                            {/* Terms & Privacy Info */}
                            <p className="text-[10px] text-slate-500 text-center px-4 leading-relaxed">
                                By continuing, you agree to our{' '}
                                <button
                                    onClick={() => setShowTerms(true)}
                                    type="button"
                                    className="text-purple-400 font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                                >
                                    Terms of Service
                                </button>{' '}
                                and{' '}
                                <button
                                    onClick={() => setShowPrivacy(true)}
                                    type="button"
                                    className="text-purple-400 font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                                >
                                    Privacy Policy
                                </button>
                                .
                            </p>

                            {/* Session Information Text */}
                            <div className="flex items-center justify-center gap-3 py-1 bg-white/5 border border-white/5 rounded-xl px-4 text-[11px] text-slate-400">
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                                    <span>OTP Login: 7-Day Session</span>
                                </div>
                                <div className="w-px h-3 bg-white/10" />
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <span>Google Login: 30-Day Session</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center pt-2 flex flex-col items-center gap-2">
                                <button
                                    onClick={() => navigate('/')}
                                    className="text-xs text-slate-400 hover:text-[#8B5CF6] transition-colors cursor-pointer group bg-transparent border-none p-0"
                                >
                                    Skip & Continue to <span className="text-[#8B5CF6] font-bold group-hover:underline">Home</span>
                                </button>
                                
                                <div className="pt-1">
                                    <Link
                                        to="/admin/login"
                                        id="admin-portal-link"
                                        className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#8B5CF6] transition-colors duration-200"
                                    >
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Admin Portal
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="otp"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="space-y-6"
                        >
                            {/* OTP Header */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-2xl shadow-inner shadow-purple-500/5">
                                    <ASLogo size={40} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-extrabold tracking-tight text-white">
                                        Welcome to AskUrSenior!
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed max-w-[320px] inline-flex items-center justify-center">
                                        <span className="truncate max-w-[190px] font-medium text-slate-200">{email}</span>
                                        <button
                                            onClick={handleBackToEmail}
                                            className="text-[#8B5CF6] font-bold hover:underline text-xs ml-2 cursor-pointer bg-transparent border-none p-0"
                                        >
                                            Change
                                        </button>
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 text-sm text-center flex items-center justify-center gap-2"
                                >
                                    <ShieldAlert size={16} className="text-red-400 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            {/* OTP Input Section */}
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="flex justify-between gap-2"
                                >
                                    {otp.map((digit, idx) => (
                                        <motion.input
                                            key={idx}
                                            variants={itemVariants}
                                            ref={(el) => (inputRefs.current[idx] = el)}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(e.target.value, idx)}
                                            onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                                            onPaste={handleOtpPaste}
                                            className="w-12 h-14 bg-black/40 border border-white/10 hover:border-white/20 text-center text-2xl font-black text-white rounded-xl focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] outline-none shadow-inner transition-all"
                                            required
                                            disabled={loading}
                                        />
                                    ))}
                                </motion.div>

                                {/* Resend Area */}
                                <div className="text-center">
                                    {resendDisabled ? (
                                        <p className="text-xs text-slate-400">
                                            Didn't receive the code?{' '}
                                            <span className="text-[#8B5CF6] font-bold">
                                                Resend in {timer} seconds
                                            </span>
                                        </p>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={loading}
                                            className="text-xs text-[#8B5CF6] hover:text-purple-400 hover:underline font-bold transition-all cursor-pointer bg-transparent border-none p-0"
                                        >
                                            Resend Verification Code
                                        </button>
                                    )}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01, boxShadow: '0 0 25px rgba(139, 92, 246, 0.45)' }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] font-bold text-white shadow-[0_4px_20px_rgba(139,92,246,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Verify & Continue'
                                    )}
                                </motion.button>
                            </form>

                            {/* Footer */}
                            <div className="text-center pt-2">
                                <button
                                    onClick={() => navigate('/')}
                                    className="text-xs text-slate-400 hover:text-[#8B5CF6] transition-colors cursor-pointer group bg-transparent border-none p-0"
                                >
                                    Skip & Continue to <span className="text-[#8B5CF6] font-bold group-hover:underline">Home</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
            <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
        </div>
    );
};

export default LoginPage;

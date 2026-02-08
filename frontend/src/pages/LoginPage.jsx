import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../utils/hooks';

import { authAPI } from '../services/api';
import { deriveBranchFromUSN, toBackendBranch, validateUSN } from '../utils/constants';
import Hero from '../components/Hero';
import AuthSuccess from '../components/AuthSuccess';

const LoginPage = ({ initialMode = 'login' }) => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        usn: '',
        password: '',
        confirmPassword: '',
        email: ''
    });
    const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login'); // 'login', 'register', or 'admin'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [verificationEmail, setVerificationEmail] = useState(''); // Store email during verification
    const [otp, setOtp] = useState('');

    const isAdmin = mode === 'admin';
    const isLogin = mode === 'login';

    // Clear form when mode changes
    const handleModeChange = (newMode) => {
        setMode(newMode);
        setFormData({ usn: '', password: '', confirmPassword: '', email: '' });
        setError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleResendOtp = async () => {
        setError('');
        setLoading(true);
        try {
            await authAPI.resendOtp(verificationEmail);
            setSuccessMessage('A new code has been sent to your email.');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = (user, token, message, targetPath) => {
        setSuccessMessage(message);
        setIsSuccess(true);
        login(user, token);
        setTimeout(() => {
            navigate(targetPath);
        }, 3500);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const response = await authAPI.googleLogin(credentialResponse.credential);
            const { token, user, message } = response.data;
            handleSuccess(user, token, message || 'Successfully logged in with Google', '/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Google Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'verify') {
                const response = await authAPI.verifySignup({ email: verificationEmail, otp });
                const { token, user } = response.data;
                handleSuccess(user, token, 'Email verified successfully!', '/dashboard');
                return;
            }

            const { usn, email, password, confirmPassword } = formData;

            if (isAdmin) {
                if (!email || !password) {
                    setError('Email and password are required');
                    setLoading(false);
                    return;
                }
                const response = await authAPI.adminLogin({ email, password });
                const { token, user } = response.data;
                handleSuccess(user, token, 'Successfully logged in as Admin', '/admin');
                return;
            }

            const branch = deriveBranchFromUSN(usn);
            if (!usn || !password) {
                setError('USN and password are required');
                setLoading(false);
                return;
            }
            if (!validateUSN(usn)) {
                setError('Invalid USN format (e.g., VTM22CS001)');
                setLoading(false);
                return;
            }
            if (!branch) {
                setError('Unable to detect branch from USN');
                setLoading(false);
                return;
            }

            if (mode === 'login') {
                const response = await authAPI.login({ usn, password, branch: toBackendBranch(branch) });
                const { token, user } = response.data;
                handleSuccess(user, token, 'Successfully logged in to Ask+', '/dashboard');
            } else {
                if (!email) {
                    setError('Email is required for registration');
                    setLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                await authAPI.register({ usn, email, password, branch: toBackendBranch(branch) });
                setVerificationEmail(email);
                setMode('verify');
                setSuccessMessage('Account created! Please check your email for the verification code.');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Authentication failed. Please try again.';
            setError(errorMsg);

            if (err.response?.data?.needsVerification) {
                setVerificationEmail(err.response.data.email);
                setMode('verify');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex flex-col justify-center relative overflow-hidden font-outfit">
            <Hero isLightMode={false} />

            {/* Modal Overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                {/* Background Decorations Inside Modal Area */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[600px] pointer-events-none opacity-20">
                    <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-orange-500/20 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full" />
                </div>

                <div
                    className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/5 bg-[#141416]/90 shadow-2xl backdrop-blur-xl text-white transition-all duration-500"
                >
                    <div className="flex items-center justify-between px-6 py-5 sm:px-8 sm:py-6 border-b border-white/5">
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                            {isSuccess ? 'Success' : mode === 'verify' ? 'Verify Email' : isAdmin ? 'Admin Access' : mode === 'register' ? 'Join Us' : 'Welcome Back'}
                        </h2>
                        {!isSuccess && mode !== 'verify' && (
                            <Link
                                to="/"
                                className="h-10 w-10 rounded-xl hover:bg-white/5 transition flex items-center justify-center group"
                                aria-label="Close"
                            >
                                <svg className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Link>
                        )}
                    </div>

                    <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-6">
                        {isSuccess ? (
                            <AuthSuccess
                                message={successMessage}
                                submessage="Redirecting in"
                            />
                        ) : (
                            <>
                                {/* Mode Toggle Buttons - Premium Tabs Style */}
                                {mode !== 'verify' && (
                                    <div className="flex bg-[#1c1c1e] rounded-2xl p-1.5 border border-white/5 relative">
                                        <button
                                            type="button"
                                            onClick={() => handleModeChange('login')}
                                            className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'login' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            {mode === 'login' && (
                                                <div className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 animate-fadeIn" />
                                            )}
                                            <span className="relative">Sign In</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleModeChange('register')}
                                            className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'register' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            {mode === 'register' && (
                                                <div className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 animate-fadeIn" />
                                            )}
                                            <span className="relative">Sign Up</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleModeChange('admin')}
                                            className={`relative z-10 flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'admin' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            {mode === 'admin' && (
                                                <div className="absolute inset-0 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/20 animate-fadeIn" />
                                            )}
                                            <span className="relative">Admin</span>
                                        </button>
                                    </div>
                                )}

                                {error && (
                                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-shake">
                                        {error}
                                    </div>
                                )}

                                {successMessage && !isSuccess && (
                                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 animate-fadeIn">
                                        {successMessage}
                                    </div>
                                )}

                                {mode === 'verify' ? (
                                    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
                                        <div className="text-center space-y-2">
                                            <p className="text-sm text-gray-400">
                                                We've sent a 6-digit verification code to
                                            </p>
                                            <p className="text-sm font-bold text-blue-400">
                                                {verificationEmail}
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Verification Code</label>
                                            <input
                                                type="text"
                                                maxLength="6"
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="w-full text-center tracking-[1em] text-xl font-bold rounded-2xl border border-white/5 bg-[#1c1c1e] px-4 py-4 text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 placeholder-gray-700 transition-all font-outfit"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || otp.length !== 6}
                                            className={`group relative w-full h-12 rounded-2xl text-sm font-bold text-white overflow-hidden transition-all shadow-lg
                                                ${loading || otp.length !== 6 ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.01] active:scale-[0.99] shadow-blue-600/20'}`}
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-3">
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Verifying...
                                                </span>
                                            ) : (
                                                'Verify & Continue'
                                            )}
                                        </button>

                                        <div className="text-center">
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={loading}
                                                className="text-xs font-bold text-gray-500 hover:text-white transition-colors"
                                            >
                                                Didn't receive the code? <span className="text-blue-500">Resend Code</span>
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setMode('login')}
                                            className="w-full text-xs font-bold text-gray-600 hover:text-gray-400 transition-colors pt-2"
                                        >
                                            Back to Sign In
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                                        {!isAdmin && (
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">USN</label>
                                                <input
                                                    type="text"
                                                    name="usn"
                                                    autoComplete="off"
                                                    placeholder="VTM22CS001"
                                                    value={formData.usn}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-2xl border border-white/5 bg-[#1c1c1e] px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 placeholder-gray-600 transition-all font-medium"
                                                />
                                            </div>
                                        )}

                                        {mode === 'register' && (
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">College Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    autoComplete="off"
                                                    placeholder="usn@sit.ac.in"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-2xl border border-white/5 bg-[#1c1c1e] px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 placeholder-gray-600 transition-all font-medium"
                                                />
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Admin Email</label>
                                                <input
                                                    type="text"
                                                    name="email"
                                                    autoComplete="off"
                                                    placeholder="admin@example.com"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-2xl border border-white/5 bg-[#1c1c1e] px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 placeholder-gray-600 transition-all font-medium"
                                                />
                                            </div>
                                        )}

                                        {!isAdmin && formData.usn && (
                                            <div className="animate-fadeIn">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Detected Branch</label>
                                                <div className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 text-sm text-blue-400 font-bold">
                                                    {deriveBranchFromUSN(formData.usn) || 'Invalid USN'}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex justify-between items-center mb-2 ml-1">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest">Password</label>
                                                {mode === 'login' && (
                                                    <Link
                                                        to="/forgot-password"
                                                        className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                                                    >
                                                        Forgot?
                                                    </Link>
                                                )}
                                            </div>
                                            <input
                                                type="password"
                                                name="password"
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full rounded-2xl border border-white/5 bg-[#1c1c1e] px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 placeholder-gray-600 transition-all font-medium"
                                            />
                                            {mode === 'register' && <p className="text-[10px] mt-2 text-gray-500 tracking-tight">Minimum 6 characters required for security.</p>}
                                        </div>

                                        {mode === 'register' && (
                                            <div className="animate-fadeIn">
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    autoComplete="new-password"
                                                    placeholder="••••••••"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-2xl border border-white/5 bg-[#1c1c1e] px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 placeholder-gray-600 transition-all font-medium"
                                                />
                                                {formData.confirmPassword && (
                                                    formData.password === formData.confirmPassword ? (
                                                        <p className="text-[10px] mt-2 text-emerald-500 font-bold flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            Passwords match
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10px] mt-2 text-red-500 font-bold flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            Passwords do not match
                                                        </p>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`group relative w-full h-12 rounded-2xl text-sm font-bold text-white overflow-hidden transition-all shadow-lg
                                                ${loading ? 'bg-orange-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:scale-[1.01] active:scale-[0.99] shadow-orange-500/20'}`}
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-3">
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                isAdmin ? 'Admin Sign In' : isLogin ? 'Sign In' : 'Create Account'
                                            )}
                                        </button>
                                    </form>
                                )}

                                {!isAdmin && mode !== 'verify' && (
                                    <>
                                        <div className="relative py-4">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-white/5"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-[#141416] px-2 text-gray-500 font-bold tracking-widest">Or continue with</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <div className="w-full">
                                                <GoogleLogin
                                                    onSuccess={handleGoogleSuccess}
                                                    onError={() => {
                                                        setError('Google Login Failed');
                                                    }}
                                                    use_fedcm_for_prompt={true}
                                                    theme="filled_black"
                                                    shape="circle"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

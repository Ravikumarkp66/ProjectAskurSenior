import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { FaLock, FaKey, FaArrowLeft, FaShieldAlt, FaClock } from 'react-icons/fa';
import OtpInput from '../components/OtpInput';
import AuthSuccess from '../components/AuthSuccess';

const ResetPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const emailParam = queryParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [location]);

    useEffect(() => {
        let timer;
        if (resendTimer > 0 && !canResend && !isSuccess) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [resendTimer, canResend, isSuccess]);

    const handleResendOtp = async () => {
        if (!canResend) return;
        setCanResend(false);
        setResendTimer(60);
        try {
            await authAPI.forgotPassword(email);
            setMessage('A new OTP has been sent to your email.');
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        if (otp.length !== 6) {
            setError('Please enter the full 6-digit OTP code');
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            await authAPI.resetPassword(email, otp, newPassword);
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden font-outfit">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-2 sm:px-0">
                {!isSuccess && (
                    <>
                        <div className="flex justify-center gap-2 mb-6 sm:mb-8 animate-fadeIn">
                            <div className="h-1.5 w-12 sm:w-16 rounded-full bg-orange-500" />
                            <div className="h-1.5 w-12 sm:w-16 rounded-full bg-orange-500" />
                            <div className="h-1.5 w-12 sm:w-16 rounded-full bg-gray-800" />
                        </div>

                        <div className="flex justify-center mb-6 animate-scaleUp">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform rotate-3">
                                <FaShieldAlt className="text-white text-2xl sm:text-3xl" />
                            </div>
                        </div>
                        <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 animate-slideUp">
                            Verify Your Account
                        </h2>
                        <div className="flex flex-col items-center animate-slideUp" style={{ animationDelay: '100ms' }}>
                            <p className="text-center text-gray-400 text-sm max-w-xs">
                                We've sent a 6-digit code to
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-blue-400 font-semibold text-sm">{email}</span>
                                <Link to="/forgot-password" size="xs" className="text-gray-500 hover:text-white text-xs underline">Change</Link>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-[#141416]/90 border border-white/5 py-8 px-6 sm:py-10 sm:px-8 shadow-2xl rounded-3xl backdrop-blur-xl transition-all duration-500 min-h-[380px] sm:min-h-[400px] flex flex-col justify-center">
                    {isSuccess ? (
                        <AuthSuccess
                            message="Password has been reset successfully."
                            submessage="Redirecting to login"
                        />
                    ) : (
                        <form className="space-y-8 animate-fadeIn" onSubmit={handleSubmit}>
                            {/* OTP Section */}
                            <div className="space-y-4">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">
                                    Enter 6-Digit Code
                                </label>
                                <OtpInput
                                    length={6}
                                    value={otp}
                                    onChange={setOtp}
                                    isLightMode={false}
                                />

                                <div className="flex flex-col items-center gap-3 pt-2">
                                    <p className="text-xs text-gray-500">Didn't receive the code?</p>
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20"
                                        >
                                            Resend Code Now
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                            <FaClock className="text-[10px]" />
                                            Send again in <span className="text-orange-500">{resendTimer}s</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Password Fields Wrapper */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                                            <FaLock className="h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="block w-full pl-12 pr-4 py-3.5 bg-[#1c1c1e] border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Confirm New Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                                            <FaLock className="h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full pl-12 pr-4 py-3.5 bg-[#1c1c1e] border border-white/5 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 animate-fadeIn">
                                    <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {message}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 animate-shake">
                                    <p className="text-sm font-medium text-red-400 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {error}
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`group relative w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-bold text-white overflow-hidden transition-all shadow-lg shadow-orange-500/20
                                    ${isLoading ? 'bg-orange-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {isLoading ? (
                                    <span className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Verifying...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Verify & Continue
                                    </span>
                                )}
                            </button>
                        </form>
                    )}

                    {!isSuccess && (
                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-xs text-gray-500 mb-4 tracking-tight">
                                Skip & continue to <Link to="/" className="text-orange-500 font-bold hover:underline">Home</Link>
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-white transition-colors group"
                            >
                                <FaArrowLeft className="mr-2 text-[10px] transition-transform group-hover:-translate-x-1" />
                                Back to Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;

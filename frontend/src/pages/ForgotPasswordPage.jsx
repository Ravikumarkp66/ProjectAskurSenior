import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { FaEnvelope, FaArrowLeft, FaPaperPlane } from 'react-icons/fa';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            await authAPI.forgotPassword(email);
            setMessage('If an account exists, an OTP has been sent. Redirecting...');
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2500);
        } catch (err) {
            if (err.response && err.response.status === 429) {
                setError('Too many requests. Please try again later.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden font-outfit">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-2 sm:px-0">
                <div className="flex justify-center mb-6 sm:mb-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 transform -rotate-6 animate-scaleUp">
                        <FaEnvelope className="text-white text-2xl sm:text-3xl" />
                    </div>
                </div>
                <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 animate-slideUp">
                    Forgot Password?
                </h2>
                <p className="text-center text-gray-400 text-sm mb-8 sm:mb-10 animate-slideUp">
                    No worries! Enter your college email and we'll send you a 6-digit OTP to reset your password.
                </p>
            </div>

            <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-[#141416]/90 border border-white/5 py-8 px-6 sm:py-10 sm:px-8 shadow-2xl rounded-3xl backdrop-blur-xl animate-fadeIn">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500">
                                    <FaEnvelope className="h-5 w-5 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-[#1c1c1e] border border-white/5 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium"
                                    placeholder="your-usn@sit.ac.in"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 animate-fadeIn">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-sm font-medium text-emerald-400">{message}</p>
                                </div>
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
                                    Sending...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Send Code <FaPaperPlane className="text-xs transition-transform group-hover:translate-x-1" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <Link
                            to="/login"
                            className="flex items-center justify-center text-sm font-semibold text-gray-400 hover:text-white transition-colors group"
                        >
                            <FaArrowLeft className="mr-2 text-xs transition-transform group-hover:-translate-x-1" />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;


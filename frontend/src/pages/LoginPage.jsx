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
            const { token, user, message, needsCompletion } = response.data;

            // If registration needs completion, redirect to complete registration page
            if (needsCompletion) {
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify(user));
                navigate('/complete-profile');
                return;
            }

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
                const response = await authAPI.register({ usn, email, password, branch: toBackendBranch(branch) });
                const { token, user } = response.data;
                handleSuccess(user, token, 'Account created successfully!', '/dashboard');
            }
        } catch (err) {
            const rawMessage = err.response?.data?.error || 'Authentication failed. Please try again.';
            const normalizedMessage = /verify|otp/i.test(rawMessage)
                ? 'Invalid credentials. Please try again.'
                : rawMessage;
            setError(normalizedMessage);
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
                            {isSuccess ? 'Success' : isAdmin ? 'Admin Access' : mode === 'register' ? 'Join Us' : 'Welcome Back'}
                        </h2>
                        {!isSuccess && (
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

                    <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-6 text-center">
                        {isSuccess ? (
                            <AuthSuccess
                                message={successMessage}
                                submessage="Redirecting in"
                            />
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-white mb-2">Login or Join Ask+</h3>
                                    <p className="text-gray-400 text-sm mb-6">
                                        Use your college email to access study materials, analytics, and more.
                                    </p>
                                </div>

                                {error && (
                                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-shake">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-center py-4">
                                    <div className="w-full flex justify-center">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => {
                                                setError('Google Login Failed');
                                            }}
                                            use_fedcm_for_prompt={true}
                                            theme="filled_black"
                                            shape="circle"
                                            size="large"
                                            text="continue_with"
                                            width="320"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-6 px-10">
                                    By continuing, you agree to our <span className="text-blue-400 cursor-pointer">Terms of Service</span> and <span className="text-blue-400 cursor-pointer">Privacy Policy</span>.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

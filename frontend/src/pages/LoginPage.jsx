import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import { authAPI } from '../services/api';
import { deriveBranchFromUSN, toBackendBranch, validateUSN } from '../utils/constants';
import AuthLayout from '../components/AuthLayout';

const LoginPage = ({ initialMode = 'login' }) => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        usn: '',
        password: '',
        email: ''
    });
    const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login'); // 'login', 'register', or 'admin'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    // Clear form when mode changes
    const handleModeChange = (newMode) => {
        setMode(newMode);
        setFormData({ usn: '', password: '', email: '' });
        setError('');
        setShowReset(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { usn, password } = formData;
            const branch = deriveBranchFromUSN(usn);

            if (!usn || !password) {
                setError('All fields are required');
                return;
            }

            if (!validateUSN(usn)) {
                setError('Invalid USN format (e.g., VTM22CS001)');
                return;
            }

            if (!branch) {
                setError('Unable to detect branch from USN');
                return;
            }

            const response = await authAPI.login({ usn, password, branch: toBackendBranch(branch) });
            const { token, user } = response.data;

            login(user, token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { usn, email, password } = formData;
            const branch = deriveBranchFromUSN(usn);

            if (!usn || !email || !password) {
                setError('All fields are required');
                return;
            }

            if (!validateUSN(usn)) {
                setError('Invalid USN format (e.g., VTM22CS001)');
                return;
            }

            if (password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }

            if (!branch) {
                setError('Unable to detect branch from USN');
                return;
            }

            const response = await authAPI.register({ usn, email, password, branch: toBackendBranch(branch) });
            const { token, user } = response.data;

            login(user, token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { email, password } = formData;

            if (!email || !password) {
                setError('Email and password are required');
                return;
            }

            const response = await authAPI.adminLogin({ email, password });
            const { token, user } = response.data;

            login(user, token);
            navigate('/admin/reviews');
        } catch (err) {
            setError(err.response?.data?.error || 'Admin login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleAdminLogin;

    const isLogin = mode === 'login';
    const isAdmin = mode === 'admin';

    return (
        <AuthLayout
            sideImageUrl="/auth-left.png"
        >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="text-xs font-semibold text-white/90">AskUrSenior</span>
                <span className="text-xs text-white/60">– Academic Tracker</span>
            </div>

            <div className="mt-5">
                <h1 className="text-3xl font-extrabold text-white">
                    {isAdmin ? 'Admin Portal' : 'Welcome Back'}
                </h1>
                <p className="mt-2 text-sm text-white/70">
                    {isAdmin
                        ? 'Sign in with admin credentials to manage feedback and reports.'
                        : 'Sign in to continue tracking your academic progress.'}
                </p>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
                <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold transition ${isLogin
                            ? 'bg-white/15 text-white'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                >
                    Sign in
                </button>
                <button
                    type="button"
                    onClick={() => handleModeChange('register')}
                    className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold transition ${mode === 'register'
                            ? 'bg-white/15 text-white'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                >
                    Sign up
                </button>
            </div>

            {error && (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                    <p className="text-sm font-medium text-red-100">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" autoComplete="off">
                {!isAdmin && (
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">USN</label>
                        <input
                            type="text"
                            name="usn"
                            autoComplete="off"
                            placeholder="USN"
                            value={formData.usn}
                            onChange={handleInputChange}
                            className="w-full min-h-11 rounded-2xl px-4 bg-white/10 border border-white/15 text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
                        />
                        <p className="hidden sm:block text-xs text-white/55 mt-1">
                            Format: 8-12 alphanumeric characters (e.g., 1si23cs123 or 4si23cs123)
                        </p>
                    </div>
                )}

                {mode === 'register' && (
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">
                            College Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            autoComplete="off"
                            placeholder="usn@sit.ac.in"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full min-h-11 rounded-2xl px-4 bg-white/10 border border-white/15 text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
                        />
                    </div>
                )}

                {isAdmin && (
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">
                            Admin Email
                        </label>
                        <input
                            type="text"
                            name="email"
                            autoComplete="off"
                            placeholder="admin@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full min-h-11 rounded-2xl px-4 bg-white/10 border border-white/15 text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
                        />
                    </div>
                )}

                {!isAdmin && (
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-2">Branch</label>
                        <input
                            value={deriveBranchFromUSN(formData.usn) || ''}
                            readOnly
                            disabled
                            className="w-full min-h-11 rounded-2xl px-4 bg-white/5 border border-white/10 text-white/70 placeholder-white/40 outline-none"
                            placeholder="Auto-detected from USN"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Password</label>
                    <input
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        placeholder=""
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full min-h-11 rounded-2xl px-4 bg-white/10 border border-white/15 text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
                    />
                    {mode === 'register' && <p className="text-xs text-white/55 mt-1">Minimum 6 characters</p>}

                    {isLogin && (
                        <div className="mt-3 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setShowReset((v) => !v)}
                                className="text-sm font-semibold text-white/80 hover:text-white transition"
                            >
                                Forgot password?
                            </button>

                            <button
                                type="button"
                                onClick={() => handleModeChange('register')}
                                className="text-sm font-semibold text-sky-200 hover:text-sky-100 transition"
                            >
                                Create an account
                            </button>
                        </div>
                    )}
                </div>

                <div
                    className={`grid transition-all duration-300 ease-out ${isLogin && showReset ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                        }`}
                >
                    <div className="overflow-hidden">
                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-sm font-semibold text-white">Reset password</div>
                            <div className="mt-3">
                                <label className="block text-sm font-semibold text-white/80 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full min-h-11 rounded-2xl px-4 bg-white/10 border border-white/15 text-white placeholder-white/40 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
                                />
                                <p className="text-xs text-white/55 mt-2">
                                    Password reset is coming soon.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full min-h-11 rounded-full px-4 text-sm font-bold text-white shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed ${isAdmin
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500'
                            : 'bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500'
                        }`}
                >
                    {loading ? 'Processing...' : isAdmin ? 'Sign in as Admin' : isLogin ? 'Sign in' : 'Create account'}
                </button>
            </form>

            <div className="mt-5 text-center text-sm text-white/70">
                {isAdmin ? (
                    <button
                        type="button"
                        onClick={() => handleModeChange('login')}
                        className="font-semibold text-sky-200 hover:text-sky-100 transition"
                    >
                        ← Back to User Login
                    </button>
                ) : isLogin ? (
                    <button
                        type="button"
                        onClick={() => handleModeChange('register')}
                        className="font-semibold text-sky-200 hover:text-sky-100 transition"
                    >
                        Don't have an account? Sign up
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => handleModeChange('login')}
                        className="font-semibold text-sky-200 hover:text-sky-100 transition"
                    >
                        Already have an account? Sign in
                    </button>
                )}
            </div>

            {!isAdmin && (
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <button
                        type="button"
                        onClick={() => handleModeChange('admin')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300/80 hover:text-amber-200 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Admin Login
                    </button>
                </div>
            )}
        </AuthLayout>
    );
};

export default LoginPage;

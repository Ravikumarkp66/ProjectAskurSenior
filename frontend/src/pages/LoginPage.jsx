import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import { authAPI } from '../services/api';
import { deriveBranchFromUSN, toBackendBranch, validateUSN } from '../utils/constants';
import Hero from '../components/Hero';

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
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    // Clear form when mode changes
    const handleModeChange = (newMode) => {
        setMode(newMode);
        setFormData({ usn: '', password: '', confirmPassword: '', email: '' });
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
            const { usn, email, password, confirmPassword } = formData;
            const branch = deriveBranchFromUSN(usn);

            if (!usn || !email || !password || !confirmPassword) {
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

            if (password !== confirmPassword) {
                setError('Passwords do not match');
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
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.error || 'Admin login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleAdminLogin;

    const isLogin = mode === 'login';
    const isAdmin = mode === 'admin';

    const [theme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const isLightMode = theme === 'light';

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-slate-50' : 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800'}`}>
            <Hero isLightMode={isLightMode} />
            
            {/* Modal Overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60" />
                <div
                    className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border shadow-xl ${
                        isLightMode
                            ? 'border-slate-200 bg-white text-slate-900'
                            : 'border-white/10 bg-primary-900 text-secondary-100'
                    }`}
                >
                    <div className={`flex items-center justify-between px-5 py-4 border-b ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                        <h2 className="text-base font-extrabold">
                            {mode === 'admin' ? 'Admin Login' : mode === 'register' ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <Link
                            to="/"
                            className={`h-9 w-9 rounded-lg ${isLightMode ? 'hover:bg-slate-100' : 'hover:bg-white/5'} transition flex items-center justify-center`}
                            aria-label="Close"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Link>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                        {/* Mode Toggle Buttons */}
                        <div className={`flex border rounded-lg p-1 ${
                            isLightMode 
                                ? 'border-slate-200 bg-slate-50'
                                : 'border-white/10 bg-white/5'
                        }`}>
                            <button
                                type="button"
                                onClick={() => handleModeChange('login')}
                                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition ${
                                    mode === 'login'
                                        ? isLightMode
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-600 text-white'
                                        : isLightMode
                                            ? 'text-slate-600 hover:text-slate-900'
                                            : 'text-secondary-300 hover:text-secondary-100'
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeChange('register')}
                                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition ${
                                    mode === 'register'
                                        ? isLightMode
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-600 text-white'
                                        : isLightMode
                                            ? 'text-slate-600 hover:text-slate-900'
                                            : 'text-secondary-300 hover:text-secondary-100'
                                }`}
                            >
                                Sign Up
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeChange('admin')}
                                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition ${
                                    mode === 'admin'
                                        ? isLightMode
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-purple-600 text-white'
                                        : isLightMode
                                            ? 'text-slate-600 hover:text-slate-900'
                                            : 'text-secondary-300 hover:text-secondary-100'
                                }`}
                            >
                                Admin
                            </button>
                        </div>

                        {error && (
                            <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                            {!isAdmin && (
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>USN</label>
                                    <input
                                        type="text"
                                        name="usn"
                                        autoComplete="off"
                                        placeholder="USN"
                                        value={formData.usn}
                                        onChange={handleInputChange}
                                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                            ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                            : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                            }`}
                                    />
                                </div>
                            )}

                            {mode === 'register' && (
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                        College Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        autoComplete="off"
                                        placeholder="usn@sit.ac.in"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                            ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                            : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                            }`}
                                    />
                                </div>
                            )}

                            {isAdmin && (
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                        Admin Email
                                    </label>
                                    <input
                                        type="text"
                                        name="email"
                                        autoComplete="off"
                                        placeholder="admin@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                            ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                            : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                            }`}
                                    />
                                </div>
                            )}

                            {!isAdmin && (
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Branch</label>
                                    <input
                                        value={deriveBranchFromUSN(formData.usn) || ''}
                                        readOnly
                                        disabled
                                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-white/10 bg-white/5 text-secondary-400'}`}
                                        placeholder="Auto-detected from USN"
                                    />
                                </div>
                            )}

                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    autoComplete="new-password"
                                    placeholder=""
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                        }`}
                                />
                                {mode === 'register' && <p className={`text-xs mt-1 ${isLightMode ? 'text-gray-500' : 'text-secondary-400'}`}>Minimum 6 characters</p>}
                            </div>

                            {mode === 'register' && (
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        autoComplete="new-password"
                                        placeholder=""
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                            ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                            : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                            }`}
                                    />
                                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                        <p className="text-xs mt-1 text-red-500">Passwords do not match</p>
                                    )}
                                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                        <p className="text-xs mt-1 text-emerald-500">Passwords match ✓</p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${
                                        loading ? 'bg-purple-600/40 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'
                                    }`}
                                >
                                    {loading ? 'Authenticating...' : isAdmin ? 'Sign in as Admin' : isLogin ? 'Sign in' : 'Create account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../utils/hooks';

const CompleteRegistrationPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        collegeName: '',
        usn: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const deriveBranchFromUSN = (usn) => {
        if (!usn || usn.length < 7) return '';
        const branchCode = usn.substring(5, 7).toUpperCase();
        const branchMap = {
            'CS': 'Computer Science',
            'IS': 'Information Science',
            'EC': 'Electronics & Communication',
            'EE': 'Electrical',
            'ME': 'Mechanical',
            'CV': 'Civil',
            'AI': 'AI & ML',
            'DS': 'Data Science',
            'CB': 'CS & Business Systems',
            'IT': 'Information Technology',
            'CI': 'Civil',
            'BT': 'Biotechnology',
            'IM': 'Industrial Management',
            'CH': 'Chemical',
            'ET': 'Electronics & Telecom',
            'EI': 'Electronics & Instrumentation'
        };
        return branchMap[branchCode] || '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.collegeName || !formData.usn || !formData.password || !formData.confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (formData.name.trim().length < 2) {
            setError('Please enter your full name (at least 2 characters)');
            return;
        }

        if (formData.collegeName.trim().length < 3) {
            setError('Please enter your college name (at least 3 characters)');
            return;
        }

        const trimmedUSN = formData.usn.trim();
        if (!/^[a-z0-9]{8,12}$/i.test(trimmedUSN)) {
            setError('Invalid USN format');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.completeGoogleRegistration({
                name: formData.name.trim(),
                collegeName: formData.collegeName.trim(),
                usn: trimmedUSN,
                password: formData.password
            });

            // Update auth context
            login(response.data.user, response.data.token);

            // Redirect to home page
            navigate('/');
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to complete registration');
        } finally {
            setLoading(false);
        }
    };

    const derivedBranch = deriveBranchFromUSN(formData.usn);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-primary-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Complete Your Registration
                        </h1>
                        <p className="text-secondary-300 text-sm">
                            Enter your USN and create a password to continue
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-300 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Ravi Kumar"
                                className="w-full px-4 py-3 bg-primary-700/50 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* College Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-300 mb-2">
                                College Name
                            </label>
                            <input
                                type="text"
                                name="collegeName"
                                value={formData.collegeName}
                                onChange={handleChange}
                                placeholder="e.g., BMSCE / RVCE"
                                className="w-full px-4 py-3 bg-primary-700/50 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* USN Input */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-300 mb-2">
                                USN (University Seat Number)
                            </label>
                            <input
                                type="text"
                                name="usn"
                                value={formData.usn}
                                onChange={handleChange}
                                placeholder="e.g., 1MS21CS001"
                                className="w-full px-4 py-3 bg-primary-700/50 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                                required
                            />
                            {derivedBranch && (
                                <p className="mt-2 text-xs text-accent-400 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Branch: {derivedBranch}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter password (min. 6 characters)"
                                className="w-full px-4 py-3 bg-primary-700/50 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-300 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                className="w-full px-4 py-3 bg-primary-700/50 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                                required
                            />
                            {formData.confirmPassword && (
                                formData.password === formData.confirmPassword ? (
                                    <p className="mt-2 text-xs text-green-400 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Passwords match
                                    </p>
                                ) : (
                                    <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        Passwords don't match
                                    </p>
                                )
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Completing Registration...' : 'Complete Registration'}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300">
                            <strong>Note:</strong> Your USN will be used to determine your branch and access relevant study materials.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteRegistrationPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../utils/hooks';

const CompleteProfilePage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        usn: '',
        username: '',
        branch: 'CS'
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
            'IT': 'Information Technology'
        };
        const branchCodeUpper = branchCode.toUpperCase();
        return branchMap[branchCodeUpper] || '';
    };

    const branches = [
        'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT',
        'CV', 'CS', 'IS', 'CI', 'BT', 'ME', 'IM', 'CH', 'EE', 'EC', 'ET', 'EI'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.usn || !formData.username || !formData.branch) {
            setError('All fields are required');
            return;
        }

        const trimmedUSN = formData.usn.trim();
        if (!/^[a-z0-9]{8,12}$/i.test(trimmedUSN)) {
            setError('Invalid USN format');
            return;
        }

        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.completeGoogleRegistration({
                usn: trimmedUSN,
                username: formData.username,
                branch: formData.branch
            });

            // Update auth context
            login(response.data.user, response.data.token);

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to complete profile');
        } finally {
            setLoading(false);
        }
    };

    const derivedBranch = deriveBranchFromUSN(formData.usn);

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4 font-outfit">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-orange-500/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-[#141416]/90 backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            Finish Your Profile
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Pick a unique username and enter your USN to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 ml-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="coolstudent24"
                                className="w-full rounded-2xl border border-white/5 bg-[#1c1c1e] px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 placeholder-gray-600 transition-all font-medium"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 ml-1">USN</label>
                            <input
                                type="text"
                                name="usn"
                                value={formData.usn}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData(prev => ({ ...prev, usn: value }));
                                    // Optional: pre-select branch if detected
                                    const detected = deriveBranchFromUSN(value);
                                    if (detected) {
                                        // You could auto-select here if you want, but user wants to choose
                                    }
                                }}
                                placeholder="VTM22CS001"
                                className="w-full rounded-2xl border border-white/5 bg-[#1c1c1e] px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 placeholder-gray-600 transition-all font-medium"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 ml-1">Branch</label>
                            <select
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                className="w-full rounded-2xl border border-white/5 bg-[#1c1c1e] px-4 py-3.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all font-medium appearance-none cursor-pointer"
                                required
                            >
                                {branches.sort().map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-200 text-sm animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Setting up...' : 'Get Started'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-[10px] text-gray-500 leading-relaxed text-center">
                            Your USN is used to automatically assign you to the correct department and semester groups.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfilePage;

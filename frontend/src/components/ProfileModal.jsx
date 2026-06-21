import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import StatsCards from './StatsCards';

// PasswordChangeSection component removed

const ProfileModal = ({ show, onClose, user, updateUser, subjects = [], overallProgress = 0, theme = 'dark' }) => {
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        usn: '',
        bio: '',
        linkedin: '',
        github: '',
        leetcode: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'stats', 'subscription'
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    const isLightMode = theme === 'light';

    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (show && user) {
            setProfileForm({
                name: user.name || '',
                usn: user.usn || '',
                bio: user.bio || '',
                linkedin: user.socialLinks?.linkedin || '',
                github: user.socialLinks?.github || '',
                leetcode: user.socialLinks?.leetcode || ''
            });
            setProfileImagePreview(user.profilePicture ?
                (user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profilePicture}`)
                : '');
            setIsEditingProfile(false);
            setProfileImage(null);
            setActiveTab('profile');
            setProfileMessage({ type: '', text: '' });
            setImageError(false);
        }
    }, [show, user]);

    if (!show) return null;

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileMessage({ type: '', text: '' });

        const trimmedUSN = profileForm.usn ? profileForm.usn.trim() : '';
        if (trimmedUSN && !/^[A-Z0-9]{8,12}$/i.test(trimmedUSN)) {
            setProfileMessage({ type: 'error', text: 'USN must be 8-12 alphanumeric characters' });
            return;
        }

        setIsSavingProfile(true);
        try {
            if (profileImage) {
                const formData = new FormData();
                formData.append('profilePicture', profileImage);
                await authAPI.uploadProfilePicture(formData);
            }

            const profileRes = await authAPI.updateProfile({
                name: profileForm.name,
                usn: trimmedUSN,
                bio: profileForm.bio,
                socialLinks: {
                    linkedin: profileForm.linkedin,
                    github: profileForm.github,
                    leetcode: profileForm.leetcode
                }
            });

            if (updateUser && profileRes.data.user) {
                updateUser(profileRes.data.user);
            }

            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => {
                setIsEditingProfile(false);
                setProfileMessage({ type: '', text: '' });
            }, 2000);
        } catch (error) {
            console.error('Failed to update profile', error);
            setProfileMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            setProfileImagePreview(URL.createObjectURL(file));
            setIsEditingProfile(true);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className={`${isLightMode ? 'bg-white' : 'bg-gray-900'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all`}>
                {/* Header Banner */}
                <div className={`h-32 ${isLightMode ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gradient-to-r from-blue-900 to-purple-900'} relative`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-2 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Profile Info Header */}
                <div className="px-8 pb-6 relative flex flex-col md:flex-row items-end md:items-center -mt-12 gap-6">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${isLightMode ? 'border-white' : 'border-gray-900'} shadow-lg bg-white`}>
                            {profileImagePreview && !imageError ? (
                                <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; setImageError(true); }} />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                                    4
                                </div>
                            )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full z-10">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    </div>

                    {/* Info */}
                    <div className="flex-1 mb-2">
                        <h2 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                            {user?.name || user?.usn || 'Guest Student'}
                        </h2>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mt-0.5">
                            <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {user?.email} • {user?.branch} Branch
                            </p>
                            {user?.name && user?.usn && (
                                <span className={`hidden md:block text-gray-400`}>•</span>
                            )}
                            {user?.usn && (
                                <p className={`text-xs font-mono font-medium ${isLightMode ? 'text-blue-600' : 'text-blue-400'}`}>
                                    {user.usn}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mb-2">
                        <button
                            onClick={() => activeTab === 'profile' ? setIsEditingProfile(!isEditingProfile) : setActiveTab('profile')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${isEditingProfile
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                                : (isLightMode ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-800 text-gray-200 hover:bg-gray-700')
                                }`}
                        >
                            {isEditingProfile ? 'Editing...' : 'Edit Profile'}
                        </button>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar / Tabs */}
                    <div className={`w-full md:w-64 p-6 flex flex-col gap-2 ${isLightMode ? 'border-r border-gray-100' : 'border-r border-gray-800'}`}>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-3 ${activeTab === 'profile'
                                ? (isLightMode ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/20 text-blue-400')
                                : (isLightMode ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-800')
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Personal Details
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-3 ${activeTab === 'stats'
                                ? (isLightMode ? 'bg-purple-50 text-purple-700' : 'bg-purple-900/20 text-purple-400')
                                : (isLightMode ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-800')
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            Academic Stats
                        </button>
                        {/* UPGRADE_SECTION_HIDDEN: Uncomment to restore Current Plan tab in profile modal
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-3 ${activeTab === 'subscription'
                                ? (isLightMode ? 'bg-orange-50 text-orange-700' : 'bg-orange-900/20 text-orange-400')
                                : (isLightMode ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:bg-gray-800')
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                            Current Plan
                        </button>
                        */}
                    </div>

                    {/* Main Content Area */}
                    <div className={`flex-1 p-6 md:p-8 overflow-y-auto ${isLightMode ? 'bg-gray-50/50' : 'bg-black/20'}`}>

                        {activeTab === 'profile' && (
                            <div className="space-y-6 max-w-2xl animate-fadeIn">
                                {/* Personal Details Section */}
                                <div>
                                    <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Full Name
                                    </h3>
                                    {isEditingProfile ? (
                                        <input
                                            type="text"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            placeholder="Your Full Name"
                                            className={`w-full p-4 rounded-xl border focus:ring-2 outline-none transition ${isLightMode
                                                ? 'bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-100 text-gray-900'
                                                : 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-900/50 text-gray-100'
                                                }`}
                                        />
                                    ) : (
                                        <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-white border-gray-100 text-gray-700' : 'bg-gray-800/50 border-gray-700 text-gray-300'}`}>
                                            {user?.name || <span className="italic opacity-60">No name added yet.</span>}
                                        </div>
                                    )}
                                </div>
                                {/* Student ID Section */}
                                <div>
                                    <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Student ID / USN <span className="text-red-500">*</span>
                                    </h3>
                                    {isEditingProfile ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={profileForm.usn}
                                                onChange={(e) => setProfileForm({ ...profileForm, usn: e.target.value.toUpperCase() })}
                                                placeholder="Enter USN (e.g. VTM22CS001)"
                                                className={`w-full p-4 rounded-xl border focus:ring-2 outline-none transition uppercase font-mono tracking-wider ${isLightMode
                                                    ? 'bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-100 text-gray-900'
                                                    : 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-900/50 text-gray-100'
                                                    }`}
                                            />
                                            <p className="text-[10px] text-gray-400">Required for payment approval and academic features.</p>
                                        </div>
                                    ) : (
                                        <div className={`p-4 rounded-xl border flex items-center justify-between ${user?.usn ? (isLightMode ? 'bg-white border-gray-100' : 'bg-gray-800/50 border-gray-700') : 'bg-red-500/10 border-red-500/20'}`}>
                                            <span className={`font-mono text-lg tracking-widest ${user?.usn ? (isLightMode ? 'text-gray-900' : 'text-white') : 'text-red-400 font-bold'}`}>
                                                {user?.usn || 'NOT PROVIDED'}
                                            </span>
                                            {!user?.usn && (
                                                <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full animate-pulse uppercase font-black">Missing</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Bio Section */}
                                <div>
                                    <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>Bio</h3>
                                    {isEditingProfile ? (
                                        <textarea
                                            value={profileForm.bio}
                                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                            className={`w-full p-4 rounded-xl border focus:ring-2 outline-none transition ${isLightMode
                                                ? 'bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-100 text-gray-900'
                                                : 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-900/50 text-gray-100'
                                                }`}
                                            rows="4"
                                            placeholder="Tell us about your academic interests..."
                                        />
                                    ) : (
                                        <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-white border-gray-100 text-gray-700' : 'bg-gray-800/50 border-gray-700 text-gray-300'}`}>
                                            {user?.bio || <span className="italic opacity-60">No bio added yet. Click edit to add one.</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Social Links */}
                                <div>
                                    <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wider ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>Social Presence</h3>
                                    <div className="grid gap-4">
                                        {[
                                            {
                                                id: 'linkedin',
                                                label: 'LinkedIn',
                                                color: 'text-[#0A66C2]',
                                                path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'
                                            },
                                            {
                                                id: 'github',
                                                label: 'GitHub',
                                                color: 'text-gray-900',
                                                darkModeColor: 'text-white',
                                                path: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'
                                            },
                                            {
                                                id: 'leetcode',
                                                label: 'LeetCode',
                                                color: 'text-[#FFA116]',
                                                path: 'M13.483 0a1.374 1.374 0 0 0 -0.961 0.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0 -1.209 2.104 5.35 5.35 0 0 0 -0.125 0.513 5.527 5.527 0 0 0 0.062 2.362 5.83 5.83 0 0 0 0.349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193 0.039 0.038c2.248 2.165 5.852 2.133 8.063 -0.074l2.396 -2.392c0.54 -0.54 0.54 -1.414 0.003 -1.955a1.378 1.378 0 0 0 -1.951 -0.003l-2.396 2.392a3.021 3.021 0 0 1 -4.205 0.038l-0.02 -0.019 -4.276 -4.193c-0.652 -0.64 -0.972 -1.469 -0.948 -2.263a2.68 2.68 0 0 1 0.066 -0.523 2.545 2.545 0 0 1 0.619 -1.164L9.13 8.114c1.058 -1.134 3.204 -1.27 4.43 -0.278l3.501 2.831c0.593 0.48 1.461 0.387 1.94 -0.207a1.384 1.384 0 0 0 -0.207 -1.943l-3.5 -2.831c-0.8 -0.647 -1.766 -1.045 -2.774 -1.202l2.015 -2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0 -1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38 -1.382 1.38 1.38 0 0 0 -1.38 -1.382z'
                                            }
                                        ].map((social) => (
                                            <div key={social.id} className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLightMode ? 'bg-white shadow-sm' : 'bg-gray-800'}`}>
                                                    <svg className={`w-6 h-6 ${social.darkModeColor && !isLightMode ? social.darkModeColor : social.color}`} fill="currentColor" viewBox="0 0 24 24">
                                                        <path d={social.path} />
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    {isEditingProfile ? (
                                                        <input
                                                            type="text"
                                                            value={profileForm[social.id] || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, [social.id]: e.target.value })}
                                                            placeholder={`Add your ${social.label} URL`}
                                                            className={`w-full px-4 py-2 rounded-lg border text-sm focus:ring-2 outline-none transition ${isLightMode
                                                                ? 'bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-100 text-gray-900'
                                                                : 'bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-900/50 text-gray-100'
                                                                }`}
                                                        />
                                                    ) : (
                                                        user?.socialLinks?.[social.id] ? (
                                                            <a
                                                                href={user.socialLinks[social.id].startsWith('http') ? user.socialLinks[social.id] : `https://${user.socialLinks[social.id]}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`text-sm font-medium hover:underline ${social.darkModeColor && !isLightMode ? social.darkModeColor : social.color}`}
                                                            >
                                                                {user.socialLinks[social.id].replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                                                            </a>
                                                        ) : (
                                                            <span className={`text-sm ${isLightMode ? 'text-gray-400' : 'text-gray-600'}`}>Not connected</span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Discord Integration */}
                                <div className={`mt-6 p-4 rounded-xl border ${isLightMode ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-900/10 border-indigo-900/30'}`}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-[#5865F2]`}>
                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.5868 0-.1635-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0775-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0775.0105c.1201.0991.246.1971.3718.2914a.077.077 0 01-.0066.1277 12.2986 12.2986 0 01-1.8722.8923.0761.0761 0 00-.0416.1057c.3528.6991.7644 1.3638 1.226 1.9942a.0775.0775 0 00.0842.0276c1.9516-.6066 3.9401-1.5218 5.9929-3.0294a.081.081 0 00.0312-.0561c.4991-5.2263-.8382-9.7231-3.5204-13.6603a.0706.0706 0 00-.0321-.0277zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-bold ${isLightMode ? 'text-indigo-900' : 'text-indigo-100'}`}>Discord Community</h4>
                                                <p className={`text-xs ${isLightMode ? 'text-indigo-700/70' : 'text-indigo-300/60'}`}>Connect your account to join our guild</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const token = localStorage.getItem('authToken');
                                                window.location.href = `https://askursenior.onrender.com/api/discord/login?token=${token}`;
                                            }}
                                            className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
                                        >
                                            Connect Discord
                                        </button>
                                    </div>
                                </div>

                                {/* Save Actions */}
                                {isEditingProfile && (
                                    <div className="pt-4 space-y-4">
                                        {profileMessage.text && (
                                            <div className={`p-3 rounded-xl text-xs font-medium animate-fadeIn ${profileMessage.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                {profileMessage.text}
                                            </div>
                                        )}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleProfileUpdate}
                                                disabled={isSavingProfile}
                                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-70 flex items-center gap-2"
                                            >
                                                {isSavingProfile ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Saving Changes...
                                                    </>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingProfile(false)}
                                                className={`px-6 py-2.5 font-semibold rounded-xl transition ${isLightMode ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* UPGRADE_SECTION_HIDDEN: Uncomment to restore subscription tab content
                        {activeTab === 'subscription' && (
                            <div className="animate-fadeIn max-w-xl space-y-6">
                                ... (subscription plan display and upgrade button)
                            </div>
                        )}
                        */}

                        {activeTab === 'stats' && (
                            <div className="animate-fadeIn">
                                <StatsCards subjects={subjects} progress={overallProgress} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ProfileModal;

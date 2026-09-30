import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../utils/hooks';
import { apiV2 } from '../../../services/authService';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import ProfilePhotoCard from './components/ProfilePhotoCard';
import PersonalInformationCard from './components/PersonalInformationCard';
import AcademicInformationCard from './components/AcademicInformationCard';
import AcademicIdentityCard from './components/AcademicIdentityCard';
import SocialLinksCard from './components/SocialLinksCard';
import { useEditProfile } from '../../../contexts/EditProfileContext';

const BasicInformationSettings = () => {
    const { user, updateUser } = useAuth();
    const { setSaving, setIsChanged, registerSaveHandler } = useEditProfile();

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        usn: '',
        email: '',
        phone: '',
        bio: '',
        branch: '',
        scheme: '',
        semester: '',
        graduationYear: '',
        admissionYear: '',
        college: '',
        socialLinks: {
            github: '',
            linkedin: '',
            portfolio: '',
            instagram: '',
            leetcode: '',
            x: ''
        }
    });

    // Populate form data when user profile resolves
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                username: user.username || '',
                usn: user.usn || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                branch: user.branch?.id || user.branch?._id || (typeof user.branch === 'string' ? user.branch : ''),
                scheme: user.scheme?.id || user.scheme?._id || (typeof user.scheme === 'string' ? user.scheme : ''),
                semester: user.semester || 1,
                graduationYear: user.graduationYear || 2027,
                admissionYear: user.admissionYear || 2023,
                college: user.college || user.collegeName || 'Siddaganga Institute of Technology',
                socialLinks: {
                    github: user.socialLinks?.github || '',
                    linkedin: user.socialLinks?.linkedin || '',
                    portfolio: user.socialLinks?.portfolio || '',
                    instagram: user.socialLinks?.instagram || '',
                    leetcode: user.socialLinks?.leetcode || '',
                    x: user.socialLinks?.x || ''
                }
            });
        }
    }, [user]);

    // Check if changes have been made
    const isChanged = useMemo(() => {
        if (!user) return false;

        return (
            formData.name.trim() !== (user.name || '').trim() ||
            formData.username.trim() !== (user.username || '').trim() ||
            formData.phone.trim() !== (user.phone || '').trim() ||
            formData.socialLinks.github.trim() !== (user.socialLinks?.github || '').trim() ||
            formData.socialLinks.linkedin.trim() !== (user.socialLinks?.linkedin || '').trim() ||
            formData.socialLinks.portfolio.trim() !== (user.socialLinks?.portfolio || '').trim() ||
            formData.socialLinks.instagram.trim() !== (user.socialLinks?.instagram || '').trim() ||
            formData.socialLinks.leetcode.trim() !== (user.socialLinks?.leetcode || '').trim() ||
            formData.socialLinks.x.trim() !== (user.socialLinks?.x || '').trim()
        );
    }, [formData, user]);

    // Sync isChanged to the layout context
    useEffect(() => {
        setIsChanged(isChanged);
    }, [isChanged, setIsChanged]);

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSocialChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [name]: value }
        }));
    };

    const doSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Full Name is required.');
            return;
        }
        if (!formData.username.trim()) {
            toast.error('Username is required.');
            return;
        }

        setSaving(true);
        try {
            const res = await apiV2.updateProfile({
                name: formData.name,
                username: formData.username,
                phone: formData.phone,
                socialLinks: formData.socialLinks
            });
            if (res.data?.success && res.data?.data?.student) {
                updateUser(res.data.data.student);
                toast.success('Profile updated successfully!');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update profile settings.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // Register save handler with layout context on mount / when formData changes
    useEffect(() => {
        registerSaveHandler(doSave);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData]);

    if (!user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: '#a78bfa' }} />
            </div>
        );
    }

    const isGoogleUser = user.authProvider === 'google' || !!user.googleId;

    return (
        <form onSubmit={e => { e.preventDefault(); doSave(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Section header — desktop only (mobile uses layout header) */}
            <div className="edit-section-header flex flex-col gap-1 pb-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Basic Information
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Manage your personal and academic profile identity
                </span>
            </div>

            {/* Profile Photo Card */}
            <ProfilePhotoCard user={user} onUpdateUser={updateUser} />

            {/* Personal Info Card */}
            <PersonalInformationCard
                formData={formData}
                onChange={handleTextChange}
                isGoogleUser={isGoogleUser}
            />

            {/* Academic Information Card */}
            <AcademicInformationCard
                formData={formData}
            />

            {/* Academic Identity Card */}
            <AcademicIdentityCard />

            {/* Social Links Card */}
            <SocialLinksCard
                socialLinks={formData.socialLinks}
                onChange={handleSocialChange}
            />

            {/* Desktop-only inline Save button row (hidden on mobile — layout provides sticky button) */}
            <div className="desktop-save-row flex items-center justify-end gap-3 pt-2">
                <button
                    type="submit"
                    disabled={!isChanged}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-150 ${
                        !isChanged
                            ? 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200/80 dark:border-white/[0.06]'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 cursor-pointer active:scale-[0.98]'
                    }`}
                >
                    Save Changes
                </button>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                /* On mobile the layout shell provides a sticky Save button — hide the inline one */
                @media (max-width: 767px) {
                    .desktop-save-row {
                        display: none !important;
                    }
                    .edit-section-header {
                        display: none !important;
                    }
                }
            `}} />
        </form>
    );
};

export default BasicInformationSettings;

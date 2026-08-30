import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../utils/hooks';
import { apiV2 } from '../../../services/authService';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import ProfilePhotoCard from './components/ProfilePhotoCard';
import PersonalInformationCard from './components/PersonalInformationCard';
import AcademicInformationCard from './components/AcademicInformationCard';
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
        const branchId = user.branch?.id || user.branch?._id || user.branch || '';
        const schemeId = user.scheme?.id || user.scheme?._id || user.scheme || '';

        return (
            formData.name.trim() !== (user.name || '').trim() ||
            formData.username.trim() !== (user.username || '').trim() ||
            formData.phone.trim() !== (user.phone || '').trim() ||
            formData.usn.trim().toUpperCase() !== (user.usn || '').trim().toUpperCase() ||
            String(formData.branch) !== String(branchId) ||
            String(formData.scheme) !== String(schemeId) ||
            Number(formData.semester) !== Number(user.semester || 1) ||
            Number(formData.graduationYear) !== Number(user.graduationYear || 0) ||
            formData.socialLinks.github.trim() !== (user.socialLinks?.github || '').trim() ||
            formData.socialLinks.linkedin.trim() !== (user.socialLinks?.linkedin || '').trim() ||
            formData.socialLinks.portfolio.trim() !== (user.socialLinks?.portfolio || '').trim() ||
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
                usn: formData.usn,
                branch: formData.branch,
                scheme: formData.scheme,
                semester: formData.semester,
                graduationYear: formData.graduationYear,
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
            <div className="edit-section-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    Basic Information
                </h2>
                <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)' }}>
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
                onChange={handleTextChange}
            />

            {/* Social Links Card */}
            <SocialLinksCard
                socialLinks={formData.socialLinks}
                onChange={handleSocialChange}
            />

            {/* Desktop-only inline Save button row (hidden on mobile — layout provides sticky button) */}
            <div className="desktop-save-row" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '8px'
            }}>
                <button
                    type="submit"
                    disabled={!isChanged}
                    style={{
                        padding: '8px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        outline: 'none',
                        background: !isChanged
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'linear-gradient(135deg, #7C3AED, #6366F1)',
                        color: !isChanged ? 'rgba(255, 255, 255, 0.25)' : '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: !isChanged ? 'not-allowed' : 'pointer',
                        boxShadow: isChanged ? '0 4px 14px rgba(124, 58, 237, 0.3)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
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

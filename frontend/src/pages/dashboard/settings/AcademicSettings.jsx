import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../utils/hooks';
import { apiV2 } from '../../../services/authService';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import AcademicInformationCard from './components/AcademicInformationCard';
import { useEditProfile } from '../../../contexts/EditProfileContext';

const AcademicSettings = () => {
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
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                username: user.username || '',
                usn: user.usn || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                branch: user.branch?.id || user.branch?._id || '',
                scheme: user.scheme?.id || user.scheme?._id || '',
                semester: user.semester || 1,
                graduationYear: user.graduationYear || '',
                admissionYear: user.admissionYear || '',
                college: user.college || '',
                socialLinks: {
                    github: user.socialLinks?.github || '',
                    linkedin: user.socialLinks?.linkedin || '',
                    portfolio: user.socialLinks?.portfolio || '',
                    instagram: user.socialLinks?.instagram || '',
                    leetcode: user.socialLinks?.leetcode || '',
                    x: user.socialLinks?.x || ''
                }
            }));
        }
    }, [user]);

    // Track whether academic fields changed
    const isAcademicChanged = useMemo(() => {
        if (!user) return false;
        const originalBranch = user.branch?.id || user.branch?._id || '';
        const originalScheme = user.scheme?.id || user.scheme?._id || '';
        return (
            formData.branch !== originalBranch ||
            formData.scheme !== originalScheme ||
            parseInt(formData.semester, 10) !== user.semester ||
            parseInt(formData.graduationYear, 10) !== user.graduationYear ||
            (formData.usn || '').trim().toUpperCase() !== (user.usn || '').trim().toUpperCase()
        );
    }, [formData, user]);

    // Sync isChanged to the layout context
    useEffect(() => {
        setIsChanged(isAcademicChanged);
    }, [isAcademicChanged, setIsChanged]);

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const doSave = async () => {
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
                toast.success('Academic details updated!');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update academic settings.';
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: '#a78bfa' }} />
            </div>
        );
    }

    return (
        <form
            onSubmit={e => { e.preventDefault(); doSave(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
            {/* Section header — desktop only (mobile header is in the layout shell) */}
            <div className="edit-section-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    Academic
                </h2>
                <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)' }}>
                    Manage your academic details
                </span>
            </div>

            <AcademicInformationCard
                formData={formData}
                onChange={handleTextChange}
            />
        </form>
    );
};

export default AcademicSettings;

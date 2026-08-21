import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { apiV2 } from '../../../../services/authService';

const ProfilePhotoCard = ({ user, onUpdateUser }) => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() || '?';

    // Check if custom profile picture exists (contains bucket URL or starts with http)
    const hasCustomPhoto = !!user?.profilePicture;

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
            const key = pic.split('/profiles/')[1];
            return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
        }
        if (pic.startsWith('http')) return pic;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${pic}`;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (PNG, JPG, WEBP).');
            return;
        }

        // Validate file size (< 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be smaller than 2MB.');
            return;
        }

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            setLoading(true);
            const res = await apiV2.uploadProfilePicture(formData);
            if (res.data?.success && res.data?.data?.student) {
                onUpdateUser(res.data.data.student);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload photo to S3.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
        
        setError('');
        try {
            setLoading(true);
            const res = await apiV2.removeProfilePicture();
            if (res.data?.success && res.data?.data?.student) {
                onUpdateUser(res.data.data.student);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove photo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxSizing: 'border-box'
        }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                Profile Photo
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Circular Avatar Container */}
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    border: '2px solid rgba(139,92,246,0.35)',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.12))',
                    color: '#c4b5fd',
                    fontSize: '22px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0
                }}>
                    {user?.profilePicture ? (
                        <img 
                            src={getProfilePicUrl(user.profilePicture)} 
                            alt="" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    ) : (
                        initials
                    )}

                    {loading && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Loader2 size={18} className="animate-spin" style={{ color: '#a78bfa' }} />
                        </div>
                    )}
                </div>

                {/* Upload & Actions Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(139,92,246,0.25)',
                                background: 'rgba(124,58,237,0.12)',
                                color: '#a78bfa',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(124,58,237,0.18)';
                                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(124,58,237,0.12)';
                                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)';
                            }}
                        >
                            <Camera size={13} />
                            Upload Photo
                        </button>

                        {hasCustomPhoto && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                disabled={loading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(239,68,68,0.25)',
                                    background: 'rgba(239,68,68,0.1)',
                                    color: '#f87171',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
                                }}
                            >
                                <Trash2 size={13} />
                                Remove
                            </button>
                        )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>
                        JPG, PNG or WEBP. Max size 2MB.
                    </span>
                </div>
            </div>

            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
            />

            {error && (
                <div style={{ fontSize: '12px', color: '#f87171', marginTop: '4px', fontWeight: 500 }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default ProfilePhotoCard;

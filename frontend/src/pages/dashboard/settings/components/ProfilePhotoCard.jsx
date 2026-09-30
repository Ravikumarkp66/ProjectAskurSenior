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
        <div className="rounded-xl border p-4 sm:p-5 bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.08] flex flex-col gap-3 box-border">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                Profile Photo
            </h3>

            <div className="flex items-center gap-4 sm:gap-5">
                {/* Circular Avatar Container */}
                <div className="w-[72px] h-[72px] rounded-full border-2 border-purple-500/30 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xl font-bold flex items-center justify-center overflow-hidden relative shrink-0">
                    {user?.profilePicture ? (
                        <img 
                            src={getProfilePicUrl(user.profilePicture)} 
                            alt="" 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        initials
                    )}

                    {loading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 size={18} className="animate-spin text-purple-400" />
                        </div>
                    )}
                </div>

                {/* Upload & Actions Buttons */}
                <div className="flex flex-col gap-2 flex-1">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-500/25 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Camera size={13} />
                            Upload Photo
                        </button>

                        {hasCustomPhoto && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-500/25 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 size={13} />
                                Remove
                            </button>
                        )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
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
                <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ProfilePhotoCard;

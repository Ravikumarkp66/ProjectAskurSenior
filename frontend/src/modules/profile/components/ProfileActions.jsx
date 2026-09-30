import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Share2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';

const ProfileActions = ({ isAnonymous = false }) => {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const handleEdit = () => {
        if (isAnonymous) {
            navigate('/login', { state: { from: '/profile/edit/basic' } });
        } else {
            navigate('/profile/edit/basic');
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: 'AskUrSenior Student Profile',
                url: url,
            }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
            toast.success('Profile link copied to clipboard!');
        } else {
            toast.success('Profile link copied!');
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            {/* Edit Profile Button */}
            <button 
                type="button"
                onClick={handleEdit}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    flex: 1,
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(37, 99, 235, 0.3)',
                    background: isDark ? 'rgba(30, 58, 138, 0.25)' : 'rgba(239, 246, 255, 0.9)',
                    color: isDark ? '#93C5FD' : '#2563EB',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                }}
            >
                {isAnonymous ? <Lock size={13} /> : <Edit2 size={13} />}
                <span>{isAnonymous ? 'Edit (Login)' : 'Edit Profile'}</span>
            </button>

            {/* Share Profile Button */}
            <button 
                type="button"
                onClick={handleShare}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    flex: 1,
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #D1D5DB',
                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                    color: isDark ? '#F1F5F9' : '#374151',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                }}
            >
                <Share2 size={13} />
                <span>Share</span>
            </button>
        </div>
    );
};

export default ProfileActions;

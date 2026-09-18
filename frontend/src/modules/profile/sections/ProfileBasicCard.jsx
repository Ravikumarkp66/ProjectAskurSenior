import React, { useEffect } from 'react';
import { useAuth } from '../../../utils/hooks';
import { useTheme } from '../../../context/ThemeContext';
import { apiV2 } from '../../../services/authService';
import ProfileIdentity from '../components/ProfileIdentity';
import ProfileActions from '../components/ProfileActions';
import BasicInformation from '../components/BasicInformation';
import SocialLinks from '../components/SocialLinks';

const ProfileBasicCard = () => {
    const { user, updateUser } = useAuth();
    const { isDark } = useTheme();

    // Fetch the latest populated details from student_accounts on mount
    useEffect(() => {
        const fetchLatestDetails = async () => {
            try {
                const res = await apiV2.getMe();
                if (res.data?.success && res.data?.data?.student) {
                    updateUser(res.data.data.student);
                }
            } catch (err) {
                console.error('[ProfileBasicCard] Failed to fetch latest details:', err);
            }
        };
        fetchLatestDetails();
    }, [updateUser]);

    if (!user) return null;

    const cardBg = isDark ? '#0D111C' : '#FFFFFF';
    const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
    const cardShadow = isDark ? '0 2px 8px rgba(0,0,0,0.35)' : '0 1px 3px rgba(15,23,42,0.06)';
    const dividerColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)';
    const bioColor = isDark ? '#94A3B8' : '#64748B';

    return (
        <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '16px',
            boxShadow: cardShadow,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            height: '100%',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* Identity & Actions Grouped Closely */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                <ProfileIdentity student={user} />
                <ProfileActions />
                {user.bio && user.bio.trim() && !/^\.+$/.test(user.bio.trim()) && (
                    <p style={{
                        fontSize: '12.5px',
                        color: bioColor,
                        margin: 0,
                        lineHeight: '1.4',
                        fontWeight: 400
                    }}>
                        {user.bio}
                    </p>
                )}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: dividerColor, margin: '2px 0' }} />

            {/* Academic Information Section */}
            <BasicInformation student={user} />

            {/* Divider */}
            <div style={{ height: '1px', background: dividerColor, margin: '2px 0' }} />

            {/* Social Links Section */}
            <SocialLinks student={user} />
        </div>
    );
};

export default ProfileBasicCard;

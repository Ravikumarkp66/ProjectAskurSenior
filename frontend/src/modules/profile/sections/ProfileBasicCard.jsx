import React, { useEffect } from 'react';
import { useAuth } from '../../../utils/hooks';
import { useTheme } from '../../../context/ThemeContext';
import { apiV2 } from '../../../services/authService';
import { DEMO_STUDENT_PROFILE } from '../../../features/profile/config/profileDemoData';
import ProfileIdentity from '../components/ProfileIdentity';
import ProfileActions from '../components/ProfileActions';
import BasicInformation from '../components/BasicInformation';
import SocialLinks from '../components/SocialLinks';

const ProfileBasicCard = () => {
    const { user, updateUser, isAuthenticated } = useAuth();
    const { isDark } = useTheme();

    const isAnonymous = !isAuthenticated || !user;
    const activeStudent = isAnonymous ? DEMO_STUDENT_PROFILE : user;

    // Fetch latest populated details from student_accounts on mount ONLY if authenticated
    useEffect(() => {
        if (!isAuthenticated) return;
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
    }, [isAuthenticated, updateUser]);

    const cardBg = isDark ? '#0F1115' : '#FFFFFF';
    const cardBorder = isDark ? '#292E37' : '#E5E7EB';
    const cardShadow = isDark ? 'none' : 'none';
    const dividerColor = isDark ? '#292E37' : '#E5E7EB';
    const bioColor = isDark ? '#A1A1AA' : '#4B5563';

    return (
        <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            boxShadow: cardShadow,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '100%',
            boxSizing: 'border-box',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            {/* Identity & Actions Grouped */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
            }}>
                <ProfileIdentity student={activeStudent} isAnonymous={isAnonymous} />
                <ProfileActions isAnonymous={isAnonymous} />
                {activeStudent.bio && activeStudent.bio.trim() && !/^\.+$/.test(activeStudent.bio.trim()) && (
                    <p style={{
                        fontSize: '13px',
                        color: bioColor,
                        margin: 0,
                        lineHeight: '1.5',
                        fontWeight: 400
                    }}>
                        {activeStudent.bio}
                    </p>
                )}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: dividerColor, margin: '2px 0' }} />

            {/* Academic Information Section (Expands comfortably) */}
            <div style={{ flex: 1 }}>
                <BasicInformation student={activeStudent} isAnonymous={isAnonymous} />
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: dividerColor, margin: '2px 0' }} />

            {/* Social Links Section */}
            <SocialLinks student={activeStudent} isAnonymous={isAnonymous} />
        </div>
    );
};

export default ProfileBasicCard;

import React, { useEffect } from 'react';
import { useAuth } from '../../../utils/hooks';
import { apiV2 } from '../../../services/authService';
import ProfileIdentity from '../components/ProfileIdentity';
import ProfileActions from '../components/ProfileActions';
import BasicInformation from '../components/BasicInformation';
import SocialLinks from '../components/SocialLinks';

const ProfileBasicCard = () => {
    const { user, updateUser } = useAuth();

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

    return (
        <div style={{
            background: 'rgba(19, 18, 26, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.15)', // Visible highlighted border on all sides
            borderRadius: '12px', // Standard rounded corners on all sides
            padding: '14px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            height: '100%',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* Identity & Actions Grouped Closely */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <ProfileIdentity student={user} />
                <ProfileActions />
                {user.bio && user.bio.trim() && !/^\.+$/.test(user.bio.trim()) && (
                    <p style={{
                        fontSize: '12.5px',
                        color: '#94a3b8',
                        margin: 0,
                        lineHeight: '1.35',
                        fontWeight: 400
                    }}>
                        {user.bio}
                    </p>
                )}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '1px 0' }} />

            {/* Academic Information Section */}
            <BasicInformation student={user} />

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '1px 0' }} />

            {/* Social Links Section */}
            <SocialLinks student={user} />
        </div>
    );
};

export default ProfileBasicCard;

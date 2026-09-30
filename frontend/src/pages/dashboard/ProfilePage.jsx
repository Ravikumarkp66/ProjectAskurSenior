import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/hooks';
import { useTheme } from '../../context/ThemeContext';
import {
    useProfileEntitlements
} from '../../features/profile/utils/profileEntitlements';
import { DEMO_STUDENT_PROFILE } from '../../features/profile/config/profileDemoData';
import { ProfileStateBanner } from '../../features/profile/components/ProfileStateBanner';
import {
    ProfileBasicCard,
    CgpaProgressCard,
    AttendanceOverviewCard,
    TodayClassesCard,
    AcademicJourneyCard,
    BasicInformation,
} from '../../modules/profile';

// ─── Mobile Profile Card Component (< 768px) ──────────────────────────
const MobileProfileCard = ({ student, isAnonymous }) => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    if (!student) return null;

    const initials = student.name
        ? student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : student.email?.[0]?.toUpperCase() || '?';

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
            const key = pic.split('/profiles/')[1];
            return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
        }
        if (pic.startsWith('http')) return pic;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${baseUrl}${pic.startsWith('/') ? '' : '/'}${pic}`;
    };

    const getYearLabel = (sem) => {
        if (!sem) return '1st Year';
        const yr = Math.ceil(sem / 2);
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = yr % 10;
        const suf = (v >= 1 && v <= 3 && (yr % 100 < 11 || yr % 100 > 13)) ? suffixes[v] : suffixes[0];
        return `${yr}${suf} Year`;
    };

    const usernameStr = student.username 
        ? (student.username.startsWith('@') ? student.username : `@${student.username}`)
        : (student.usn ? `@${student.usn.toLowerCase()}` : '@student');

    const branchStr = typeof student.branch === 'object' 
        ? (student.branch?.shortName || student.branch?.name) 
        : (student.branch || 'ISE');

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${student.name} - AskUrSenior Profile`,
                url: window.location.href,
            }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            alert('Profile link copied to clipboard!');
        }
    };

    const handleEdit = () => {
        if (isAnonymous) {
            navigate('/login', { state: { from: '/profile/edit/basic' } });
        } else {
            navigate('/profile/edit/basic');
        }
    };

    const cardBg = isDark ? '#0F1115' : '#FFFFFF';
    const cardBorder = isDark ? '#292E37' : '#E5E7EB';
    const nameColor = isDark ? '#F3F4F6' : '#111827';
    const subColor = isDark ? '#A1A1AA' : '#6B7280';
    const dividerColor = isDark ? '#292E37' : '#E5E7EB';

    return (
        <div style={{
            borderRadius: '8px',
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            {/* Centered Avatar */}
            <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(37, 99, 235, 0.25)',
                background: isDark
                    ? 'rgba(30, 58, 138, 0.25)'
                    : 'rgba(239, 246, 255, 0.9)',
                color: isDark ? '#93C5FD' : '#2563EB',
                fontSize: '22px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: '12px'
            }}>
                {student.profilePicture && !imgError ? (
                    <img 
                        src={getProfilePicUrl(student.profilePicture)} 
                        alt={student.name} 
                        onError={() => setImgError(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                ) : (
                    initials
                )}
            </div>

            {/* Full Name */}
            <h2 style={{
                fontSize: '17px',
                fontWeight: 700,
                color: nameColor,
                margin: '0 0 2px 0',
                letterSpacing: '-0.01em'
            }}>
                {student.name || 'AskUrSenior Student'}
            </h2>

            {/* Username + Demo Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#EA580C'
                }}>
                    {usernameStr}
                </span>
                {isAnonymous && (
                    <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                        color: isDark ? '#93C5FD' : '#2563EB',
                        border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #DBEAFE',
                        textTransform: 'uppercase'
                    }}>
                        Demo
                    </span>
                )}
            </div>

            {/* Branch */}
            <p style={{
                fontSize: '13px',
                fontWeight: 500,
                color: subColor,
                margin: '0 0 4px 0'
            }}>
                {branchStr}
            </p>

            {/* Year • Graduation */}
            <p style={{
                fontSize: '12px',
                fontWeight: 600,
                color: isDark ? '#93C5FD' : '#2563EB',
                margin: 0
            }}>
                {getYearLabel(student.semester)} • {student.graduationYear || '2027'}
            </p>

            {/* Horizontal Divider */}
            <div style={{ width: '100%', height: '1px', background: dividerColor, margin: '16px 0' }} />

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                <button 
                    onClick={handleEdit}
                    style={{
                        flex: 1,
                        maxWidth: '140px',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        background: isDark ? '#2563EB' : '#2563EB',
                        border: '1px solid #1D4ED8',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    {isAnonymous ? 'Edit (Login)' : 'Edit Profile'}
                </button>
                <button 
                    onClick={handleShare}
                    style={{
                        flex: 1,
                        maxWidth: '140px',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #D1D5DB',
                        color: isDark ? '#F1F5F9' : '#374151',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    Share
                </button>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const [selectedDate, setSelectedDate] = useState(null);
    const { user, isAuthenticated } = useAuth();
    const { isDark } = useTheme();
    const { userState, isAnonymous } = useProfileEntitlements();

    const activeStudent = isAnonymous ? DEMO_STUDENT_PROFILE : user;

    const mobileCardStyle = {
        borderRadius: '8px',
        background: isDark ? '#0F1115' : '#FFFFFF',
        border: `1px solid ${isDark ? '#292E37' : '#E5E7EB'}`,
        padding: '16px',
        boxShadow: 'none',
    };

    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 32px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            {/* ── MOBILE LAYOUT (< 768px): Dedicated Single Column Stack ── */}
            <div className="mobile-profile-stack">
                {/* 0. State Banner (State 1: Demo preview banner / State 2 & 3: Completion banner) */}
                <ProfileStateBanner userState={userState} student={activeStudent} />

                {/* 1. Profile Card */}
                <MobileProfileCard student={activeStudent} isAnonymous={isAnonymous} />

                {/* 2. Basic Information Card */}
                <div style={mobileCardStyle}>
                    <BasicInformation student={activeStudent} isAnonymous={isAnonymous} />
                </div>

                {/* 3. Academic Journey Card */}
                <AcademicJourneyCard onSelectDate={setSelectedDate} />

                {/* 4. CGPA Progress Card */}
                <CgpaProgressCard />

                {/* 5. Attendance Card */}
                <AttendanceOverviewCard />

                {/* 6. Today's Classes Card */}
                <TodayClassesCard selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            </div>

            {/* ── DESKTOP & TABLET LAYOUT (≥ 768px) ── */}
            <div
                style={{
                    gridTemplateColumns: '390px 1fr',
                    gap: '12px',
                    width: '100%',
                    height: '100%',
                }}
                className="desktop-profile-grid profile-layout-grid"
            >
                {/* ── Left: Permanent Identity Card (no scroll) ─────────── */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: '390px', height: '100%' }}
                >
                    <ProfileBasicCard />
                </motion.div>

                {/* ── Right: Scrollable Analytics Column ────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        minWidth: 0,
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        paddingRight: '4px',
                        paddingBottom: '16px',
                    }}
                    className="profile-scroll-col"
                >
                    {/* Top State Banner */}
                    <ProfileStateBanner userState={userState} student={activeStudent} />

                    {/* Row 1 — Summary Cards */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px',
                            width: '100%',
                            flexShrink: 0,
                        }}
                        className="profile-cards-row"
                    >
                        <CgpaProgressCard />
                        <AttendanceOverviewCard />
                        <TodayClassesCard selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                    </div>

                    {/* Row 2 — Academic Journey Heatmap */}
                    <AcademicJourneyCard onSelectDate={setSelectedDate} />
                </motion.div>
            </div>

            {/* Responsive breakpoints + scrollbar styling */}
            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 767px) {
                    .mobile-profile-stack {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 20px !important;
                        width: 100% !important;
                        padding-bottom: 40px !important;
                    }
                    .desktop-profile-grid {
                        display: none !important;
                    }
                }
                @media (min-width: 768px) {
                    .mobile-profile-stack {
                        display: none !important;
                    }
                    .desktop-profile-grid {
                        display: grid !important;
                    }
                }
                @media (max-width: 1280px) {
                    .profile-cards-row {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 1024px) {
                    .profile-layout-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .profile-cards-row {
                        grid-template-columns: 1fr !important;
                    }
                }
                .profile-scroll-col::-webkit-scrollbar {
                    width: 4px;
                }
                .profile-scroll-col::-webkit-scrollbar-track {
                    background: transparent;
                }
                .profile-scroll-col::-webkit-scrollbar-thumb {
                    background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.15)'};
                    border-radius: 4px;
                }
                .profile-scroll-col::-webkit-scrollbar-thumb:hover {
                    background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.25)'};
                }
            `}} />
        </div>
    );
};

export default ProfilePage;

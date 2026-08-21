import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/hooks';
import {
    ProfileBasicCard,
    CgpaProgressCard,
    AttendanceOverviewCard,
    TodayClassesCard,
    AcademicJourneyCard,
    BasicInformation,
} from '../../modules/profile';

// ─── Mobile Profile Card Component (< 768px) ──────────────────────────
const MobileProfileCard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    if (!user) return null;

    const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user.email?.[0]?.toUpperCase() || '?';

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
            const key = pic.split('/profiles/')[1];
            return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
        }
        if (pic.startsWith('http')) return pic;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${pic}`;
    };

    const getYearLabel = (sem) => {
        if (!sem) return '1st Year';
        const yr = Math.ceil(sem / 2);
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = yr % 10;
        const suf = (v >= 1 && v <= 3 && (yr % 100 < 11 || yr % 100 > 13)) ? suffixes[v] : suffixes[0];
        return `${yr}${suf} Year`;
    };

    const usernameStr = user.username 
        ? (user.username.startsWith('@') ? user.username : `@${user.username}`)
        : `@${user.email?.split('@')[0] || 'student'}`;

    const branchStr = typeof user.branch === 'object' 
        ? (user.branch?.shortName || user.branch?.name) 
        : (user.branch || 'ISE');

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${user.name} - AskUrSenior Profile`,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Profile link copied to clipboard!');
        }
    };

    return (
        <div style={{
            borderRadius: '20px',
            background: 'rgba(19, 18, 26, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '20px 16px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* Centered Avatar */}
            <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: '2px solid rgba(139, 92, 246, 0.4)',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(99, 102, 241, 0.2))',
                color: '#c4b5fd',
                fontSize: '24px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: '12px',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.25)'
            }}>
                {user.profilePicture && !imgError ? (
                    <img 
                        src={getProfilePicUrl(user.profilePicture)} 
                        alt={user.name} 
                        onError={() => setImgError(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                ) : (
                    initials
                )}
            </div>

            {/* Full Name */}
            <h2 style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#F1F5F9',
                margin: '0 0 2px 0',
                letterSpacing: '0.02em'
            }}>
                {user.name?.toUpperCase() || 'STUDENT NAME'}
            </h2>

            {/* Username */}
            <p style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#F97316',
                margin: '0 0 8px 0'
            }}>
                {usernameStr}
            </p>

            {/* Branch */}
            <p style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#94A3B8',
                margin: '0 0 4px 0'
            }}>
                {branchStr}
            </p>

            {/* Year • Graduation */}
            <p style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#A78BFA',
                margin: 0
            }}>
                {getYearLabel(user.semester)} • {user.graduationYear || '2027'}
            </p>

            {/* Horizontal Divider */}
            <div style={{ width: '100%', height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '16px 0' }} />

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                <button 
                    onClick={() => navigate('/settings')}
                    style={{
                        flex: 1,
                        maxWidth: '140px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background: 'rgba(124, 58, 237, 0.25)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        color: '#EDE9FE',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    Edit Profile
                </button>
                <button 
                    onClick={handleShare}
                    style={{
                        flex: 1,
                        maxWidth: '140px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#CBD5E1',
                        fontSize: '13px',
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
    const { user } = useAuth();

    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 32px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* ── MOBILE LAYOUT (< 768px): Dedicated Single Column Stack ── */}
            <div className="mobile-profile-stack">
                {/* 1. Profile Card */}
                <MobileProfileCard />

                {/* 2. Basic Information Card */}
                <div style={{
                    borderRadius: '20px',
                    background: 'rgba(19, 18, 26, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '16px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}>
                    <BasicInformation student={user} />
                </div>

                {/* 3. Academic Journey Card */}
                <div style={{
                    borderRadius: '20px',
                    background: 'rgba(19, 18, 26, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '16px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}>
                    <AcademicJourneyCard onSelectDate={setSelectedDate} />
                </div>

                {/* 4. CGPA Progress Card */}
                <div style={{
                    borderRadius: '20px',
                    background: 'rgba(19, 18, 26, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '16px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}>
                    <CgpaProgressCard />
                </div>

                {/* 5. Attendance Card */}
                <div style={{
                    borderRadius: '20px',
                    background: 'rgba(19, 18, 26, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '16px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}>
                    <AttendanceOverviewCard />
                </div>

                {/* 6. Today's Classes Card */}
                <div style={{
                    borderRadius: '20px',
                    background: 'rgba(19, 18, 26, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '16px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}>
                    <TodayClassesCard selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                </div>
            </div>

            {/* ── DESKTOP & TABLET LAYOUT (≥ 768px): 100% UNCHANGED ── */}
            <div
                style={{
                    gridTemplateColumns: '360px 1fr',
                    gap: '12px',
                    width: '100%',
                    height: '100%',
                }}
                className="desktop-profile-grid profile-layout-grid"
            >
                {/* ── Left: Permanent Identity Card (no scroll) ─────────── */}
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '360px', height: '100%' }}
                >
                    <ProfileBasicCard />
                </motion.div>

                {/* ── Right: Scrollable Analytics Column ────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        minWidth: 0,
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        paddingRight: '4px',       // breathing room from scrollbar
                        paddingBottom: '16px',     // comfortable bottom margin
                    }}
                    className="profile-scroll-col"
                >
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
                        gap: 24px !important;
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
                /* Thin custom scrollbar for the analytics column */
                .profile-scroll-col::-webkit-scrollbar {
                    width: 4px;
                }
                .profile-scroll-col::-webkit-scrollbar-track {
                    background: transparent;
                }
                .profile-scroll-col::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                }
                .profile-scroll-col::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }
            `}} />
        </div>
    );
};

export default ProfilePage;

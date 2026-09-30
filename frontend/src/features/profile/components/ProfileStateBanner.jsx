import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Sparkles, Lock, ShieldAlert } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import AcademicProfileCompletionBanner from '../../../modules/profile/components/AcademicProfileCompletionBanner';

/**
 * ProfileStateBanner — Top banner orchestrator across all 3 user states:
 * 
 * 1. State 1 (Non-logged-in): Shows realistic demo preview banner with "Sign in to personalize" CTA.
 * 2. State 2 & 3 (Logged-in Free / Plus): Shows real profile completion banner if profile is incomplete.
 */
export const ProfileStateBanner = ({ userState, student, onUpdated }) => {
    const { isDark } = useTheme();
    const navigate = useNavigate();

    // State 1: Anonymous / Non-logged in preview banner
    if (userState === 'ANONYMOUS' || !student) {
        const bg = isDark
            ? 'rgba(15, 23, 42, 0.75)'
            : '#FFFFFF';
        const border = isDark
            ? '1px solid rgba(59, 130, 246, 0.25)'
            : '1px solid #DBEAFE';
        const titleColor = isDark ? '#F8FAFC' : '#1E293B';
        const subColor = isDark ? '#94A3B8' : '#475569';
        const iconBg = isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF';
        const iconBorder = isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE';

        return (
            <div
                style={{
                    width: '100%',
                    marginBottom: '12px',
                    borderRadius: '10px',
                    background: bg,
                    border: border,
                    padding: '12px 16px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    fontFamily: 'Inter, sans-serif'
                }}
            >
                {/* Left: Indicator & Description */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 280px' }}>
                    <div
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: iconBg,
                            border: iconBorder,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#60A5FA' : '#2563EB',
                            flexShrink: 0
                        }}
                    >
                        <Sparkles size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: titleColor, letterSpacing: '-0.01em' }}>
                                Demo Profile Preview
                            </span>
                            <span
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '1px 7px',
                                    borderRadius: '999px',
                                    background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                                    color: isDark ? '#93C5FD' : '#1D4ED8',
                                    border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #DBEAFE',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                }}
                            >
                                Preview Mode
                            </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: subColor, lineHeight: 1.4 }}>
                            Sign in to personalize your profile with your real institutional USN, attendance, timetable, and records.
                        </p>
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                        type="button"
                        onClick={() => navigate('/login', { state: { from: '/profile' } })}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '6px',
                            background: isDark ? '#2563EB' : '#2563EB',
                            border: '1px solid #1D4ED8',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <LogIn size={13} />
                        <span>Sign In to Personalize</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/signup', { state: { from: '/profile' } })}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
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
                        <UserPlus size={13} />
                        <span>Create Account</span>
                    </button>
                </div>
            </div>
        );
    }

    // State 2 & 3: Logged-in Free and Plus users show profile completion banner if incomplete
    return (
        <AcademicProfileCompletionBanner student={student} onUpdated={onUpdated} />
    );
};

export default ProfileStateBanner;

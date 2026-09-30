import React from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';

/**
 * ProfileLockBadge — Small, crisp indicator tag for locked card headers.
 */
export const ProfileLockBadge = ({ isAnonymous, label = 'Plus' }) => {
    const { isDark } = useTheme();

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3.5px',
                fontSize: '10px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontWeight: 700,
                padding: '1.5px 6px',
                borderRadius: '4px',
                background: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                color: isDark ? '#93C5FD' : '#2563EB',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(37, 99, 235, 0.2)',
                letterSpacing: '0.03em',
                textTransform: 'uppercase'
            }}
            title={isAnonymous ? 'Sign in to access personalized data' : 'Requires Plus plan'}
        >
            <Lock size={9.5} strokeWidth={2.5} />
            <span>{isAnonymous ? 'PREVIEW' : label}</span>
        </span>
    );
};

/**
 * ProfileLockedOverlay — Subtle, elegant overlay placed over locked preview content.
 * 
 * Provides a clear explanation and clean "Unlock with Plus" (or "Sign In") CTA button.
 */
export const ProfileLockedOverlay = ({
    title = 'Academic Intelligence',
    description = 'Unlock personalized metrics with AskUrSenior Plus.',
    isAnonymous = false,
    onUnlock
}) => {
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const handleAction = () => {
        if (onUnlock) {
            onUnlock();
            return;
        }
        if (isAnonymous) {
            navigate('/login', { state: { from: '/profile' } });
        } else {
            navigate('/pricing');
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '14px',
                background: isDark
                    ? 'rgba(13, 17, 28, 0.65)'
                    : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                textAlign: 'center',
                zIndex: 10,
                gap: '8px',
                boxSizing: 'border-box'
            }}
        >
            <div
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                    border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(37, 99, 235, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#93C5FD' : '#2563EB'
                }}
            >
                <Lock size={15} strokeWidth={2.2} />
            </div>

            <div style={{ maxWidth: '240px' }}>
                <p
                    style={{
                        margin: 0,
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isDark ? '#F1F5F9' : '#0F172A',
                        lineHeight: 1.3
                    }}
                >
                    {title}
                </p>
                <p
                    style={{
                        margin: '3px 0 0',
                        fontSize: '11px',
                        color: isDark ? '#94A3B8' : '#64748B',
                        lineHeight: 1.35
                    }}
                >
                    {description}
                </p>
            </div>

            <button
                type="button"
                onClick={handleAction}
                style={{
                    marginTop: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    background: isDark ? '#2563EB' : '#2563EB',
                    border: '1px solid #1D4ED8',
                    color: '#FFFFFF',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
            >
                <span>{isAnonymous ? 'Sign in to Personalize' : 'Unlock with Plus'}</span>
                <ArrowRight size={11} strokeWidth={2.2} />
            </button>
        </div>
    );
};

export default ProfileLockedOverlay;

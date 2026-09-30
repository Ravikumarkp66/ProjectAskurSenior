import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════════
   PlusFeatureLock
   ────────────────────────────────────────────────────────────────
   Wraps any widget/card and gates it behind an active Plus subscription.

   USAGE:
     <PlusFeatureLock featureName="Materials Overview">
       <MaterialsOverviewWidget />
     </PlusFeatureLock>

   BEHAVIOUR:
     • Plus user    → renders children normally (no lock, no overhead)
     • Free user    → renders children + frosted overlay + lock icon
                      Clicking anywhere → /pricing
     • Not logged in → renders children + frosted overlay + lock icon
                       Clicking anywhere → /login (with ?redirect= so
                       LoginPage can bounce back after auth)

   DESIGN PRINCIPLE:
     The overlay sits on top via `position: absolute; inset: 0` so the
     card retains its exact height, width and visual structure. This
     lets non-Plus users see what Plus provides without exposing
     personalised data (the widget itself is already visible as a
     blurred preview).
═══════════════════════════════════════════════════════════════════ */

/** Inline lock SVG — no extra dependency, consistent with the dark UI */
const LockIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

/** Inline star/sparkle SVG for the Plus badge */
const StarIcon = () => (
    <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const PlusFeatureLock = ({ children, featureName = 'This Feature' }) => {
    const { isAuthenticated, hasPlusAccess } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // ── Plus user: render normally ──────────────────────────────────
    if (hasPlusAccess) {
        return <>{children}</>;
    }

    // ── Non-Plus: click handler ─────────────────────────────────────
    const handleUnlockClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            // Encode current path so login can bounce back
            const redirectTo = encodeURIComponent(location.pathname);
            navigate(`/login?redirect=${redirectTo}`);
        } else {
            // Logged in but free — send to pricing
            navigate('/pricing');
        }
    };

    // ── Overlay styles ──────────────────────────────────────────────
    const overlayStyle = {
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: 'pointer',
        // Frosted dark glass — consistent with the dark dashboard UI
        background: 'rgba(8, 10, 20, 0.68)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        borderRadius: 'inherit',
    };

    const lockCircleStyle = {
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: 'rgba(139, 92, 246, 0.15)',
        border: '1.5px solid rgba(139, 92, 246, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#a78bfa',
        flexShrink: 0,
        boxShadow: '0 0 18px rgba(139, 92, 246, 0.2)',
    };

    const labelStyle = {
        fontSize: 11,
        fontWeight: 600,
        color: 'rgba(203, 213, 225, 0.75)',
        letterSpacing: '0.02em',
        fontFamily: 'Outfit, sans-serif',
        textAlign: 'center',
        lineHeight: 1.3,
    };

    const ctaBtnStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'Outfit, sans-serif',
        letterSpacing: '0.01em',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(124, 58, 237, 0.35)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        whiteSpace: 'nowrap',
    };

    const plusBadgeStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: '#c4b5fd',
        background: 'rgba(139, 92, 246, 0.18)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        borderRadius: 4,
        padding: '2px 6px',
        fontFamily: 'Outfit, sans-serif',
    };

    return (
        // Container must be `position: relative` so the overlay can
        // use `position: absolute; inset: 0` correctly.
        <div style={{ position: 'relative' }}>
            {/* ── Widget preview (blurred behind the overlay) ── */}
            <div
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    filter: 'blur(2.5px)',
                    opacity: 0.45,
                }}
                aria-hidden="true"
            >
                {children}
            </div>

            {/* ── Lock overlay ── */}
            <div
                role="button"
                tabIndex={0}
                aria-label={`${featureName} — AskUrSenior Plus feature. Click to unlock.`}
                onClick={handleUnlockClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleUnlockClick(e);
                }}
                style={overlayStyle}
            >
                {/* Lock icon circle */}
                <div style={lockCircleStyle}>
                    <LockIcon />
                </div>

                {/* Plus badge */}
                <div style={plusBadgeStyle}>
                    <StarIcon />
                    <span>Plus Only</span>
                </div>

                {/* Feature name */}
                <span style={labelStyle}>{featureName}</span>

                {/* CTA button */}
                <button
                    type="button"
                    onClick={handleUnlockClick}
                    style={ctaBtnStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.88';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    {isAuthenticated ? 'Upgrade to Plus →' : 'Login to Access →'}
                </button>
            </div>
        </div>
    );
};

export default PlusFeatureLock;

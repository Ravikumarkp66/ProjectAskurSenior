import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../utils/hooks';

/**
 * AuthGate — wraps content behind auth/plus checks.
 *
 * Props:
 *   requireAuth   {boolean} — show login wall for guests
 *   requirePlus   {boolean} — show upgrade wall for non-plus users
 *   loginMessage  {string}  — subtitle shown on the login wall
 *   plusMessage   {string}  — subtitle shown on the plus wall
 *   children                — rendered when fully authorized
 */
const AuthGate = ({
    requireAuth = true,
    requirePlus = false,
    loginMessage = 'Sign in to continue.',
    plusMessage = 'This feature is available on the Plus plan.',
    children,
}) => {
    const { isAuthenticated, hasPlusAccess } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    /* ── Login wall ── */
    if (requireAuth && !isAuthenticated) {
        const redirectParam = encodeURIComponent(location.pathname + location.search);
        return (
            <div className="flex items-center justify-center min-h-[320px] w-full py-12">
                <div className="border border-[#E5E7EB] dark:border-[#292E37] rounded-lg p-8 bg-white dark:bg-[#15181D] text-center max-w-sm mx-auto">
                    <div className="flex justify-center mb-4">
                        <LogIn size={20} style={{ color: '#2563EB' }} />
                    </div>
                    <h2 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '8px',
                        fontFamily: "'Inter', sans-serif",
                    }}
                        className="dark:text-[#F3F4F6]"
                    >
                        Login to continue
                    </h2>
                    <p style={{
                        fontSize: '13px',
                        color: '#4B5563',
                        marginBottom: '20px',
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: '20px',
                    }}
                        className="dark:text-[#A1A1AA]"
                    >
                        {loginMessage}
                    </p>
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={() => navigate(`/login?redirect=${redirectParam}`)}
                            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[6px] px-4 py-2 text-sm font-medium transition-colors"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                            Log in
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="text-[#4B5563] dark:text-[#A1A1AA] text-sm underline bg-transparent border-0 cursor-pointer"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                            Sign up
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Plus wall ── */
    if (requirePlus && !hasPlusAccess) {
        return (
            <div className="flex items-center justify-center min-h-[320px] w-full py-12">
                <div className="border border-[#E5E7EB] dark:border-[#292E37] rounded-lg p-8 bg-white dark:bg-[#15181D] text-center max-w-sm mx-auto">
                    <div className="flex justify-center mb-4">
                        <Sparkles size={20} style={{ color: '#2563EB' }} />
                    </div>
                    <h2 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: '8px',
                        fontFamily: "'Inter', sans-serif",
                    }}
                        className="dark:text-[#F3F4F6]"
                    >
                        Plus feature
                    </h2>
                    <p style={{
                        fontSize: '13px',
                        color: '#4B5563',
                        marginBottom: '20px',
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: '20px',
                    }}
                        className="dark:text-[#A1A1AA]"
                    >
                        {plusMessage}
                    </p>
                    <button
                        onClick={() => navigate('/pricing')}
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[6px] px-4 py-2 text-sm font-medium transition-colors"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                        Upgrade to Plus
                    </button>
                </div>
            </div>
        );
    }

    /* ── Authorized ── */
    return <>{children}</>;
};

export default AuthGate;

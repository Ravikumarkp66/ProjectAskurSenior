import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/Logo';
import { Moon, Sun } from 'lucide-react';

export const LoginPage = () => {
  const { loginWithGoogle, isAuthenticated } = useAdminAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired') === 'true';

  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(() => {
    if (isExpired) {
      return {
        type: 'session_expired',
        title: 'Session expired',
        message: 'Your administrative session has expired. Please sign in again.'
      };
    }
    return null;
  });

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clean handler for Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    try {
      setErrorState(null);
      setLoading(true);

      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '403325191152-3d7ma4s0pkig1il3r8a48vjn6g1bunih.apps.googleusercontent.com';

      // Wait briefly for GIS script if loading
      let gisAvailable = window.google?.accounts?.oauth2;
      if (!gisAvailable) {
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 200));
          if (window.google?.accounts?.oauth2) {
            gisAvailable = true;
            break;
          }
        }
      }

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services failed to load. Please check your internet connection or ad-blocker.');
      }

      const accessToken = await new Promise((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
            } else if (response.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error('No access token received from Google.'));
            }
          },
          error_callback: (err) => {
            reject(new Error(err.message || 'Google Sign-In popup was closed or blocked.'));
          }
        });
        client.requestAccessToken({ prompt: 'select_account' });
      });

      // Send Google access token to backend for verification and admin authorization
      await loginWithGoogle(accessToken);

      // On authorized admin, navigate to admin dashboard
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Google sign-in error:', err);

      if (err.code === 'UNAUTHORIZED_ADMIN' || err.response?.status === 403) {
        setErrorState({
          type: 'unauthorized',
          title: 'Access denied.',
          message: 'Your account is not authorized to access the AskUrSenior Admin Portal.'
        });
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setErrorState({
          type: 'error',
          title: 'Unable to connect.',
          message: 'Could not reach the authentication server. Please ensure the backend is running on port 5000.'
        });
      } else {
        const errorDetail = err.response?.data?.error || err.response?.data?.message || err.message;
        setErrorState({
          type: 'error',
          title: 'Unable to sign in.',
          message: errorDetail && errorDetail !== 'Error'
            ? errorDetail
            : 'Please check your connection and try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb] text-gray-900 dark:bg-[#121212] dark:text-gray-100">
      {/* Top Header - CSES sheet-style horizontal header bar */}
      <header className="w-full border-b border-gray-200 bg-white px-4 py-3.5 sm:px-8 dark:border-zinc-800 dark:bg-[#121212]">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          {/* Top Left: Dominant Logo */}
          <Logo size={38} showText={true} textClassName="text-xl sm:text-2xl" />

          {/* Top Right: Unobtrusive Light/Dark Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center gap-1.5 rounded-sm border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-gray-600" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Login Content Area */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px]">
          {/* Centered CSES Academic Container Box */}
          <div className="rounded-sm border border-gray-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-[#18181b]">
            {/* Header Content */}
            <div className="text-left">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Welcome back
              </h1>
              <p className="mt-1.5 text-xs text-gray-600 sm:text-sm dark:text-gray-400">
                Sign in to access the AskUrSenior administration portal.
              </p>
            </div>

            {/* Primary Action: Continue with Google Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-sm border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-750 sm:text-sm"
              >
                {/* Official Google 'G' Logo SVG */}
                <svg
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
              </button>
            </div>

            {/* Inline Error Message State */}
            {errorState && (
              <div
                role="alert"
                className={`mt-4 rounded-sm border p-3 text-xs leading-relaxed ${
                  errorState.type === 'unauthorized'
                    ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                    : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
                }`}
              >
                <div className="font-semibold">{errorState.title}</div>
                <div className="mt-0.5">{errorState.message}</div>
              </div>
            )}

            {/* Admin Access Informational Message */}
            <div className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-zinc-800 dark:text-gray-400">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Authorized administrators only.
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                Your account must have administrative access to continue.
              </p>
            </div>

            {/* Subtle Footer Note */}
            <div className="mt-6 border-t border-gray-100 pt-3 text-[11px] text-gray-400 dark:border-zinc-800/60 dark:text-zinc-500">
              <div className="flex items-center justify-between">
                <span>AskUrSenior Admin Portal</span>
                <span>Administrative access is logged.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

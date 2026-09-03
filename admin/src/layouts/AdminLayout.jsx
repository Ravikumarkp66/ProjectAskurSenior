import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/Logo';
import { Moon, Sun } from 'lucide-react';

export const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb] text-gray-900 dark:bg-[#121212] dark:text-gray-100 font-sans">
      {/* Top Header - Compact CSES Academic Layout */}
      <header className="w-full border-b border-gray-200 bg-white px-3 py-2 sm:px-6 dark:border-zinc-800 dark:bg-[#121212]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          {/* Top Left: Logo & Admin Portal Label */}
          <div className="flex items-center gap-2.5">
            <Link to="/users" className="inline-flex items-center">
              <Logo size={30} showText={true} textClassName="text-base sm:text-lg" />
            </Link>
            <span className="border-l border-gray-300 dark:border-zinc-700 pl-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 select-none">
              Admin Portal
            </span>
          </div>

          {/* Top Right: User Email, Theme Toggle & Logout */}
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="hidden sm:inline-block text-gray-600 dark:text-gray-400">
              {admin?.email || 'Administrator'}
            </span>

            <span className="hidden sm:inline-block text-gray-300 dark:text-zinc-700 font-sans">|</span>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center gap-1 rounded-none border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-zinc-800 font-sans"
            >
              {isDark ? (
                <>
                  <Sun className="h-3 w-3 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3 w-3 text-gray-600" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <span className="text-gray-300 dark:text-zinc-700 font-sans">|</span>

            {/* Logout Link */}
            <button
              type="button"
              onClick={handleLogout}
              className="text-red-600 hover:underline dark:text-red-400 font-medium font-sans"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main CSES Horizontal Navigation Bar */}
      <nav className="w-full border-b border-gray-200 bg-white px-3 py-1.5 sm:px-6 dark:border-zinc-800 dark:bg-[#121212]">
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          <NavLink
            to="/users"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 underline underline-offset-4 font-bold dark:text-blue-400'
                : 'hover:text-blue-600 dark:hover:text-blue-400'
            }
          >
            USERS
          </NavLink>

          <span className="text-gray-300 dark:text-zinc-700">|</span>

          <span
            className="text-gray-400 dark:text-zinc-600 cursor-not-allowed select-none"
            title="Module not yet implemented"
          >
            CONTENT
          </span>

          <span className="text-gray-300 dark:text-zinc-700">|</span>

          <span
            className="text-gray-400 dark:text-zinc-600 cursor-not-allowed select-none"
            title="Module not yet implemented"
          >
            COMMUNITY
          </span>

          <span className="text-gray-300 dark:text-zinc-700">|</span>

          <span
            className="text-gray-400 dark:text-zinc-600 cursor-not-allowed select-none"
            title="Module not yet implemented"
          >
            AI
          </span>

          <span className="text-gray-300 dark:text-zinc-700">|</span>

          <span
            className="text-gray-400 dark:text-zinc-600 cursor-not-allowed select-none"
            title="Module not yet implemented"
          >
            SYSTEM
          </span>
        </div>
      </nav>

      {/* Main CSES Content Area - Full 1280px Width */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-3 sm:px-6 py-3">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

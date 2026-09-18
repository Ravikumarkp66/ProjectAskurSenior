import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Shield, Moon, Sun, LogOut } from 'lucide-react';
import { isSuperAdmin } from '../../utils/permissions';

const getBreadcrumb = (pathname) => {
  if (pathname.startsWith('/dashboard') || pathname === '/' || pathname === '/overview') {
    return { group: 'Overview', title: 'Dashboard' };
  }
  if (pathname.startsWith('/users')) {
    return { group: 'Users', title: 'Student Accounts' };
  }
  if (pathname.startsWith('/admins')) {
    return { group: 'Users', title: 'Administrators' };
  }
  if (pathname.startsWith('/structure')) {
    return { group: 'Academic', title: 'Academic Structure' };
  }
  if (pathname.startsWith('/subjects')) {
    return { group: 'Academic', title: 'Subjects Directory' };
  }
  if (pathname.startsWith('/materials')) {
    return { group: 'Content', title: 'Study Materials' };
  }
  if (pathname.startsWith('/interviews')) {
    return { group: 'Content', title: 'Interview Experiences' };
  }
  if (pathname.startsWith('/announcements')) {
    return { group: 'Content', title: 'Announcements' };
  }
  if (pathname.startsWith('/security')) {
    return { group: 'System', title: 'Security & Access' };
  }
  return { group: 'Admin', title: 'Control Center' };
};

export const AdminHeader = ({
  admin,
  onOpenMobileMenu,
  onOpenSecurityDrawer,
  toggleTheme,
  isDark,
  onLogout
}) => {
  const location = useLocation();
  const { group, title } = getBreadcrumb(location.pathname);
  const isSuper = isSuperAdmin(admin);

  return (
    <header className="h-14 w-full sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur border-b border-gray-200 dark:border-zinc-800/80 select-none">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 dark:text-zinc-500 font-medium">
            {group}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm tracking-tight">
            {title}
          </h1>
        </nav>
      </div>

      {/* Right: Quick Operator Actions */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs">
        {/* Active Sessions Audit Trigger */}
        <button
          type="button"
          onClick={onOpenSecurityDrawer}
          title="Audit active administrative login sessions"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="hidden sm:inline">Sessions</span>
        </button>

        {/* Theme Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 transition-colors"
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-zinc-600" />
          )}
        </button>

        <span className="hidden sm:inline-block w-px h-4 bg-zinc-200 dark:bg-zinc-800" />

        {/* Admin Quick Identity Pill */}
        <div className="hidden md:flex items-center gap-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300 max-w-[150px] truncate">
            {admin?.name || admin?.email || 'Admin'}
          </span>
          {isSuper ? (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
              SUPER
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {admin?.department?.shortName || 'ADMIN'}
            </span>
          )}
        </div>

        {/* Logout Link */}
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;

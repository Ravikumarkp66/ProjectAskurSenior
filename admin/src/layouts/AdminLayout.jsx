import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/Logo';
import { Moon, Sun, Shield, Menu, X, Users, BookOpen, FileText, Lock, ShieldAlert, LogOut } from 'lucide-react';
import MySecurityDrawer from '../components/admin/MySecurityDrawer';
import { hasPermission, isSuperAdmin } from '../utils/permissions';

export const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSecurityDrawerOpen, setIsSecurityDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Determine permission for each module
  const canViewUsers = hasPermission(admin, 'users', 'view');
  const canViewSubjects = hasPermission(admin, 'subjects', 'view');
  const canViewMaterials = hasPermission(admin, 'materials', 'view');
  const isSuper = isSuperAdmin(admin);

  // Compute first allowed route
  const firstAllowedRoute = canViewUsers
    ? '/users'
    : canViewSubjects
    ? '/subjects'
    : canViewMaterials
    ? '/materials'
    : isSuper
    ? '/admins'
    : '/login';

  // Build active navigation tabs based on explicit permissions
  const navTabs = [];
  if (canViewUsers) {
    navTabs.push({ key: 'users', to: '/users', label: 'USERS', icon: Users });
  }
  if (canViewSubjects) {
    navTabs.push({ key: 'subjects', to: '/subjects', label: 'SUBJECTS', icon: BookOpen });
  }
  if (canViewMaterials) {
    navTabs.push({ key: 'materials', to: '/materials', label: 'MATERIALS', icon: FileText });
  }

  // Un-implemented modules
  navTabs.push({ key: 'community', label: 'COMMUNITY', disabled: true });
  navTabs.push({ key: 'ai', label: 'AI', disabled: true });

  if (isSuper) {
    navTabs.push({ key: 'admins', to: '/admins', label: 'ADMINS', icon: Lock });
    navTabs.push({ key: 'security', to: '/security', label: 'SECURITY', icon: ShieldAlert });
  }

  navTabs.push({ key: 'system', label: 'SYSTEM', disabled: true });

  // If current path is unpermitted, redirect to first allowed route
  const currentPath = location.pathname;
  if (currentPath === '/users' && !canViewUsers) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  if (currentPath === '/subjects' && !canViewSubjects) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  if (currentPath === '/materials' && !canViewMaterials) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  if ((currentPath === '/admins' || currentPath === '/security') && !isSuper) {
    return <Navigate to={firstAllowedRoute} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb] text-gray-900 dark:bg-[#121212] dark:text-gray-100 font-sans">
      <MySecurityDrawer
        isOpen={isSecurityDrawerOpen}
        onClose={() => setIsSecurityDrawerOpen(false)}
      />

      {/* Mobile Navigation Drawer Backdrop & Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Navigation Drawer Side Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-zinc-800 flex flex-col justify-between p-4 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4">
          {/* Drawer Header: Logo + Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
            <Link to={firstAllowedRoute} onClick={closeMobileMenu} className="inline-flex items-center gap-2">
              <Logo size={28} showText={true} textClassName="text-base" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Admin
              </span>
            </Link>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
              aria-label="Close mobile menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin User Info Card in Mobile Drawer */}
          <div className="p-2.5 rounded-md bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 text-xs">
            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {admin?.name || admin?.email || 'Administrator'}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {(admin?.isSuperAdmin || admin?.role === 'SUPER_ADMIN') ? (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded dark:bg-purple-950/60 dark:text-purple-300">
                  SUPER ADMIN
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-semibold rounded dark:bg-zinc-800 dark:text-zinc-300">
                  ADMIN{admin?.department?.shortName ? ` (${admin.department.shortName})` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links (Filtered by permissions) */}
          <div className="space-y-1 font-semibold text-xs tracking-wider uppercase">
            {navTabs.filter(t => !t.disabled).map((tab) => {
              const IconComp = tab.icon;
              return (
                <NavLink
                  key={tab.key}
                  to={tab.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/40 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  {IconComp && <IconComp className="w-4 h-4" />}
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="pt-3 border-t border-gray-200 dark:border-zinc-800 space-y-2">
          <button
            type="button"
            onClick={() => {
              closeMobileMenu();
              setIsSecurityDrawerOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700"
          >
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Active Sessions</span>
          </button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300"
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-gray-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                closeMobileMenu();
                handleLogout();
              }}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Top Header - Compact CSES Academic Layout */}
      <header className="w-full border-b border-gray-200 bg-white px-3 py-2 sm:px-6 dark:border-zinc-800 dark:bg-[#121212] sticky top-0 z-30">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-2">
          {/* Top Left: Hamburger Button (Mobile/Tablet) + Logo & Admin Portal Label */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to={firstAllowedRoute} className="inline-flex items-center">
              <Logo size={30} showText={true} textClassName="text-sm sm:text-base md:text-lg" />
            </Link>
            <span className="hidden xs:inline-block border-l border-gray-300 dark:border-zinc-700 pl-2 sm:pl-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 select-none">
              Admin Portal
            </span>
          </div>

          {/* Top Right: User Email, Theme Toggle & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs font-mono">
            <span className="hidden md:inline-block text-gray-600 dark:text-gray-400 font-mono">
              {admin?.name || admin?.email || 'Administrator'}
              {(admin?.isSuperAdmin || admin?.role === 'SUPER_ADMIN') ? (
                <span className="ml-1.5 px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] font-bold rounded dark:bg-purple-950/60 dark:text-purple-300">
                  SUPER ADMIN
                </span>
              ) : (
                <span className="ml-1.5 px-1.5 py-0.2 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded dark:bg-zinc-800 dark:text-zinc-300">
                  ADMIN{admin?.department?.shortName ? ` (${admin.department.shortName})` : ''}
                </span>
              )}
            </span>

            {/* Self-service security history trigger */}
            <button
              type="button"
              onClick={() => setIsSecurityDrawerOpen(true)}
              title="View my active session & login history"
              className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-1.5 sm:px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900"
            >
              <Shield className="w-3 h-3 text-blue-500" />
              <span className="hidden sm:inline">Sessions</span>
            </button>

            <span className="hidden sm:inline-block text-gray-300 dark:text-zinc-700 font-sans">|</span>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="hidden sm:inline-flex items-center gap-1 rounded-none border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-zinc-800 font-sans"
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

            <span className="hidden sm:inline-block text-gray-300 dark:text-zinc-700 font-sans">|</span>

            {/* Logout Link */}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-block text-red-600 hover:underline dark:text-red-400 font-medium font-sans"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main CSES Horizontal Navigation Bar (Scrollable on smaller screens) */}
      <nav className="w-full border-b border-gray-200 bg-white px-3 py-1.5 sm:px-6 dark:border-zinc-800 dark:bg-[#121212] overflow-x-auto scrollbar-none">
        <div className="mx-auto flex max-w-[1280px] min-w-max items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {navTabs.map((tab, idx) => (
            <React.Fragment key={tab.key}>
              {idx > 0 && <span className="text-gray-300 dark:text-zinc-700">|</span>}

              {tab.disabled ? (
                <span
                  className="text-gray-400 dark:text-zinc-600 cursor-not-allowed select-none"
                  title="Module not yet implemented"
                >
                  {tab.label}
                </span>
              ) : (
                <NavLink
                  to={tab.to}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-blue-600 underline underline-offset-4 font-bold dark:text-blue-400'
                      : 'hover:text-blue-600 dark:hover:text-blue-400'
                  }
                >
                  {tab.label}
                </NavLink>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Main CSES Content Area - Full 1280px Width */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-3 sm:px-6 py-3 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;


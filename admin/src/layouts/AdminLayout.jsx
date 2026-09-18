import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTheme } from '../context/ThemeContext';
import MySecurityDrawer from '../components/admin/MySecurityDrawer';
import { hasPermission, isSuperAdmin } from '../utils/permissions';
import AdminSidebar from '../components/navigation/AdminSidebar';
import AdminHeader from '../components/navigation/AdminHeader';

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
  const canViewStructure = isSuperAdmin(admin) || hasPermission(admin, 'academic_structure', 'view');
  const canViewSubjects = hasPermission(admin, 'subjects', 'view');
  const canViewMaterials = hasPermission(admin, 'materials', 'view');
  const canViewInterviews = isSuperAdmin(admin) || hasPermission(admin, 'interviews', 'view');
  const canViewAnnouncements = isSuperAdmin(admin) || hasPermission(admin, 'announcements', 'view');
  const isSuper = isSuperAdmin(admin);

  // Compute first allowed route
  const firstAllowedRoute = canViewUsers
    ? '/users'
    : canViewStructure
    ? '/structure'
    : canViewSubjects
    ? '/subjects'
    : canViewMaterials
    ? '/materials'
    : canViewInterviews
    ? '/interviews'
    : isSuper
    ? '/admins'
    : '/login';

  // Guard unpermitted routes and redirect safely
  const currentPath = location.pathname;
  if (currentPath === '/users' && !canViewUsers) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  if (currentPath === '/structure' && !canViewStructure) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  if (currentPath === '/subjects' && !canViewSubjects) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  if (currentPath === '/materials' && !canViewMaterials) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  if (currentPath === '/interviews' && !canViewInterviews) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  if (currentPath === '/announcements' && !canViewAnnouncements) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  const canViewEvaluation = isSuper || canViewSubjects || canViewStructure;
  if ((currentPath === '/evaluation-groups' || currentPath === '/evaluation-rules') && !canViewEvaluation) {
    return <Navigate to={firstAllowedRoute} replace />;
  }
  if ((currentPath === '/admins' || currentPath === '/security') && !isSuper) {
    return <Navigate to={firstAllowedRoute} replace />;
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-gray-900 dark:bg-[#09090b] dark:text-gray-100 font-sans antialiased">
      {/* Active Administrative Sessions Audit Drawer */}
      <MySecurityDrawer
        isOpen={isSecurityDrawerOpen}
        onClose={() => setIsSecurityDrawerOpen(false)}
      />

      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar
          admin={admin}
          onLogout={handleLogout}
          onOpenSecurityDrawer={() => setIsSecurityDrawerOpen(true)}
          onCloseMobile={closeMobileMenu}
          isMobile={true}
        />
      </div>

      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
        <AdminSidebar
          admin={admin}
          onLogout={handleLogout}
          onOpenSecurityDrawer={() => setIsSecurityDrawerOpen(true)}
        />
      </div>

      {/* Main Layout Area: Header + Scrollable Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminHeader
          admin={admin}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSecurityDrawer={() => setIsSecurityDrawerOpen(true)}
          toggleTheme={toggleTheme}
          isDark={isDark}
          onLogout={handleLogout}
        />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

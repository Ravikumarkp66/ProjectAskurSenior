import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Logo } from '../Logo';
import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  BookOpen,
  ScrollText,
  FileText,
  Briefcase,
  Megaphone,
  FileEdit,
  Newspaper,
  KeyRound,
  Sparkles,
  Layers,
  CreditCard,
  Receipt,
  BarChart3,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { hasPermission, isSuperAdmin } from '../../utils/permissions';

/**
 * Modern Linear/Vercel-inspired Admin Sidebar Navigation
 */
export const AdminSidebar = ({
  admin,
  onLogout,
  onOpenSecurityDrawer,
  onCloseMobile,
  isMobile = false
}) => {
  const location = useLocation();
  const isSuper = isSuperAdmin(admin);

  // Permission evaluation for active modules
  const canViewUsers = hasPermission(admin, 'users', 'view');
  const canViewStructure = isSuper || hasPermission(admin, 'academic_structure', 'view');
  const canViewSubjects = hasPermission(admin, 'subjects', 'view');
  const canViewEvaluationGroups = isSuper || canViewSubjects || canViewStructure;
  const canViewMaterials = hasPermission(admin, 'materials', 'view');
  const canViewInterviews = isSuper || hasPermission(admin, 'interviews', 'view');
  const canViewAnnouncements = isSuper || hasPermission(admin, 'announcements', 'view');

  // Navigation Group Definitions
  const navigationGroups = [
    {
      title: 'OVERVIEW',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          to: '/dashboard',
          icon: LayoutDashboard,
          visible: true,
          badge: null
        }
      ]
    },
    {
      title: 'USERS',
      items: [
        {
          key: 'users',
          label: 'Users',
          to: '/users',
          icon: Users,
          visible: canViewUsers,
          badge: null
        },
        {
          key: 'admins',
          label: 'Admins',
          to: '/admins',
          icon: Shield,
          visible: isSuper,
          badge: null
        }
      ]
    },
    {
      title: 'ACADEMIC',
      items: [
        {
          key: 'structure',
          label: 'Structure',
          to: '/structure',
          icon: Building2,
          visible: canViewStructure,
          badge: null
        },
        {
          key: 'subjects',
          label: 'Subjects',
          to: '/subjects',
          icon: BookOpen,
          visible: canViewSubjects,
          badge: null
        },
        {
          key: 'evaluation-groups',
          label: 'Evaluation Groups',
          to: '/evaluation-groups',
          icon: Layers,
          visible: canViewEvaluationGroups,
          badge: null
        },
        {
          key: 'evaluation-rules',
          label: 'Evaluation Rules',
          to: '/evaluation-rules',
          icon: ScrollText,
          visible: canViewEvaluationGroups,
          badge: null
        }
      ]
    },
    {
      title: 'CONTENT',
      items: [
        {
          key: 'materials',
          label: 'Materials',
          to: '/materials',
          icon: FileText,
          visible: canViewMaterials,
          badge: null
        },
        {
          key: 'interviews',
          label: 'Interviews',
          to: '/interviews',
          icon: Briefcase,
          visible: canViewInterviews,
          badge: null
        },
        {
          key: 'announcements',
          label: 'Announcements',
          to: '/announcements',
          icon: Megaphone,
          visible: canViewAnnouncements,
          badge: null
        },
        {
          key: 'editorials',
          label: 'Editorials',
          to: null,
          icon: FileEdit,
          visible: true,
          badge: 'Soon',
          disabled: true
        },
        {
          key: 'blogs',
          label: 'Blogs',
          to: null,
          icon: Newspaper,
          visible: true,
          badge: 'Soon',
          disabled: true
        }
      ]
    },
    {
      title: 'PLUS',
      items: [
        {
          key: 'plus-access',
          label: 'Access',
          to: '/users',
          icon: KeyRound,
          visible: true,
          badge: null
        },
        {
          key: 'plus-features',
          label: 'Features',
          to: '/features',
          icon: Sparkles,
          visible: true,
          badge: null
        },
        {
          key: 'plus-plans',
          label: 'Plans',
          to: null,
          icon: Layers,
          visible: true,
          badge: 'Soon',
          disabled: true
        },
        {
          key: 'plus-subscriptions',
          label: 'Subscriptions',
          to: null,
          icon: CreditCard,
          visible: true,
          badge: 'Soon',
          disabled: true
        },
        {
          key: 'plus-payments',
          label: 'Payments',
          to: null,
          icon: Receipt,
          visible: true,
          badge: 'Soon',
          disabled: true
        }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        {
          key: 'analytics',
          label: 'Analytics',
          to: null,
          icon: BarChart3,
          visible: true,
          badge: 'Soon',
          disabled: true
        },
        {
          key: 'reports',
          label: 'Reports',
          to: null,
          icon: FileSpreadsheet,
          visible: true,
          badge: 'Soon',
          disabled: true
        },
        {
          key: 'security',
          label: 'Security',
          to: '/security',
          icon: ShieldAlert,
          visible: isSuper,
          badge: null
        },
        {
          key: 'settings',
          label: 'Settings',
          to: null,
          icon: Settings,
          visible: true,
          onClick: onOpenSecurityDrawer,
          badge: 'Sessions'
        }
      ]
    }
  ];

  return (
    <aside
      className={`flex flex-col h-full bg-white dark:bg-[#111113] border-r border-gray-200 dark:border-zinc-800/80 select-none ${
        isMobile ? 'w-full' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-zinc-800/80">
        <Link
          to="/dashboard"
          onClick={onCloseMobile}
          className="inline-flex items-center gap-2.5 group"
        >
          <Logo size={24} showText={true} textClassName="text-base font-bold tracking-tight" />
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-zinc-100 text-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
            Admin
          </span>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.visible !== false);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <div className="px-2 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                {group.title}
              </div>

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const IconComp = item.icon;

                  // Disabled / Coming Soon items
                  if (item.disabled) {
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-75"
                        title={`${item.label} (Coming Soon)`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {IconComp && <IconComp className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-600" />}
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold tracking-wide bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-500 border border-zinc-200/50 dark:border-zinc-700/40">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    );
                  }

                  // Clickable Action items (e.g. Settings opening drawer)
                  if (item.onClick) {
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          if (onCloseMobile) onCloseMobile();
                          item.onClick();
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {IconComp && <IconComp className="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400" />}
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold tracking-wide bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  }

                  // Active NavLink routes
                  const isActive =
                    item.to === '/dashboard'
                      ? location.pathname === '/dashboard' || location.pathname === '/overview'
                      : location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      onClick={onCloseMobile}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-zinc-800/90 dark:text-white dark:border-l-2 dark:border-blue-500 pl-2'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {IconComp && (
                          <IconComp
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-zinc-500 dark:text-zinc-400'
                            }`}
                          />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold tracking-wide bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Profile Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-[#0d0d0f]/60">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                {admin?.name || 'Administrator'}
              </span>
              {isSuper ? (
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 shrink-0">
                  SUPER
                </span>
              ) : (
                <span className="px-1.5 py-0.2 text-[9px] font-medium rounded bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                  ADMIN{admin?.department?.shortName ? ` (${admin.department.shortName})` : ''}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {admin?.email || ''}
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Sign out of Admin Portal"
            className="p-1.5 rounded-md text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

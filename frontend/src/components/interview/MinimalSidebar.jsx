import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, LayoutDashboard, Briefcase, User, LogOut, Settings } from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../utils/hooks';

const MinimalSidebar = () => {
    const { logout } = useAuth();
    
    const navItems = [
        { icon: Home, path: '/', label: 'Home' },
        { icon: Briefcase, path: '/interview', label: 'Interview Experiences' },
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[72px] bg-[#0a0a0b] border-r border-white/5 flex flex-col items-center py-8 z-50">
            {/* Logo */}
            <div className="mb-10">
                <Link to="/">
                    <Logo size="xs" />
                </Link>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col gap-6">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => 
                                `group relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                                    isActive 
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 opacity-100' 
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            <Icon size={22} />
                            {/* Tooltip */}
                            <div className="absolute left-[calc(100%+12px)] px-3 py-1.5 rounded-lg bg-[#141416] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap z-50">
                                {item.label}
                                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#141416] border-l border-b border-white/10 rotate-45"></div>
                            </div>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Section Empty per request */}
            <div className="mt-auto"></div>

        </aside>
    );
};

export default MinimalSidebar;

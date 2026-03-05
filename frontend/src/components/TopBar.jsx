import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const TopBar = ({ progress, branch, sidebarCollapsed = false, theme = 'dark', onMenuClick }) => {
    const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0));
    const isLightMode = theme === 'light';
    const navigate = useNavigate();
    return (
        <div
            className={`fixed top-0 right-0 shadow-lg z-10 transition-all duration-300 
                ${sidebarCollapsed ? 'left-0 sm:left-20' : 'left-0 sm:left-64'}
                ${isLightMode ? 'bg-white border-b border-slate-200' : 'bg-[#0F172A] border-b border-[#1E293B]'}`}
        >
            <div className="px-4 sm:px-6 py-4 pl-16 sm:pl-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onMenuClick}
                            className={`p-2 rounded-lg sm:hidden transition-colors ${isLightMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <Logo size="sm" />
                        <div>
                            <p className={`${isLightMode ? 'text-slate-500' : 'text-[#94A3B8]'} text-xs mt-0.5`}>Overall Progress</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${isLightMode
                                ? 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                : 'text-slate-400 hover:bg-slate-800 border border-white/5'
                                }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Home
                        </button>
                    </div>
                </div>

                <div className="mt-3">
                    <div className="relative">
                        <div className={`h-3 rounded-full overflow-hidden ${isLightMode ? 'bg-slate-200' : 'bg-[#1E293B]'}`}>
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isLightMode ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-[#38BDF8]'
                                    }`}
                                style={{ width: `${safeProgress}%`, transition: 'width 0.3s ease-out' }}
                            />
                        </div>

                        <div
                            className="absolute -top-6"
                            style={{ left: `${safeProgress}%`, transform: 'translateX(-50%)' }}
                        >
                            <span className={`text-xs font-semibold ${isLightMode ? 'text-slate-900' : 'text-[#E5E7EB]'}`}>
                                {Math.round(safeProgress)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;

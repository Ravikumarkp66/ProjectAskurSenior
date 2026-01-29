import React from 'react';

const TopBar = ({ progress, branch, sidebarCollapsed = false, theme = 'dark' }) => {
    const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0));
    const isLightMode = theme === 'light';
    return (
        <div
            className={`fixed top-0 right-0 left-0 sm:right-0 shadow-lg z-10 transition-all duration-300 ${
                sidebarCollapsed ? 'sm:left-20' : 'sm:left-64'
            } ${isLightMode ? 'bg-white border-b border-slate-200' : 'bg-[#0F172A] border-b border-[#1E293B]'}`}
        >
            <div className="px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className={`text-lg sm:text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-[#E5E7EB]'}`}>ASK+ A2Z Sheet</h2>
                        <p className={`${isLightMode ? 'text-slate-500' : 'text-[#94A3B8]'} text-sm sm:text-xs mt-0.5`}>Overall Progress</p>
                    </div>
                </div>

                <div className="mt-3">
                    <div className="relative">
                        <div className={`h-3 rounded-full overflow-hidden ${isLightMode ? 'bg-slate-200' : 'bg-[#1E293B]'}`}>
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    isLightMode ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-[#38BDF8]'
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

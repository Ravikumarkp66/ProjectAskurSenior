import React from 'react';

const AnalyticsCard = ({ icon: Icon, label, value, trend, isLoading, isLightMode, color = 'purple' }) => {
    const colorSchemes = {
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', lightBg: 'bg-purple-50' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', lightBg: 'bg-blue-50' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', lightBg: 'bg-emerald-50' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', lightBg: 'bg-amber-50' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', lightBg: 'bg-indigo-50' },
        rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', lightBg: 'bg-rose-50' }
    };

    const scheme = colorSchemes[color] || colorSchemes.purple;

    return (
        <div className={`rounded-2xl border p-5 ${isLightMode
            ? 'bg-white border-slate-200'
            : 'bg-dark-100 border-white/5 shadow-2xl shadow-black/20'
            } transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}>

            <div className="flex items-center gap-4 mb-4">
                <div className={`p-2.5 rounded-xl ${isLightMode ? scheme.lightBg : scheme.bg} ${scheme.text}`}>
                    {Icon && <Icon className="w-5 h-5" />}
                </div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {label}
                </p>
            </div>

            {isLoading ? (
                <div className="mt-2 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ) : (
                <>
                    <p className={`text-3xl font-bold mt-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {trend && (
                        <p className={`text-xs mt-2 ${trend >= 0
                            ? isLightMode ? 'text-green-600' : 'text-green-400'
                            : isLightMode ? 'text-red-600' : 'text-red-400'
                            }`}>
                            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

export default React.memo(AnalyticsCard);

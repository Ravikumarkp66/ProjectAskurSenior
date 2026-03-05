import React from 'react';

const AnalyticsCard = ({ icon: Icon, label, value, trend, isLoading, isLightMode }) => {
    return (
        <div className={`rounded-xl border p-6 ${isLightMode
            ? 'bg-white border-slate-200 hover:border-purple-300'
            : 'bg-dark-100 border-white/10 hover:border-purple-500/30'
            } transition shadow-sm hover:shadow-md`}>

            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${isLightMode
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-purple-500/10 text-purple-400'
                    }`}>
                    {Icon && <Icon className="w-6 h-6" />}
                </div>
            </div>

            <p className={`text-sm font-medium ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>
                {label}
            </p>

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

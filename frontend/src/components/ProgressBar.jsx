import React from 'react';

const ProgressBar = ({ progress = 0, height = 6, className = '', theme = 'light' }) => {
    const clamped = Math.min(100, Math.max(0, progress));
    const isLightMode = theme === 'light';

    return (
        <div
            className={`w-full rounded-full overflow-hidden ${isLightMode ? 'bg-slate-200' : 'bg-[#1E293B]'} ${className}`}
            style={{ height }}
        >
            <div
                className={`h-full ${
                    isLightMode ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-[#38BDF8]'
                }`}
                style={{ width: `${clamped}%`, transition: 'width 0.3s ease-out' }}
            />
        </div>
    );
};

export default ProgressBar;

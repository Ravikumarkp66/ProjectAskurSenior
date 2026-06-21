import React from 'react';

// Inline SVG logo — no network request, crisp at all sizes
// A stroke: white (#FFFFFF) | S strokes: purple (#8B5CF6)
const ASLogo = ({ size = 32, className = '', strokeColor }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ flexShrink: 0 }}
        aria-label="AskUrSenior logo"
    >
        {/* A — uses theme text color (white in dark, black in light) */}
        <path
            d="M105 380L205 205C220 180 240 170 270 170H405"
            stroke={strokeColor || "var(--theme-text)"}
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        {/* S — purple */}
        <path
            d="M405 170H290C250 170 220 200 220 240C220 280 250 310 290 310H345"
            stroke="#8B5CF6"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M285 240H360C400 240 430 270 430 310C430 350 400 380 360 380H210"
            stroke="#8B5CF6"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const Logo = ({ className = '', size = 'md', showText = true }) => {
    const sizes = {
        sm: { px: 52, text: 'text-lg' },
        md: { px: 60, text: 'text-xl' },
        lg: { px: 72, text: 'text-3xl' },
        xl: { px: 84, text: 'text-4xl' },
    };

    const config = sizes[size] || sizes.md;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <ASLogo size={config.px} className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />

            {showText && (
                <span
                    style={{
                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        fontSize: config.text === 'text-lg' ? '1.15rem'
                            : config.text === 'text-xl' ? '1.3rem'
                            : config.text === 'text-3xl' ? '1.875rem'
                            : '2.25rem',
                    }}
                    className="text-white drop-shadow-sm select-none"
                >
                    <span style={{ color: 'var(--theme-text)' }}>Ask</span><span style={{ color: '#8B5CF6' }}>UR</span><span style={{ color: 'var(--theme-text)' }}>Senior</span>
                </span>
            )}
        </div>
    );
};

export { ASLogo };
export default Logo;

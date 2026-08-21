import React from 'react';

/**
 * ASLogo — Minimal, responsive & crisp SVG monogram logo for AskUrSenior
 */
/**
 * ASLogo — Minimal, responsive & crisp SVG monogram logo for AskUrSenior
 */
const ASLogo = React.memo(({
    size = 32,
    className = "",
    strokeColor,
    primaryColor = "currentColor",
    accentColor = "#8B5CF6",
    style = {},
    ...props
}) => {
    const sColor = strokeColor || (primaryColor === "currentColor" ? "var(--text-primary, #FFFFFF)" : primaryColor);
    const sizePx = typeof size === 'number' ? size : 32;

    return (
        <svg
            width={sizePx}
            height={sizePx}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ flexShrink: 0, transition: 'opacity 0.15s, filter 0.15s', ...style }}
            aria-label="AskUrSenior logo"
            {...props}
        >
            {/* 'A' stroke */}
            <path
                d="M105 380L205 205C220 180 240 170 270 170H405"
                stroke={sColor}
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* 'S' top curve */}
            <path
                d="M405 170H290C250 170 220 200 220 240C220 280 250 310 290 310H345"
                stroke={accentColor}
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* 'S' bottom curve */}
            <path
                d="M285 240H360C400 240 430 270 430 310C430 350 400 380 360 380H210"
                stroke={accentColor}
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
});

ASLogo.displayName = 'ASLogo';

/**
 * Logo — Main brand component (Monogram + optional wordmark)
 * Supports `showText`, `withText`, and `textClassName` props for flexible responsive usage.
 */
const Logo = React.memo(({
    className = '',
    textClassName = '',
    size = 'md',
    showText = true,
    withText,
    primaryColor = "currentColor",
    accentColor = "#8B5CF6",
    onClick,
    ...props
}) => {
    const isTextVisible = withText !== undefined ? withText : showText;

    const sizeConfigs = {
        sm: { px: 40, fontSize: '1.15rem' },
        md: { px: 48, fontSize: '1.3rem' },
        lg: { px: 60, fontSize: '1.875rem' },
        xl: { px: 76, fontSize: '2.25rem' },
    };

    const config = typeof size === 'string' && sizeConfigs[size]
        ? sizeConfigs[size]
        : { px: typeof size === 'number' ? size : 48, fontSize: '1.3rem' };

    const handleNavigate = (e) => {
        if (onClick) {
            onClick(e);
        } else {
            window.location.href = '/';
        }
    };

    return (
        <div
            onClick={handleNavigate}
            style={{ cursor: 'pointer' }}
            className={`flex items-center gap-2.5 ${className}`}
            {...props}
        >
            <ASLogo
                size={config.px}
                primaryColor={primaryColor}
                accentColor={accentColor}
                className="drop-shadow-[0_0_8px_rgba(139,92,246,0.45)] text-white"
            />

            {isTextVisible && (
                <span
                    style={{
                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                        fontWeight: 700,
                        letterSpacing: '-0.025em',
                        lineHeight: 1,
                        fontSize: config.fontSize,
                    }}
                    className={`text-white drop-shadow-sm select-none ${textClassName}`}
                >
                    <span style={{ color: primaryColor === 'currentColor' ? 'var(--theme-text, #FFFFFF)' : primaryColor }}>Ask</span>
                    <span style={{ color: accentColor }}>UR</span>
                    <span style={{ color: primaryColor === 'currentColor' ? 'var(--theme-text, #FFFFFF)' : primaryColor }}>Senior</span>
                </span>
            )}
        </div>
    );
});

Logo.displayName = 'Logo';

export { ASLogo, Logo };
export default Logo;

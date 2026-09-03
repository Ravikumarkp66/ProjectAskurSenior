import React from 'react';

export const ASMonogram = React.memo(({
  size = 36,
  className = '',
  primaryColor = 'currentColor',
  accentColor = '#2563eb', // Clean blue accent
  style = {},
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-label="AskUrSenior logo"
      {...props}
    >
      {/* 'A' stroke */}
      <path
        d="M105 380L205 205C220 180 240 170 270 170H405"
        stroke={primaryColor}
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 'S' top curve */}
      <path
        d="M405 170H290C250 170 220 200 220 240C220 280 250 310 290 310H345"
        stroke={accentColor}
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 'S' bottom curve */}
      <path
        d="M285 240H360C400 240 430 270 430 310C430 350 400 380 360 380H210"
        stroke={accentColor}
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

ASMonogram.displayName = 'ASMonogram';

export const Logo = React.memo(({
  className = '',
  size = 36,
  showText = true,
  textClassName = '',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <ASMonogram
        size={size}
        primaryColor="currentColor"
        accentColor="#2563eb"
        className="text-gray-900 dark:text-gray-100"
      />
      {showText && (
        <span
          className={`font-bold tracking-tight text-lg sm:text-xl text-gray-900 dark:text-gray-100 flex items-center ${textClassName}`}
        >
          <span>Ask</span>
          <span className="text-blue-600 dark:text-blue-500">UR</span>
          <span>Senior</span>
        </span>
      )}
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;

import React from 'react';

const Logo = ({ className = '', size = 'md', showText = true }) => {
    const sizes = {
        sm: { icon: 20, font: 'text-lg' },
        md: { icon: 24, font: 'text-xl' },
        lg: { icon: 32, font: 'text-2xl' },
        xl: { icon: 48, font: 'text-4xl' }
    };

    const config = sizes[size] || sizes.md;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Logo Icon */}
            <div className="relative flex-shrink-0" style={{ width: config.icon * 1.5, height: config.icon }}>
                <svg
                    viewBox="0 0 45 30"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    {/* Speech Bubble Tail for 'A' */}
                    <path
                        d="M10 25L5 30V25H10Z"
                        className="fill-indigo-500"
                    />
                    {/* Stylized 'A' */}
                    <path
                        d="M5 5L15 5V25H5V5Z"
                        className="fill-indigo-600"
                    />
                    <path
                        d="M15 15H20V25H15V15Z"
                        className="fill-indigo-400"
                    />

                    {/* Stylized 'S' with Graduation Cap */}
                    <path
                        d="M25 15H35V20H25V25H35V30H20V10H35V15H25Z"
                        className="fill-red-600"
                    />

                    {/* Graduation Cap on 'S' */}
                    <path
                        d="M20 10L27.5 5L35 10L27.5 15L20 10Z"
                        className="fill-gray-900"
                    />
                    <path
                        d="M35 10V14"
                        stroke="#000"
                        strokeWidth="1"
                    />
                </svg>
            </div>

            {/* Logo Text */}
            {showText && (
                <div className="flex flex-col">
                    <span className={`font-bold tracking-tight leading-none ${config.font} text-white`}>
                        AskUrSenior
                    </span>
                    <div className="h-1 w-full bg-gradient-to-r from-red-600 to-transparent mt-1" />
                </div>
            )}
        </div>
    );
};

export default Logo;

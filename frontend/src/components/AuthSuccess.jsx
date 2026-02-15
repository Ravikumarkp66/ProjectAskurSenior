import React, { useEffect, useState } from 'react';
import { FaCheck } from 'react-icons/fa';

const AuthSuccess = ({ message = "Successfully logged in", submessage = "Redirecting in 1.5s...", onAnimationComplete }) => {
    const [seconds, setSeconds] = useState(1.5);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => (prev > 0 ? parseFloat((prev - 0.1).toFixed(1)) : 0));
        }, 100);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
            {/* Success Icon with Scale-up Animation */}
            <div className="relative mb-6 sm:mb-8 transform transition-transform duration-700 hover:scale-110">
                <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 rounded-full animate-pulse" />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 border-4 border-white/10 animate-scaleUp">
                    {/* Provided SVG Checkmark */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 256 256"
                        xmlSpace="preserve"
                        className="text-white drop-shadow-md sm:w-12 sm:h-12"
                    >
                        <g transform="translate(1.4 1.4) scale(2.81)">
                            <path
                                d="M 45 90 C 20.187 90 0 69.813 0 45 C 0 20.187 20.187 0 45 0 c 24.813 0 45 20.187 45 45 C 90 69.813 69.813 90 45 90 z"
                                style={{ fill: 'none' }}
                            />
                            <polygon
                                points="37.33,69.32 15.14,47.13 26.22,36.05 37.33,47.17 63.78,20.68 74.86,31.75"
                                style={{ fill: 'rgb(255,255,255)' }}
                            />
                        </g>
                    </svg>
                </div>
            </div>

            {/* Content with Slide-up Animation */}
            <div className="space-y-3 animate-slideUp">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Success!</h2>
                <p className="text-sm sm:text-base text-gray-400 font-medium px-4">{message}</p>
                <div className="flex items-center justify-center gap-2 pt-4 sm:pt-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 sm:ml-2">
                        {submessage} {seconds}s...
                    </span>
                </div>
            </div>

            {/* Glassmorphism Card Style is inherited from parent but we enhance here if needed */}
        </div>
    );
};

export default AuthSuccess;

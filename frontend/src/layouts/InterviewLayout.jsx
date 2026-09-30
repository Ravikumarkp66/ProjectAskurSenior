import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Home, ChevronLeft } from 'lucide-react';

const InterviewLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] text-slate-900 dark:text-[#e1e1e3] font-outfit relative transition-colors duration-200">
            {/* Minimal Floating Back to Home Button - Styled for better integration */}
            <div className="absolute top-8 left-6 z-50">
                <Link 
                    to="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm dark:shadow-none transition-all duration-300 group backdrop-blur-md"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <Home size={16} className="text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Back to Home</span>
                </Link>
            </div>

            {/* Main Content Area - Maximized Width */}
            <main className="w-full min-h-screen">
                {/* 
                    "Cards occupy entire page by giving just small space in the borders"
                    - Using max-w-full with small margins (px-4 to px-8)
                */}
                <div className="w-full max-w-[1700px] mx-auto px-4 md:px-8 py-20 pb-32">
                    <Outlet />
                </div>
            </main>

            {/* Subtle Footer */}
            <footer className="py-10 border-t border-slate-200 dark:border-white/5 text-center text-slate-400 dark:text-slate-600">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">ASK<span className="text-purple-600 dark:text-slate-400">+</span> SENIOR ACADEMICS</p>
            </footer>
        </div>
    );
};

export default InterviewLayout;

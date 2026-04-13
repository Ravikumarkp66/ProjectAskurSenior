import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Home, ChevronLeft } from 'lucide-react';

const InterviewLayout = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0b] text-[#e1e1e3] font-outfit relative">
            {/* Minimal Floating Back to Home Button - Styled for better integration */}
            <div className="absolute top-8 left-6 z-50">
                <Link 
                    to="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
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
            <footer className="py-10 border-t border-white/5 text-center text-slate-800">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">ASK<span className="text-slate-900">+</span> SENIOR ACADEMICS</p>
            </footer>
        </div>
    );
};

export default InterviewLayout;

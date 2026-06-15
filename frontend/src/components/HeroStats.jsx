import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate, useInView } from 'framer-motion';
import { FileText, Files, BookOpen, FolderArchive, Users, MessageCircle } from 'lucide-react';
import { apiClient } from '../services/api';

function AnimatedCounter({ value, duration = 2 }) {
    const ref = useRef(null);
    const count = useMotionValue(0);
    const [rounded, setRounded] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (!isInView) return;

        setIsComplete(false);
        const controls = animate(count, value, {
            duration: duration,
            ease: "easeOut",
            onUpdate: (latest) => {
                setRounded(Math.round(latest));
            },
            onComplete: () => {
                setIsComplete(true);
            }
        });
        return () => controls.stop();
    }, [value, duration, isInView]);

    const formatted = rounded.toLocaleString('en-US');

    return (
        <span ref={ref} className="relative inline-block">
            <motion.span
                animate={isComplete ? { scale: [1, 1.06, 1] } : {}}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className={`transition-all duration-500 ${isComplete ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-white drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]" : "text-white"}`}
            >
                {formatted}+
            </motion.span>
        </span>
    );
}

export default function HeroStats() {
    const [stats, setStats] = useState({
        notes: 4582,
        pyqs: 2143,
        questionBanks: 967,
        otherMaterials: 1321,
        users: 842,
        whatsapp: 1600
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/hero-stats');
                if (response.data) {
                    setStats({
                        notes: response.data.notes || 4582,
                        pyqs: response.data.pyqs || 2143,
                        questionBanks: response.data.questionBanks || 967,
                        otherMaterials: response.data.otherMaterials || 1321,
                        users: response.data.users || 842,
                        whatsapp: 1600
                    });
                }
            } catch (error) {
                console.error('Failed to fetch hero stats:', error);
            }
        };
        fetchStats();
    }, []);

    const statsConfig = [
        { label: "Notes", value: stats.notes, icon: FileText },
        { label: "PYQs", value: stats.pyqs, icon: Files },
        { label: "Question Banks", value: stats.questionBanks, icon: BookOpen },
        { label: "Other Materials", value: stats.otherMaterials, icon: FolderArchive },
        { label: "Total Users", value: stats.users, icon: Users },
        { label: "WhatsApp Community", value: stats.whatsapp, icon: MessageCircle }
    ];

    return (
        <div className="relative w-full max-w-7xl mx-auto px-1 z-20">
            {/* SVG Gradient definitions for icons */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="purple-blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" /> {/* purple-500 */}
                        <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
                    </linearGradient>
                </defs>
            </svg>

            {/* Main statistics container */}
            <div className="w-full bg-[#070b19]/45 border border-white/[0.08] backdrop-blur-[24px] rounded-3xl p-6 lg:p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-8 gap-x-4 shadow-[0_0_50px_rgba(139,92,246,0.06)] hover:border-purple-500/20 hover:shadow-[0_0_40px_rgba(139,92,246,0.08)] transition-all duration-500">
                {statsConfig.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div 
                            key={idx}
                            className="flex flex-col items-center text-center px-4 relative group hover:scale-[1.03] transition-all duration-300 cursor-default"
                        >
                            {/* Vertical Separator for Desktop */}
                            {idx < 5 && (
                                <div className="hidden lg:block absolute right-[-8px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                            )}
                            
                            {/* Icon Wrapper with subtle rotation on hover */}
                            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 mb-3 group-hover:border-purple-500/20 group-hover:bg-purple-500/5 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:-translate-y-0.5 transition-all duration-300">
                                <Icon 
                                    className="w-5 h-5 transition-transform duration-300 group-hover:rotate-6" 
                                    style={{ stroke: 'url(#purple-blue-gradient)' }} 
                                />
                            </div>

                            {/* Animated Number */}
                            <div className="text-xl md:text-2xl font-black text-white tracking-tight mb-1 select-all">
                                <AnimatedCounter value={stat.value} />
                            </div>

                            {/* Label */}
                            <div className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider uppercase">
                                {stat.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

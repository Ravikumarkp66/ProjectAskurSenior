import React from 'react';
import { motion } from 'framer-motion';

const IconButton = ({ icon: Icon, onClick, active, label, count, colorClass = "text-slate-400 group-hover:text-purple-400" }) => {
    return (
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="flex items-center gap-2 group outline-none"
        >
            <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-all duration-300 border border-transparent ${
                    active 
                    ? 'bg-purple-600/20 text-purple-400 border-purple-500/20 shadow-lg shadow-purple-900/20' 
                    : `bg-white/5 ${colorClass} hover:bg-white/10 hover:border-white/10`
                }`}
                title={label}
            >
                <Icon size={16} fill={active ? "currentColor" : "none"} />
            </motion.div>
            {count !== undefined && (
                <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-purple-400' : 'text-slate-500 group-hover:text-purple-400/80 transition-colors'}`}>
                    {count}
                </span>
            )}
        </button>
    );
};

export default IconButton;

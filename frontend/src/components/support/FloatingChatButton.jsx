import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

const FloatingChatButton = ({ onClick, isOpen }) => {
    return (
        <motion.button
            onClick={onClick}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
                relative flex items-center justify-center h-14 rounded-full
                bg-gradient-to-r from-purple-600 to-blue-600
                shadow-[0_0_20px_rgba(168,85,247,0.3)]
                border border-white/20 z-50
                transition-all duration-300
                ${isOpen ? 'w-14' : 'px-5'}
            `}
        >
            {/* Pulse Effect */}
            {!isOpen && (
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0, 0.3]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 rounded-full bg-purple-500/50"
                />
            )}
            
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <X className="w-6 h-6 text-white relative z-10" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="open"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-2 relative z-10"
                    >
                        <span className="text-xl">👨‍🎓</span>
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-white font-bold text-sm tracking-wide flex items-center gap-1">
                                ASK+ <Sparkles className="w-3 h-3 text-yellow-300" />
                            </span>
                        </div>
                        {/* Online Indicator */}
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-purple-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    </motion.div>
                )}
            </AnimatePresence>
            
        </motion.button>
    );
};

export default FloatingChatButton;

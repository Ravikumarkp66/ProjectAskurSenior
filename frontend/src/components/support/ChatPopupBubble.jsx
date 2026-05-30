import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';

const ChatPopupBubble = ({ onOpenChat, onClose, user }) => {
    const firstName = user?.name?.split(' ')[0] || 'there';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                className="absolute bottom-20 right-0 w-64 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-purple-500/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(168,85,247,0.25)] z-40 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-600/5" />
                
                {/* Close Button */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors hover:bg-white/10 rounded-full p-1 z-10"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                <div 
                    onClick={onOpenChat}
                    className="cursor-pointer group relative z-10"
                >
                    {/* Content */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-[1px] shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0 mt-1">
                            <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center text-xl">
                                👨‍🎓
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                            <p className="text-white text-sm font-medium">
                                Hi {firstName} 👋<br/>Need notes or guidance?
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatPopupBubble;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Check, CheckCheck } from 'lucide-react';

const ChatMessage = ({ messageId, message, senderType, seen, isDeleted, onDelete, timestamp }) => {
    const isAdmin = senderType === 'admin' || senderType === 'ai';
    const [isHovered, setIsHovered] = useState(false);

    const formatTime = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderFormattedText = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, i) => {
            if (!line.trim()) return <div key={`empty-${i}`} className="h-1.5"></div>;
            
            const isHeading = line.trim().match(/^[📖⚠✅💼🎓🚀💡📚]/);
            
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <div key={i} className={`mb-1 leading-relaxed ${isHeading ? 'font-bold text-base mt-3 mb-2 flex items-center gap-1.5 border-b border-white/10 pb-1.5' : ''}`}>
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className={`font-bold ${isAdmin ? 'text-white' : 'text-purple-100'}`}>{part.slice(2, -2)}</strong>;
                        }
                        return <span key={j}>{part}</span>;
                    })}
                </div>
            );
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`flex gap-3 w-full ${isAdmin ? 'justify-start' : 'justify-end'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isAdmin && (
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-[1px] shrink-0 mt-auto shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center text-sm">
                        👨‍🎓
                    </div>
                </div>
            )}
            
            <div className={`relative flex items-center gap-2 max-w-[85%] ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                <div
                    className={`
                        relative w-full rounded-2xl px-4 pt-3 pb-5 text-[15px]
                        ${isAdmin
                            ? 'bg-[#181824] border border-white/5 text-slate-200 rounded-bl-sm shadow-md pr-12' 
                            : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(168,85,247,0.25)] pr-16'
                        }
                    `}
                >
                    {isDeleted ? (
                        <div className="italic opacity-80 mb-1 leading-relaxed text-[13px]">🚫 This message was deleted</div>
                    ) : (
                        renderFormattedText(message)
                    )}

                    {/* Timestamp and Seen status */}
                    <div className={`absolute bottom-1 right-2 flex items-center gap-1 ${isAdmin ? 'opacity-60' : 'opacity-80'}`}>
                        {timestamp && (
                            <span className={`text-[10px] ${isAdmin ? 'text-slate-400' : 'text-blue-100'}`}>
                                {formatTime(timestamp)}
                            </span>
                        )}
                        {!isAdmin && (
                            seen ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" /> : <Check className="w-3.5 h-3.5 text-slate-300" />
                        )}
                    </div>
                </div>
                
                {/* Delete button for user messages */}
                {!isAdmin && onDelete && isHovered && (
                    <button 
                        onClick={() => onDelete(messageId)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded-full transition-colors opacity-0 hover:opacity-100 absolute -left-8 top-1/2 -translate-y-1/2"
                        style={{ opacity: isHovered ? 1 : 0 }}
                        title="Delete for me"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default ChatMessage;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Check, CheckCheck } from 'lucide-react';

const ChatMessage = ({ messageId, message, senderType, seen, onDelete }) => {
    const isAdmin = senderType === 'admin';
    const [isHovered, setIsHovered] = useState(false);

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
            
            <div className={`relative flex items-center gap-2 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                <div
                    className={`
                        relative max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed
                        ${isAdmin
                            ? 'bg-white/[0.05] border border-white/5 text-slate-200 rounded-bl-none shadow-sm' 
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(168,85,247,0.15)] pr-8'
                        }
                    `}
                >
                    {/* Render message handling potential newlines */}
                    {message.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i !== message.split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}

                    {/* Seen status for user messages */}
                    {!isAdmin && (
                        <div className="absolute bottom-1.5 right-2 opacity-80">
                            {seen ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                            ) : (
                                <Check className="w-3.5 h-3.5 text-slate-300" />
                            )}
                        </div>
                    )}
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

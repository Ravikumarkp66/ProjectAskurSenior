/* ═══════════════════════════════════════════════════════════════════
   MarketplaceChat Component
   Private 1-on-1 Conversation between Seller, Interested Buyer, and Admin
═══════════════════════════════════════════════════════════════════ */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Lock, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '../utils/marketplace.utils';

const MarketplaceChat = ({ item, currentUser, onSendMessage }) => {
    const [text, setText] = useState('');
    const messagesEndRef = useRef(null);

    const messages = item.messages || [];

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSendMessage(item.id, text.trim());
        setText('');
    };

    return (
        <div className="flex flex-col bg-[#0D1117] border border-[#21262D] rounded-2xl overflow-hidden h-[450px]">
            {/* Chat Top Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#161B22] border-b border-[#21262D]">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-[#E6EDF3]">Private Buyer & Seller Chat</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#8B949E] bg-[#21262D] px-2 py-0.5 rounded-full">
                    <Lock size={10} className="text-emerald-400" />
                    <span>Seller & Buyer Only</span>
                </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#8B949E]">
                        <Lock size={28} className="text-emerald-400/60 mb-2" />
                        <p className="text-xs font-semibold text-[#E6EDF3]">Start a private conversation</p>
                        <p className="text-[11px] mt-1 max-w-xs">
                            Ask questions, negotiate price, or arrange an offline campus meetup with the seller.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.senderId === currentUser.id;

                        return (
                            <div
                                key={msg.id || i}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#8B949E]">
                                    <span className="font-semibold text-[#E6EDF3]">{isMe ? 'You' : msg.senderName}</span>
                                    <span>·</span>
                                    <span>{formatRelativeTime(msg.timestamp)}</span>
                                </div>

                                <div
                                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                        isMe
                                            ? 'bg-emerald-600 text-white rounded-br-xs shadow-md shadow-emerald-600/10'
                                            : 'bg-[#161B22] border border-[#21262D] text-[#E6EDF3] rounded-bl-xs'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-[#161B22] border-t border-[#21262D] flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Type a message to seller..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="flex-1 bg-[#0D1117] border border-[#21262D] text-[#E6EDF3] text-xs sm:text-sm px-3.5 py-2 rounded-xl outline-none focus:border-emerald-500/50 transition-colors placeholder-[#8B949E]/50"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-all shadow-md shadow-emerald-600/20"
                >
                    <Send size={15} />
                </button>
            </form>
        </div>
    );
};

export default MarketplaceChat;

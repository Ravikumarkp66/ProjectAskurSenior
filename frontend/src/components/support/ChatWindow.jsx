import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Send, Sparkles, BookOpen, AlertTriangle, GraduationCap, ThumbsUp, ThumbsDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatMessage from './ChatMessage';
import MaterialCard from './MaterialCard';
import PdfPreviewModal from './PdfPreviewModal';
import MentorshipModal from './MentorshipModal';
import socket from '../../services/socket';

const ChatWindow = ({ isOpen, onClose, user }) => {
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [adminTyping, setAdminTyping] = useState(false);
    const [systemMessage, setSystemMessage] = useState(null);
    const [chatMode, setChatMode] = useState('ai'); // 'ai' or 'admin'
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [pendingAdminMessage, setPendingAdminMessage] = useState(null);
    const [previewMaterial, setPreviewMaterial] = useState(null);
    const [showMentorshipModal, setShowMentorshipModal] = useState(false);
    const [mentorshipTopic, setMentorshipTopic] = useState('');
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    let typingTimeout = useRef(null);

    const SUGGESTIONS = [
        "💡 Ask: What is the minimum attendance required?",
        "💡 Ask: Can I write exams with 70% attendance?",
        "💡 Ask: What happens if I miss an internal test?",
        "💡 Ask: How is SGPA calculated?",
        "💡 Ask: Show me DBMS notes",
        "💡 Ask: Need placement guidance?"
    ];

    useEffect(() => {
        if (!isOpen || chatMode !== 'ai' || messageInput || isFocused) return;
        const interval = setInterval(() => {
            setSuggestionIndex(prev => (prev + 1) % SUGGESTIONS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isOpen, chatMode, messageInput, isFocused]);

    // Initialize AI messages from sessionStorage or default empty array
    const [aiMessages, setAiMessages] = useState(() => {
        const saved = sessionStorage.getItem('askPlusAiHistory');
        if (saved) return JSON.parse(saved);
        return [];
    });

    useEffect(() => {
        sessionStorage.setItem('askPlusAiHistory', JSON.stringify(aiMessages));
    }, [aiMessages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, aiMessages, isOpen, isAiThinking, chatMode, adminTyping]);

    // Socket Connection for Admin Mode
    useEffect(() => {
        if (!isOpen || !user || chatMode !== 'admin') return;

        socket.emit('create_or_join_conversation', {
            userId: user._id || user.id,
            name: user.name || user.email,
            email: user.email
        });

        const handleConversationData = (data) => {
            setConversationId(data.conversation._id);
            if (data.messages && data.messages.length > 0) {
                setMessages(data.messages.filter(m => !m.isDeletedForUser));
            }
            // Mark messages seen by user
            socket.emit('mark_seen', { conversationId: data.conversation._id, readerType: 'user' });
        };

        const handleReceiveMessage = (newMessage) => {
            setMessages(prev => [...prev, newMessage]);
            if (isOpen) {
                socket.emit('mark_seen', { conversationId: newMessage.conversationId, readerType: 'user' });
            }
            if (newMessage.senderType === 'admin') setAdminTyping(false);
        };

        const handleMessageDeleted = (deletedId) => {
            setMessages(prev => prev.filter(m => m._id !== deletedId));
        };

        const handleMessagesSeen = (data) => {
            if (data.readerType === 'admin') {
                setMessages(prev => prev.map(m => m.senderType === 'user' ? { ...m, seen: true } : m));
            }
        };

        const handleTypingStatus = (data) => {
            if (data.senderType === 'admin') setAdminTyping(data.isTyping);
        };

        const handleAdminJoined = () => {
            setSystemMessage('Admin joined your conversation');
            setTimeout(() => setSystemMessage(null), 5000);
        };

        socket.on('conversation_data', handleConversationData);
        socket.on('receive_message', handleReceiveMessage);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('messages_seen', handleMessagesSeen);
        socket.on('typing_status', handleTypingStatus);
        socket.on('admin_joined', handleAdminJoined);

        return () => {
            socket.off('conversation_data', handleConversationData);
            socket.off('receive_message', handleReceiveMessage);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('messages_seen', handleMessagesSeen);
            socket.off('typing_status', handleTypingStatus);
            socket.off('admin_joined', handleAdminJoined);
        };
    }, [isOpen, user, chatMode]);

    // Send pending message when entering admin mode and conversation connects
    useEffect(() => {
        if (chatMode === 'admin' && conversationId && pendingAdminMessage && user) {
            socket.emit('send_message', {
                conversationId,
                senderId: user._id || user.id,
                senderType: 'user',
                message: pendingAdminMessage
            });
            setPendingAdminMessage(null);
        }
    }, [chatMode, conversationId, pendingAdminMessage, user]);

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        if (chatMode === 'admin' && conversationId && user) {
            socket.emit('typing', { conversationId, senderType: 'user', isTyping: true });
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
                socket.emit('typing', { conversationId, senderType: 'user', isTyping: false });
            }, 1000);
        }
    };

    const handleAskAi = async (questionText) => {
        // Add User Message
        const userMsg = { _id: Date.now().toString(), message: questionText, senderType: 'user' };
        setAiMessages(prev => [...prev, userMsg]);
        setIsAiThinking(true);

        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/knowledge-base/ask', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ question: questionText })
            });

            if (!res.ok) {
                if (res.status === 403) {
                    const errorData = await res.json();
                    throw new Error(errorData.answer || "Account banned from ASK+.");
                }
                throw new Error("Failed to fetch response from ASK+");
            }
            const data = await res.json();
            
            const isLimitReached = data.type === 'limit_reached';
            const needsAdmin = data.answer.includes("I couldn't find that information in the uploaded college documents");
            const qLower = questionText.toLowerCase();
            const wantsMentorship = ['placement', 'resume', 'career', 'project', 'internship', 'guidance', 'mentor'].some(w => qLower.includes(w));
            
            // Check for 3+ follow up questions in a row
            const recentMsgs = aiMessages.slice(-5);
            const highInteraction = recentMsgs.length >= 3;

            const aiMsg = { 
                _id: (Date.now() + 1).toString(), 
                message: data.answer, 
                senderType: 'ai',
                sources: data.sources,
                materials: data.materials,
                originalQuestion: questionText,
                needsAdmin: !isLimitReached && needsAdmin,
                needsMentorship: !isLimitReached && (wantsMentorship || (needsAdmin && highInteraction) || highInteraction),
                isLimitReached
            };
            setAiMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg = { 
                _id: (Date.now() + 1).toString(), 
                message: error.message === "Failed to fetch response from ASK+" 
                    ? "I'm having trouble connecting to my knowledge base right now. Please try again later."
                    : error.message, 
                senderType: 'ai' 
            };
            setAiMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsAiThinking(false);
        }
    };

    const handleSend = () => {
        if (!messageInput.trim() || !user) return;
        const text = messageInput.trim();
        setMessageInput('');

        if (chatMode === 'ai') {
            handleAskAi(text);
        } else if (chatMode === 'admin' && conversationId) {
            socket.emit('send_message', {
                conversationId,
                senderId: user._id || user.id,
                senderType: 'user',
                message: text
            });
            socket.emit('typing', { conversationId, senderType: 'user', isTyping: false });
        }
    };

    const handleDeleteMessage = (messageId) => {
        if (chatMode === 'ai') {
            setAiMessages(prev => prev.filter(m => m._id !== messageId));
            return;
        }
        if (!conversationId) return;
        socket.emit('delete_message', { messageId, conversationId });
        setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTalkToAdmin = (originalQuestion) => {
        setChatMode('admin');
        setPendingAdminMessage(originalQuestion);
    };

    const renderAiMessages = () => {
        return aiMessages.map((msg) => (
            <div key={msg._id} className="flex flex-col w-full">
                <ChatMessage 
                    messageId={msg._id}
                    message={msg.message} 
                    senderType={msg.senderType === 'ai' ? 'admin' : 'user'} 
                    seen={true}
                    onDelete={handleDeleteMessage}
                />
                
                {/* Sources block removed as requested */}

                {msg.senderType === 'ai' && msg.materials && msg.materials.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 ml-11 mb-4 flex flex-col gap-2">
                        {msg.materials.map(mat => (
                            <MaterialCard 
                                key={mat._id} 
                                material={mat} 
                                onPreview={setPreviewMaterial} 
                            />
                        ))}
                    </motion.div>
                )}

                {msg.needsAdmin && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-11 mb-2 flex flex-col items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl max-w-[85%]">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-amber-500/90 text-xs font-medium">I couldn't find this in official documents.</span>
                        </div>
                        <button 
                            onClick={() => handleTalkToAdmin(msg.originalQuestion)}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs px-4 py-1.5 rounded-full transition-all active:scale-95 font-medium w-full text-center"
                        >
                            Talk to Admin
                        </button>
                    </motion.div>
                )}

                {msg.isLimitReached && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 ml-11 mb-2 flex flex-col items-start gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl max-w-[85%]">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-red-500/90 text-xs font-medium">Daily AI Limit Reached</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">Material searches and PDF previews remain unlimited.</p>
                    </motion.div>
                )}

                {(msg.needsMentorship || msg.needsAdmin) && msg.senderType === 'ai' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 ml-11 mb-4 flex flex-col items-start gap-3 bg-gradient-to-r from-purple-900/40 to-[#0a0a0f] border border-purple-500/30 p-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.1)] relative overflow-hidden group max-w-[85%]">
                        <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-slate-300 text-xs font-semibold relative z-10">Still have doubts?</p>
                        <button 
                            onClick={() => {
                                setMentorshipTopic(msg.originalQuestion);
                                setShowMentorshipModal(true);
                            }}
                            className="relative z-10 flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 text-white text-xs py-2 rounded-lg transition-all shadow-md active:scale-95 group/btn"
                        >
                            🎓 <span className="font-bold group-hover/btn:text-purple-300 transition-colors">Get 1:1 Mentorship</span>
                        </button>
                    </motion.div>
                )}

                {/* Feedback CTA */}
                {msg.senderType === 'ai' && !msg.isLimitReached && (
                    <div className="mt-2 ml-11 mb-4 flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-medium">Was this helpful?</span>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => toast.success("We will show text like this in future requests")}
                                className="text-xs text-slate-400 hover:text-green-400 hover:bg-green-400/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                <ThumbsUp className="w-3.5 h-3.5" /> Yes
                            </button>
                            <button 
                                onClick={() => toast.error("Please click 'Talk to a Senior' to chat with an admin!")}
                                className="text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                <ThumbsDown className="w-3.5 h-3.5" /> No
                            </button>
                        </div>
                        <div className="w-px h-3 bg-white/10 mx-1"></div>
                        <button 
                            onClick={() => handleTalkToAdmin(msg.originalQuestion)}
                            className="text-[11px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 hover:bg-purple-500/10 px-2 py-1 rounded transition-colors"
                        >
                            🎓 Talk to a Senior
                        </button>
                    </div>
                )}
            </div>
        ));
    };

    return (
        <>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                    className="absolute bottom-20 right-0 w-[390px] sm:w-[410px] h-[600px] max-h-[680px] bg-[#0a0a0f]/95 backdrop-blur-2xl border border-purple-500/30 rounded-2xl shadow-[0_10px_40px_rgba(168,85,247,0.15)] z-40 flex flex-col overflow-hidden"
                >
                    {/* Premium Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-blue-600/10 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-[2px] shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                    <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center relative overflow-hidden text-2xl">
                                        👨‍🎓
                                        <div className="absolute inset-0 bg-white/5" />
                                    </div>
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0f] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-base flex items-center gap-1.5 tracking-wide">
                                    ASK+ Senior Assistant <Sparkles className="w-4 h-4 text-yellow-400" />
                                </h3>
                                <p className="text-green-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                                    {chatMode === 'ai' ? 'ONLINE' : 'HUMAN SUPPORT'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setChatMode(prev => prev === 'ai' ? 'admin' : 'ai')}
                                className="px-3 py-1 mr-2 bg-white/10 text-[10px] text-white rounded-lg hover:bg-white/20 transition-all font-bold uppercase"
                                title="Toggle Chat Mode"
                            >
                                {chatMode === 'ai' ? 'Switch to Admin' : 'Switch to AI'}
                            </button>
                            <button 
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Spacious Chat Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-purple-500/30 hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/50 [&::-webkit-scrollbar-thumb]:rounded-full pr-3 flex flex-col">
                        {!user ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-90 mt-10">
                                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-5 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                                    <Sparkles className="w-10 h-10 text-purple-400" />
                                </div>
                                <h4 className="text-white font-bold text-lg mb-2">Welcome to ASK+</h4>
                                <p className="text-slate-400 text-sm max-w-[250px] leading-relaxed">Please login to chat with our senior support assistants.</p>
                            </div>
                        ) : chatMode === 'ai' && aiMessages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-start justify-center p-2 mt-4">
                                <div className="text-4xl mb-4">👋</div>
                                <h4 className="text-white font-bold text-xl mb-2">Hi {user.name?.split(' ')[0] || 'there'}!</h4>
                                <p className="text-slate-300 text-sm mb-6">I'm ASK+, your senior assistant.</p>
                                
                                <p className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">I can help with:</p>
                                <ul className="space-y-3 mb-8 ml-1">
                                    <li className="flex items-center gap-3 text-sm text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]"></span> 📚 Notes & PYQs</li>
                                    <li className="flex items-center gap-3 text-sm text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span> 📜 College Rules</li>
                                    <li className="flex items-center gap-3 text-sm text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span> 📈 SGPA / CGPA</li>
                                    <li className="flex items-center gap-3 text-sm text-slate-300"><span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_5px_rgba(236,72,153,0.8)]"></span> 💼 Placements & Internships</li>
                                </ul>
                                
                                <p className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">Try asking:</p>
                                <div className="space-y-2.5 w-full">
                                    {["What is the attendance requirement?", "Show DBMS notes", "How is SGPA calculated?"].map((q, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleAskAi(q)}
                                            className="w-full text-left text-sm text-slate-300 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 px-4 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                                        >
                                            • {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : chatMode === 'admin' && messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                                <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">You are now connected to human support. Send a message to start.</p>
                            </div>
                        ) : (
                            chatMode === 'ai' ? renderAiMessages() : messages.map((msg) => (
                                <ChatMessage 
                                    key={msg._id} 
                                    messageId={msg._id}
                                    message={msg.message} 
                                    senderType={msg.senderType} 
                                    seen={msg.seen}
                                    onDelete={handleDeleteMessage}
                                />
                            ))
                        )}

                        {isAiThinking && chatMode === 'ai' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3 w-full justify-start items-center ml-2"
                            >
                                <div className="text-xs text-purple-400 italic flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 animate-spin" /> ASK+ is thinking...
                                </div>
                            </motion.div>
                        )}

                        {adminTyping && chatMode === 'admin' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3 w-full justify-start items-center ml-2"
                            >
                                <div className="text-xs text-slate-400 italic">Admin is typing...</div>
                            </motion.div>
                        )}

                        {systemMessage && chatMode === 'admin' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full flex justify-center my-2"
                            >
                                <span className="bg-purple-500/20 text-purple-300 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-purple-500/30">
                                    {systemMessage}
                                </span>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>


                    
                    {/* Premium Input Section */}
                    <div className="p-5 pt-3 bg-[#0d0d12]/90 backdrop-blur-md relative z-10 border-t border-white/5">
                        <div className="relative flex items-center group">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                disabled={!user || (chatMode === 'ai' && isAiThinking)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all disabled:opacity-50 shadow-inner relative z-20 bg-transparent"
                            />
                            {/* Smart Suggestions Placeholder */}
                            {!messageInput && !isFocused && user && (
                                <div className="absolute left-5 right-14 top-0 bottom-0 flex items-center pointer-events-none z-10 overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={suggestionIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-sm text-slate-500 truncate"
                                        >
                                            {chatMode === 'ai' ? SUGGESTIONS[suggestionIndex] : "Type a message..."}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            )}
                            {!user && (
                                <div className="absolute left-5 right-14 top-0 bottom-0 flex items-center pointer-events-none z-10">
                                    <span className="text-sm text-slate-500">Login to chat...</span>
                                </div>
                            )}
                            <button
                                onClick={handleSend}
                                disabled={!messageInput.trim() || !user || (chatMode === 'ai' && isAiThinking)}
                                className={`absolute right-2 p-2.5 rounded-xl transition-all duration-300 ${
                                    messageInput.trim() && user && !(chatMode === 'ai' && isAiThinking)
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95' 
                                    : 'text-slate-600 bg-transparent'
                                }`}
                            >
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        </div>
                        <div className="text-center mt-3 opacity-60 hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-slate-500 tracking-wider font-semibold uppercase">Powered by ASK+</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* PDF Preview Modal is rendered outside the chat constraint */}
        {previewMaterial && (
            <PdfPreviewModal 
                material={previewMaterial} 
                onClose={() => setPreviewMaterial(null)} 
            />
        )}

        <MentorshipModal
            isOpen={showMentorshipModal}
            onClose={() => setShowMentorshipModal(false)}
            initialTopic={mentorshipTopic}
        />
        </>
    );
};

export default ChatWindow;

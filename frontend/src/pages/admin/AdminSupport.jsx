import React, { useState, useEffect, useRef } from 'react';
import { Users, Search, Send, Check, CheckCheck, Trash2 } from 'lucide-react';
import socket from '../../services/socket';
import { useAuth } from '../../utils/hooks';

const AdminSupport = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const [userTyping, setUserTyping] = useState(false);
    let typingTimeout = useRef(null);

    useEffect(() => {
        socket.emit('join_admin');

        const handleConversationsList = (list) => {
            setConversations(list);
        };

        const handleNewConversation = (conv) => {
            setConversations(prev => [conv, ...prev]);
        };

        const handleConversationUpdated = (updatedConv) => {
            setConversations(prev => {
                const index = prev.findIndex(c => c._id === updatedConv._id);
                if (index > -1) {
                    const newList = [...prev];
                    newList[index] = updatedConv;
                    return newList.sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
                } else {
                    return [updatedConv, ...prev].sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
                }
            });
        };

        socket.on('admin_conversations_list', handleConversationsList);
        socket.on('new_conversation', handleNewConversation);
        socket.on('conversation_updated', handleConversationUpdated);

        return () => {
            socket.off('admin_conversations_list', handleConversationsList);
            socket.off('new_conversation', handleNewConversation);
            socket.off('conversation_updated', handleConversationUpdated);
        };
    }, []);

    useEffect(() => {
        if (!activeConversation) return;

        const handleConversationData = (data) => {
            setMessages(data.messages || []);
            scrollToBottom();
            socket.emit('mark_seen', { conversationId: activeConversation._id, readerType: 'admin' });
        };

        const handleReceiveMessage = (newMessage) => {
            if (newMessage.conversationId === activeConversation._id) {
                setMessages(prev => [...prev, newMessage]);
                scrollToBottom();
                socket.emit('mark_seen', { conversationId: newMessage.conversationId, readerType: 'admin' });
                if (newMessage.senderType === 'user') setUserTyping(false);
            }
        };

        const handleMessageDeleted = (deletedId) => {
            setMessages(prev => prev.map(m => m._id === deletedId ? { ...m, isDeletedForUser: true } : m));
        };

        const handleMessagesSeen = (data) => {
            if (data.readerType === 'user') {
                setMessages(prev => prev.map(m => m.senderType === 'admin' ? { ...m, seen: true } : m));
            }
        };

        const handleTypingStatus = (data) => {
            if (data.senderType === 'user') setUserTyping(data.isTyping);
        };

        socket.on('conversation_data', handleConversationData);
        socket.on('receive_message', handleReceiveMessage);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('messages_seen', handleMessagesSeen);
        socket.on('typing_status', handleTypingStatus);

        return () => {
            socket.off('conversation_data', handleConversationData);
            socket.off('receive_message', handleReceiveMessage);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('messages_seen', handleMessagesSeen);
            socket.off('typing_status', handleTypingStatus);
        };
    }, [activeConversation]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSelectConversation = (conv) => {
        setActiveConversation(conv);
        socket.emit('admin_join_conversation', conv._id);
        
        socket.emit('create_or_join_conversation', {
            userId: conv.userId,
            name: conv.userName,
            email: conv.userEmail
        });
    };

    const handleSendMessage = () => {
        if (!messageInput.trim() || !activeConversation) return;

        socket.emit('send_message', {
            conversationId: activeConversation._id,
            senderId: user._id || user.id,
            senderType: 'admin',
            message: messageInput
        });

        setMessageInput('');
        socket.emit('typing', { conversationId: activeConversation._id, senderType: 'admin', isTyping: false });
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        if (activeConversation) {
            socket.emit('typing', { conversationId: activeConversation._id, senderType: 'admin', isTyping: true });
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
                socket.emit('typing', { conversationId: activeConversation._id, senderType: 'admin', isTyping: false });
            }, 1000);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleDeleteMessage = (messageId, conversationId) => {
        socket.emit('delete_message', { messageId, conversationId });
    };

    const filteredConversations = conversations.filter(c => 
        c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[85vh] min-h-[600px] max-w-7xl mx-auto mt-6 bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl font-outfit">
            
            {/* Left Sidebar (25%) */}
            <div className="w-1/4 min-w-[280px] border-r border-white/5 flex flex-col bg-[#0d0d12]">
                <div className="p-4 border-b border-white/5">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-purple-400" />
                        Support Inbox
                    </h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 p-2 space-y-1">
                    {filteredConversations.length === 0 ? (
                        <div className="text-center text-slate-500 text-sm mt-10">No active conversations</div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div 
                                key={conv._id}
                                onClick={() => handleSelectConversation(conv)}
                                className={`
                                    p-3 rounded-xl cursor-pointer transition-colors flex flex-col gap-1
                                    ${activeConversation?._id === conv._id ? 'bg-purple-500/10 border border-purple-500/20' : 'hover:bg-white/[0.03] border border-transparent'}
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col items-start gap-1 overflow-hidden w-full">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-[1px] shrink-0">
                                                <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center text-xs text-white">
                                                    {conv.userName.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <span className="text-white font-semibold text-sm truncate">{conv.userName}</span>
                                        </div>
                                        {userTyping && activeConversation?._id === conv._id ? (
                                            <span className="text-purple-400 text-xs italic pl-10">typing...</span>
                                        ) : (
                                            <span className="truncate max-w-[140px] text-xs text-slate-500 pl-10">
                                                {conv.lastMessage || 'No messages yet'}
                                            </span>
                                        )}
                                    </div>
                                    {conv.unreadAdminCount > 0 && (
                                        <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {conv.unreadAdminCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-end text-xs text-slate-500 mt-1">
                                    <span className="shrink-0">{new Date(conv.lastMessageAt || conv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Pane (75%) */}
            <div className="w-3/4 flex flex-col bg-[#0a0a0f] relative">
                {activeConversation ? (
                    <>
                        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-[1px] shrink-0">
                                    <div className="w-full h-full bg-[#0a0a0f] rounded-full flex items-center justify-center text-sm text-white font-bold">
                                        {activeConversation.userName.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">{activeConversation.userName}</h3>
                                    <p className="text-slate-400 text-xs">{activeConversation.userEmail}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                    No messages in this conversation yet.
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg._id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'} group/msg relative`}>
                                        <div className={`
                                            relative max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed flex items-end gap-2
                                            ${msg.senderType === 'admin' 
                                                ? 'bg-purple-600 text-white rounded-br-none shadow-[0_4px_15px_rgba(168,85,247,0.15)] pr-16 pb-5' 
                                                : 'bg-white/[0.05] border border-white/5 text-slate-200 rounded-bl-none shadow-sm pr-14 pb-5'
                                            }
                                        `}>
                                            <div className={msg.isDeletedForUser ? "opacity-50 line-through" : ""}>
                                                {msg.message.split('\n').map((line, i) => (
                                                    <React.Fragment key={i}>
                                                        {line}
                                                        {i !== msg.message.split('\n').length - 1 && <br />}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            {msg.isDeletedForUser && (
                                                <span className="text-red-400/80 text-[10px] shrink-0 font-medium bg-red-400/10 px-1.5 py-0.5 rounded ml-2" title="Deleted by user">
                                                    Deleted
                                                </span>
                                            )}

                                            {/* Timestamp and Seen status */}
                                            <div className="absolute bottom-1 right-2 flex items-center gap-1 opacity-70">
                                                <span className="text-[10px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {msg.senderType === 'admin' && (
                                                    msg.seen ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" /> : <Check className="w-3.5 h-3.5 text-slate-300" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Dropdown for delete */}
                                        <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity ${msg.senderType === 'admin' ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                            <button 
                                                onClick={() => handleDeleteMessage(msg._id, activeConversation._id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
                                                title="Delete message"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                            {userTyping && (
                                <div className="flex gap-3 w-full justify-start items-center">
                                    <div className="text-xs text-slate-400 italic">User is typing...</div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-[#0d0d12] border-t border-white/5">
                            <div className="relative flex items-center">
                                <textarea
                                    value={messageInput}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your reply to user..."
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-4 pr-14 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                                    rows="1"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim()}
                                    className={`absolute right-2 p-2 rounded-lg transition-all ${
                                        messageInput.trim()
                                        ? 'bg-purple-600 text-white hover:bg-purple-500' 
                                        : 'text-slate-500 bg-transparent'
                                    }`}
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <Users className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;

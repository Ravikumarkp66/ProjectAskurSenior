import React, { useState, useEffect } from 'react';
import FloatingChatButton from './FloatingChatButton';
import ChatPopupBubble from './ChatPopupBubble';
import ChatWindow from './ChatWindow';
import { useAuthContext } from '../../context/AuthContext';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

const SupportWidget = () => {
    const { user, isAuthenticated } = useAuthContext();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Connect socket when user is logged in
        if (!socket.connected) {
            socket.connect();
        }

        const handleAdminMessage = (data) => {
            setUnreadCount(prev => prev + 1);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 3000);
            
            // Show Live Toast
            toast.custom((t) => (
                <div
                    className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-sm w-full bg-white dark:bg-[#1a1a24] shadow-lg rounded-xl pointer-events-auto flex flex-col ring-1 ring-black/5 dark:ring-white/10`}
                >
                    <div className="p-4 flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">💬</span>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                New Message from ASK+ Support
                            </p>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 ml-8">
                            You have received a new reply.
                        </p>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                handleOpenChat();
                            }}
                            className="ml-8 w-max bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                            View Message
                        </button>
                    </div>
                </div>
            ), { duration: 5000 });
        };

        socket.on('admin_message_sent', handleAdminMessage);

        const hasSeenPopup = sessionStorage.getItem('askPlusPopupSeen');
        
        if (!hasSeenPopup && !isChatOpen) {
            const timer = setTimeout(() => {
                setShowPopup(true);
            }, 5000);

            const hideTimer = setTimeout(() => {
                setShowPopup(false);
            }, 13000);

            return () => {
                clearTimeout(timer);
                clearTimeout(hideTimer);
                socket.off('admin_message_sent', handleAdminMessage);
            };
        }
        
        return () => {
            socket.off('admin_message_sent', handleAdminMessage);
            // Disconnect socket if the component unmounts
        };
    }, [isChatOpen, isAuthenticated, user]);

    const handleClosePopup = () => {
        setShowPopup(false);
        sessionStorage.setItem('askPlusPopupSeen', 'true');
    };

    const handleOpenChat = () => {
        setIsChatOpen(true);
        setShowPopup(false);
        setUnreadCount(0); // Reset unread count when chat opens
        sessionStorage.setItem('askPlusPopupSeen', 'true');
    };

    const toggleChat = () => {
        if (!isChatOpen) {
            handleOpenChat();
        } else {
            setIsChatOpen(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Mobile Banner Experience */}
            {!isChatOpen && unreadCount > 0 && (
                <div className="sm:hidden fixed top-4 left-4 right-4 bg-[#1a1a24] border border-purple-500/30 rounded-xl p-3 shadow-2xl z-[60] flex items-center justify-between animate-in slide-in-from-top-4">
                    <div className="flex flex-col">
                        <span className="text-white text-sm font-bold flex items-center gap-2">
                            💬 ASK+ Support
                        </span>
                        <span className="text-slate-400 text-xs">You have a new reply.</span>
                    </div>
                    <button onClick={handleOpenChat} className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                        Open
                    </button>
                </div>
            )}

            <ChatWindow 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
                user={user}
            />
            
            {!isChatOpen && showPopup && (
                <ChatPopupBubble 
                    onOpenChat={handleOpenChat} 
                    onClose={handleClosePopup}
                    user={user} 
                />
            )}
            
            <div className="mt-4">
                <FloatingChatButton 
                    isOpen={isChatOpen} 
                    onClick={toggleChat} 
                    unreadCount={unreadCount}
                    isAnimating={isAnimating}
                />
            </div>
        </div>
    );
};

export default SupportWidget;

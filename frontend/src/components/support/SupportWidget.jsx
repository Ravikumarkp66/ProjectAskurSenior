import React, { useState, useEffect } from 'react';
import FloatingChatButton from './FloatingChatButton';
import ChatPopupBubble from './ChatPopupBubble';
import ChatWindow from './ChatWindow';
import { useAuthContext } from '../../context/AuthContext';
import socket from '../../services/socket';

const SupportWidget = () => {
    const { user, isAuthenticated } = useAuthContext();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Connect socket when user is logged in
        if (!socket.connected) {
            socket.connect();
        }

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
            };
        }
        
        return () => {
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
                />
            </div>
        </div>
    );
};

export default SupportWidget;

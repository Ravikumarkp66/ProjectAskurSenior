const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { eventBus, EVENTS } = require('../events/eventBus');

const activeUsers = new Map();
const activeSockets = new Set();

const setupSocketHandler = (io) => {
    io.on('connection', (socket) => {
        activeSockets.add(socket.id);
        console.log("Socket connected:", socket.id);
        
        socket.on('user_online', (userData) => {
            console.log("USER ONLINE:", userData);
            const { userId, name, email, role } = userData;
            if (!userId) return;

            User.findByIdAndUpdate(userId, { lastActiveAt: new Date() }).catch(err => console.error("Error updating lastActiveAt:", err));

            if (!activeUsers.has(userId)) {
                activeUsers.set(userId, {
                    userId,
                    name,
                    email,
                    role,
                    sockets: new Set(),
                    joinedAt: new Date()
                });
            }
            
            activeUsers.get(userId).sockets.add(socket.id);

            io.emit("dashboard_live_stats", {
                liveUsers: activeUsers.size,
                trafficTabs: activeSockets.size
            });

            io.emit(
                "live_users_list",
                Array.from(activeUsers.values()).map(user => ({
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tabs: user.sockets.size,
                    joinedAt: user.joinedAt
                }))
            );
        });

        socket.on('join_admin', () => {
            socket.join('admins');
            
            socket.emit("dashboard_live_stats", {
                liveUsers: activeUsers.size,
                trafficTabs: activeSockets.size
            });

            socket.emit(
                "live_users_list",
                Array.from(activeUsers.values()).map(user => ({
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tabs: user.sockets.size,
                    joinedAt: user.joinedAt
                }))
            );

            Conversation.find({})
                .sort({ lastMessageAt: -1, createdAt: -1 })
                .then(conversations => {
                    socket.emit('admin_conversations_list', conversations);
                })
                .catch(err => console.error(err));
        });

        socket.on('request_dashboard_stats', () => {
            socket.emit("dashboard_live_stats", {
                liveUsers: activeUsers.size,
                trafficTabs: activeSockets.size
            });

            socket.emit(
                "live_users_list",
                Array.from(activeUsers.values()).map(user => ({
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tabs: user.sockets.size,
                    joinedAt: user.joinedAt
                }))
            );
        });

        socket.on('create_or_join_conversation', async (userData) => {
            try {
                const { userId, name, email } = userData;
                if (!userId) return;

                let conversation = await Conversation.findOne({ userId });

                if (!conversation) {
                    conversation = await Conversation.create({
                        userId,
                        userName: name,
                        userEmail: email
                    });
                    io.to('admins').emit('new_conversation', conversation);
                }

                const roomId = `conversation_${conversation._id}`;
                socket.join(roomId);

                const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
                
                conversation.unreadUserCount = 0;
                await conversation.save();

                socket.emit('conversation_data', { conversation, messages });
            } catch (error) {
                console.error('Socket create_or_join_conversation error:', error);
            }
        });

        socket.on('send_message', async (data) => {
            try {
                const { conversationId, senderId, senderType, message } = data;
                
                const newMessage = await Message.create({
                    conversationId,
                    senderId,
                    senderType,
                    message
                });

                const conversation = await Conversation.findById(conversationId);
                if (conversation) {
                    conversation.lastMessage = message;
                    conversation.lastMessageAt = new Date();
                    if (senderType === 'user') {
                        conversation.unreadAdminCount += 1;
                    } else if (senderType === 'admin') {
                        conversation.unreadUserCount += 1;
                        
                        // Emit Notification Event via EventBus
                        eventBus.emit(EVENTS.NOTIFICATION_CREATED, {
                            userId: conversation.userId,
                            type: 'admin_reply',
                            title: 'New Support Reply',
                            message: 'You have received a new reply from ASK+ Support.',
                            activeUsers
                        });

                        const userKey = conversation.userId.toString();
                        if (activeUsers.has(userKey)) {
                            const userSocketData = activeUsers.get(userKey);
                            userSocketData.sockets.forEach(socketId => {
                                io.to(socketId).emit('admin_message_sent', { conversationId });
                            });
                        }
                    }
                    await conversation.save();
                }

                const roomId = `conversation_${conversationId}`;
                io.to(roomId).emit('receive_message', newMessage);
                io.to('admins').emit('conversation_updated', conversation);
            } catch (error) {
                console.error('Socket send_message error:', error);
            }
        });

        socket.on('delete_message', async (data) => {
            try {
                const { messageId, conversationId } = data;
                await Message.findByIdAndUpdate(messageId, { isDeletedForUser: true });
                
                const roomId = `conversation_${conversationId}`;
                io.to(roomId).emit('message_deleted', messageId);
            } catch (error) {
                console.error('Socket delete_message error:', error);
            }
        });

        socket.on('typing', (data) => {
            const { conversationId, senderType, isTyping } = data;
            const roomId = `conversation_${conversationId}`;
            socket.to(roomId).emit('typing_status', { senderType, isTyping });
        });

        socket.on('mark_seen', async (data) => {
            try {
                const { conversationId, readerType } = data;
                const targetSender = readerType === 'admin' ? 'user' : 'admin';
                
                await Message.updateMany(
                    { conversationId, senderType: targetSender, seen: false },
                    { seen: true }
                );
                
                const roomId = `conversation_${conversationId}`;
                io.to(roomId).emit('messages_seen', { readerType, conversationId });
            } catch (error) {
                console.error('Socket mark_seen error:', error);
            }
        });

        socket.on('admin_join_conversation', (conversationId) => {
            const roomId = `conversation_${conversationId}`;
            socket.join(roomId);
            
            socket.to(roomId).emit('admin_joined', conversationId);

            Conversation.findByIdAndUpdate(conversationId, { unreadAdminCount: 0 }, { new: true })
                .then(conv => {
                    if(conv) io.to('admins').emit('conversation_updated', conv);
                }).catch(err => console.error(err));
        });

        socket.on('disconnect', () => {
            console.log("Socket disconnected:", socket.id);
            activeSockets.delete(socket.id);
            
            for (const [userId, user] of activeUsers.entries()) {
                user.sockets.delete(socket.id);
                if (user.sockets.size === 0) {
                    activeUsers.delete(userId);
                }
            }

            io.emit("dashboard_live_stats", {
                liveUsers: activeUsers.size,
                trafficTabs: activeSockets.size
            });

            io.emit(
                "live_users_list",
                Array.from(activeUsers.values()).map(user => ({
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tabs: user.sockets.size,
                    joinedAt: user.joinedAt
                }))
            );
        });
    });
};

module.exports = {
    setupSocketHandler,
    activeUsers,
    activeSockets
};

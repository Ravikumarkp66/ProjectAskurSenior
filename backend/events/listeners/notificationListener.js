const { eventBus, EVENTS } = require('../eventBus');
const UserNotification = require('../../models/UserNotification');

const registerNotificationListeners = (ioProvider) => {
    eventBus.on(EVENTS.NOTIFICATION_CREATED, async (data) => {
        try {
            const { userId, type, title, message, activeUsers } = data;
            
            const newNotif = await UserNotification.create({
                userId,
                type,
                title,
                message
            });

            if (ioProvider && activeUsers) {
                const userKey = userId.toString();
                if (activeUsers.has(userKey)) {
                    const userSocketData = activeUsers.get(userKey);
                    const io = typeof ioProvider === 'function' ? ioProvider() : ioProvider;
                    if (io) {
                        userSocketData.sockets.forEach(socketId => {
                            io.to(socketId).emit('notification_created', newNotif);
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error handling NOTIFICATION_CREATED event:', error);
        }
    });
};

module.exports = registerNotificationListeners;

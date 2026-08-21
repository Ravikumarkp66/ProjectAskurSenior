const registerNotificationListeners = require('./listeners/notificationListener');
const registerAnalyticsListeners = require('./listeners/analyticsListener');

const initEventBus = (getIoInstance) => {
    registerNotificationListeners(getIoInstance);
    registerAnalyticsListeners();
    console.log('⚡ EventBus initialized with Notification & Analytics listeners');
};

module.exports = { initEventBus };

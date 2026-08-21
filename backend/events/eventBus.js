const EventEmitter = require('events');

class AppEventBus extends EventEmitter {}

const eventBus = new AppEventBus();

const EVENTS = {
    NOTIFICATION_CREATED: 'notification:created',
    ANALYTICS_LOGGED: 'analytics:logged',
    ACTIVITY_LOGGED: 'activity:logged',
    SOCKET_BROADCAST: 'socket:broadcast'
};

module.exports = {
    eventBus,
    EVENTS
};

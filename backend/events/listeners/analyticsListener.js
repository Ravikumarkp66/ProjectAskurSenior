const { eventBus, EVENTS } = require('../eventBus');
const AnalyticsEvent = require('../../models/AnalyticsEvent');

const registerAnalyticsListeners = () => {
    eventBus.on(EVENTS.ANALYTICS_LOGGED, async (data) => {
        try {
            const { eventType, userId, metadata } = data;
            await AnalyticsEvent.create({
                eventType,
                userId,
                metadata,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error handling ANALYTICS_LOGGED event:', error);
        }
    });
};

module.exports = registerAnalyticsListeners;

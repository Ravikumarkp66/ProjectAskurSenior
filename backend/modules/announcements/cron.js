/**
 * AskUrSenior Plus Announcements — Scheduling Cron
 *
 * Reuses the existing node-cron infrastructure already installed
 * and running in this project (see modules/assistant/cron.js).
 *
 * Job: Every minute, promote SCHEDULED → PUBLISHED for any announcement
 * whose scheduledAt <= now. This is reliable across server restarts.
 *
 * NOTE: Query-time filtering remains the authoritative mechanism for student
 * visibility. This cron handles state hygiene only.
 */

const cron = require('node-cron');
const { promoteScheduledAnnouncements } = require('../../services/plusAnnouncementService');

// Runs every minute: '* * * * *'
cron.schedule('* * * * *', async () => {
    try {
        const promoted = await promoteScheduledAnnouncements();
        if (promoted > 0) {
            console.log(`[AnnouncementsCron] Promoted ${promoted} scheduled announcement(s) to PUBLISHED.`);
        }
    } catch (err) {
        console.error('[AnnouncementsCron] Error promoting scheduled announcements:', err.message);
    }
});

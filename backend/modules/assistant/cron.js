const cron = require('node-cron');
const User = require('../../models/User');
const Timetable = require('../academic/Timetable');
const { getTodaySchedule, getTomorrowSchedule } = require('./getScheduleData');
const { generateMorningMessage, generateNightMessage } = require('./messageGenerator');
const { sendWhatsAppMessage } = require('../whatsapp/whatsapp.service');
const { sendClassEndReminder } = require('../whatsapp/attendanceHelper');
const { sendNightWrapUp } = require('../whatsapp/wrapupHelper');

/**
 * Minute-by-Minute Job: Check for classes that just ended
 */
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  try {
    const users = await User.find({ whatsappEnabled: true, phone: { $ne: null } });
    for (const user of users) {
      const timetable = await Timetable.findOne({ userId: user._id });
      if (!timetable || !timetable[dayName]) continue;

      const classes = timetable[dayName];
      for (const cls of classes) {
        if (cls.end === currentTime) {
          await sendClassEndReminder(user, cls.subject);
        }
      }
    }
  } catch (error) {
    console.error('Minute-by-Minute Cron Error:', error.message);
  }
}, { timezone: "Asia/Kolkata" });

/**
 * Morning Job (6 AM)
 */
cron.schedule('0 6 * * *', async () => {
  console.log('🌅 Running Morning Assistant Job...');
  try {
    const users = await User.find({ whatsappEnabled: true, phone: { $ne: null } });
    for (const user of users) {
      try {
        const data = await getTodaySchedule(user._id);
        const message = generateMorningMessage(data);
        await sendWhatsAppMessage(user.phone, message);
      } catch (err) {
        console.error(`Error in morning job for ${user.email}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Morning Cron Master Error:', error.message);
  }
}, { timezone: "Asia/Kolkata" });

/**
 * Night Job (9 PM)
 */
cron.schedule('0 21 * * *', async () => {
  console.log('🌙 Running Night Assistant Job...');
  try {
    const users = await User.find({ whatsappEnabled: true, phone: { $ne: null } });
    for (const user of users) {
      try {
        // 1. Send Tomorrow's Preview (Existing)
        const data = await getTomorrowSchedule(user._id);
        const message = generateNightMessage(data);
        await sendWhatsAppMessage(user.phone, message);

        // 2. Trigger Interactive Night Wrap-Up (New)
        await sendNightWrapUp(user);
      } catch (err) {
        console.error(`Error in night job for ${user.email}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Night Cron Master Error:', error.message);
  }
}, { timezone: "Asia/Kolkata" });

console.log('⏰ Advanced Academic Assistant Cron Jobs Active (Minute-by-Minute, 6AM & 9PM)');

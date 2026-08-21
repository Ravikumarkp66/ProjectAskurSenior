const cron = require('node-cron');
const User = require('../../models/User');
const Timetable = require('../academic/Timetable');
const { getTodaySchedule, getTomorrowSchedule } = require('./getScheduleData');
const { generateMorningMessage, generateNightMessage } = require('./messageGenerator');
const sendWhatsAppMessage = async () => ({ success: false });
const sendClassEndReminder = async () => ({ success: false });
const sendNightWrapUp = async () => ({ success: false });

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

/**
 * Daily Trash Purge Job (Run at midnight 12:00 AM)
 * Permanently deletes materials that have been in the Trash for more than 30 days
 */
cron.schedule('0 0 * * *', async () => {
  console.log('🗑 Running Daily Trash Purge Job...');
  try {
    const AcademicMaterial = require('../../models/AcademicMaterial');
    const AcademicSubject = require('../../models/AcademicSubject');
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const { s3 } = require('../../utils/s3');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find materials in trash older than 30 days
    const expiredMaterials = await AcademicMaterial.find({
      status: 'Hidden',
      deletedAt: { $ne: null, $lte: thirtyDaysAgo }
    });

    console.log(`Found ${expiredMaterials.length} expired materials in trash.`);

    for (const material of expiredMaterials) {
      // 1. Delete from S3
      let key = material.storedFileName;
      if (!key || !(key.startsWith('materials/') || key.startsWith('pyqs/'))) {
        const fileUrl = material.fileUrl || '';
        if (fileUrl.includes('d2mh2rnmjqdkgx.cloudfront.net/')) {
          key = fileUrl.split('d2mh2rnmjqdkgx.cloudfront.net/')[1];
        } else if (fileUrl.includes('.amazonaws.com/')) {
          key = fileUrl.split('.amazonaws.com/')[1];
        } else {
          key = fileUrl;
        }
      }

      if (key) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
          });
          await s3.send(deleteCommand);
          console.log(`Deleted file from S3: ${key}`);
        } catch (s3Err) {
          console.error(`Failed to delete S3 file ${key}:`, s3Err.message);
        }
      }

      // 2. Decrement subject count
      if (material.subject) {
        await AcademicSubject.findByIdAndUpdate(material.subject, {
          $inc: { materialCount: -1 }
        });
      }

      // 3. Delete document from Mongo
      await AcademicMaterial.findByIdAndDelete(material._id);
      console.log(`Permanently deleted material: "${material.title}"`);
    }
  } catch (error) {
    console.error('Trash Purge Cron Error:', error.message);
  }
}, { timezone: "Asia/Kolkata" });

console.log('⏰ Advanced Academic Assistant Cron Jobs Active (Minute-by-Minute, 6AM & 9PM)');

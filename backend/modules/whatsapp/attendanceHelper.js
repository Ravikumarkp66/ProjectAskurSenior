const AttendanceSession = require('./AttendanceSession');
const { sendWhatsAppMessage } = require('./whatsapp.service');

/**
 * Send attendance reminder after class ends
 */
const sendClassEndReminder = async (user, subjectName) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Create session
    const session = new AttendanceSession({
      userId: user._id,
      phone: user.phone,
      subject: subjectName,
      date: today,
      status: 'pending'
    });
    await session.save();

    const message = `⏰ *${subjectName}* just ended\n\nDid you attend?\n\nReply:\n1 → Yes\n2 → No`;
    await sendWhatsAppMessage(user.phone, message);
    
    console.log(`Attendance reminder sent to ${user.phone} for ${subjectName}`);
  } catch (error) {
    console.error('Send Class End Reminder Error:', error);
  }
};

module.exports = { sendClassEndReminder };

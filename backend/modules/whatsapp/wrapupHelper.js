const WrapUpSession = require('./WrapUpSession');
const { sendWhatsAppMessage } = require('./whatsapp.service');
const { format } = require('date-fns');

/**
 * Send Night Wrap-Up Menu
 */
const sendNightWrapUp = async (user) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Ensure only one active session per day
    await WrapUpSession.deleteMany({ userId: user._id, date: today });

    const session = new WrapUpSession({
      userId: user._id,
      phone: user.phone,
      date: today,
      status: 'active',
      step: 'menu'
    });
    await session.save();

    const dateStr = format(today, 'dd MMMM');
    const message = `🌙 *Day Wrap-Up*\n📅 ${dateStr}\n\nWhat would you like to check?\n\nReply:\n1 → Today's Classes\n2 → Today's Attendance Summary\n3 → Overall Attendance %\n4 → Past Date Summary\n5 → Today's Tasks\n6 → Edit Attendance`;
    
    await sendWhatsAppMessage(user.phone, message);
    console.log(`Night Wrap-Up sent to ${user.phone}`);
  } catch (error) {
    console.error('Send Night Wrap-Up Error:', error);
  }
};

module.exports = { sendNightWrapUp };

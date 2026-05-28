const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Twilio Sandbox Number
const FROM_NUMBER = 'whatsapp:+14155238886';

/**
 * Send a WhatsApp message
 * @param {string} to - Recipient phone number (e.g., +91XXXXXXXXXX)
 * @param {string} message - Message content
 */
const sendWhatsAppMessage = async (to, message) => {
  try {
    // Clean up the phone number (handle spaces from URL and ensure +)
    let cleanTo = to.trim().replace(/\s+/g, '');
    if (!cleanTo.startsWith('+')) {
      cleanTo = '+' + cleanTo;
    }

    const formattedTo = `whatsapp:${cleanTo}`;
    
    const response = await client.messages.create({
      from: FROM_NUMBER,
      to: formattedTo,
      body: message
    });

    console.log(`WhatsApp message sent to ${cleanTo}: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('Twilio WhatsApp Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWhatsAppMessage
};

const { sendWhatsAppMessage } = require('./whatsapp.service');

/**
 * Send a test WhatsApp message
 */
exports.sendTestMessage = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const message = "🚀 Hello from AskUrSenior! This is a test WhatsApp message from your MERN platform.";
    
    const result = await sendWhatsAppMessage(phone, message);

    if (result.success) {
      res.status(200).json({ 
        message: 'WhatsApp message sent successfully', 
        sid: result.sid 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send WhatsApp message', 
        details: result.error 
      });
    }
  } catch (error) {
    console.error('WhatsApp Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

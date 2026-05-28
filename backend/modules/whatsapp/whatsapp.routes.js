const express = require('express');
const router = express.Router();
const whatsappController = require('./whatsapp.controller');
const { handleWebhook } = require('./webhookHandler');
const { sendNightWrapUp } = require('./wrapupHelper');
const auth = require('../../middleware/auth');
const User = require('../../models/User');

// Webhook for Twilio
router.post('/webhook', handleWebhook);

// Test route for interactivity (No Auth for easy browser trigger)
router.get('/test-interactive', async (req, res) => {
  try {
    const user = await User.findOne({ phone: { $ne: null } });
    if (!user) return res.status(404).send('No user with phone found');
    
    await sendNightWrapUp(user);
    res.send(`✅ Interactive Wrap-Up triggered for ${user.phone}. Check your WhatsApp!`);
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

// POST /api/whatsapp/send-test
// Protected by auth middleware to ensure only logged in users can send
router.post('/send-test', auth, whatsappController.sendTestMessage);

module.exports = router;

const express = require("express");
const router = express.Router();
const { sendWhatsAppMessage } = require("../services/whatsappService");

router.post("/send-message", async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message required" });
    }

    const data = await sendWhatsAppMessage(phone, message);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to send message",
    });
  }
});

module.exports = router;

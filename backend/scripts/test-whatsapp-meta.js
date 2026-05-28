const axios = require('axios');
require('dotenv').config();

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const RECIPIENT_NUMBER = process.env.TEST_PHONE_NUMBER || "919986577493"; // Update TEST_PHONE_NUMBER in .env

async function testWhatsAppTemplate() {
  console.log("🚀 Starting WhatsApp Template Test...");
  console.log(`📱 Using Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log(`🎯 Sending to: ${RECIPIENT_NUMBER}`);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: RECIPIENT_NUMBER,
        type: "template",
        template: {
          name: "daily_update",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: "Present" },
                { type: "text", text: "DBMS 10 AM" },
                { type: "text", text: "Submit assignment" }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Success!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Failed to send template message");
    if (error.response) {
      console.error("Error Status:", error.response.status);
      console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error Message:", error.message);
    }
  }
}

testWhatsAppTemplate();

const axios = require("axios");

const sendWhatsAppMessage = async (phone, message) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "WhatsApp Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const sendWhatsAppTemplate = async (phone, attendance, classTime, assignment) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: "daily_update",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: attendance },
                { type: "text", text: classTime },
                { type: "text", text: assignment }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "WhatsApp Template Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = { sendWhatsAppMessage, sendWhatsAppTemplate };

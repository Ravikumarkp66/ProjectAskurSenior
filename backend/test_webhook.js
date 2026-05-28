const axios = require('axios');
const qs = require('qs');

async function testWebhook() {
  try {
    const data = qs.stringify({
      Body: '1',
      From: 'whatsapp:+919986577493'
    });
    const res = await axios.post('http://localhost:5000/api/whatsapp/webhook', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log(res.status, res.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}
testWebhook();

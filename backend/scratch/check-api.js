const axios = require('axios');
const fs = require('fs');

async function test() {
  try {
    const res = await axios.get('http://127.0.0.1:5000/api/experiences/companies');
    fs.writeFileSync('api_response.json', JSON.stringify(res.data, null, 2));
    console.log('Response saved to api_response.json');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();

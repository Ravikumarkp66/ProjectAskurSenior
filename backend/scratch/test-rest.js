require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function testREST() {
    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`, {
            model: "models/text-embedding-004",
            content: {
                parts: [{ text: "Hello" }]
            }
        });
        console.log("REST SUCCESS:", response.data);
    } catch (err) {
        console.error("REST ERROR:", err.response?.data || err.message);
    }
}

testREST();

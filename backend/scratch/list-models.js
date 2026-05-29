require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function listModels() {
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const models = response.data.models;
        for (const m of models) {
            if (m.name.includes('embedding')) {
                console.log(`Model: ${m.name}`);
                console.log(`Supported Methods: ${m.supportedGenerationMethods.join(', ')}`);
                console.log(`---`);
            }
        }
    } catch (err) {
        console.error('Failed to list models:', err.response?.data || err.message);
    }
}

listModels();

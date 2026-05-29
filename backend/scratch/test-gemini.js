require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent("Hello world");
        console.log(`${modelName} success! Dimensions: ${result.embedding.values.length}`);
    } catch (err) {
        console.error(`${modelName} failed:`, err.message);
    }
}

async function run() {
    await testModel("text-embedding-004");
    await testModel("embedding-001");
}

run();

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a vector embedding for a given text chunk using Gemini.
 * Model: gemini-embedding-001 (768 dimensions)
 * 
 * @param {string} text - The text to embed
 * @returns {Promise<Array<number>>} - The embedding vector
 */
const generateEmbedding = async (text) => {
    if (!text) return [];

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values; // Returns an array of 768 floats
    } catch (error) {
        console.error('Error generating Gemini embedding:', error.message);
        throw error;
    }
};

module.exports = { generateEmbedding };

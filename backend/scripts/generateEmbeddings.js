require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { generateEmbedding } = require('../services/geminiEmbeddingService');

// Optional sleep function to avoid rate limits if chunking thousands of files
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const processEmbeddings = async () => {
    console.log('Starting Gemini Embedding Pipeline...');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.\n');

        // Fetch unembedded chunks
        const chunksToEmbed = await KnowledgeChunk.find({ isEmbedded: false });

        if (chunksToEmbed.length === 0) {
            console.log('No unembedded chunks found. Exiting.');
            process.exit(0);
        }

        console.log(`Found ${chunksToEmbed.length} chunk(s) ready for embedding.`);

        let successCount = 0;
        let failCount = 0;

        for (const chunk of chunksToEmbed) {
            console.log(`\n-----------------------------------`);
            console.log(`Processing Chunk: ${chunk._id} (${chunk.title} - Index ${chunk.chunkIndex})`);

            try {
                if (!chunk.chunkText || chunk.chunkText.trim().length === 0) {
                    console.log('Chunk has no text. Skipping.');
                    continue;
                }

                // Generate vector embedding via Gemini API
                const vector = await generateEmbedding(chunk.chunkText);
                
                if (!vector || vector.length === 0) {
                    throw new Error("Received empty vector from Gemini API");
                }

                // Save vector to chunk
                chunk.embedding = vector;
                chunk.isEmbedded = true;
                chunk.embeddedAt = new Date();
                
                await chunk.save();

                console.log(`Embedding Generated (Dimensions: ${vector.length})`);
                console.log(`Saved Successfully.`);
                
                successCount++;

                // A tiny sleep to prevent hitting generous Gemini rate limits
                await sleep(500);
            } catch (err) {
                console.error(`Failed processing chunk ${chunk._id}:`, err.message);
                failCount++;
            }
        }

        console.log(`\n===================================`);
        console.log(`Embedding Pipeline Complete.`);
        console.log(`Successfully Processed: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        console.log(`Total Chunks Processed: ${successCount + failCount}`);
        console.log(`===================================`);

    } catch (error) {
        console.error('Database connection error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
};

processEmbeddings();

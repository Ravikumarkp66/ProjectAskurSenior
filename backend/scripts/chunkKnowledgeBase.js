require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { chunkText } = require('../utils/chunkText');

const CHUNK_SIZE = 400;
const OVERLAP = 80;

const processChunks = async () => {
    console.log('Starting Knowledge Base Chunking Pipeline...');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.\n');

        // Find documents that have been processed for text, but not yet chunked
        const pendingDocs = await KnowledgeDocument.find({
            isProcessed: true,
            isChunked: false
        });
        
        if (pendingDocs.length === 0) {
            console.log('No un-chunked documents found. Exiting.');
            process.exit(0);
        }

        console.log(`Found ${pendingDocs.length} document(s) ready for chunking.`);

        let successCount = 0;
        let failCount = 0;
        let totalChunksGenerated = 0;

        for (const doc of pendingDocs) {
            console.log(`\n-----------------------------------`);
            console.log(`Processing: ${doc.title} (${doc.category})`);

            try {
                if (!doc.extractedText || doc.extractedText.trim().length === 0) {
                    console.log('Document has no extracted text. Skipping.');
                    continue;
                }

                // Generate text chunks
                const chunks = chunkText(doc.extractedText, CHUNK_SIZE, OVERLAP);
                
                if (chunks.length === 0) {
                    console.log('No chunks generated. Skipping.');
                    continue;
                }

                // Delete any existing chunks for this document just in case (idempotency)
                await KnowledgeChunk.deleteMany({ documentId: doc._id });

                // Save new chunks
                const chunkPromises = chunks.map((text, index) => {
                    return KnowledgeChunk.create({
                        documentId: doc._id,
                        title: doc.title,
                        category: doc.category,
                        chunkText: text,
                        chunkIndex: index + 1,
                        wordCount: text.split(/\s+/).length
                    });
                });

                await Promise.all(chunkPromises);

                for (let i = 0; i < chunks.length; i++) {
                    console.log(`Created Chunk #${i + 1}`);
                }
                
                console.log(`\nTotal Chunks: ${chunks.length}`);

                // Update document status
                doc.isChunked = true;
                doc.chunkCount = chunks.length;
                await doc.save();
                
                console.log(`Completed Successfully.`);
                successCount++;
                totalChunksGenerated += chunks.length;

            } catch (err) {
                console.error(`Failed chunking ${doc.title}:`, err.message);
                failCount++;
            }
        }

        console.log(`\n===================================`);
        console.log(`Pipeline Complete.`);
        console.log(`Successfully Chunked Documents: ${successCount}`);
        console.log(`Failed Documents: ${failCount}`);
        console.log(`Total New Chunks Created: ${totalChunksGenerated}`);
        console.log(`===================================`);

    } catch (error) {
        console.error('Database connection error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
};

processChunks();

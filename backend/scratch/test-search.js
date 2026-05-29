require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { generateEmbedding } = require('../services/geminiEmbeddingService');

const testSearch = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const query = "attendance";
        
        console.log(`\n--- VECTOR SEARCH DEBUG ---`);
        console.log(`1. Query received: "${query}"`);
        
        const queryVector = await generateEmbedding(query);
        console.log(`2. Query embedding dimensions: ${queryVector?.length}`);

        const indexName = 'knowledge_chunks';
        console.log(`3. Atlas index name: ${indexName}`);
        
        const collectionName = KnowledgeChunk.collection.name;
        console.log(`4. Collection name: ${collectionName}`);

        const totalChunks = await KnowledgeChunk.countDocuments();
        console.log(`5. Total knowledgechunks count: ${totalChunks}`);

        const embeddedChunks = await KnowledgeChunk.countDocuments({ isEmbedded: true });
        console.log(`6. Count of embedded chunks: ${embeddedChunks}`);

        const pipeline = [
            {
                $vectorSearch: {
                    index: indexName,
                    path: 'embedding',
                    queryVector: queryVector,
                    numCandidates: 100,
                    limit: 5
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    category: 1,
                    chunkText: 1,
                    chunkIndex: 1,
                    score: { $meta: 'vectorSearchScore' }
                }
            }
        ];

        const results = await KnowledgeChunk.aggregate(pipeline);
        console.log(`7. Raw Atlas vector search response:`, JSON.stringify(results, null, 2));
        console.log(`---------------------------\n`);
        
    } catch (err) {
        console.error('8. Aggregation / Search error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

testSearch();

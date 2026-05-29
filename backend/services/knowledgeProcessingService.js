const axios = require('axios');
const pdfParse = require('pdf-parse');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { chunkText } = require('../utils/chunkText');
const { generateEmbedding } = require('./geminiEmbeddingService');

const CHUNK_SIZE = 400;
const OVERLAP = 80;

// Clean extracted text: remove excessive spaces, tabs, and multiple blank lines
const cleanText = (text) => {
    if (!text) return '';
    return text
        .replace(/\r\n/g, '\n')       // Normalize newlines
        .replace(/\t/g, ' ')          // Replace tabs with spaces
        .replace(/ +/g, ' ')          // Replace multiple spaces with a single space
        .replace(/\n\s*\n/g, '\n\n')  // Replace multiple blank lines with max 2
        .trim();
};

const processKnowledgeDocument = async (documentId) => {
    const startTime = Date.now();
    let doc;
    try {
        doc = await KnowledgeDocument.findById(documentId);
        if (!doc) throw new Error("Document not found");

        console.log(`[RAG-Pipeline] Starting automated processing for: ${doc.title}`);

        // 1. Download PDF
        console.log(`[RAG-Pipeline] Downloading PDF from S3: ${doc.fileUrl}`);
        const response = await axios.get(doc.fileUrl, {
            responseType: 'arraybuffer',
            timeout: 60000 // 1 min timeout
        });
        const buffer = Buffer.from(response.data);

        // 2. Extract Text
        console.log(`[RAG-Pipeline] Extracting text...`);
        const pdfData = await pdfParse(buffer);
        const extractedText = cleanText(pdfData.text);
        
        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("No text extracted from PDF. It might be a scanned image.");
        }

        doc.extractedText = extractedText;
        doc.isProcessed = true;

        // 3. Chunk Text
        console.log(`[RAG-Pipeline] Chunking text...`);
        const chunks = chunkText(extractedText, CHUNK_SIZE, OVERLAP);
        
        if (chunks.length === 0) {
            throw new Error("No chunks generated from extracted text.");
        }

        // Clean any potential existing chunks for this doc (idempotency)
        await KnowledgeChunk.deleteMany({ documentId: doc._id });

        // 4. Generate Embeddings and Save Chunks
        console.log(`[RAG-Pipeline] Generating embeddings for ${chunks.length} chunks...`);
        
        let successChunkCount = 0;
        for (let i = 0; i < chunks.length; i++) {
            const text = chunks[i];
            
            // Generate embedding via Gemini API
            const vector = await generateEmbedding(text);
            if (!vector || vector.length === 0) {
                throw new Error(`Failed to generate embedding for chunk ${i+1}`);
            }

            // Save chunk with embedding
            await KnowledgeChunk.create({
                documentId: doc._id,
                title: doc.title,
                category: doc.category,
                chunkText: text,
                chunkIndex: i + 1,
                wordCount: text.split(/\s+/).length,
                embedding: vector,
                isEmbedded: true,
                embeddedAt: new Date()
            });

            successChunkCount++;
        }

        // 5. Finalize Document Status
        const timeTakenMs = Date.now() - startTime;
        console.log(`[RAG-Pipeline] Processing complete in ${timeTakenMs}ms. Embedded ${successChunkCount} chunks.`);

        doc.isChunked = true;
        doc.chunkCount = successChunkCount;
        doc.processingStatus = 'ready';
        doc.processingTimeMs = timeTakenMs;
        doc.processedAt = new Date();

        await doc.save();
        return true;

    } catch (error) {
        console.error(`[RAG-Pipeline] Processing failed for ${documentId}:`, error);
        if (doc) {
            doc.processingStatus = 'failed';
            doc.processingTimeMs = Date.now() - startTime;
            await doc.save();
        }
        return false;
    }
};

module.exports = {
    processKnowledgeDocument
};

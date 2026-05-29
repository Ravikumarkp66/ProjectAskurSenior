require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const KnowledgeDocument = require('../models/KnowledgeDocument');

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

const processDocuments = async () => {
    console.log('Starting Knowledge Base Processing Pipeline...');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Find unprocessed documents
        const unprocessedDocs = await KnowledgeDocument.find({ isProcessed: false });
        
        if (unprocessedDocs.length === 0) {
            console.log('No unprocessed documents found. Exiting.');
            process.exit(0);
        }

        console.log(`Found ${unprocessedDocs.length} unprocessed document(s).`);

        let successCount = 0;
        let failCount = 0;

        for (const doc of unprocessedDocs) {
            console.log(`\n-----------------------------------`);
            console.log(`Processing: ${doc.title} (${doc.category})`);

            try {
                // Download PDF
                console.log(`Downloading PDF from S3...`);
                const response = await axios.get(doc.fileUrl, {
                    responseType: 'arraybuffer',
                    timeout: 60000 // 1 min timeout
                });
                
                const buffer = Buffer.from(response.data);
                console.log(`PDF Downloaded. Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

                // Extract Text
                console.log(`Extracting text...`);
                const pdfData = await pdfParse(buffer);
                const rawText = pdfData.text;

                // Clean Text
                const extractedText = cleanText(rawText);
                console.log(`Text Extracted. Characters: ${extractedText.length}`);

                // Save to MongoDB
                doc.extractedText = extractedText;
                doc.isProcessed = true;
                doc.processedAt = new Date();
                
                await doc.save();
                console.log(`Saved Successfully.`);
                successCount++;

            } catch (err) {
                console.error(`Failed processing ${doc.title}:`, err.message);
                failCount++;
            }
        }

        console.log(`\n===================================`);
        console.log(`Pipeline Complete.`);
        console.log(`Successfully Processed: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        console.log(`===================================`);

    } catch (error) {
        console.error('Database connection error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
};

processDocuments();

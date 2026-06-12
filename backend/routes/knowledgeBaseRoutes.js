const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3 } = require('../utils/s3');
const deleteFromS3 = require('../utils/deleteFromS3');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { generateEmbedding } = require('../services/geminiEmbeddingService');
const { processKnowledgeDocument } = require('../services/knowledgeProcessingService');
const { checkToxicity } = require('../services/aiModerationService');
const { processAcademicCalculation } = require('../services/academicCalculator');
const { performMaterialSearch } = require('../controllers/materialController');
const User = require('../models/User');
const ChatbotMessage = require('../models/ChatbotMessage');
const FaqCache = require('../models/FaqCache');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
const { routeQuestion } = require('../services/askPlusRouter');
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Generate Presigned URL for direct S3 upload
router.get('/upload-url', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { fileName, fileType, category } = req.query;

        if (!fileName || !fileType || !category) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        if (fileType !== 'application/pdf') {
            return res.status(400).json({ error: 'Only PDF files are allowed' });
        }

        const cleanCategory = category.toLowerCase().replace(/ /g, '-');
        const s3Key = `knowledge-base/${cleanCategory}/${Date.now()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            ContentType: fileType
        });

        // URL expires in 5 minutes
        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        res.json({
            uploadUrl,
            s3Key,
            fileUrl: `https://d2mh2rnmjqdkgx.cloudfront.net/${s3Key}`
        });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

// Save metadata after successful S3 upload
router.post('/upload', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, category, fileUrl, s3Key, fileSize } = req.body;

        if (!title || !category || !fileUrl || !s3Key || !fileSize) {
            return res.status(400).json({ error: 'Missing required metadata fields' });
        }

        const newDoc = new KnowledgeDocument({
            title,
            category,
            fileUrl,
            s3Key,
            fileSize,
            uploadedBy: req.userId
        });

        await newDoc.save();

        // Trigger processing pipeline asynchronously (don't await)
        processKnowledgeDocument(newDoc._id).catch(err => {
            console.error("Async processing error:", err);
        });

        res.status(201).json({
            message: 'Knowledge document metadata saved successfully. Processing started.',
            document: newDoc
        });
    } catch (error) {
        console.error('Error saving knowledge document metadata:', error);
        res.status(500).json({ error: 'Failed to save document metadata' });
    }
});

// Get all knowledge documents and stats
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const documents = await KnowledgeDocument.find()
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });

        // Calculate stats
        const totalDocuments = documents.length;
        const processedDocuments = documents.filter(doc => doc.isProcessed).length;
        const chunkedDocuments = documents.filter(doc => doc.isChunked).length;
        const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0);
        
        res.json({
            documents,
            stats: {
                total: totalDocuments,
                processed: processedDocuments,
                chunked: chunkedDocuments,
                totalChunks
            }
        });
    } catch (error) {
        console.error('Error fetching knowledge documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Delete a knowledge document
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const document = await KnowledgeDocument.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from S3
        if (document.s3Key) {
            try {
                await deleteFromS3(document.s3Key);
            } catch (err) {
                console.error(`Failed to delete S3 object: ${document.s3Key}`, err);
                // Continue with DB deletion even if S3 fails (maybe it was already deleted)
            }
        }

        // Delete from MongoDB
        await KnowledgeDocument.findByIdAndDelete(req.params.id);

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting knowledge document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Temporary endpoint for testing vector search
router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        console.log(`\n--- VECTOR SEARCH DEBUG ---`);
        console.log(`1. Query received: "${query}"`);
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // 1. Generate embedding for query using Gemini
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

        // 2. Search MongoDB Vector Index
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

        res.json({
            query,
            results
        });

    } catch (error) {
        console.error('8. Aggregation / Search error:', error);
        res.status(500).json({ error: 'Failed to perform semantic search' });
    }
});

// Temporary endpoint for testing Groq
router.get("/test-groq", async (req, res) => {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: "What is SGPA?"
                }
            ]
        });

        res.json({ content: response.choices[0].message.content });
    } catch (error) {
        console.error("Groq Test Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// RAG Answer Generation Endpoint (SSE Stream)
router.post('/ask', authMiddleware, async (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendSSE = (payload) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
        const { question } = req.body;
        console.log(`\n--- ASK+ INTELLIGENCE LAYER DEBUG ---`);
        console.log(`1. Question received: "${question}"`);

        if (!question) {
            sendSSE({ error: 'Question is required' });
            return res.end();
        }

        // --- 1. User & Ban Check ---
        const user = await User.findById(req.userId);
        if (!user) {
            sendSSE({ error: 'User not found' });
            return res.end();
        }

        if (user.chatBanUntil && user.chatBanUntil > new Date()) {
            sendSSE({ 
                error: 'Account Banned', 
                answer: `Your account is temporarily banned from ASK+ until ${new Date(user.chatBanUntil).toLocaleString()} due to abusive behavior.`
            });
            return res.end();
        }

        // --- 2. Moderation Check ---
        const modResult = await checkToxicity(question);
        
        let newBan = null;
        if (modResult.points > 0) {
            user.demeritPoints += modResult.points;
            if (user.demeritPoints >= 60) {
                newBan = new Date(Date.now() + 99 * 365 * 24 * 60 * 60 * 1000);
            } else if (user.demeritPoints >= 40) {
                newBan = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            } else if (user.demeritPoints >= 20) {
                newBan = new Date(Date.now() + 24 * 60 * 60 * 1000);
            }

            if (newBan) user.chatBanUntil = newBan;
            await user.save();
        }

        await ChatbotMessage.create({
            userId: user._id,
            message: question,
            toxicityScore: modResult.points,
            demeritsAwarded: modResult.points,
            flags: modResult.flags
        });

        if (newBan) {
            sendSSE({ answer: `Your message was flagged for severe toxicity. Your account is banned until ${newBan.toLocaleString()}.`, sources: [] });
            return res.end();
        }
        if (modResult.points >= 5) {
            sendSSE({ answer: `Your message was flagged for inappropriate content. You received ${modResult.points} demerit points.`, sources: [] });
            return res.end();
        }

        // --- Limit Check (20 questions / day) ---
        const today = new Date().setHours(0, 0, 0, 0);
        const userLastDate = user.lastAiQuestionDate ? new Date(user.lastAiQuestionDate).setHours(0, 0, 0, 0) : null;
        if (userLastDate === today && user.dailyAiQuestionsCount >= 20) {
            sendSSE({
                type: "limit_reached",
                answer: "You have reached your limit of 20 AI questions for today. You can still search for materials, preview PDFs, and download files unlimitedly! Please come back tomorrow.",
                sources: [],
                materials: []
            });
            return res.end();
        }

        const normalizedQuestion = question.toLowerCase().trim();

        // --- INTENT ROUTER ---
        const routing = await routeQuestion(question);
        console.log("2. Detected Intent:", routing);
        const { intent, entities } = routing;

        // Increment usage limit now that we are processing
        if (userLastDate === today) {
            user.dailyAiQuestionsCount = (user.dailyAiQuestionsCount || 0) + 1;
        } else {
            user.dailyAiQuestionsCount = 1;
            user.lastAiQuestionDate = new Date();
        }
        await user.save();

        // --- CALCULATOR FLOW ---
        if (intent === 'calculator') {
            const calcResult = await processAcademicCalculation(question);
            if (calcResult) {
                sendSSE({ type: "calculator", answer: calcResult, sources: [], materials: [] });
                return res.end();
            }
        }

        // --- MENTORSHIP FLOW ---
        if (intent === 'mentorship') {
            sendSSE({
                type: "mentorship_required",
                answer: "💡 I can see you're looking for personalized guidance.\n\nSince this requires specific advice tailored to you, I highly recommend connecting directly with a Senior Mentor.",
                sources: [],
                materials: []
            });
            return res.end();
        }

        // --- MATERIAL FLOW ---
        if (intent === 'material') {
            if (!entities.subject) {
                sendSSE({
                    type: "material_disambiguation_subject",
                    answer: "📚 I'd be happy to help you find materials. Which subject are you looking for?",
                    suggestions: ["DBMS", "ADA", "CN", "Java", "Mathematics", "OS", "AIML"],
                    sources: [],
                    materials: []
                });
                return res.end();
            }

            if (!entities.branch && !entities.semester && (normalizedQuestion.includes("notes") || normalizedQuestion.includes("pyq"))) {
                // If it's too broad
                sendSSE({
                    type: "material_disambiguation_branch_sem",
                    answer: `📚 I found multiple resources for ${entities.subject}. Please help me narrow down your search by selecting your Branch and Semester.`,
                    subject: entities.subject,
                    sources: [],
                    materials: []
                });
                return res.end();
            }

            const foundMaterials = await performMaterialSearch(question);
            if (foundMaterials.length > 0) {
                sendSSE({
                    type: "material_search",
                    answer: `📚 ${entities.subject || 'Materials'} Found\n\nFound ${foundMaterials.length} Resources.`,
                    materials: foundMaterials,
                    sources: []
                });
            } else {
                sendSSE({
                    type: "material_missing",
                    answer: `😔 I couldn't find matching materials for ${entities.subject || 'this subject'}.\n\nWe are continuously working with seniors and contributors to expand and verify our academic repository.`,
                    materials: [],
                    sources: []
                });
            }
            return res.end();
        }

        // --- INTERVIEW FLOW ---
        if (intent === 'interview') {
            if (!entities.company) {
                sendSSE({
                    type: "interview_search",
                    answer: "Please specify which company you want to know about. (e.g., 'Did Amazon visit SIT?')",
                    sources: [],
                    materials: []
                });
                return res.end();
            }

            const companyRegex = new RegExp(entities.company, 'i');
            const foundCompany = await Company.findOne({ name: companyRegex });

            if (!foundCompany) {
                sendSSE({
                    type: "company_missing",
                    answer: `🔍 I couldn't find verified interview experiences for ${entities.company} in our repository.\n\nThis does not necessarily mean the company never visited. Our team relies on student-submitted experiences.`,
                    sources: [],
                    materials: []
                });
                return res.end();
            }

            const experiences = await Experience.find({ companyId: foundCompany._id });
            if (experiences.length === 0) {
                sendSSE({
                    type: "company_missing",
                    answer: `🔍 I couldn't find verified interview experiences for ${foundCompany.name}.\n\nThis does not necessarily mean the company never visited.`,
                    sources: [],
                    materials: []
                });
                return res.end();
            }

            // Extract CTCs
            let ctcValues = [];
            let roles = new Set();
            experiences.forEach(exp => {
                roles.add(exp.role);
                // Simple parser to extract numbers from "22 LPA" or "22"
                const match = exp.ctc.match(/(\d+(\.\d+)?)/);
                if (match) ctcValues.push(parseFloat(match[1]));
            });

            let ctcInsights = "";
            if (ctcValues.length > 0) {
                const min = Math.min(...ctcValues);
                const max = Math.max(...ctcValues);
                const avg = (ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length).toFixed(1);
                ctcInsights = `\n\n💰 ${foundCompany.name} Compensation Insights\n\nBased on recorded student experiences:\n\nLowest Mentioned: ${min} LPA\nAverage Mentioned: ${avg} LPA\nHighest Mentioned: ${max} LPA\n\n⚠ Values may vary by year, role and hiring cycle.`;
            }

            sendSSE({
                type: "interview_search",
                answer: `💼 ${foundCompany.name} Placement Insights\n\nYes, ${foundCompany.name} appears in verified placement experiences shared by SIT students.\n\n📊 Quick Overview\nExperiences Found: ${experiences.length}\nRoles:\n${Array.from(roles).map(r => `• ${r}`).join('\n')}${ctcInsights}`,
                sources: ["Interview Experiences Collection"],
                materials: []
            });
            return res.end();
        }

        // --- RULEBOOK & GENERAL RAG FLOW ---
        const cachedFaq = await FaqCache.findOne({ question: normalizedQuestion });
        if (cachedFaq) {
            sendSSE({ type: "rag", answer: cachedFaq.answer, sources: cachedFaq.sources, materials: [], cached: true });
            return res.end();
        }

        let queryVector = await generateEmbedding(question);
        const pipeline = [
            { $vectorSearch: { index: 'knowledge_chunks', path: 'embedding', queryVector: queryVector, numCandidates: 100, limit: 5 } },
            { $project: { _id: 1, title: 1, chunkText: 1, score: { $meta: 'vectorSearchScore' } } }
        ];
        const chunks = await KnowledgeChunk.aggregate(pipeline);
        const contextText = chunks.map((c, i) => `[Source ${i + 1}: ${c.title}]\n${c.chunkText}`).join('\n\n');
        const sources = [...new Set(chunks.map(c => c.title))];

        const ragStream = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are ASK+, the official academic assistant for AskUrSenior.
Your job is to provide accurate, concise, structured answers using the retrieved knowledge base documents.

CRITICAL RULES:
1. Never hallucinate. If the context does not contain the answer, you MUST return exactly the string: "LOW_CONFIDENCE_FALLBACK" and nothing else.
2. For Rulebook Questions: Use headers 📖 Rule, ⚠ Important Notes, ✅ Summary.
3. For General Questions: Provide 🎯 Direct Answer, 📖 Details, ✅ Final Result.
4. Keep it concise.`
                },
                {
                    role: "user",
                    content: `CONTEXT:\n${contextText}\n\nQUESTION:\n${question}`
                }
            ],
            temperature: 0.1,
            stream: true
        });

        let fullAnswer = "";
        let isStarted = false;

        for await (const chunk of ragStream) {
            const text = chunk.choices[0]?.delta?.content || "";
            fullAnswer += text;

            if (!isStarted) {
                // Wait until we have enough chars to verify it's not the fallback string
                if (fullAnswer.length > 25 || (!fullAnswer.startsWith("L") && !fullAnswer.startsWith("LOW"))) {
                    isStarted = true;
                    sendSSE({ type: "rag_start" });
                    sendSSE({ type: "chunk", text: fullAnswer });
                }
            } else {
                if (text) {
                    sendSSE({ type: "chunk", text });
                }
            }
        }

        if (!isStarted) {
            // Stream ended very quickly. Check for fallback.
            if (fullAnswer.includes("LOW_CONFIDENCE_FALLBACK") || fullAnswer.trim() === "LOW_CONFIDENCE_FALLBACK") {
                sendSSE({
                    type: "mentorship_required",
                    answer: `⚠ I couldn't find enough verified information to answer confidently.\n\n🎓 Need Personalized Help?\nConnect with a Senior Mentor.`,
                    sources: [],
                    materials: []
                });
            } else {
                // It was just a very short valid answer
                sendSSE({ type: "rag_start" });
                sendSSE({ type: "chunk", text: fullAnswer });
                sendSSE({ type: "rag_end", sources, materials: [] });
                if (fullAnswer) {
                    FaqCache.create({ question: normalizedQuestion, answer: fullAnswer, sources }).catch(e => null);
                }
            }
        } else {
            sendSSE({ type: "rag_end", sources, materials: [] });
            if (fullAnswer) {
                FaqCache.create({ question: normalizedQuestion, answer: fullAnswer, sources }).catch(e => null);
            }
        }

        return res.end();

    } catch (error) {
        console.error('Error in /ask endpoint:', error);
        sendSSE({ error: 'Failed to generate answer' });
        res.end();
    }
});

module.exports = router;

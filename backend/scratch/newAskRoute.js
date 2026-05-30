// RAG Answer Generation Endpoint
router.post('/ask', authMiddleware, async (req, res) => {
    try {
        const { question } = req.body;
        console.log(`\n--- ASK+ INTELLIGENCE LAYER DEBUG ---`);
        console.log(`1. Question received: "${question}"`);

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        // --- 1. User & Ban Check ---
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.chatBanUntil && user.chatBanUntil > new Date()) {
            return res.status(403).json({ 
                error: 'Account Banned', 
                answer: `Your account is temporarily banned from ASK+ until ${new Date(user.chatBanUntil).toLocaleString()} due to abusive behavior.`
            });
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
            return res.json({ answer: `Your message was flagged for severe toxicity. Your account is banned until ${newBan.toLocaleString()}.`, sources: [] });
        }
        if (modResult.points >= 5) {
            return res.json({ answer: `Your message was flagged for inappropriate content. You received ${modResult.points} demerit points.`, sources: [] });
        }

        // --- Limit Check (20 questions / day) ---
        const today = new Date().setHours(0, 0, 0, 0);
        const userLastDate = user.lastAiQuestionDate ? new Date(user.lastAiQuestionDate).setHours(0, 0, 0, 0) : null;
        if (userLastDate === today && user.dailyAiQuestionsCount >= 20) {
            return res.json({
                type: "limit_reached",
                answer: "You have reached your limit of 20 AI questions for today. You can still search for materials, preview PDFs, and download files unlimitedly! Please come back tomorrow.",
                sources: [],
                materials: []
            });
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
                return res.json({ type: "calculator", answer: calcResult, sources: [], materials: [] });
            }
        }

        // --- MENTORSHIP FLOW ---
        if (intent === 'mentorship') {
            return res.json({
                type: "mentorship_required",
                answer: "💡 I can see you're looking for personalized guidance.\n\nSince this requires specific advice tailored to you, I highly recommend connecting directly with a Senior Mentor.",
                sources: [],
                materials: []
            });
        }

        // --- MATERIAL FLOW ---
        if (intent === 'material') {
            if (!entities.subject) {
                return res.json({
                    type: "material_disambiguation_subject",
                    answer: "📚 I'd be happy to help you find materials. Which subject are you looking for?",
                    suggestions: ["DBMS", "ADA", "CN", "Java", "Mathematics", "OS", "AIML"],
                    sources: [],
                    materials: []
                });
            }

            if (!entities.branch && !entities.semester && (normalizedQuestion.includes("notes") || normalizedQuestion.includes("pyq"))) {
                // If it's too broad
                return res.json({
                    type: "material_disambiguation_branch_sem",
                    answer: `📚 I found multiple resources for ${entities.subject}. Please help me narrow down your search by selecting your Branch and Semester.`,
                    subject: entities.subject,
                    sources: [],
                    materials: []
                });
            }

            const foundMaterials = await performMaterialSearch(question);
            if (foundMaterials.length > 0) {
                return res.json({
                    type: "material_search",
                    answer: `📚 ${entities.subject || 'Materials'} Found\n\nFound ${foundMaterials.length} Resources.`,
                    materials: foundMaterials,
                    sources: []
                });
            } else {
                return res.json({
                    type: "material_missing",
                    answer: `😔 I couldn't find matching materials for ${entities.subject || 'this subject'}.\n\nWe are continuously working with seniors and contributors to expand and verify our academic repository.`,
                    materials: [],
                    sources: []
                });
            }
        }

        // --- INTERVIEW FLOW ---
        if (intent === 'interview') {
            if (!entities.company) {
                return res.json({
                    type: "interview_search",
                    answer: "Please specify which company you want to know about. (e.g., 'Did Amazon visit SIT?')",
                    sources: [],
                    materials: []
                });
            }

            const companyRegex = new RegExp(entities.company, 'i');
            const foundCompany = await Company.findOne({ name: companyRegex });

            if (!foundCompany) {
                return res.json({
                    type: "company_missing",
                    answer: `🔍 I couldn't find verified interview experiences for ${entities.company} in our repository.\n\nThis does not necessarily mean the company never visited. Our team relies on student-submitted experiences.`,
                    sources: [],
                    materials: []
                });
            }

            const experiences = await Experience.find({ companyId: foundCompany._id });
            if (experiences.length === 0) {
                return res.json({
                    type: "company_missing",
                    answer: `🔍 I couldn't find verified interview experiences for ${foundCompany.name}.\n\nThis does not necessarily mean the company never visited.`,
                    sources: [],
                    materials: []
                });
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

            return res.json({
                type: "interview_search",
                answer: `💼 ${foundCompany.name} Placement Insights\n\nYes, ${foundCompany.name} appears in verified placement experiences shared by SIT students.\n\n📊 Quick Overview\nExperiences Found: ${experiences.length}\nRoles:\n${Array.from(roles).map(r => `• ${r}`).join('\n')}${ctcInsights}`,
                sources: ["Interview Experiences Collection"],
                materials: []
            });
        }

        // --- RULEBOOK & GENERAL RAG FLOW ---
        const cachedFaq = await FaqCache.findOne({ question: normalizedQuestion });
        if (cachedFaq) {
            return res.json({ type: "rag", answer: cachedFaq.answer, sources: cachedFaq.sources, materials: [], cached: true });
        }

        let queryVector = await generateEmbedding(question);
        const pipeline = [
            { $vectorSearch: { index: 'knowledge_chunks', path: 'embedding', queryVector: queryVector, numCandidates: 100, limit: 5 } },
            { $project: { _id: 1, title: 1, chunkText: 1, score: { $meta: 'vectorSearchScore' } } }
        ];
        const chunks = await KnowledgeChunk.aggregate(pipeline);
        const contextText = chunks.map((c, i) => `[Source ${i + 1}: ${c.title}]\n${c.chunkText}`).join('\n\n');
        const sources = [...new Set(chunks.map(c => c.title))];

        const ragResponse = await groq.chat.completions.create({
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
            temperature: 0.1
        });

        let answer = ragResponse.choices[0].message.content.trim();

        if (answer === "LOW_CONFIDENCE_FALLBACK" || answer.includes("LOW_CONFIDENCE_FALLBACK")) {
            return res.json({
                type: "mentorship_required",
                answer: `⚠ I couldn't find enough verified information to answer confidently.\n\n🎓 Need Personalized Help?\nConnect with a Senior Mentor.`,
                sources: [],
                materials: []
            });
        }

        if (answer) {
            FaqCache.create({ question: normalizedQuestion, answer: answer, sources: sources }).catch(e => null);
        }

        res.json({
            type: "rag",
            answer,
            sources,
            materials: []
        });

    } catch (error) {
        console.error('Error in /ask endpoint:', error);
        res.status(500).json({ error: 'Failed to generate answer' });
    }
});

module.exports = router;

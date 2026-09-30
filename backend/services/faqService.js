const Faq = require('../models/Faq');

const initialFaqs = [
    // 1. Getting Started
    { category: 'Getting Started', order: 1, question: 'What is AskUrSenior?', answer: 'AskUrSenior is an all-in-one student platform built specifically for Siddaganga Institute of Technology. It brings together subject study materials, solved previous year question papers (PYQs), section timetables, attendance tracking with the 85% SIT rule, CIE mark analyzer, coding playground for lab manual programs, and verified senior interview experiences in one centralized place.' },
    { category: 'Getting Started', order: 2, question: 'Who can use AskUrSenior?', answer: 'Any student currently studying at Siddaganga Institute of Technology can create an account using their college or personal email. Core study materials, calculators, roadmaps, and community access are free, while advanced semester management tools are part of AskUrSenior Plus.' },
    { category: 'Getting Started', order: 3, question: 'Is AskUrSenior free to use?', answer: 'Yes! Core features such as subject study materials, solved SEE question papers, SGPA/CGPA calculators, campus map, and student community discussions are completely free forever.' },

    // 2. Academic Tools
    { category: 'Academic Tools', order: 1, question: 'How does the Smart Attendance Tracker work?', answer: 'It automatically synchronizes with your department and section timetable, supports lab-batch filtering (B1/B2/B3), enforces SIT’s 85% attendance policy, calculates your exact safe bunk margin ("Can Miss"), and displays your daily schedule in real-time.' },
    { category: 'Academic Tools', order: 2, question: 'What does the CIE Analyzer do?', answer: 'The CIE Analyzer handles 50-mark normalization using Best-of-N internal test scores and IPCC theory/lab split ratios. It then calculates the exact SEE exam marks required to maintain or achieve your target semester grade (O, A+, A, B).' },
    { category: 'Academic Tools', order: 3, question: 'What is the Branch Change Predictor?', answer: 'The Branch Change Predictor compares your 1st-year CGPA against historical SIT department cutoffs to determine transfer odds and your live CGPA gap (Δ).' },
    { category: 'Academic Tools', order: 4, question: 'What is the Pre-Exam Eligibility Checker?', answer: 'It audits your dual compliance (minimum 85% attendance across subjects + minimum 20/50 aggregate CIE marks) to verify that you meet all SIT hall-ticket eligibility requirements.' },

    // 3. Coding & Labsets
    { category: 'Coding & Labsets', order: 1, question: 'What is the Monaco Coding Playground?', answer: 'An in-browser code editor supporting C, C++, Java, and Python. It is tailored for SIT engineering students to practice coding without local compiler setup issues.' },
    { category: 'Coding & Labsets', order: 2, question: 'Are college lab manual problem sets included?', answer: 'Yes, official college lab manual problems are organized with automated test cases, reference implementations, and custom input/output runners.' },

    // 4. Study Materials & PYQs
    { category: 'Study Materials & PYQs', order: 1, question: 'What study materials are available on AskUrSenior?', answer: 'High-quality lecture notes, module-wise question banks, lab manuals, formula sheets, and toppers’ reference notes categorized by SIT engineering branches and schemes.' },
    { category: 'Study Materials & PYQs', order: 2, question: 'Are solved Previous Year Question Papers (PYQs) available?', answer: 'Yes, Semester End Exam (SEE) question papers from previous years are provided with step-by-step solutions and mathematical proofs.' },
    { category: 'Study Materials & PYQs', order: 3, question: 'Can students contribute notes or interview logs?', answer: 'Yes! Students can upload verified notes or share their company placement interview experiences directly through the platform.' },

    // 5. AskUrSenior Plus
    { category: 'AskUrSenior Plus', order: 1, question: 'What is AskUrSenior Plus?', answer: 'AskUrSenior Plus is our premium semester toolkit that unlocks section timetable syncing, attendance deficit planners, CIE & target SEE forecasters, branch change predictors, lab coding playgrounds, and 1-credit subject quizzes.' },
    { category: 'AskUrSenior Plus', order: 2, question: 'Is Plus a one-time semester payment or recurring subscription?', answer: 'Plus is a simple one-time payment for the entire semester. There are zero auto-renewals, zero recurring credit card deductions, and no hidden fees.' },
    { category: 'AskUrSenior Plus', order: 3, question: 'What happens when my Plus semester pass ends?', answer: 'Your account automatically reverts to AskUrSenior Free with zero data loss. Your notes, saved resources, and free tools remain accessible forever.' },
    { category: 'AskUrSenior Plus', order: 4, question: 'Is Plus worth it for first-year students?', answer: 'Yes! First-year students get instant access to 1st/2nd sem subject notes, credit calculators, timetable sync, and branch change predictors.' },

    // 6. Placements & Interviews
    { category: 'Placements & Interviews', order: 1, question: 'What are Senior Interview Experiences?', answer: 'Detailed interview logs submitted by placed SIT seniors, containing round breakdowns, coding questions, Online Assessment (OA) topics, and technical/HR interview tips for top recruiters.' },
    { category: 'Placements & Interviews', order: 2, question: 'Are company eligibility cutoffs provided?', answer: 'Yes, historical CGPA cutoffs and eligible branches for companies visiting SIT campus placements are listed for quick reference.' },

    // 7. Campus & Community
    { category: 'Campus & Community', order: 1, question: 'What campus tools are available?', answer: 'CGPA/SGPA Calculator, CIE Analyzer, Eligibility Checker, Year Back Predictor, Interactive Campus Map, and Lost & Found portal.' },
    { category: 'Campus & Community', order: 2, question: 'Who are the Community Contributors?', answer: 'Senior students and alumni who voluntarily share notes, guide freshers, post interview experiences, and support SIT juniors.' },
    { category: 'Campus & Community', order: 3, question: 'How does Campus Explorer work?', answer: 'Campus Explorer provides interactive map layouts of SIT blocks, departments, canteens, libraries, and auditoriums.' },

    // 8. Account & Security
    { category: 'Account & Security', order: 1, question: 'Is my personal academic data private?', answer: 'Yes. Your personal contact information and internal academic grades are strictly confidential and encrypted.' },
    { category: 'Account & Security', order: 2, question: 'Can I update my branch, semester, and section?', answer: 'Yes, you can update your department branch, semester, section, and elective preferences at any time from your Account Settings.' },
    { category: 'Account & Security', order: 3, question: 'Can I sign in with Google?', answer: 'Yes, fast 1-click Google OAuth sign-in is fully supported for SIT student emails.' }
];

class FaqService {
    /**
     * Seeds or cleans FAQs to ensure no stale Ask+ / AI data persists in MongoDB.
     */
    async seedFaqsIfEmpty() {
        try {
            // Delete legacy / AI / Ask+ FAQ categories if present in DB
            await Faq.deleteMany({
                $or: [
                    { category: 'Ask+ AI Assistant' },
                    { category: 'AI Assistant' },
                    { question: { $regex: /Ask\+|RAG|ChatGPT|AI Assistant|AI queries|AI query/i } },
                    { answer: { $regex: /Ask\+|RAG|ChatGPT|AI Assistant|AI queries|AI query/i } }
                ]
            });

            const count = await Faq.countDocuments();
            if (count === 0) {
                console.log(`🌱 Seeding ${initialFaqs.length} FAQs into MongoDB...`);
                await Faq.insertMany(initialFaqs.map(item => ({ ...item, isPublished: true })));
                console.log('✅ FAQs seeded successfully.');
            }
        } catch (error) {
            console.error('❌ Error seeding FAQs:', error.message);
        }
    }

    /**
     * Get grouped published FAQs by category sorted by order.
     */
    async getGroupedFaqs() {
        await this.seedFaqsIfEmpty();
        const faqs = await Faq.find({ isPublished: true }).sort({ category: 1, order: 1 });

        // Group by category while preserving category order
        const categoryMap = {};
        for (const item of faqs) {
            if (!categoryMap[item.category]) {
                categoryMap[item.category] = [];
            }
            categoryMap[item.category].push({
                id: item._id,
                question: item.question,
                answer: item.answer,
                order: item.order
            });
        }

        return categoryMap;
    }
}

module.exports = new FaqService();

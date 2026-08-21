const Faq = require('../models/Faq');

const initialFaqs = [
    // 1. Getting Started
    { category: 'Getting Started', order: 1, question: 'What is AskUrSenior?', answer: 'AskUrSenior is an all-in-one student platform built specifically for Siddaganga Institute of Technology. It brings together study materials, previous year question papers, AI assistance, interview experiences, faculty profiles, campus tools, and student guidance in one place.' },
    { category: 'Getting Started', order: 2, question: 'Who can use AskUrSenior?', answer: 'Any student studying at Siddaganga Institute of Technology can create an account and use the platform. Some premium features are available through AskUrSenior Plus.' },
    { category: 'Getting Started', order: 3, question: 'Is AskUrSenior free to use?', answer: 'Yes. Many core features such as study materials, campus tools, faculty profiles, blogs, and calculators are available for free. Premium features are unlocked through AskUrSenior Plus.' },

    // 2. Study Materials
    { category: 'Study Materials', order: 1, question: 'What kind of study materials are available?', answer: 'High-quality module notes, lab manuals, assignment solutions, formula sheets, and toppers notes for all SIT engineering branches.' },
    { category: 'Study Materials', order: 2, question: 'Are previous year question papers available?', answer: 'Yes, we provide organized Semester End Exam (SEE) and internal test question papers categorized by scheme and semester.' },
    { category: 'Study Materials', order: 3, question: 'Who uploads and verifies the study materials?', answer: 'Materials are uploaded by verified toppers, senior students, and community leads, then checked for accuracy.' },
    { category: 'Study Materials', order: 4, question: 'How often are new materials added?', answer: 'Study resources and exam updates are added continuously every week based on current semester syllabus changes.' },
    { category: 'Study Materials', order: 5, question: 'Can I contribute notes or PYQs?', answer: 'Absolutely! You can upload notes through your student dashboard or submit them directly to community admins.' },

    // 3. AskUrSenior Plus
    { category: 'AskUrSenior Plus', order: 1, question: 'What is AskUrSenior Plus?', answer: 'AskUrSenior Plus is our premium membership plan providing unlimited AI queries, exclusive topper notes, priority download bandwidth, and advanced career insights.' },
    { category: 'AskUrSenior Plus', order: 2, question: 'What features are included in Plus?', answer: 'Unlimited Ask+ RAG questions, premium SEE question banks with answer keys, company cutoff predictor, and priority support.' },
    { category: 'AskUrSenior Plus', order: 3, question: 'Will I receive future premium updates?', answer: 'Yes, all active Plus subscribers automatically get access to new tools and feature releases at no extra charge.' },
    { category: 'AskUrSenior Plus', order: 4, question: 'Can I cancel my subscription?', answer: 'Yes, you can manage or cancel your subscription at any time directly from your account settings.' },
    { category: 'AskUrSenior Plus', order: 5, question: 'Is Plus worth it for first-year students?', answer: 'Yes! First-year students get instant access to 1st/2nd sem subject notes, credit calculators, and branch change predictors.' },

    // 4. Ask+ AI Assistant
    { category: 'Ask+ AI Assistant', order: 1, question: 'What is Ask+?', answer: 'Ask+ is our custom AI study assistant trained specifically on SIT syllabus data, academic rules, and course materials.' },
    { category: 'Ask+ AI Assistant', order: 2, question: 'How is Ask+ different from ChatGPT?', answer: 'Unlike general ChatGPT, Ask+ uses Retrieval-Augmented Generation (RAG) on verified SIT notes, past papers, and university guidelines.' },
    { category: 'Ask+ AI Assistant', order: 3, question: 'How many AI questions can I ask every day?', answer: 'Free accounts get daily query credits, while AskUrSenior Plus members enjoy unlimited AI chat access.' },
    { category: 'Ask+ AI Assistant', order: 4, question: 'Can Ask+ answer SIT-specific academic questions?', answer: 'Yes, Ask+ is specifically fine-tuned on SIT syllabus modules, credit grading policies, and internal marks evaluation formulas.' },
    { category: 'Ask+ AI Assistant', order: 5, question: 'What happens after my AI credits are exhausted?', answer: 'Daily credits refresh automatically every 24 hours, or you can upgrade to Plus for uninterrupted access.' },

    // 5. Campus Tools
    { category: 'Campus Tools', order: 1, question: 'What campus tools are available?', answer: 'CGPA/SGPA Calculator, CIE Analyzer, Eligibility Checker, Year Back Predictor, Interactive Campus Map, and Lost & Found portal.' },
    { category: 'Campus Tools', order: 2, question: 'Can I use the CGPA calculator for free?', answer: 'Yes, the CGPA and SGPA calculators are 100% free and calibrated to SIT choice-based credit policies.' },
    { category: 'Campus Tools', order: 3, question: 'How does Campus Explorer work?', answer: 'Campus Explorer provides interactive 2D/3D map layouts of SIT blocks, departments, canteens, libraries, and auditoriums.' },
    { category: 'Campus Tools', order: 4, question: 'What is the Lost & Found feature?', answer: 'A dedicated portal where students can post lost or found items on campus to quickly reconnect with their owners.' },
    { category: 'Campus Tools', order: 5, question: 'What are Faculty Profiles?', answer: 'Anonymous student feedback and insights on faculty teaching methods, lab evaluations, and elective guidance.' },

    // 6. Community
    { category: 'Community', order: 1, question: 'Who are the Community Contributors?', answer: 'Senior students and alumni who voluntarily share notes, guide freshers, post interview experiences, and support SIT juniors.' },
    { category: 'Community', order: 2, question: 'How can I become a Community Contributor?', answer: 'Active students who regularly contribute verified notes, write interview logs, or help in support channels are awarded Contributor badges.' },
    { category: 'Community', order: 3, question: 'Can I upload study materials?', answer: 'Yes! You can submit PDFs and notes through your user upload panel.' },
    { category: 'Community', order: 4, question: 'Can I share interview experiences?', answer: 'Yes, placed seniors can share their company interview rounds, coding questions, and prep tips to help juniors prepare.' },
    { category: 'Community', order: 5, question: 'How are contributed resources verified?', answer: 'Submissions undergo peer verification by domain leads before being published live on the platform.' },

    // 7. Account & Privacy
    { category: 'Account & Privacy', order: 1, question: 'Can I sign in with Google?', answer: 'Yes, fast 1-click Google OAuth sign-in is fully supported for all SIT student emails.' },
    { category: 'Account & Privacy', order: 2, question: 'Is my personal information secure?', answer: 'Yes, we use industry-standard encryption, strict access controls, and private database configurations to protect student data.' },
    { category: 'Account & Privacy', order: 3, question: 'Can I edit my profile later?', answer: 'Yes, you can update your branch, USN, semester, and preferences in your account settings anytime.' },
    { category: 'Account & Privacy', order: 4, question: 'Can I delete my account?', answer: 'Yes, you can request account deletion or data purge at any time from your security settings.' },
    { category: 'Account & Privacy', order: 5, question: 'Will other students see my personal details?', answer: 'No, your personal contact information remains strictly private. Only public profile details (like contributor badges if enabled) are displayed.' },

    // 8. Payments
    { category: 'Payments', order: 1, question: 'Which payment methods are supported?', answer: 'We support UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Wallet payments via secure Razorpay checkout.' },
    { category: 'Payments', order: 2, question: 'Is there a refund policy?', answer: 'Yes, we offer a hassle-free 3-day refund guarantee if you encounter any technical issues with your Plus activation.' },
    { category: 'Payments', order: 3, question: 'What happens if my payment fails?', answer: 'If money was debited during a failed transaction, it is automatically refunded by your bank within 3-5 business days.' },
    { category: 'Payments', order: 4, question: 'Can I upgrade my subscription later?', answer: 'Yes, you can upgrade your plan or renew existing passes whenever you choose.' },
    { category: 'Payments', order: 5, question: 'Will my subscription renew automatically?', answer: 'No, we do not charge hidden auto-renewals. You decide when to manually renew your pass.' },

    // 9. General
    { category: 'General', order: 1, question: 'Who built AskUrSenior?', answer: 'AskUrSenior was created by Ravikumar KP, an ISE student at SIT Tumakuru, along with student community contributors.' },
    { category: 'General', order: 2, question: 'Why was AskUrSenior created?', answer: 'To eliminate scattered study resources and provide a single, organized academic & campus hub for every SIT student.' },
    { category: 'General', order: 3, question: 'How can I report incorrect information?', answer: 'You can use the "Report Issue" button on any material page or send a message via our support widget.' },
    { category: 'General', order: 4, question: 'How do I contact the AskUrSenior team?', answer: 'You can email us at askursenior66@gmail.com or connect via our official WhatsApp community leads.' },
    { category: 'General', order: 5, question: 'Where can I submit feedback or feature requests?', answer: 'We welcome student feedback! Submit ideas via the in-app feedback modal or support widget.' }
];

class FaqService {
    /**
     * Seeds FAQs if collection is empty.
     */
    async seedFaqsIfEmpty() {
        try {
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

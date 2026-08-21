import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, MessageSquare, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { faqAPI } from '../../services/api';

const defaultFaqCategories = {
    'Getting Started': [
        { id: 'gs-1', question: 'What is AskUrSenior?', answer: 'AskUrSenior is an all-in-one student platform built specifically for Siddaganga Institute of Technology. It brings together study materials, previous year question papers, AI assistance, interview experiences, faculty profiles, campus tools, and student guidance in one place.' },
        { id: 'gs-2', question: 'Who can use AskUrSenior?', answer: 'Any student studying at Siddaganga Institute of Technology can create an account and use the platform. Some premium features are available through AskUrSenior Plus.' },
        { id: 'gs-3', question: 'Is AskUrSenior free to use?', answer: 'Yes. Many core features such as study materials, campus tools, faculty profiles, blogs, and calculators are available for free. Premium features are unlocked through AskUrSenior Plus.' }
    ],
    'Study Materials': [
        { id: 'sm-1', question: 'What kind of study materials are available?', answer: 'High-quality module notes, lab manuals, assignment solutions, formula sheets, and toppers notes for all SIT engineering branches.' },
        { id: 'sm-2', question: 'Are previous year question papers available?', answer: 'Yes, we provide organized Semester End Exam (SEE) and internal test question papers categorized by scheme and semester.' },
        { id: 'sm-3', question: 'Who uploads and verifies the study materials?', answer: 'Materials are uploaded by verified toppers, senior students, and community leads, then checked for accuracy.' },
        { id: 'sm-4', question: 'How often are new materials added?', answer: 'Study resources and exam updates are added continuously every week based on current semester syllabus changes.' },
        { id: 'sm-5', question: 'Can I contribute notes or PYQs?', answer: 'Absolutely! You can upload notes through your student dashboard or submit them directly to community admins.' }
    ],
    'AskUrSenior Plus': [
        { id: 'p-1', question: 'What is AskUrSenior Plus?', answer: 'AskUrSenior Plus is our premium membership plan providing unlimited AI queries, exclusive topper notes, priority download bandwidth, and advanced career insights.' },
        { id: 'p-2', question: 'What features are included in Plus?', answer: 'Unlimited Ask+ RAG questions, premium SEE question banks with answer keys, company cutoff predictor, and priority support.' },
        { id: 'p-3', question: 'Will I receive future premium updates?', answer: 'Yes, all active Plus subscribers automatically get access to new tools and feature releases at no extra charge.' },
        { id: 'p-4', question: 'Can I cancel my subscription?', answer: 'Yes, you can manage or cancel your subscription at any time directly from your account settings.' },
        { id: 'p-5', question: 'Is Plus worth it for first-year students?', answer: 'Yes! First-year students get instant access to 1st/2nd sem subject notes, credit calculators, and branch change predictors.' }
    ],
    'Ask+ AI Assistant': [
        { id: 'ai-1', question: 'What is Ask+?', answer: 'Ask+ is our custom AI study assistant trained specifically on SIT syllabus data, academic rules, and course materials.' },
        { id: 'ai-2', question: 'How is Ask+ different from ChatGPT?', answer: 'Unlike general ChatGPT, Ask+ uses Retrieval-Augmented Generation (RAG) on verified SIT notes, past papers, and university guidelines.' },
        { id: 'ai-3', question: 'How many AI questions can I ask every day?', answer: 'Free accounts get daily query credits, while AskUrSenior Plus members enjoy unlimited AI chat access.' },
        { id: 'ai-4', question: 'Can Ask+ answer SIT-specific academic questions?', answer: 'Yes, Ask+ is specifically fine-tuned on SIT syllabus modules, credit grading policies, and internal marks evaluation formulas.' },
        { id: 'ai-5', question: 'What happens after my AI credits are exhausted?', answer: 'Daily credits refresh automatically every 24 hours, or you can upgrade to Plus for uninterrupted access.' }
    ],
    'Campus Tools': [
        { id: 'ct-1', question: 'What campus tools are available?', answer: 'CGPA/SGPA Calculator, CIE Analyzer, Eligibility Checker, Year Back Predictor, Interactive Campus Map, and Lost & Found portal.' },
        { id: 'ct-2', question: 'Can I use the CGPA calculator for free?', answer: 'Yes, the CGPA and SGPA calculators are 100% free and calibrated to SIT choice-based credit policies.' },
        { id: 'ct-3', question: 'How does Campus Explorer work?', answer: 'Campus Explorer provides interactive 2D/3D map layouts of SIT blocks, departments, canteens, libraries, and auditoriums.' },
        { id: 'ct-4', question: 'What is the Lost & Found feature?', answer: 'A dedicated portal where students can post lost or found items on campus to quickly reconnect with their owners.' },
        { id: 'ct-5', question: 'What are Faculty Profiles?', answer: 'Anonymous student feedback and insights on faculty teaching methods, lab evaluations, and elective guidance.' }
    ],
    'Community': [
        { id: 'c-1', question: 'Who are the Community Contributors?', answer: 'Senior students and alumni who voluntarily share notes, guide freshers, post interview experiences, and support SIT juniors.' },
        { id: 'c-2', question: 'How can I become a Community Contributor?', answer: 'Active students who regularly contribute verified notes, write interview logs, or help in support channels are awarded Contributor badges.' },
        { id: 'c-3', question: 'Can I upload study materials?', answer: 'Yes! You can submit PDFs and notes through your user upload panel.' },
        { id: 'c-4', question: 'Can I share interview experiences?', answer: 'Yes, placed seniors can share their company interview rounds, coding questions, and prep tips to help juniors prepare.' },
        { id: 'c-5', question: 'How are contributed resources verified?', answer: 'Submissions undergo peer verification by domain leads before being published live on the platform.' }
    ],
    'Account & Privacy': [
        { id: 'ap-1', question: 'Can I sign in with Google?', answer: 'Yes, fast 1-click Google OAuth sign-in is fully supported for all SIT student emails.' },
        { id: 'ap-2', question: 'Is my personal information secure?', answer: 'Yes, we use industry-standard encryption, strict access controls, and private database configurations to protect student data.' },
        { id: 'ap-3', question: 'Can I edit my profile later?', answer: 'Yes, you can update your branch, USN, semester, and preferences in your account settings anytime.' },
        { id: 'ap-4', question: 'Can I delete my account?', answer: 'Yes, you can request account deletion or data purge at any time from your security settings.' },
        { id: 'ap-5', question: 'Will other students see my personal details?', answer: 'No, your personal contact information remains strictly private. Only public profile details (like contributor badges if enabled) are displayed.' }
    ],
    'Payments': [
        { id: 'pms-1', question: 'Which payment methods are supported?', answer: 'We support UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Wallet payments via secure Razorpay checkout.' },
        { id: 'pms-2', question: 'Is there a refund policy?', answer: 'Yes, we offer a hassle-free 3-day refund guarantee if you encounter any technical issues with your Plus activation.' },
        { id: 'pms-3', question: 'What happens if my payment fails?', answer: 'If money was debited during a failed transaction, it is automatically refunded by your bank within 3-5 business days.' },
        { id: 'pms-4', question: 'Can I upgrade my subscription later?', answer: 'Yes, you can upgrade your plan or renew existing passes whenever you choose.' },
        { id: 'pms-5', question: 'Will my subscription renew automatically?', answer: 'No, we do not charge hidden auto-renewals. You decide when to manually renew your pass.' }
    ],
    'General': [
        { id: 'g-1', question: 'Who built AskUrSenior?', answer: 'AskUrSenior was created by Ravikumar KP, an ISE student at SIT Tumakuru, along with student community contributors.' },
        { id: 'g-2', question: 'Why was AskUrSenior created?', answer: 'To eliminate scattered study resources and provide a single, organized academic & campus hub for every SIT student.' },
        { id: 'g-3', question: 'How can I report incorrect information?', answer: 'You can use the "Report Issue" button on any material page or send a message via our support widget.' },
        { id: 'g-4', question: 'How do I contact the AskUrSenior team?', answer: 'You can email us at askursenior66@gmail.com or connect via our official WhatsApp community leads.' },
        { id: 'g-5', question: 'Where can I submit feedback or feature requests?', answer: 'We welcome student feedback! Submit ideas via the in-app feedback modal or support widget.' }
    ]
};

const FaqSection = ({ data }) => {
    if (data && data.isVisible === false) return null;

    const [faqData, setFaqData] = useState(defaultFaqCategories);
    const [activeCategory, setActiveCategory] = useState('Getting Started');
    const [openIndex, setOpenIndex] = useState(0); // Only 1 accordion open at a time

    useEffect(() => {
        let isMounted = true;
        faqAPI.getGrouped()
            .then(res => {
                if (isMounted && res.data?.data && Object.keys(res.data.data).length > 0) {
                    setFaqData(res.data.data);
                    const categories = Object.keys(res.data.data);
                    if (categories.length > 0) {
                        setActiveCategory(categories[0]);
                    }
                }
            })
            .catch(err => {
                console.error('Failed to fetch FAQs from backend, using default fallback data:', err);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const categories = Object.keys(faqData);
    const currentQuestions = faqData[activeCategory] || [];

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <section id="faqs" className="py-24 px-6 relative bg-[#030712] overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-12">
                
                {/* Section Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto space-y-3"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Support & Clarity</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-outfit tracking-tight">
                        Frequently Asked Questions
                    </h2>

                    <p className="text-slate-400 text-sm sm:text-base font-normal leading-relaxed">
                        {data?.subtitle || 'Everything you need to know about AskUrSenior, its features, subscriptions, AI assistant, and community.'}
                    </p>
                </motion.div>

                {/* 30% : 70% Layout on Desktop; Horizontal Chips on Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

                    {/* Left Side (30%): Category Navigation Pills */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="md:col-span-4 flex md:flex-col gap-2 overflow-x-auto pb-3 md:pb-0 scrollbar-none snap-x snap-mandatory touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0"
                    >
                        {categories.map((cat) => {
                            const isSelected = activeCategory === cat;
                            const count = faqData[cat]?.length || 0;

                            return (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setActiveCategory(cat);
                                        setOpenIndex(0); // Reset open item when switching category
                                    }}
                                    className={`snap-start min-h-[44px] w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-between gap-3 text-left shrink-0 whitespace-nowrap md:whitespace-normal touch-manipulation ${
                                        isSelected
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 border border-purple-500 scale-[1.01]'
                                            : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] border border-white/5'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </motion.div>

                    {/* Right Side (70%): Accordion Questions */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="md:col-span-8 space-y-3.5"
                    >
                        {currentQuestions.map((item, index) => {
                            const isOpen = openIndex === index;

                            return (
                                <motion.div
                                    key={item.id || item.question || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${
                                        isOpen
                                            ? 'bg-white/[0.05] border-purple-500/40 shadow-xl shadow-purple-500/10'
                                            : 'bg-white/[0.03] border-white/5 hover:border-purple-500/20'
                                    }`}
                                >
                                    {/* Question Header - min 48px touch target */}
                                    <button
                                        onClick={() => toggleAccordion(index)}
                                        className="w-full min-h-[48px] p-4 sm:p-6 flex items-center justify-between gap-4 text-left transition-colors active:bg-white/[0.06]"
                                    >
                                        <span className="text-sm sm:text-lg font-semibold text-white font-outfit leading-snug">
                                            {item.question}
                                        </span>
                                        <div className={`p-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0 transition-transform duration-300 ${
                                            isOpen ? 'rotate-180 bg-purple-500/20 border-purple-500/30 text-purple-400' : 'text-slate-400'
                                        }`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </button>

                                    {/* Answer Content Expand */}
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-300 font-normal leading-relaxed border-t border-white/5">
                                                    {item.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default FaqSection;

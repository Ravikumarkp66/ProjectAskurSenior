import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { faqAPI } from '../../services/api';

const defaultFaqCategories = {
    'Getting Started': [
        { id: 'gs-1', question: 'What is AskUrSenior?', answer: 'AskUrSenior is an all-in-one student platform built specifically for Siddaganga Institute of Technology. It brings together subject study materials, solved previous year question papers (PYQs), section timetables, attendance tracking with the 85% SIT rule, CIE mark analyzer, coding playground for lab manual programs, and verified senior interview experiences in one centralized place.' },
        { id: 'gs-2', question: 'Who can use AskUrSenior?', answer: 'Any student currently studying at Siddaganga Institute of Technology can create an account using their college or personal email. Core study materials, calculators, roadmaps, and community access are free, while advanced semester management tools are part of AskUrSenior Plus.' },
        { id: 'gs-3', question: 'Is AskUrSenior free to use?', answer: 'Yes! Core features such as subject study materials, solved SEE question papers, SGPA/CGPA calculators, campus map, and student community discussions are completely free forever.' }
    ],
    'Academic Tools': [
        { id: 'at-1', question: 'How does the Smart Attendance Tracker work?', answer: 'It automatically synchronizes with your department and section timetable, supports lab-batch filtering (B1/B2/B3), enforces SIT’s 85% attendance policy, calculates your exact safe bunk margin ("Can Miss"), and displays your daily schedule in real-time.' },
        { id: 'at-2', question: 'What does the CIE Analyzer do?', answer: 'The CIE Analyzer handles 50-mark normalization using Best-of-N internal test scores and IPCC theory/lab split ratios. It then calculates the exact SEE exam marks required to maintain or achieve your target semester grade (O, A+, A, B).' },
        { id: 'at-3', question: 'What is the Branch Change Predictor?', answer: 'The Branch Change Predictor compares your 1st-year CGPA against historical SIT department cutoffs to determine transfer odds and your live CGPA gap (Δ).' },
        { id: 'at-4', question: 'What is the Pre-Exam Eligibility Checker?', answer: 'It audits your dual compliance (minimum 85% attendance across subjects + minimum 20/50 aggregate CIE marks) to verify that you meet all SIT hall-ticket eligibility requirements.' }
    ],
    'Coding & Labsets': [
        { id: 'cp-1', question: 'What is the Monaco Coding Playground?', answer: 'An in-browser code editor supporting C, C++, Java, and Python. It is tailored for SIT engineering students to practice coding without local compiler setup issues.' },
        { id: 'cp-2', question: 'Are college lab manual problem sets included?', answer: 'Yes, official college lab manual problems are organized with automated test cases, reference implementations, and custom input/output runners.' }
    ],
    'Study Materials & PYQs': [
        { id: 'sm-1', question: 'What study materials are available on AskUrSenior?', answer: 'High-quality lecture notes, module-wise question banks, lab manuals, formula sheets, and toppers’ reference notes categorized by SIT engineering branches and schemes.' },
        { id: 'sm-2', question: 'Are solved Previous Year Question Papers (PYQs) available?', answer: 'Yes, Semester End Exam (SEE) question papers from previous years are provided with step-by-step solutions and KaTeX mathematical proofs.' },
        { id: 'sm-3', question: 'Can students contribute notes or interview logs?', answer: 'Yes! Students can upload verified notes or share their company placement interview experiences directly through the platform.' }
    ],
    'AskUrSenior Plus': [
        { id: 'p-1', question: 'What is AskUrSenior Plus?', answer: 'AskUrSenior Plus is our premium semester toolkit that unlocks section timetable syncing, attendance deficit planners, CIE & target SEE forecasters, branch change predictors, lab coding playgrounds, and 1-credit subject quizzes.' },
        { id: 'p-2', question: 'Is Plus a one-time semester payment or recurring subscription?', answer: 'Plus is a simple one-time payment for the entire semester. There are zero auto-renewals, zero recurring credit card deductions, and no hidden fees.' },
        { id: 'p-3', question: 'What happens when my Plus semester pass ends?', answer: 'Your account automatically reverts to AskUrSenior Free with zero data loss. Your notes, saved resources, and free tools remain accessible forever.' }
    ],
    'Placements & Interviews': [
        { id: 'pi-1', question: 'What are Senior Interview Experiences?', answer: 'Detailed interview logs submitted by placed SIT seniors, containing round breakdowns, coding questions, Online Assessment (OA) topics, and technical/HR interview tips for top recruiters.' },
        { id: 'pi-2', question: 'Are company eligibility cutoffs provided?', answer: 'Yes, historical CGPA cutoffs and eligible branches for companies visiting SIT campus placements are listed for quick reference.' }
    ],
    'Account & Security': [
        { id: 'as-1', question: 'Is my personal academic data private?', answer: 'Yes. Your personal contact information and internal academic grades are strictly confidential and encrypted.' },
        { id: 'as-2', question: 'Can I update my branch, semester, and section?', answer: 'Yes, you can update your department branch, semester, section, and elective preferences at any time from your Account Settings.' }
    ]
};

const FaqSection = ({ data }) => {
    const [faqData, setFaqData] = useState(defaultFaqCategories);
    const [activeCategory, setActiveCategory] = useState('Getting Started');
    const [openIndex, setOpenIndex] = useState(0);

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
                // Fallback to accurate default FAQ data
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (data && data.isVisible === false) return null;

    const categories = Object.keys(faqData);
    const currentQuestions = faqData[activeCategory] || [];

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <section id="faqs" className="py-20 px-6 relative bg-transparent overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10 space-y-12">
                
                {/* Section Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center max-w-3xl mx-auto space-y-3"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] text-xs font-semibold uppercase tracking-wider mb-2">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Support & Clarity</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                        Frequently Asked Questions
                    </h2>

                    <p className="text-[#4B5563] dark:text-[#A1A1AA] text-sm sm:text-base font-normal leading-relaxed">
                        {data?.subtitle || 'Everything you need to know about AskUrSenior, its features, tools, study resources, and Plus access.'}
                    </p>
                </motion.div>

                {/* 30% : 70% Layout on Desktop; Horizontal Chips on Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">

                    {/* Left Side (30%): Category Navigation Pills */}
                    <div 
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
                                        setOpenIndex(0);
                                    }}
                                    className={`snap-start min-h-[40px] w-full px-3.5 py-2.5 rounded-[6px] text-xs sm:text-sm font-medium transition-colors duration-150 flex items-center justify-between gap-3 text-left shrink-0 whitespace-nowrap md:whitespace-normal touch-manipulation border ${
                                        isSelected
                                            ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-none'
                                            : 'bg-white dark:bg-[#15181D] text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F8FAFC] dark:hover:bg-[#1B1F26] border-[#E5E7EB] dark:border-[#292E37]'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] dark:bg-[#1B1F26] text-[#6B7280] dark:text-[#9CA3AF]'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Side (70%): Accordion Questions */}
                    <div 
                        className="md:col-span-8 space-y-3"
                    >
                        {currentQuestions.map((item, index) => {
                            const isOpen = openIndex === index;

                            return (
                                <motion.div
                                    key={item.id || item.question || index}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                    className={`rounded-lg border transition-colors duration-150 overflow-hidden shadow-none ${
                                        isOpen
                                            ? 'bg-white dark:bg-[#15181D] border-[#E9D5FF] dark:border-[#7C3AED]/40'
                                            : 'bg-white dark:bg-[#15181D] border-[#E5E7EB] dark:border-[#292E37] hover:border-[#D1D5DB] dark:hover:border-[#3E4553]'
                                    }`}
                                >
                                    {/* Question Header */}
                                    <button
                                        onClick={() => toggleAccordion(index)}
                                        className="w-full min-h-[44px] p-4 sm:p-4.5 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
                                    >
                                        <span className="text-sm sm:text-base font-semibold text-[#111827] dark:text-[#F3F4F6] leading-snug">
                                            {item.question}
                                        </span>
                                        <div className={`p-1.5 rounded-[6px] border shrink-0 transition-transform duration-150 ${
                                            isOpen 
                                                ? 'rotate-180 bg-[#FAF5FF] dark:bg-[#581C87]/20 border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA]' 
                                                : 'border-[#E5E7EB] dark:border-[#292E37] text-[#6B7280] dark:text-[#9CA3AF]'
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
                                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4.5 pb-4 pt-1 text-xs sm:text-sm text-[#4B5563] dark:text-[#A1A1AA] font-normal leading-relaxed border-t border-[#E5E7EB] dark:border-[#292E37]">
                                                    {item.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FaqSection;

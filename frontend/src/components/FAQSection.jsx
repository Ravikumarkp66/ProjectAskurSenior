import React, { useState } from 'react';

const FAQSection = () => {
    const [activeCategory, setActiveCategory] = useState('getting-started');
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    const categories = [
        { id: 'getting-started', label: 'Getting Started & Access' },
        { id: 'study-materials', label: 'Study Materials & Content' },
        { id: 'features', label: 'Features & Functionality' },
        { id: 'branch-management', label: 'Branch & Subject Management' },
        { id: 'progress', label: 'Progress Tracking' },
        { id: 'technical', label: 'Technical Support' },
        { id: 'contributors', label: 'For Contributors' }
    ];

    const faqs = {
        'getting-started': [
            {
                question: 'What is AskUrSenior and who can use it?',
                answer: 'AskUrSenior is a comprehensive academic platform designed specifically for engineering students. It provides free access to study materials, previous year questions (PYQs), notes, and tools to track your academic progress. Any engineering student can create an account and start using the platform immediately - no fees, no subscriptions required!'
            },
            {
                question: 'How do I create an account and get started?',
                answer: 'Getting started is simple! Click the "Sign Up" button on the homepage, choose your engineering branch (CS, IS, EC, EE, ME, etc.), select your cycle (Physics/Chemistry), and create your account. Once registered, you\'ll have instant access to all study materials for your branch. You can always switch branches later if needed.'
            },
            {
                question: 'Is AskUrSenior free to use for students?',
                answer: 'Yes! AskUrSenior is completely free for all students. We believe quality education resources should be accessible to everyone. There are no hidden fees, premium tiers, or paid content. All features including notes, PYQs, question banks, CGPA calculator, and progress tracking are 100% free.'
            },
            {
                question: 'Which engineering branches are supported?',
                answer: 'We support all major engineering branches including Computer Science (CS/CSE), Information Science (IS/ISE), Electronics & Communication (EC/ECE), Electrical Engineering (EE/EEE), Mechanical Engineering (ME/MECH), Civil Engineering (CV/CIVIL), AI & ML (AIML), Data Science (DS), and more. Content is shared across branches for common subjects!'
            }
        ],
        'study-materials': [
            {
                question: 'What types of study materials are available?',
                answer: 'We provide comprehensive study resources including: Module-wise Notes for all subjects, Previous Year Questions (PYQs) with solutions, Question Banks for practice, Syllabus documents, and additional reference materials. All content is organized by subject, module, and branch for easy access.'
            },
            {
                question: 'How do I access notes and PYQs for my subjects?',
                answer: 'After logging in, go to your Dashboard and select any subject. You\'ll see tabs for Notes, PYQs, Question Banks, and Syllabus. Click on any material to view it instantly in your browser. Notes are organized by modules, while PYQs are available for the entire subject.'
            },
            {
                question: 'Can I download study materials for offline use?',
                answer: 'Yes! All PDFs can be viewed directly in your browser and downloaded for offline study. Simply open any material and use your browser\'s download option. This allows you to study even without an internet connection.'
            },
            {
                question: 'How often is new content added to the platform?',
                answer: 'Content is continuously updated by our admin team and contributors. When new materials are uploaded, you\'ll receive instant notifications on your dashboard. We prioritize adding the most requested content and keeping materials current with the latest syllabus.'
            }
        ],
        'features': [
            {
                question: 'How does the CGPA calculator work?',
                answer: 'Our CGPA calculator lets you input your semester grades and credits to automatically calculate your CGPA. Simply navigate to the CGPA Calculator page, enter your subject grades and credits for each semester, and get instant results. It supports all credit patterns and provides accurate calculations based on standard formulas.'
            },
            {
                question: 'Can I track my study progress on specific subjects?',
                answer: 'Absolutely! Each subject has a built-in progress tracker. As you complete questions and study modules, your progress is automatically saved. You can see completion percentages for each module and track which topics you\'ve covered. This helps you stay organized and focused on areas that need more attention.'
            },
            {
                question: 'How do notifications work when new content is uploaded?',
                answer: 'You\'ll receive real-time notifications whenever new study materials are uploaded for your branch and subjects. Notifications appear in your dashboard and show details like the subject name, content type (notes/PYQs), and which module it belongs to. This ensures you never miss important updates!'
            },
            {
                question: 'Can I provide feedback or report bugs on the platform?',
                answer: 'Yes! We highly encourage feedback. Use the "Feedback" option in your dashboard to share suggestions, report issues, or request features. You can also report bugs through the dedicated bug reporting section. Your input helps us improve the platform for everyone!'
            }
        ],
        'branch-management': [
            {
                question: 'Can I switch between different engineering branches?',
                answer: 'Yes! You can switch your branch anytime from your profile settings. This is useful if you change your specialization or want to access content from different branches. When you switch, your dashboard will immediately show subjects and materials relevant to your new branch.'
            },
            {
                question: 'Why do I see the same content across different branches?',
                answer: 'Many engineering subjects like Mathematics, Physics, Chemistry, and core subjects are common across branches. When admins upload content for these shared subjects, it automatically appears for all branches that study it. This ensures efficient content distribution and benefits all students!'
            },
            {
                question: 'How are subjects organized by modules and cycles?',
                answer: 'Subjects are organized into Physics Cycle (P) and Chemistry Cycle (C) for first-year students, and then by semesters for higher years. Each subject is divided into modules (typically 5 modules), making it easy to find specific topics. All study materials are tagged accordingly for quick navigation.'
            }
        ],
        'progress': [
            {
                question: 'Is my study progress saved automatically?',
                answer: 'Yes! Every time you mark a question as completed or access study materials, your progress is automatically saved to your account. You can log in from any device and continue right where you left off. Your progress data is securely stored and never lost.'
            },
            {
                question: 'Can I see my progress across all subjects?',
                answer: 'Absolutely! Your dashboard provides a comprehensive overview of your progress across all enrolled subjects. You can see completion percentages, which modules you\'ve studied, and which questions you\'ve completed. This gives you a clear picture of your overall academic journey.'
            },
            {
                question: 'How do I reset my progress for a subject?',
                answer: 'Currently, progress is automatically tracked as you study. If you want to revisit topics, you can simply access them again - the materials remain available. Individual question completion can be toggled on/off by clicking them again.'
            }
        ],
        'technical': [
            {
                question: 'What devices and browsers are supported?',
                answer: 'AskUrSenior works on all modern devices - desktops, laptops, tablets, and smartphones. We support all major browsers including Chrome, Firefox, Safari, and Edge. The platform is fully responsive and optimized for both mobile and desktop experiences.'
            },
            {
                question: 'What should I do if PDFs are not loading?',
                answer: 'If PDFs don\'t load, try: 1) Refreshing the page, 2) Clearing your browser cache, 3) Trying a different browser, 4) Checking your internet connection. If issues persist, report it through our bug reporting system with details about your browser and device.'
            },
            {
                question: 'Is my data secure on the platform?',
                answer: 'Yes! We take security seriously. All passwords are encrypted, your data is stored securely, and we use industry-standard security practices. We never share your personal information with third parties. Your study progress and account details are completely private and protected.'
            },
            {
                question: 'Can I use AskUrSenior offline?',
                answer: 'While you need an internet connection to access the platform and load materials, you can download PDFs for offline study. Once downloaded, you can view them without internet. We\'re working on adding more offline capabilities in future updates!'
            }
        ],
        'contributors': [
            {
                question: 'How can I contribute study materials to help other students?',
                answer: 'We love student contributors! If you have quality notes, solutions, or study materials, contact our admin team through the feedback system. After review, you may be granted contributor access to upload materials that will benefit thousands of students!'
            },
            {
                question: 'Who can upload content and how is it moderated?',
                answer: 'Only verified admins and approved contributors can upload content to ensure quality. All uploads are reviewed for accuracy, completeness, and relevance. This moderation process ensures that students receive reliable, high-quality study materials.'
            },
            {
                question: 'How do I become an admin or content contributor?',
                answer: 'Admins are typically senior students, alumni, or faculty members who are passionate about helping students. If you\'re interested, reach out through our feedback system with information about your qualifications and motivation. We\'re always looking for dedicated contributors who can maintain content quality!'
            }
        ]
    };

    const toggleQuestion = (index) => {
        setExpandedQuestion(expandedQuestion === index ? null : index);
    };

    const [theme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const isLightMode = theme === 'light';

    return (
        <section className={`py-20 ${isLightMode ? 'bg-gray-50' : 'bg-gray-900'}`} id="faq">
            <div className="container mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                        Frequently Asked Questions
                    </h2>
                    <p className={`text-lg ${isLightMode ? 'text-gray-600' : 'text-gray-400'} max-w-2xl mx-auto`}>
                        Everything you need to know about AskUrSenior
                    </p>
                </div>

                {/* FAQ Content */}
                <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
                    {/* Categories Sidebar */}
                    <div className={`lg:w-1/4 ${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-xl p-6 h-fit sticky top-6 shadow-lg`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                            Categories
                        </h3>
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        setActiveCategory(category.id);
                                        setExpandedQuestion(null);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                                        activeCategory === category.id
                                            ? `${isLightMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'} shadow-lg`
                                            : `${isLightMode ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
                                    }`}
                                >
                                    <span className="text-sm font-medium">{category.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Questions Panel */}
                    <div className="lg:w-3/4 space-y-4">
                        {faqs[activeCategory]?.map((faq, index) => (
                            <div
                                key={index}
                                className={`${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-xl border shadow-lg overflow-hidden transition-all duration-200`}
                            >
                                <button
                                    onClick={() => toggleQuestion(index)}
                                    className={`w-full px-6 py-5 flex items-center justify-between ${isLightMode ? 'hover:bg-gray-50' : 'hover:bg-gray-750'} transition-colors`}
                                >
                                    <span className={`text-lg font-semibold text-left ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                        {faq.question}
                                    </span>
                                    <svg
                                        className={`w-6 h-6 flex-shrink-0 ml-4 transition-transform duration-200 ${
                                            expandedQuestion === index ? 'transform rotate-180' : ''
                                        } ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        expandedQuestion === index ? 'max-h-96' : 'max-h-0'
                                    }`}
                                >
                                    <div className={`px-6 pb-5 ${isLightMode ? 'text-gray-600' : 'text-gray-300'} text-base leading-relaxed border-t ${isLightMode ? 'border-gray-200' : 'border-gray-700'} pt-5`}>
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Still Have Questions CTA */}
                <div className={`mt-16 text-center ${isLightMode ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gradient-to-r from-gray-800 to-gray-700'} rounded-2xl p-8 shadow-lg`}>
                    <h3 className={`text-2xl font-bold mb-3 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                        Still have questions?
                    </h3>
                    <p className={`${isLightMode ? 'text-gray-600' : 'text-gray-300'} mb-6`}>
                        Can't find the answer you're looking for? Feel free to reach out to us!
                    </p>
                    <a
                        href="/login"
                        className={`inline-block px-8 py-3 ${isLightMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl`}
                    >
                        Get Started Now
                    </a>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    ChevronDown, 
    UserRound, 
    GraduationCap, 
    Calendar, 
    BookOpen, 
    CreditCard, 
    Wrench, 
    Mail, 
    Bug, 
    CircleHelp
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useBugReportModal } from '../../context/BugReportModalContext';

const HELP_CATEGORIES = [
    {
        id: 'account',
        title: 'Account',
        icon: UserRound,
        faqs: [
            {
                q: 'How do I update my branch, semester, or college details?',
                a: 'Navigate to My Profile > Edit Profile to update your academic semester and personal information. To change your branch, use the Branch Switcher or request a branch profile update.'
            },
            {
                q: 'Can I connect a different email address to my account?',
                a: 'Primary authentication is tied to the email address used during registration or Google sign-in. To update verified student credentials, reach out to student support.'
            },
            {
                q: 'How do I sign out of other active devices?',
                a: 'Go to Account > Security and click "Sign out other sessions". This immediately terminates authentication on all secondary browsers and mobile devices.'
            }
        ]
    },
    {
        id: 'academic',
        title: 'Academic Features',
        icon: GraduationCap,
        faqs: [
            {
                q: 'How does the CIE & SGPA calculator compute marks?',
                a: 'Calculators use official VTU / university grading rubrics according to your scheme. Input your internal marks (CIE-1, CIE-2, assignments) to see your minimum required SEE target.'
            },
            {
                q: 'Where can I find syllabus question papers and model solutions?',
                a: 'Head to AskFinder or the Notes workspace. Filter by your scheme, subject code, and academic semester to view verified PDF downloads.'
            }
        ]
    },
    {
        id: 'attendance',
        title: 'Attendance',
        icon: Calendar,
        faqs: [
            {
                q: 'How is my 75% attendance threshold tracked?',
                a: 'The attendance tracker computes your present/absent ratio against your configured timetable. It alerts you with the exact number of safe classes you can miss or need to attend to stay eligible.'
            },
            {
                q: 'Can I log extra classes or lab sessions?',
                a: 'Yes, in your Attendance settings, tap "+ Extra Class" to record substitute lectures or rescheduled laboratory batches.'
            }
        ]
    },
    {
        id: 'subjects',
        title: 'My Subjects',
        icon: BookOpen,
        faqs: [
            {
                q: 'How do I register or pin my current semester subjects?',
                a: 'Visit Student Academics > Registered Subjects. Pick your scheme and semester to pin your syllabus modules and view topic-wise notes.'
            },
            {
                q: 'Are elective subjects supported?',
                a: 'Yes, both Professional Electives and Open Electives can be added during your semester subject setup.'
            }
        ]
    },
    {
        id: 'payments',
        title: 'Payments / Plus',
        icon: CreditCard,
        faqs: [
            {
                q: 'What is included in AskUrSenior Plus?',
                a: 'Plus includes unlimited full-length notes, verified exam solutions, interactive AI question explanations, timetable syncing, and ad-free access.'
            },
            {
                q: 'Where can I view invoices for my Plus purchase?',
                a: 'Visit Account > Summary to see your active plan validity, purchase date, and recent payment transaction receipts.'
            }
        ]
    },
    {
        id: 'technical',
        title: 'Technical Issues',
        icon: Wrench,
        faqs: [
            {
                q: 'The page looks outdated or notes are not opening.',
                a: 'Hard-refresh your browser (Ctrl+F5 or Cmd+Shift+R) to pull the latest cached bundle. Ensure you have allowed PDF viewing permissions.'
            },
            {
                q: 'How do I submit an error log or bug report?',
                a: 'Click the "Report a problem" button below or click Bug Report in your profile dropdown menu to automatically attach your environment and error details.'
            }
        ]
    }
];

const HelpSupportPage = () => {
    const { isDark } = useTheme();
    const { openBugReport } = useBugReportModal();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);

    // Filter FAQs based on search
    const filteredCategories = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return HELP_CATEGORIES;

        return HELP_CATEGORIES.map(cat => ({
            ...cat,
            faqs: cat.faqs.filter(
                f => f.q.toLowerCase().includes(query) || f.a.toLowerCase().includes(query)
            )
        })).filter(cat => cat.faqs.length > 0);
    }, [searchQuery]);

    const toggleFaq = (key) => {
        setExpandedFaq(prev => (prev === key ? null : key));
    };

    return (
        <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 box-border transition-colors">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Title & Search */}
                <div className="text-center max-w-xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <CircleHelp size={13} strokeWidth={1.75} />
                        AskUrSenior Support
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        How can we help you?
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Search common student questions, academic guides, and platform troubleshooting.
                    </p>

                    {/* Search Bar */}
                    <div className="relative pt-2">
                        <Search
                            size={16}
                            strokeWidth={1.75}
                            className="absolute left-3.5 top-5 text-slate-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search questions (e.g. attendance, CIE marks, invoice, password)..."
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none transition-all shadow-sm ${
                                isDark
                                    ? 'bg-[#0B0D14] border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10'
                            }`}
                        />
                    </div>
                </div>

                {/* Quick Sections FAQ Accordion */}
                <div className="space-y-6 pt-2">
                    {filteredCategories.length === 0 ? (
                        <div className={`p-8 rounded-xl border text-center text-xs text-slate-500 ${
                            isDark ? 'bg-[#0B0D14] border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                            No matching questions found for "{searchQuery}". Try a different keyword or report a problem below.
                        </div>
                    ) : (
                        filteredCategories.map((cat) => {
                            const CategoryIcon = cat.icon;
                            return (
                                <div key={cat.id} className="space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <CategoryIcon size={15} strokeWidth={1.75} className="text-purple-600 dark:text-purple-400" />
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            {cat.title}
                                        </h2>
                                    </div>

                                    <div className={`rounded-xl border divide-y overflow-hidden ${
                                        isDark ? 'bg-[#0B0D14] border-slate-800 divide-slate-800/80' : 'bg-white border-slate-200 divide-slate-100'
                                    }`}>
                                        {cat.faqs.map((faq, idx) => {
                                            const key = `${cat.id}-${idx}`;
                                            const isExpanded = expandedFaq === key;

                                            return (
                                                <div key={key} className="transition-colors">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFaq(key)}
                                                        className="w-full flex items-center justify-between p-4 text-left cursor-pointer transition-colors hover:bg-purple-500/[0.02]"
                                                    >
                                                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 pr-4">
                                                            {faq.q}
                                                        </span>
                                                        <ChevronDown
                                                            size={16}
                                                            strokeWidth={1.75}
                                                            className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                                                                isExpanded ? 'rotate-180 text-purple-500' : ''
                                                            }`}
                                                        />
                                                    </button>

                                                    <AnimatePresence initial={false}>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.18 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className={`px-4 pb-4 pt-1 text-xs leading-relaxed ${
                                                                    isDark ? 'text-slate-400' : 'text-slate-600'
                                                                }`}>
                                                                    {faq.a}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Bottom Section: Still need help? */}
                <div className={`p-6 rounded-2xl border ${
                    isDark ? 'bg-[#0B0D14] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                Still need help?
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                                Have an academic inquiry or discovered an unexpected platform behavior? We are here to help.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => openBugReport('Other')}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                                    isDark
                                        ? 'border-slate-800 hover:bg-slate-800 text-slate-200'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                            >
                                <Bug size={14} strokeWidth={1.75} className="text-purple-500" />
                                <span>Report a problem</span>
                            </button>

                            <a
                                href="mailto:support@askursenior.in?subject=Student%20Support%20Request"
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm shadow-purple-600/20 inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <Mail size={14} strokeWidth={1.75} />
                                <span>Contact Support</span>
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HelpSupportPage;

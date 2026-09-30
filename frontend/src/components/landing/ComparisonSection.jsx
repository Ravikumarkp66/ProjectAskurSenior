import React from 'react';
import { XCircle, CheckCircle2, ArrowRightLeft, Sparkles } from 'lucide-react';

const defaultComparisonItems = [
    { without: 'Guessing attendance & risking the SIT 85% rule', with: 'Section Timetable Sync, Lab Batch Filter & Safe Bunk ("Can Miss") Tracker', order: 1 },
    { without: 'Asking classmates daily for class schedules & lab batches', with: 'Real-Time Today’s Classes & Lab Batch Tracking', order: 2 },
    { without: 'Manual Best-of-N split mark normalization calculations', with: 'Autonomous CIE 50-Mark Analyzer & SEE Target Grade Forecaster', order: 3 },
    { without: 'Complex manual CGPA/SGPA calculations', with: 'Accurate SIT Credit-Weighted SGPA & CGPA Calculators', order: 4 },
    { without: 'Relying on campus rumors about branch change cutoffs', with: 'Branch Change Predictor with Real SIT Department Cutoffs & CGPA Gap (Δ)', order: 5 },
    { without: 'Uncertainty about exam eligibility and year-back rules', with: 'Pre-Exam Dual Compliance Auditor (85% Attendance + 20 CIE) & Deficit Pathways', order: 6 },
    { without: 'Wrestling with local IDE setups for college lab programs', with: 'In-Browser Monaco Coding Playground with Official SIT Labsets (C, C++, Java, Python)', order: 7 },
    { without: 'Searching individually on LinkedIn for SIT placement rounds', with: 'Verified Senior Interview Experiences & Company OA Breakdowns', order: 8 },
    { without: 'Scattered unverified PDFs and WhatsApp group links', with: 'Organized Subject Notes, Lab Manuals & Solved SEE PYQs with Step-by-Step Proofs', order: 9 },
    { without: 'No guidance for mandatory 1-credit NCMC/AEC subjects', with: 'Curated Engineering Roadmaps & Practice Quizzes for 1-Credit Courses', order: 10 },
    { without: 'Getting lost searching for exam halls and department blocks', with: 'Interactive 2D/3D SIT Campus Map with Building & Department Locators', order: 11 },
    { without: 'No central place to track academic streaks & progress over 4 years', with: 'Personalized Student Dashboard with Streaks & 4-Year Journey Heatmap', order: 12 }
];

const ComparisonSection = ({ data }) => {
    if (data && data.isVisible === false) return null;

    const rawItems = data?.items && data.items.length > 0 ? data.items : defaultComparisonItems;
    const items = [...rawItems].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <section id="comparison" className="py-16 px-6 relative bg-transparent border-b border-[#E5E7EB] dark:border-[#292E37]">
            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] text-xs font-medium uppercase tracking-wider mb-3">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Comparison Table</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight mb-2">
                        {data?.title || 'Without AskUrSenior vs With AskUrSenior'}
                    </h2>
                    <p className="text-[#4B5563] dark:text-[#A1A1AA] text-sm font-normal">
                        {data?.subtitle || 'See how AskUrSenior transforms student life and study preparation at SIT.'}
                    </p>
                </div>

                {/* MOBILE VIEW (< md): Stacked/Side-by-side Mobile Comparison Cards */}
                <div className="md:hidden space-y-3">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="p-4 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] space-y-2.5 shadow-none"
                        >
                            <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#292E37] pb-1.5">
                                <span className="text-[11px] font-medium text-[#6B7280] dark:text-[#71717A] uppercase tracking-wider tabular-nums">
                                    Feature #{index + 1}
                                </span>
                            </div>

                            {/* Without AskUrSenior */}
                            <div className="flex items-start gap-2.5 p-2.5 rounded-[6px] bg-[#FEF2F2] dark:bg-[#7F1D1D]/15 border border-[#FECACA] dark:border-[#991B1B]/30">
                                <XCircle className="w-4 h-4 text-[#DC2626] dark:text-[#EF4444] mt-0.5 shrink-0" />
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-[#DC2626] dark:text-[#F87171] uppercase tracking-wider block">
                                        Without AskUrSenior
                                    </span>
                                    <span className="text-xs text-[#374151] dark:text-[#D1D5DB] font-normal">
                                        {item.without}
                                    </span>
                                </div>
                            </div>

                            {/* With AskUrSenior */}
                            <div className="flex items-start gap-2.5 p-2.5 rounded-[6px] bg-[#F0FDF4] dark:bg-[#14532D]/15 border border-[#BBF7D0] dark:border-[#166534]/30">
                                <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] mt-0.5 shrink-0" />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-semibold text-[#16A34A] dark:text-[#4ADE80] uppercase tracking-wider block">
                                            With AskUrSenior
                                        </span>
                                        <Sparkles className="w-3 h-3 text-[#16A34A] dark:text-[#4ADE80]" />
                                    </div>
                                    <span className="text-xs text-[#111827] dark:text-[#F3F4F6] font-medium">
                                        {item.with}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DESKTOP VIEW (>= md): Full Structured Table */}
                <div className="hidden md:block w-full rounded-lg border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] shadow-none overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26]">
                                <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider text-[#6B7280] dark:text-[#71717A] w-12 text-center tabular-nums">
                                    #
                                </th>
                                <th className="py-3 px-5 text-xs font-medium uppercase tracking-wider text-[#DC2626] dark:text-[#F87171] w-1/2">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-[#DC2626] dark:text-[#EF4444]" />
                                        <span>Without AskUrSenior</span>
                                    </div>
                                </th>
                                <th className="py-3 px-5 text-xs font-medium uppercase tracking-wider text-[#16A34A] dark:text-[#4ADE80] w-1/2 bg-[#F0FDF4]/50 dark:bg-[#14532D]/10">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80]" />
                                        <span>With AskUrSenior</span>
                                        <Sparkles className="w-3.5 h-3.5 text-[#16A34A] dark:text-[#4ADE80] ml-auto" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#292E37]">
                            {items.map((item, index) => (
                                <tr key={index} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1B1F26] transition-colors group">
                                    <td className="py-3 px-4 text-xs font-medium text-[#6B7280] dark:text-[#71717A] text-center tabular-nums">
                                        {index + 1}
                                    </td>
                                    <td className="py-3 px-5 text-sm text-[#4B5563] dark:text-[#A1A1AA] font-normal">
                                        <div className="flex items-start gap-2.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-2 shrink-0" />
                                            <span>{item.without}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-5 text-sm text-[#111827] dark:text-[#F3F4F6] font-medium bg-[#F0FDF4]/30 dark:bg-[#14532D]/5 group-hover:bg-[#F0FDF4]/60 dark:group-hover:bg-[#14532D]/10 transition-colors">
                                        <div className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-[#16A34A] dark:text-[#4ADE80] mt-0.5 shrink-0" />
                                            <span>{item.with}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default ComparisonSection;

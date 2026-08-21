import React from 'react';
import { XCircle, CheckCircle2, ArrowRightLeft, Sparkles } from 'lucide-react';

const defaultComparisonItems = [
    { without: 'Searching WhatsApp groups for notes', with: 'Search organized study materials instantly', order: 1 },
    { without: 'Asking seniors individually', with: 'Verified interview experiences from real seniors', order: 2 },
    { without: 'Using multiple academic websites', with: 'Everything in one platform', order: 3 },
    { without: 'Manual CGPA calculations', with: 'Instant CGPA, SGPA and CIE analysis', order: 4 },
    { without: 'No campus navigation', with: 'Interactive Campus Explorer', order: 5 },
    { without: 'No faculty insights', with: 'Faculty and Department Ratings', order: 6 },
    { without: 'Generic AI answers', with: 'Ask+ trained on SIT-specific resources', order: 7 },
    { without: 'No study tracking', with: 'Personal Dashboard with Streaks & Progress', order: 8 },
    { without: 'Scattered PDFs and Google Drive links', with: 'Organized Notes, PYQs, SEE Papers & Question Banks', order: 9 },
    { without: 'No structured placement preparation', with: 'Company Cutoffs, Roadmaps & Interview Experiences', order: 10 },
    { without: 'No student marketplace', with: 'Buy, Sell & Exchange within campus', order: 11 },
    { without: 'No centralized Lost & Found', with: 'Dedicated Lost & Found Portal', order: 12 }
];

const ComparisonSection = ({ data }) => {
    if (data && data.isVisible === false) return null;

    const rawItems = data?.items && data.items.length > 0 ? data.items : defaultComparisonItems;
    const items = [...rawItems].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <section id="comparison" className="py-16 px-6 relative bg-[#030712] overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-1/3 left-10 w-96 h-96 bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Comparison Table</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight mb-3">
                        {data?.title || 'Without AskUrSenior vs With AskUrSenior'}
                    </h2>
                    <p className="text-slate-400 text-base font-normal">
                        {data?.subtitle || 'See how AskUrSenior transforms student life and study preparation at SIT.'}
                    </p>
                </div>

                {/* MOBILE VIEW (< md): Stacked/Side-by-side Mobile Comparison Cards */}
                <div className="md:hidden space-y-4">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 shadow-lg"
                        >
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Feature #{index + 1}
                                </span>
                            </div>

                            {/* Without AskUrSenior */}
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/[0.06] border border-red-500/20">
                                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <div className="space-y-0.5">
                                    <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
                                        Without AskUrSenior
                                    </span>
                                    <span className="text-xs text-slate-300 font-medium">
                                        {item.without}
                                    </span>
                                </div>
                            </div>

                            {/* With AskUrSenior */}
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/30">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                                            With AskUrSenior
                                        </span>
                                        <Sparkles className="w-3 h-3 text-emerald-300" />
                                    </div>
                                    <span className="text-xs text-white font-semibold">
                                        {item.with}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DESKTOP VIEW (>= md): Full Structured Table */}
                <div className="hidden md:block w-full rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.04]">
                                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-400 w-12 text-center">
                                    #
                                </th>
                                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-red-400 w-1/2">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-400" />
                                        <span>Without AskUrSenior</span>
                                    </div>
                                </th>
                                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-emerald-400 w-1/2 bg-emerald-500/[0.05]">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span>With AskUrSenior</span>
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-300 ml-auto" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {items.map((item, index) => (
                                <tr key={index} className="hover:bg-white/[0.03] transition-colors group">
                                    <td className="py-4 px-6 text-xs font-semibold text-slate-500 text-center">
                                        {index + 1}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-400 font-medium">
                                        <div className="flex items-start gap-2.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400/50 mt-2 shrink-0" />
                                            <span>{item.without}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-white font-semibold bg-emerald-500/[0.02] group-hover:bg-emerald-500/[0.04] transition-colors">
                                        <div className="flex items-start gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                            <span className="text-emerald-100">{item.with}</span>
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

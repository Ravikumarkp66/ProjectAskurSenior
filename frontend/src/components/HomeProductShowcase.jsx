import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomeProductShowcase = () => {
    const navigate = useNavigate();

    // CIE Calculator State
    const [mathMarks, setMathMarks] = useState({ test1: '', test2: '', quiz: '', assignment: '' });
    const t1 = Math.min(50, parseFloat(mathMarks.test1) || 0);
    const t2 = Math.min(50, parseFloat(mathMarks.test2) || 0);
    const q = Math.min(40, parseFloat(mathMarks.quiz) || 0);
    const a = Math.min(40, parseFloat(mathMarks.assignment) || 0);

    const testSum = t1 + t2;
    const testReduced = (testSum / 100) * 34;
    const testPass = testSum >= 40;

    const quizReduced = (q / 40) * 8;
    const quizPass = q >= 16;

    const ablReduced = (a / 40) * 8;
    const ablPass = a >= 16;

    const totalCIE = Math.round(testReduced + quizReduced + ablReduced);
    const isEligible = totalCIE >= 20 && testPass && quizPass && ablPass;
    const hasEnteredMarks = mathMarks.test1 !== '' || mathMarks.test2 !== '';

    return (
        <div className="py-2 bg-[#0a0a0b] text-white w-full relative z-10">
            <div className="max-w-6xl mx-auto px-6 space-y-6 md:space-y-8 w-full">
                
                {/* 1. How It Works Section */}
                <section>
                    <div className="text-center mb-10 md:mb-12">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-outfit">How AskUrSenior Works</h2>
                        <p className="text-slate-400 text-lg">Three simple steps to access everything you need.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        {/* Step 1 */}
                        <div className="bg-[#141416]/80 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black text-purple-400 mb-5 md:mb-6">1</div>
                            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Search your subject</h3>
                            <p className="text-slate-400 text-sm md:text-base">Enter a subject name, code, or topic to instantly find notes, PYQs, and study materials shared by seniors.</p>
                        </div>
                        {/* Step 2 */}
                        <div className="bg-[#141416]/80 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black text-indigo-400 mb-5 md:mb-6">2</div>
                            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Preview notes or PYQs</h3>
                            <p className="text-slate-400 text-sm md:text-base">View file details, summaries, and tags before downloading so you know exactly what you're getting.</p>
                        </div>
                        {/* Step 3 */}
                        <div className="bg-[#141416]/80 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black text-emerald-400 mb-5 md:mb-6">3</div>
                            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Download instantly</h3>
                            <p className="text-slate-400 text-sm md:text-base">Download study materials directly or bookmark them to access later from your dashboard.</p>
                        </div>
                    </div>
                </section>

                {/* 1.5 Feature Overview Sections */}
                <section>
                    <div className="text-center mb-10 md:mb-12">
                        <span className="text-purple-400 font-bold uppercase tracking-widest text-[10px] md:text-sm mb-2 block">What you can do on AskUrSenior</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 font-outfit">Everything you need to study smarter</h2>
                        <p className="text-slate-400 text-lg">A simple toolkit designed to help SIT students prepare better for exams.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {/* Card 1 */}
                        <div className="bg-[#141416]/50 border border-white/5 hover:border-white/20 rounded-2xl p-6 transition-all group hover:-translate-y-1">
                            <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Study Materials</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Search notes, PYQs, and test papers shared by seniors across multiple subjects.</p>
                        </div>
                        {/* Card 2 */}
                        <div className="bg-[#141416]/50 border border-white/5 hover:border-white/20 rounded-2xl p-6 transition-all group hover:-translate-y-1">
                            <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">CIE / CGPA Calculator</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Instantly calculate your CIE and CGPA using SIT's academic evaluation structure.</p>
                        </div>
                        {/* Card 3 */}
                        <div className="bg-[#141416]/50 border border-white/5 hover:border-white/20 rounded-2xl p-6 transition-all group hover:-translate-y-1">
                            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Study Dashboard</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Track your module progress and organize your learning across subjects.</p>
                        </div>
                        {/* Card 4 */}
                        <div className="bg-[#141416]/50 border border-white/5 hover:border-white/20 rounded-2xl p-6 transition-all group hover:-translate-y-1">
                            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Academic Blog</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Read guides, exam strategies, and important academic insights written for SIT students.</p>
                        </div>
                    </div>
                </section>


                {/* 2. Recently Added Materials */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 font-outfit">Recently Added Materials</h2>
                            <p className="text-slate-400 text-sm md:text-base">New materials uploaded by seniors and verified by admins.</p>
                        </div>
                        <button onClick={() => navigate('/ask-finder')} className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2 transition-colors whitespace-nowrap">
                            Explore All Materials <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Material Card 1 */}
                        <div className="bg-[#141416] border border-white/5 hover:border-purple-500/30 rounded-2xl overflow-hidden transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/10" onClick={() => navigate('/ask-finder')}>
                            {/* Thumbnail Preview */}
                            <div className="h-28 bg-gradient-to-br from-purple-900/50 to-purple-800/30 relative overflow-hidden px-4 pt-4">
                                <div className="space-y-2">
                                    <div className="h-2 w-3/4 bg-white/20 rounded" />
                                    <div className="h-2 w-full bg-white/10 rounded" />
                                    <div className="h-2 w-5/6 bg-white/10 rounded" />
                                    <div className="h-2 w-2/3 bg-white/10 rounded" />
                                    <div className="h-2 w-full bg-white/10 rounded" />
                                </div>
                                <div className="absolute top-3 right-3 opacity-20">
                                    <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                            </div>
                            {/* Info */}
                            <div className="p-4">
                                <span className="inline-block text-[9px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-0.5 mb-2">Notes</span>
                                <h4 className="font-bold text-sm text-white leading-snug mb-1">Chemistry Module 3 Notes</h4>
                                <p className="text-[11px] text-slate-500">Unit 3 • 24 pages</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-[10px] text-slate-600 font-medium">Added 2 hrs ago</span>
                                    <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Material Card 2 */}
                        <div className="bg-[#141416] border border-white/5 hover:border-indigo-500/30 rounded-2xl overflow-hidden transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/10" onClick={() => navigate('/ask-finder')}>
                            <div className="h-28 bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 relative overflow-hidden px-4 pt-4">
                                <div className="space-y-2">
                                    <div className="h-2 w-1/2 bg-white/20 rounded" />
                                    <div className="h-2 w-full bg-white/10 rounded" />
                                    <div className="h-2 w-4/5 bg-white/10 rounded" />
                                    <div className="h-2 w-full bg-white/10 rounded" />
                                    <div className="h-2 w-3/5 bg-white/10 rounded" />
                                </div>
                                <div className="absolute top-3 right-3 opacity-20">
                                    <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                            </div>
                            <div className="p-4">
                                <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5 mb-2">Internal Paper</span>
                                <h4 className="font-bold text-sm text-white leading-snug mb-1">Electrical Test-02</h4>
                                <p className="text-[11px] text-slate-500">Sem 2 • 4 pages</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-[10px] text-slate-600 font-medium">Added 5 hrs ago</span>
                                    <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Material Card 3 */}
                        <div className="bg-[#141416] border border-white/5 hover:border-pink-500/30 rounded-2xl overflow-hidden transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-900/10" onClick={() => navigate('/ask-finder')}>
                            <div className="h-28 bg-gradient-to-br from-pink-900/50 to-pink-800/30 relative overflow-hidden px-4 pt-4">
                                <div className="space-y-2">
                                    <div className="h-2 w-2/3 bg-white/20 rounded" />
                                    <div className="h-2 w-full bg-white/10 rounded" />
                                    <div className="h-2 w-3/4 bg-white/10 rounded" />
                                    <div className="h-2 w-full bg-white/10 rounded" />
                                    <div className="h-2 w-1/2 bg-white/10 rounded" />
                                </div>
                                <div className="absolute top-3 right-3 opacity-20">
                                    <svg className="w-10 h-10 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                            </div>
                            <div className="p-4">
                                <span className="inline-block text-[9px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded px-2 py-0.5 mb-2">SEE Paper</span>
                                <h4 className="font-bold text-sm text-white leading-snug mb-1">Mathematics SEE 2023</h4>
                                <p className="text-[11px] text-slate-500">Sem 4 • 8 pages</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-[10px] text-slate-600 font-medium">Added yesterday</span>
                                    <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-pink-500/20 flex items-center justify-center transition-colors">
                                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Material Card 4 */}
                        <div className="bg-[#141416] border border-white/5 hover:border-emerald-500/30 rounded-2xl overflow-hidden transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10" onClick={() => navigate('/ask-finder')}>
                            <div className="h-28 bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 relative overflow-hidden px-4 pt-4">
                                <div className="space-y-2">
                                    <div className="h-2 w-4/5 bg-white/20 rounded" />
                                    <div className="h-2 w-full bg-white/10 rounded" />
                                    <div className="h-2 w-2/3 bg-white/10 rounded" />
                                    <div className="h-2 w-full bg-white/10 rounded" />
                                    <div className="h-2 w-3/4 bg-white/10 rounded" />
                                </div>
                                <div className="absolute top-3 right-3 opacity-20">
                                    <svg className="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                            </div>
                            <div className="p-4">
                                <span className="inline-block text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5 mb-2">PYQ</span>
                                <h4 className="font-bold text-sm text-white leading-snug mb-1">Engineering Physics PYQs</h4>
                                <p className="text-[11px] text-slate-500">Sem 1 • 12 pages</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-[10px] text-slate-600 font-medium">Added 2 days ago</span>
                                    <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                                        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Problem -> Tool Sections */}
                
                {/* Tool 1: Material Finder */}
                <section className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                    <div className="md:w-1/2">
                        <span className="text-purple-400 font-bold uppercase tracking-widest text-[10px] md:text-sm mb-2 block">Materials Finder</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 font-outfit leading-tight">Find Study Materials Easily</h2>
                        <p className="text-slate-400 text-base md:text-lg mb-6 md:mb-8">
                            Stop scrolling through endless WhatsApp groups. Search for notes, PYQs, and test papers shared directly by seniors in organized folders.
                        </p>
                        <button onClick={() => navigate('/ask-finder')} className="bg-white/10 hover:bg-white/20 border border-white/20 px-5 md:px-6 py-2.5 md:py-3 rounded-full font-bold transition-all text-sm md:text-base inline-flex items-center gap-2">
                            Search Materials <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                    </div>
                    {/* Mockup */}
                    <div className="md:w-1/2 w-full mt-8 md:mt-0">
                        <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/10">
                            {/* Browser Header */}
                            <div className="bg-[#242427] px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                <div className="ml-4 bg-[#1a1a1c] rounded flex-1 h-5 md:h-6 flex items-center px-4">
                                    <span className="text-[9px] md:text-[10px] text-slate-500">askursenior.com/ask-finder?search=chemistry</span>
                                </div>
                            </div>
                            {/* UI Body Mock */}
                            <div className="p-4 md:p-6">
                                <div className="flex gap-3 md:gap-4 mb-4 md:mb-6">
                                    <div className="h-8 md:h-10 w-full bg-[#242427] rounded-lg border border-white/10 flex items-center px-3 md:px-4 text-xs md:text-sm text-slate-400">
                                        Chemistry Module
                                    </div>
                                    <div className="h-8 md:h-10 w-20 md:w-24 bg-purple-600 rounded-lg hidden sm:block"></div>
                                </div>
                                <div className="space-y-2.5 md:space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center justify-between p-2.5 md:p-3 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-purple-500/20"></div>
                                                <div>
                                                    <div className="h-3 md:h-4 w-24 md:w-32 bg-white/20 rounded mb-1.5 md:mb-2"></div>
                                                    <div className="h-1.5 md:h-2 w-16 md:w-20 bg-white/10 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="h-6 md:h-8 w-12 md:w-16 bg-white/10 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tool 2: CIE Analyzer & CGPA Calculator */}
                <section className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16 w-full overflow-hidden">
                    <div className="md:w-1/2">
                        <span className="text-pink-400 font-bold uppercase tracking-widest text-[10px] md:text-sm mb-2 block">Grade Tracking & Analysis</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 font-outfit leading-tight">CIE Analyzer & CGPA Calculator</h2>
                        <p className="text-slate-400 text-base md:text-lg mb-6 md:mb-8">
                            Are you eligible for your finals? Try our interactive CIE Analyzer! Instantly compute your SGPA and CGPA using precise SIT rules, and plan exactly what marks you need for your target grade.
                        </p>
                        <button onClick={() => navigate('/calculator')} className="bg-white/10 hover:bg-white/20 border border-white/20 px-5 md:px-6 py-2.5 md:py-3 rounded-full font-bold transition-all text-sm md:text-base inline-flex items-center gap-2">
                            Open Full Calculator <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </button>
                    </div>
                    {/* Interactive Widget */}
                    <div className="md:w-1/2 w-full mt-8 md:mt-0 max-w-sm mx-auto">
                        <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-pink-900/10 hover:border-pink-500/20 transition-colors">
                            {/* Browser Header */}
                            <div className="bg-[#242427] px-4 py-2.5 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-wider">MATHEMATICS CIE</span>
                            </div>
                            {/* UI Body Interactive */}
                            <div className="p-5 md:p-6 relative">
                                <div className="mb-5 text-center">
                                    <h4 className="text-lg font-bold text-white mb-1">Calculate Your CIE Instantly</h4>
                                    <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed">Enter your Test, Quiz, and ABL marks to instantly see your CIE score and understand your exam readiness.</p>
                                </div>
                                <form onSubmit={e => e.preventDefault()} className="space-y-3.5 md:space-y-4 relative z-10">
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div>
                                            <label className="block text-[10px] md:text-xs font-bold text-slate-400 mb-1">Test-01 (50)</label>
                                            <input type="number" min="0" max="50" value={mathMarks.test1} onChange={e => setMathMarks({...mathMarks, test1: e.target.value})} className="w-full bg-[#242427] border border-white/10 rounded-xl py-1.5 md:py-2 px-3 text-white text-xs md:text-sm focus:ring-1 focus:ring-pink-500 focus:outline-none" placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] md:text-xs font-bold text-slate-400 mb-1">Test-02 (50)</label>
                                            <input type="number" min="0" max="50" value={mathMarks.test2} onChange={e => setMathMarks({...mathMarks, test2: e.target.value})} className="w-full bg-[#242427] border border-white/10 rounded-xl py-1.5 md:py-2 px-3 text-white text-xs md:text-sm focus:ring-1 focus:ring-pink-500 focus:outline-none" placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div>
                                            <label className="block text-[10px] md:text-xs font-bold text-slate-400 mb-1">Quiz (40)</label>
                                            <input type="number" min="0" max="40" value={mathMarks.quiz} onChange={e => setMathMarks({...mathMarks, quiz: e.target.value})} className="w-full bg-[#242427] border border-white/10 rounded-xl py-1.5 md:py-2 px-3 text-white text-xs md:text-sm focus:ring-1 focus:ring-pink-500 focus:outline-none" placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] md:text-xs font-bold text-slate-400 mb-1">ABL (40)</label>
                                            <input type="number" min="0" max="40" value={mathMarks.assignment} onChange={e => setMathMarks({...mathMarks, assignment: e.target.value})} className="w-full bg-[#242427] border border-white/10 rounded-xl py-1.5 md:py-2 px-3 text-white text-xs md:text-sm focus:ring-1 focus:ring-pink-500 focus:outline-none" placeholder="0" />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-3 md:pt-4 mt-3 md:mt-4 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-2.5 md:mb-3">
                                            <span className="text-xs md:text-sm font-semibold text-white">Total CIE</span>
                                            <span className="text-xl md:text-2xl font-black text-white">{totalCIE} <span className="text-xs md:text-sm text-slate-500">/ 50</span></span>
                                        </div>
                                        
                                        {hasEnteredMarks ? (
                                            <div className={`py-1.5 md:py-2 px-3 rounded-lg text-center font-bold text-xs md:text-sm ${isEligible ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                {isEligible ? 'Eligible for SEE 🎉' : 'Not Eligible for SEE ⚠️'}
                                            </div>
                                        ) : (
                                            <div className="py-1.5 md:py-2 px-3 rounded-lg text-center font-bold text-xs md:text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                Enter marks to analyze
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tool 3: Dashboard */}
                <section className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                    <div className="md:w-1/2">
                        <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] md:text-sm mb-2 block">Student Workspace</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 font-outfit leading-tight">Track Study Progress</h2>
                        <p className="text-slate-400 text-base md:text-lg mb-6 md:mb-8">
                            Monitor your complete module progress, keep track of revision topics, and stay absolutely exam ready across all your enrolled subjects.
                        </p>
                        <button onClick={() => navigate('/dashboard')} className="bg-white/10 hover:bg-white/20 border border-white/20 px-5 md:px-6 py-2.5 md:py-3 rounded-full font-bold transition-all text-sm md:text-base inline-flex items-center gap-2">
                            Go to Dashboard <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </div>
                    {/* Mockup */}
                    <div className="md:w-1/2 w-full mt-8 md:mt-0">
                        <div className="bg-[#1a1a1c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/10">
                            {/* Browser Header */}
                            <div className="bg-[#242427] px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            </div>
                            {/* UI Body Mock */}
                            <div className="p-4 md:p-6">
                                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-500/20 border border-indigo-500/50"></div>
                                    <div>
                                        <div className="h-3 md:h-4 w-20 md:w-24 bg-white/20 rounded mb-1.5 md:mb-2"></div>
                                        <div className="h-1.5 md:h-2 w-28 md:w-32 bg-white/10 rounded"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                                    {/* Subject Card Mocks */}
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="p-2.5 md:p-3 bg-white/5 border border-white/5 rounded-xl">
                                            <div className="h-2.5 md:h-3 w-14 md:w-16 bg-white/20 rounded mb-2.5 md:mb-3"></div>
                                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-1">
                                                <div className="h-full bg-indigo-500" style={{ width: `${Math.random() * 60 + 20}%`}}></div>
                                            </div>
                                            <div className="h-1.5 md:h-2 w-6 md:w-8 bg-white/10 rounded ml-auto"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
            </div>
        </div>
    );
};

export default HomeProductShowcase;;

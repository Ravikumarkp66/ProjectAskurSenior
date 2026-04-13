import { useState } from 'react';
import Hero from '../components/Hero';
import InterviewExperienceSection from '../components/InterviewExperienceSection';
import TermsModal from '../components/TermsModal';

import PrivacyModal from '../components/PrivacyModal';
import HomeBlogSection from '../components/HomeBlogSection';
import CreatorSection from '../components/CreatorSection';
import HomeProductShowcase from '../components/HomeProductShowcase';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-[#0a0a0b] font-outfit">
            <main className="flex-1 relative z-10">
                <Hero />
                <InterviewExperienceSection />
                <HomeProductShowcase />
                <HomeBlogSection />
                <CreatorSection />
                
                {/* Trust Section - Icon Cards */}
                <section className="py-16 px-6 border-t border-white/5 bg-[#0d0d0f]">
                    <div className="max-w-5xl mx-auto">
                        <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-slate-600 mb-10">Why students trust AskUrSenior</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {/* Card 1 */}
                            <div className="flex items-start gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-purple-500/20 transition-colors">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">Shared by Seniors</h4>
                                    <p className="text-slate-500 text-xs leading-relaxed">Real notes and PYQs uploaded by students who've been through the same exams.</p>
                                </div>
                            </div>
                            {/* Card 2 */}
                            <div className="flex items-start gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-colors">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">Fully Organized</h4>
                                    <p className="text-slate-500 text-xs leading-relaxed">Materials sorted by subject, semester, and exam type — find exactly what you need.</p>
                                </div>
                            </div>
                            {/* Card 3 */}
                            <div className="flex items-start gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-colors">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm mb-1">SIT-Specific</h4>
                                    <p className="text-slate-500 text-xs leading-relaxed">Built exclusively for SIT's academic structure, CIE rules, and exam patterns.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Platform Footer */}
            <footer className="w-full bg-[#0a0a0b] py-16 px-6 flex flex-col items-center justify-center text-center space-y-10 relative z-20">
                <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 text-left">
                    <div>
                        <h4 className="text-white font-extrabold text-xl mb-4 font-outfit">AskUrSenior</h4>
                        <p className="text-slate-400 text-sm max-w-xs block mb-4">
                            Notes, PYQs and academic tools built natively for SIT students.
                        </p>
                        <p className="text-slate-500 text-xs font-medium">
                            © 2026 AskUrSenior. All rights reserved.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs text-slate-500">Platform</h4>
                        <div className="flex flex-col space-y-3">
                            <Link to="/ask-finder" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Materials Finder</Link>
                            <Link to="/calculator" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">CGPA Calculator</Link>
                            <Link to="/blog" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Blog Guides</Link>
                            <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Student Dashboard</Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-base mb-4 tracking-wide uppercase text-xs text-slate-500">Support & Legal</h4>
                        <div className="flex flex-col space-y-3">
                            <a href="mailto:askursenior66@gmail.com" className="text-purple-400 hover:text-purple-300 font-bold text-sm transition-colors">askursenior66@gmail.com</a>
                            <button onClick={() => setShowTerms(true)} className="text-slate-400 hover:text-white transition-colors text-sm font-medium text-left">Terms & Conditions</button>
                            <button onClick={() => setShowPrivacy(true)} className="text-slate-400 hover:text-white transition-colors text-sm font-medium text-left">Privacy Policy</button>
                        </div>
                    </div>
                </div>
            </footer>

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
            />
            <PrivacyModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
            />
        </div>
    );
};

export default HomePage;

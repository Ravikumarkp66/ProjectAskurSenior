import { useState } from 'react';
import Hero from '../components/Hero';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';
import HomeBlogSection from '../components/HomeBlogSection';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-[#0a0a0b] font-outfit">
            <main className="flex-1 overflow-x-hidden">
                <Hero />
                <HomeBlogSection />
            </main>

            {/* Platform Footer */}
            <footer className="w-full bg-[#141416]/50 border-t border-white/5 py-12 px-6 flex flex-col items-center justify-center text-center space-y-6 relative z-[10]">
                <div className="max-w-4xl mx-auto space-y-4">
                    <p className="text-gray-400 text-sm font-medium">
                        © 2026 AskUrSenior. All rights reserved.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <Link to="/calculator" className="text-gray-500 hover:text-white transition-colors text-sm">CGPA Calculator</Link>
                        <button
                            onClick={() => setShowTerms(true)}
                            className="text-gray-500 hover:text-white transition-colors text-sm"
                        >
                            Terms & Conditions
                        </button>
                        <button
                            onClick={() => setShowPrivacy(true)}
                            className="text-gray-500 hover:text-white transition-colors text-sm"
                        >
                            Privacy Policy
                        </button>
                    </div>
                    <div className="pt-4 border-t border-white/5 w-full flex flex-col items-center gap-2">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-[0.2em]">Contact & Support</p>
                        <a href="mailto:askursenior66@gmail.com" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                            askursenior66@gmail.com
                        </a>
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

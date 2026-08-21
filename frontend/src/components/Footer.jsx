import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { FaInstagram, FaLinkedin, FaGithub, FaYoutube, FaXTwitter } from 'react-icons/fa6';

const Footer = ({ onOpenTerms, onOpenPrivacy }) => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="w-full bg-[#030712] relative z-20 py-12 sm:py-16 px-6">
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center space-y-8">
                
                {/* Section 1: Official Brand Logo & Tagline */}
                <div className="flex flex-col items-center space-y-2.5">
                    <button 
                        onClick={scrollToTop} 
                        aria-label="Scroll to top"
                        className="group inline-flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                        <Logo size="md" showText={true} onClick={scrollToTop} />
                    </button>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
                        Built by students, for students.
                    </p>
                </div>

                {/* Section 2: Navigation Links (Single horizontal row, wrapping on tablet/mobile) */}
                <nav className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-8 gap-y-2 text-xs sm:text-sm font-medium text-slate-400">
                    <Link to="/" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                        Home
                    </Link>
                    <Link to="/ask-finder" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                        Ask+
                    </Link>
                    <Link to="/pricing" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                        Pricing
                    </Link>
                    <Link to="/cms" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                        Materials
                    </Link>
                    <Link to="/campus-map" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                        Campus Explorer
                    </Link>
                    <Link to="/interview" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                        Interview Experiences
                    </Link>
                    <Link to="/blog" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                        Blogs
                    </Link>
                    <a href="mailto:askursenior66@gmail.com" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                        Contact
                    </a>
                    {onOpenPrivacy ? (
                        <button onClick={onOpenPrivacy} className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                            Privacy Policy
                        </button>
                    ) : (
                        <Link to="/privacy" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                            Privacy Policy
                        </Link>
                    )}
                    {onOpenTerms ? (
                        <button onClick={onOpenTerms} className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                            Terms & Conditions
                        </button>
                    ) : (
                        <Link to="/terms" className="min-h-[44px] inline-flex items-center px-2 hover:text-white hover:underline hover:decoration-purple-500 hover:underline-offset-4 transition-all duration-300">
                            Terms & Conditions
                        </Link>
                    )}
                </nav>

                {/* Section 3: Copyright */}
                <div className="pt-2 w-full max-w-xs">
                    <p className="text-xs text-slate-500 font-medium">
                        © 2026 AskUrSenior. Built by students, for students.
                    </p>
                </div>

            </div>
        </footer>
    );
};

export default Footer;

import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { FaInstagram, FaLinkedin, FaGithub, FaYoutube, FaXTwitter } from 'react-icons/fa6';

const Footer = ({ onOpenTerms, onOpenPrivacy }) => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="w-full bg-[#F8FAFC] dark:bg-[#0F1115] border-t border-[#E5E7EB] dark:border-[#292E37] relative z-20 py-12 sm:py-16 px-6 transition-colors duration-150">
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
                
                {/* Section 1: Official Brand Logo & Tagline */}
                <div className="flex flex-col items-center space-y-2">
                    <button 
                        onClick={scrollToTop} 
                        aria-label="Scroll to top"
                        className="group inline-flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                        <Logo size="md" showText={true} onClick={scrollToTop} />
                    </button>
                    <p className="text-xs sm:text-sm text-[#4B5563] dark:text-[#A1A1AA] font-normal tracking-normal">
                        Built by students, for students.
                    </p>
                </div>

                {/* Section 2: Navigation Links (Single horizontal row, wrapping on tablet/mobile) */}
                <nav className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-[#4B5563] dark:text-[#A1A1AA]">
                    <Link to="/" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                        Home
                    </Link>
                    <Link to="/ask-finder" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                        Notes & PYQs
                    </Link>
                    <Link to="/pricing" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                        Pricing
                    </Link>
                    <Link to="/cms" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                        Materials
                    </Link>
                    <Link to="/campus-map" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                        Campus Explorer
                    </Link>
                    <Link to="/interview" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                        Interview Experiences
                    </Link>
                    <Link to="/blog" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                        Blogs
                    </Link>
                    <a href="mailto:askursenior66@gmail.com" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                        Contact
                    </a>
                    {onOpenPrivacy ? (
                        <button onClick={onOpenPrivacy} className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                            Privacy Policy
                        </button>
                    ) : (
                        <Link to="/privacy" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                            Privacy Policy
                        </Link>
                    )}
                    {onOpenTerms ? (
                        <button onClick={onOpenTerms} className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                            Terms & Conditions
                        </button>
                    ) : (
                        <Link to="/terms" className="min-h-[40px] inline-flex items-center px-2 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors duration-150">
                            Terms & Conditions
                        </Link>
                    )}
                </nav>

                {/* Section 3: Copyright */}
                <div className="pt-2 w-full max-w-xs">
                    <p className="text-xs text-[#6B7280] dark:text-[#71717A] font-normal">
                        © 2026 AskUrSenior. Built by students, for students.
                    </p>
                </div>

            </div>
        </footer>
    );
};

export default Footer;

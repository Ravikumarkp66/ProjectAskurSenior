import React, { useState } from 'react';
import { Target, Sparkles, ExternalLink, User } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';

const ImageWithFallback = ({ src, alt }) => {
    const [status, setStatus] = useState('loading');

    return (
        <div className="relative w-full aspect-[4/5] min-h-[360px] rounded-lg overflow-hidden bg-[#F8FAFC] dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37]">
            <img 
                src={src} 
                alt={alt}
                className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
                    status === 'loaded' ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 z-0'
                }`}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
            />

            {(status === 'loading' || status === 'error') && (
                <div className="absolute inset-0 z-0 bg-[#F8FAFC] dark:bg-[#15181D] rounded-lg flex flex-col items-center justify-center p-6 text-center border border-[#E5E7EB] dark:border-[#292E37]">
                    <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 p-1 flex items-center justify-center border border-[#E9D5FF] dark:border-[#7C3AED]/30">
                            <User className="text-[#7C3AED] dark:text-[#A78BFA]" size={36} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-[#7C3AED] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            🎓 SIT
                        </div>
                    </div>

                    <h4 className="text-[#111827] dark:text-[#F3F4F6] font-bold text-lg tracking-tight mb-0.5">Ravikumar KP</h4>
                    <p className="text-[#7C3AED] dark:text-[#A78BFA] text-xs font-medium uppercase tracking-wider mb-2">Founder • AskUrSenior</p>

                    <div className="bg-white dark:bg-[#1B1F26] border border-[#E5E7EB] dark:border-[#292E37] rounded-[6px] px-3.5 py-2 text-[11px] text-[#4B5563] dark:text-[#A1A1AA] max-w-[240px] space-y-0.5">
                        <p className="font-medium text-[#111827] dark:text-[#F3F4F6]">Information Science & Engineering</p>
                        <p className="text-[#7C3AED] dark:text-[#A78BFA]">Siddaganga Institute of Technology</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const CreatorSection = () => {
    return (
        <section id="creator" className="relative py-16 px-6 bg-transparent border-b border-[#E5E7EB] dark:border-[#292E37]">
            <div className="max-w-6xl mx-auto relative z-10 space-y-12">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] text-xs font-medium uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Founder Story</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight leading-tight">
                        Built by a student,{' '}
                        <span className="text-[#7C3AED] dark:text-[#A78BFA]">
                            for every student.
                        </span>
                    </h2>

                    <p className="text-[#4B5563] dark:text-[#A1A1AA] text-sm font-normal">
                        Meet the student behind AskUrSenior.
                    </p>
                </div>

                {/* Top Founder Story Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">

                    {/* Founder Image & Floating Badges */}
                    <div className="md:col-span-5 relative flex justify-center items-center">
                        <div className="relative p-1 bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] rounded-lg shadow-none overflow-hidden w-full max-w-[360px]">
                            <ImageWithFallback 
                                src="https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/DocScanner+Apr+20%2C+2022+9-12+AM_LE_upscale_prime_cleanup.jpg" 
                                alt="Ravikumar KP - Founder of AskUrSenior"
                            />
                        </div>

                        {/* Top Floating Badge: Founder */}
                        <div 
                            className="absolute -top-3 -left-2 sm:-left-4 px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] shadow-none flex items-center gap-1.5 z-20 text-[#111827] dark:text-[#F3F4F6]"
                        >
                            <span className="text-xs">🎓</span>
                            <span className="text-xs font-semibold tracking-wide">Founder</span>
                        </div>

                        {/* Bottom Floating Badge: Building AskUrSenior */}
                        <div 
                            className="absolute -bottom-3 -right-2 sm:-right-4 px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] shadow-none flex items-center gap-1.5 z-20 text-[#111827] dark:text-[#F3F4F6]"
                        >
                            <span className="text-xs">🚀</span>
                            <span className="text-xs font-semibold tracking-wide">Building AskUrSenior</span>
                        </div>
                    </div>

                    {/* Creator Information & Body Story Content */}
                    <div className="md:col-span-7 space-y-4 text-[#374151] dark:text-[#D1D5DB] font-normal">
                        <p className="text-[#111827] dark:text-[#F3F4F6] font-semibold text-lg sm:text-xl leading-snug">
                            Hi, I'm <span className="text-[#7C3AED] dark:text-[#A78BFA] underline decoration-[#7C3AED]/40 decoration-2 underline-offset-4">Ravikumar KP</span>, an Information Science and Engineering student at Siddaganga Institute of Technology, Tumakuru.
                        </p>

                        <p className="text-[#4B5563] dark:text-[#A1A1AA] text-sm sm:text-base leading-relaxed">
                            During my first year, I realized that finding reliable academic resources, understanding college procedures, and learning from seniors often took more time than studying itself.
                        </p>

                        <p className="text-[#4B5563] dark:text-[#A1A1AA] text-sm sm:text-base leading-relaxed">
                            Important information was scattered across different groups, repeated questions were asked every semester, and many students struggled simply because they didn't know where to look.
                        </p>

                        <p className="text-[#111827] dark:text-[#F3F4F6] font-medium italic text-base sm:text-lg border-l-2 border-[#7C3AED] pl-3.5 py-1 bg-[#FAF5FF]/50 dark:bg-[#581C87]/15 rounded-r-[6px]">
                            That's why I created AskUrSenior.
                        </p>

                        <p className="text-[#4B5563] dark:text-[#A1A1AA] text-sm sm:text-base leading-relaxed">
                            Today, AskUrSenior brings together study materials, previous year question papers, interview experiences, faculty insights, CIE & attendance tools, and student guidance into one platform designed to make college life simpler.
                        </p>
                    </div>

                </div>

                {/* Mission & Vision Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Mission Card */}
                    <div className="p-5 sm:p-6 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] shadow-none flex flex-col justify-between">
                        <div>
                            <div className="w-9 h-9 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED] dark:text-[#A78BFA] mb-3">
                                <Target className="w-4.5 h-4.5" />
                            </div>
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6] mb-1.5">My Mission</h3>
                            <p className="text-[#4B5563] dark:text-[#A1A1AA] text-xs sm:text-sm leading-relaxed font-normal">
                                Help every student spend less time searching and more time learning by providing trusted resources, practical guidance, and the experience of seniors in one place.
                            </p>
                        </div>
                    </div>

                    {/* Vision Card */}
                    <div className="p-5 sm:p-6 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] shadow-none flex flex-col justify-between">
                        <div>
                            <div className="w-9 h-9 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED] dark:text-[#A78BFA] mb-3">
                                <Sparkles className="w-4.5 h-4.5" />
                            </div>
                            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6] mb-1.5">Vision</h3>
                            <p className="text-[#4B5563] dark:text-[#A1A1AA] text-xs sm:text-sm leading-relaxed font-normal">
                                Build the most trusted student platform where knowledge, guidance, and opportunities are accessible to every student.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Founder Quote */}
                <div 
                    className="p-6 sm:p-8 rounded-lg bg-[#F8FAFC] dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] text-center"
                >
                    <div className="max-w-3xl mx-auto space-y-3">
                        <p className="text-base sm:text-lg text-[#111827] dark:text-[#F3F4F6] leading-relaxed italic font-normal">
                            "I wanted to build the platform I wish I had during my first year—a place where every student can find the right information in seconds instead of spending hours searching for it."
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
                            — Ravikumar KP
                        </p>
                    </div>
                </div>

                {/* Bottom Bar: Founder Profile Card & Actions */}
                <div 
                    className="pt-4 flex flex-col items-center justify-center gap-4"
                >
                    {/* Founder Mini Card */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3.5 p-3 px-4 rounded-lg bg-white dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] shadow-none">
                        <img 
                            src="https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/DocScanner+Apr+20%2C+2022+9-12+AM_LE_upscale_prime_cleanup.jpg" 
                            alt="Ravikumar KP" 
                            className="w-10 h-10 rounded-[6px] object-cover border border-[#E5E7EB] dark:border-[#292E37] shrink-0"
                        />
                        <div className="text-center sm:text-left">
                            <h4 className="text-[#111827] dark:text-[#F3F4F6] font-semibold text-sm leading-tight">Ravikumar KP</h4>
                            <p className="text-[#6B7280] dark:text-[#71717A] text-xs mt-0.5 font-normal">Founder • AskUrSenior</p>
                        </div>

                        <div className="hidden sm:block h-5 w-px bg-[#E5E7EB] dark:bg-[#292E37] mx-1" />

                        {/* Social Buttons */}
                        <div className="flex items-center gap-2">
                            <a 
                                href="https://www.linkedin.com/in/ravikumar-k-p-80b7a628b/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="min-h-[34px] min-w-[34px] flex items-center justify-center p-1.5 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#7C3AED] hover:text-white dark:hover:bg-[#7C3AED] dark:hover:text-white transition-colors"
                                title="LinkedIn Profile"
                            >
                                <FaLinkedin size={15} />
                            </a>
                            <a 
                                href="https://ravikumar-kp.github.io/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="min-h-[34px] min-w-[34px] flex items-center justify-center p-1.5 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] hover:bg-[#7C3AED] hover:text-white dark:hover:bg-[#7C3AED] dark:hover:text-white transition-colors"
                                title="Portfolio"
                            >
                                <ExternalLink size={15} />
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default CreatorSection;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles, ArrowRight, ExternalLink, User } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ImageWithFallback = ({ src, alt }) => {
    const [status, setStatus] = useState('loading');

    return (
        <div className="relative w-full aspect-[4/5] min-h-[380px] rounded-[24px] overflow-hidden bg-gradient-to-b from-[#180E38] via-[#0E0728] to-[#070314] border border-purple-500/20">
            <img 
                src={src} 
                alt={alt}
                className={`w-full h-full object-cover rounded-[24px] transition-all duration-700 shadow-2xl group-hover:scale-[1.03] ${
                    status === 'loaded' ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 z-0'
                }`}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
            />

            {(status === 'loading' || status === 'error') && (
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#1A0C3B] via-[#0E0728] to-[#070314] rounded-[24px] flex flex-col items-center justify-center p-6 text-center border border-purple-500/20">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-1 flex items-center justify-center shadow-xl shadow-purple-500/30">
                            <div className="w-full h-full rounded-full bg-[#0A051D] flex items-center justify-center">
                                <User className="text-purple-300" size={44} />
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0A051D]">
                            🎓 SIT
                        </div>
                    </div>

                    <h4 className="text-white font-extrabold text-xl tracking-tight mb-1 font-outfit">Ravikumar KP</h4>
                    <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">Founder • AskUrSenior</p>

                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-slate-300 max-w-[250px] space-y-0.5">
                        <p className="font-semibold text-slate-200">Information Science & Engineering</p>
                        <p className="text-purple-300 font-medium">Siddaganga Institute of Technology</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const CreatorSection = () => {
    return (
        <section id="creator" className="relative py-24 px-6 overflow-hidden bg-transparent">
            <div className="max-w-6xl mx-auto relative z-10 space-y-16">

                {/* Section Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto space-y-3"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Founder Story</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight leading-tight">
                        Built by a student,<br />
                        <span className="text-purple-600 dark:text-purple-400">
                            for every student.
                        </span>
                    </h2>

                    <p className="text-slate-600 dark:text-slate-400 text-base font-normal">
                        Meet the student behind AskUrSenior.
                    </p>
                </motion.div>

                {/* Top Founder Story Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">

                    {/* Founder Image & Floating Badges */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="md:col-span-5 relative flex justify-center items-center"
                    >
                        {/* Premium Image Container */}
                        <div className="relative p-1.5 bg-slate-100 dark:bg-[#0D111C] border border-slate-200 dark:border-slate-800 rounded-[28px] group shadow-sm dark:shadow-none overflow-hidden w-full max-w-[380px]">
                            <div className="relative bg-slate-900 dark:bg-[#060913] rounded-[24px] overflow-hidden">
                                <ImageWithFallback 
                                    src="https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/DocScanner+Apr+20%2C+2022+9-12+AM_LE_upscale_prime_cleanup.jpg"
                                    alt="Ravikumar KP - Founder of AskUrSenior"
                                />
                            </div>
                        </div>

                        {/* Top Floating Badge: Founder */}
                        <div 
                            className="absolute -top-4 -left-4 sm:-left-6 px-4 py-2 rounded-xl bg-white dark:bg-[#0D111C] border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-2 z-20 text-slate-900 dark:text-white"
                        >
                            <span className="text-sm">🎓</span>
                            <span className="text-xs font-bold tracking-wide">Founder</span>
                        </div>

                        {/* Bottom Floating Badge: Building AskUrSenior */}
                        <div 
                            className="absolute -bottom-4 -right-4 sm:-right-6 px-4 py-2 rounded-xl bg-white dark:bg-[#0D111C] border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-2 z-20 text-slate-900 dark:text-white"
                        >
                            <span className="text-sm">🚀</span>
                            <span className="text-xs font-bold tracking-wide">Building AskUrSenior</span>
                        </div>
                    </motion.div>

                    {/* Creator Information & Body Story Content */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="md:col-span-7 space-y-5 text-slate-700 dark:text-slate-300 font-normal"
                    >
                        <p className="text-slate-900 dark:text-white font-medium text-xl sm:text-2xl leading-snug">
                            Hi, I'm <span className="text-purple-600 dark:text-purple-400 font-bold underline decoration-purple-500/40 decoration-2 underline-offset-4">Ravikumar KP</span>, an Information Science and Engineering student at Siddaganga Institute of Technology, Tumakuru.
                        </p>

                        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
                            During my first year, I realized that finding reliable academic resources, understanding college procedures, and learning from seniors often took more time than studying itself.
                        </p>

                        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
                            Important information was scattered across different groups, repeated questions were asked every semester, and many students struggled simply because they didn't know where to look.
                        </p>

                        <p className="text-slate-900 dark:text-white font-semibold italic text-lg sm:text-xl border-l-2 border-purple-600 pl-4 py-1.5 bg-purple-50/50 dark:bg-purple-500/5 rounded-r-xl">
                            That's why I created AskUrSenior.
                        </p>

                        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
                            Today, AskUrSenior brings together study materials, previous year question papers, interview experiences, faculty insights, AI assistance, campus tools, and student guidance into one platform designed to make college life simpler.
                        </p>
                    </motion.div>

                </div>

                {/* Mission & Vision Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Mission Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="p-7 rounded-2xl bg-white dark:bg-[#0D111C] border border-slate-200 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all duration-200 shadow-sm dark:shadow-none flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                                <Target className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-2">My Mission</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-normal">
                                Help every student spend less time searching and more time learning by providing trusted resources, practical guidance, and the experience of seniors in one place.
                            </p>
                        </div>
                    </motion.div>

                    {/* Vision Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="p-7 rounded-2xl bg-white dark:bg-[#0D111C] border border-slate-200 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-500/30 transition-all duration-200 shadow-sm dark:shadow-none flex flex-col justify-between group"
                    >
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-2">Vision</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-normal">
                                Build the most trusted student platform where knowledge, guidance, and opportunities are accessible to every student.
                            </p>
                        </div>
                    </motion.div>

                </div>

                {/* Founder Quote */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="p-8 sm:p-10 rounded-2xl bg-slate-100/70 dark:bg-[#0D111C]/60 border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden"
                >
                    <div className="max-w-3xl mx-auto space-y-4 relative z-10">
                        <p className="text-xl sm:text-2xl text-slate-800 dark:text-slate-200 leading-relaxed italic font-medium">
                            "I wanted to build the platform I wish I had during my first year—a place where every student can find the right information in seconds instead of spending hours searching for it."
                        </p>
                        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 font-outfit">
                            — Ravikumar KP
                        </p>
                    </div>
                </motion.div>

                {/* Bottom Bar: Founder Profile Card & Actions */}
                <div 
                    className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-6"
                >
                    {/* Founder Mini Card */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3.5 p-3 px-5 sm:pr-6 rounded-2xl bg-white dark:bg-[#0D111C] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <img 
                            src="https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/DocScanner+Apr+20%2C+2022+9-12+AM_LE_upscale_prime_cleanup.jpg" 
                            alt="Ravikumar KP" 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="text-center sm:text-left">
                            <h4 className="text-slate-900 dark:text-white font-bold text-sm leading-tight font-outfit">Ravikumar KP</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium">Founder • AskUrSenior</p>
                        </div>

                        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                        {/* Social Buttons */}
                        <div className="flex items-center gap-2">
                            <a 
                                href="https://www.linkedin.com/in/ravikumar-k-p-80b7a628b/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-lg bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                title="LinkedIn Profile"
                            >
                                <FaLinkedin size={16} />
                            </a>
                            <a 
                                href="https://ravikumar-kp.github.io/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all active:scale-95"
                                title="Portfolio"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default CreatorSection;

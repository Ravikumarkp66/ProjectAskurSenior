import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Code, GraduationCap, Sparkles, User } from 'lucide-react';
import { FaLinkedin } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const ImageWithFallback = ({ src, alt }) => {
    const [status, setStatus] = React.useState('loading');

    return (
        <div className="relative w-full h-full">
            {/* Skeleton / Loading */}
            {status === 'loading' && (
                <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
                    <Sparkles className="text-purple-500/20 animate-spin" size={40} />
                </div>
            )}
            
            {/* Image */}
            <img 
                src={src} 
                alt={alt}
                className={`w-full max-w-[420px] h-auto rounded-[20px] object-contain transition-all duration-700 shadow-[0_20px_60px_rgba(139,92,246,0.25)] group-hover:scale-[1.03] ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
            />

            {/* Error Placeholder */}
            {status === 'error' && (
                <div className="absolute inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center p-8 text-center">
                    <User className="text-white/10 mb-4" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Image not public</p>
                    <p className="text-[8px] text-slate-600 mt-2 max-w-[150px]">Please check S3 permissions for "DocScanner..."</p>
                </div>
            )}
        </div>
    );
};

const CreatorSection = () => {
    const { isAuthenticated } = useAuthContext();
    return (
        <section className="relative py-24 px-6 overflow-hidden bg-[#0a0a0b]">
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] opacity-50" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] opacity-30" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    
                    {/* Left Content */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] font-outfit">
                            Built by a student,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400">
                                for students
                            </span>
                        </h2>

                        <div className="space-y-6 max-w-xl">
                            <p className="text-lg text-slate-300 font-medium leading-relaxed">
                                Hey, I’m <span className="text-white font-bold underline decoration-purple-500/50 decoration-2 underline-offset-4">Ravikumar KP</span> — a BE student in Information Science and Engineering at <span className="text-purple-400">Siddaganga Institute of Technology, Tumkur.</span>
                            </p>
                            
                            <p className="text-slate-400 leading-relaxed">
                                I’m the creator and founder of <span className="text-white font-bold">AskUrSenior</span> — a growing student community that has already helped <span className="text-white font-bold underline decoration-purple-500/20">1000+ students</span>, especially from the 2028 and 2029 graduating batches, understand the college curriculum and study smarter.
                            </p>

                            <p className="text-slate-400 leading-relaxed italic">
                                What started as a small idea is now something many students rely on — something I personally wish I had when I first joined college.
                            </p>

                            <div className="py-4 border-l-2 border-purple-500/30 pl-6 my-8 bg-white/5 rounded-r-2xl">
                                <p className="text-2xl font-black text-white mb-2 tracking-tighter">
                                    Skills &gt;&gt;&gt; CGPA.
                                </p>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    But I also understood a harsh reality — you still need a minimum CGPA to even get shortlisted in most companies.
                                </p>
                            </div>

                            <p className="text-slate-400 leading-relaxed font-medium">
                                That’s exactly why I built AskUrSenior. <br />
                                Not just to study more — but to <span className="text-purple-400">study smarter, faster, and with clarity.</span>
                            </p>

                            <p className="text-slate-500 leading-relaxed italic border-t border-white/5 pt-6 text-sm">
                                "I wanted to create the platform I wished I had in my first year — a place where every SIT student can find what they need in seconds."
                            </p>
                        </div>

                        <div className="pt-8 flex flex-col gap-6">
                            {/* LinkedIn Profile Badge - Large Version */}
                            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full w-fit border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:border-blue-500/30 transition-all group/badge group-hover:scale-105 active:scale-95 cursor-pointer">
                                <img 
                                    src="https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/DocScanner+Apr+20%2C+2022+9-12+AM_LE_upscale_prime_cleanup.jpg" 
                                    alt="Ravikumar KP" 
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                                />
                                <div className="flex flex-col pr-2">
                                    <span className="text-white font-black text-sm tracking-tight leading-none">Ravikumar KP</span>
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1.5 leading-none">Creator of AskUrSenior</span>
                                </div>
                                <div className="w-px h-6 bg-white/10 mx-1" />
                                <a 
                                    href="https://www.linkedin.com/in/ravikumar-k-p-80b7a628b/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-400 hover:scale-110 transition-all p-1.5"
                                >
                                    <FaLinkedin size={22} />
                                </a>
                            </div>

                            <Link 
                                to={isAuthenticated ? "/dashboard" : "/login"} 
                                className="group inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-black text-sm uppercase tracking-wider transition-all hover:bg-purple-500 hover:text-white shadow-xl shadow-purple-500/10 hover:shadow-purple-500/30 active:scale-95"
                            >
                                {isAuthenticated ? "Resume Learning" : "Sign in to Explore Platform"}
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right Image Container (40% width equivalent in grid) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative flex justify-center items-center"
                    >
                        {/* Glow Behind Image */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 rounded-[2rem] blur-2xl -rotate-6 scale-95" />
                        
                        {/* Premium Image Wrapper with Gradient Border */}
                        <div className="relative p-1.5 bg-gradient-to-br from-purple-600 to-blue-500 rounded-[24px] group shadow-2xl flex items-center justify-center overflow-hidden">
                            <div className="relative bg-[#0a0a0b] rounded-[22px] overflow-hidden">
                                <ImageWithFallback 
                                    src="https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/DocScanner+Apr+20%2C+2022+9-12+AM_LE_upscale_prime_cleanup.jpg"
                                    alt="Creator of AskUrSenior"
                                />
                                {/* Soft transition at bottom */}
                                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent opacity-60 pointer-events-none" />
                            </div>
                        </div>

                        {/* Floating Badges */}
                        
                        {/* Badge 1: SIT Student */}
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-6 -left-6 md:-left-12 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-3 active:scale-95 transition-transform"
                        >
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <GraduationCap size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Status</p>
                                <p className="text-sm font-bold text-white leading-none">SIT Student</p>
                            </div>
                        </motion.div>

                        {/* Badge 2: Developer */}
                        <motion.div 
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute bottom-12 -right-6 md:-right-12 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Code size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Expertise</p>
                                <p className="text-sm font-bold text-white leading-none">Full Stack Dev</p>
                            </div>
                        </motion.div>

                        {/* Badge 3: Built Platform */}
                        <motion.div 
                            animate={{ x: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute top-1/2 -right-4 md:-right-8 p-3 rounded-xl bg-purple-500 border border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2"
                        >
                            <Sparkles size={14} className="text-white fill-white" />
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">Built AskUrSenior</p>
                        </motion.div>

                    </motion.div>

                </div>
            </div>
            
            {/* Divider */}
            <div className="max-w-7xl mx-auto mt-24">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
        </section>
    );
};

export default CreatorSection;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const HomeAskFinderSection = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        // Navigate to ASK+ Finder page, maybe we can't pass query in URL easily if not set up,
        // but we can just navigate to the page if they submit.
        navigate('/ask-finder');
    };

    return (
        <section className="py-24 bg-[#0a0a0b] relative z-10 border-t border-white/5 font-sans overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none mix-blend-screen" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    {/* Left: Content */}
                    <div className="flex-1 w-full text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold mb-6">
                            <FileText size={16} />
                            <span>ASK+ Materials Finder</span>
                        </div>
                        
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 font-outfit leading-tight">
                            Find exactly what you <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                                need to study
                            </span>
                        </h2>
                        
                        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto md:mx-0 font-outfit">
                            Access a vast repository of previous year questions, curated notes, and study materials shared by seniors who've been exactly where you are.
                        </p>
                        
                        <form onSubmit={handleSearch} className="relative max-w-md mx-auto md:mx-0 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search size={20} className="text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by topic, exam, or tags..."
                                className="w-full bg-[#141416]/50 border border-white/10 rounded-full py-4 pl-12 pr-32 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-lg backdrop-blur-sm shadow-purple-900/10"
                            />
                            <button
                                type="submit"
                                className="absolute inset-y-2 right-2 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-all shadow-md active:scale-95 flex items-center gap-2"
                            >
                                Find
                            </button>
                        </form>
                    </div>
                    
                    {/* Right: Visual / CTA Cards */}
                    <div className="flex-1 w-full relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Card 1 */}
                            <motion.div 
                                className="bg-[#141416]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-start gap-4 hover:border-purple-500/30 transition-colors cursor-pointer group"
                                whileHover={{ y: -5 }}
                                onClick={() => navigate('/ask-finder')}
                            >
                                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Previous Papers</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Access real exam papers and internal assessments.</p>
                                </div>
                            </motion.div>
                            
                            {/* Card 2 */}
                            <motion.div 
                                className="bg-[#141416]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-start gap-4 hover:border-purple-500/30 transition-colors cursor-pointer group mt-0 sm:mt-10"
                                whileHover={{ y: -5 }}
                                onClick={() => navigate('/ask-finder')}
                            >
                                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Study Notes</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Curated comprehensive notes organized by module.</p>
                                </div>
                            </motion.div>
                        </div>
                        
                        {/* Interactive floating element */}
                        <div className="absolute -bottom-8 -left-8 bg-[#141416]/90 border border-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-slow">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl border-2 border-[#0a0a0b]">
                                +
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">Contribute</p>
                                <p className="text-slate-400 text-xs">Upload your own material</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeAskFinderSection;

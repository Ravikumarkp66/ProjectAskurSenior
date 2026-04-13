import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewExperiencesAPI } from '../services/api';
import { Briefcase, ChevronRight, Building2 } from 'lucide-react';

const InterviewExperienceSection = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await interviewExperiencesAPI.getCompanies();
                const data = Array.isArray(res.data) ? res.data : [];

                // Process: split Amazon into batch cards, keep others as-is
                const processed = data.flatMap(comp => {
                    const nameUpper = (comp.name || '').toUpperCase();
                    if (nameUpper === 'AMAZON') {
                        return [
                            { ...comp, _navSlug: `amazon--2026`, name: 'Amazon', experienceCount: 42, _batch: '2026' },
                            { ...comp, _navSlug: `amazon--2027`, name: 'Amazon', experienceCount: 64, _batch: '2027' },
                        ];
                    }
                    // Use name slug for clean URLs
                    return [{ ...comp, _navSlug: (comp.name || '').toLowerCase().replace(/\s+/g, '-') }];
                });

                setCompanies(processed.slice(0, 4));
            } catch (error) {
                console.error('Error fetching companies:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    return (
        <section className="py-20 px-6 border-t border-white/5 bg-[#0a0a0b] relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] -z-10" />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                <Briefcase size={20} />
                            </div>
                            <span className="text-purple-400 font-black uppercase tracking-widest text-[10px]">Career Success</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                            💼 Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Experiences</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium">
                            Prepare with real interview experiences from your college seniors. Learn what's actually asked in big tech and startups.
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/interview')}
                        className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all active:scale-95"
                    >
                        View All Companies
                        <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-48 rounded-3xl bg-white/5 animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {companies.map((company, idx) => (
                            <div
                                key={company._navSlug || company._id || idx}
                                onClick={() => navigate(`/interview/${company._navSlug || company._id}`)}
                                className="group p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/[0.08] transition-all cursor-pointer hover:-translate-y-2"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden border border-white/10 p-2 group-hover:scale-110 transition-transform">
                                        <img 
                                            src={company.logo} 
                                            alt={company.name} 
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                                            }}
                                        />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        company.type === 'Product' 
                                        ? 'bg-emerald-500/10 text-emerald-400' 
                                        : 'bg-blue-500/10 text-blue-400'
                                    }`}>
                                        {company.type}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-white mb-1 group-hover:text-purple-400 transition-colors uppercase truncate">
                                    {company.name}
                                    {company._batch && <span className="text-purple-500/60 text-sm ml-2">'{company._batch.slice(2)}</span>}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                    <Building2 size={12} />
                                    <span>{company.experienceCount || 0} Experiences</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default InterviewExperienceSection;

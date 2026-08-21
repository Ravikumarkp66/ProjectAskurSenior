import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Heart } from 'lucide-react';
import { contributorAPI } from '../../services/api';

const defaultContributors = [
    {
        _id: 'c1',
        name: 'Ravikumar KP',
        usn: '1SI23IS001',
        branch: 'Information Science & Engineering',
        role: 'Founder & Developer',
        avatar: null,
        order: 1,
        isVisible: true
    },
    {
        _id: 'c2',
        name: 'Shubham Patil',
        usn: '1SI23CS001',
        branch: 'Computer Science & Engineering',
        role: 'Community Contributor',
        avatar: null,
        order: 2,
        isVisible: true
    },
    {
        _id: 'c3',
        name: 'Gajendra',
        usn: '1SI23ME001',
        branch: 'Mechanical Engineering',
        role: 'Community Contributor',
        avatar: null,
        order: 3,
        isVisible: true
    },
    {
        _id: 'c4',
        name: 'Kalpana',
        usn: '1SI23IS001',
        branch: 'Information Science & Engineering',
        role: 'Community Contributor',
        avatar: null,
        order: 4,
        isVisible: true
    },
    {
        _id: 'c5',
        name: 'Ananya',
        usn: '1SI23AD001',
        branch: 'Artificial Intelligence & Data Science',
        role: 'Community Contributor',
        avatar: null,
        order: 5,
        isVisible: true
    }
];

// Automatically generate initials from name (e.g. Ravikumar KP -> RK)
const getInitials = (name) => {
    if (!name) return 'CC';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ContributorCard = ({ contributor, index }) => {
    const initials = getInitials(contributor.name);
    
    // Unique gradient variants per card
    const gradients = [
        'from-purple-600 via-indigo-600 to-purple-700',
        'from-indigo-600 via-purple-600 to-violet-700',
        'from-violet-600 via-purple-500 to-indigo-700',
        'from-purple-500 via-pink-600 to-purple-700'
    ];
    const avatarGradient = gradients[index % gradients.length];
    const isFounder = contributor.role && contributor.role.toLowerCase().includes('founder');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className={`p-6 rounded-[22px] bg-white/[0.03] border transition-all duration-300 backdrop-blur-md shadow-xl flex flex-col items-center text-center group relative overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] ${
                isFounder 
                    ? 'border-purple-500/30 bg-purple-500/[0.03]' 
                    : 'border-white/5 hover:border-purple-500/30 hover:bg-white/[0.05]'
            }`}
        >
            {/* Ambient hover glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Circular Avatar: Photo if available, else Gradient Initials */}
            <div className="relative mb-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full blur-md opacity-30 group-hover:opacity-75 transition duration-300" />
                
                {contributor.avatar ? (
                    <img 
                        src={contributor.avatar} 
                        alt={contributor.name}
                        className="relative w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-md group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${avatarGradient} text-white font-black text-lg font-outfit flex items-center justify-center border-2 border-white/20 shadow-md group-hover:scale-105 transition-transform duration-300 tracking-wider`}>
                        {initials}
                    </div>
                )}
            </div>

            {/* Contributor Name */}
            <h3 className="text-base font-bold text-white font-outfit tracking-tight group-hover:text-purple-300 transition-colors">
                {contributor.name}
            </h3>

            {/* USN */}
            {contributor.usn && (
                <p className="text-[11px] font-semibold text-slate-400 font-mono tracking-wider uppercase mt-1">
                    {contributor.usn}
                </p>
            )}

            {/* Branch */}
            {contributor.branch && (
                <p className="text-xs text-slate-400 font-normal leading-relaxed mt-2 line-clamp-1 max-w-[220px]">
                    {contributor.branch}
                </p>
            )}

            {/* Role Badge */}
            <div className={`mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                isFounder 
                    ? 'bg-purple-600 text-white border border-purple-400/50 shadow-md shadow-purple-500/20' 
                    : 'bg-purple-500/10 border border-purple-500/20 text-purple-300'
            }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isFounder ? 'bg-white' : 'bg-purple-400 animate-pulse'}`} />
                <span>{contributor.role || 'Community Contributor'}</span>
            </div>
        </motion.div>
    );
};

const CommunityContributorsSection = ({ data }) => {
    if (data && data.isVisible === false) return null;

    const [contributors, setContributors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        contributorAPI.getPublic()
            .then(res => {
                if (isMounted && res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    setContributors(res.data.data);
                } else if (isMounted) {
                    setContributors(defaultContributors);
                }
            })
            .catch(err => {
                console.error('Failed to fetch contributors from backend API, using fallback data:', err);
                if (isMounted) setContributors(defaultContributors);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Ensure contributors are sorted by order field
    const sortedContributors = [...contributors].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <section id="contributors" className="py-20 px-6 relative bg-[#030712] overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-12">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Community Champions</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-outfit tracking-tight">
                        {data?.sectionTitle || 'Community Contributors'}
                    </h2>

                    <p className="text-slate-400 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed">
                        {data?.subtitle || 'The students who helped strengthen the AskUrSenior community by supporting juniors, sharing resources, and contributing valuable information.'}
                    </p>
                </div>

                {/* Grid Layout: Desktop 4 cards (lg:grid-cols-4), Tablet 2 cards (sm:grid-cols-2), Mobile 1 card (grid-cols-1) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {sortedContributors.map((contributor, index) => (
                        <ContributorCard 
                            key={contributor._id || contributor.usn || index} 
                            contributor={contributor} 
                            index={index} 
                        />
                    ))}
                </div>

                {/* Footer Appreciation Banner */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center max-w-3xl mx-auto backdrop-blur-sm"
                >
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal mb-2">
                        Every contribution, whether sharing resources, guiding juniors, or helping the community, has played an important role in making AskUrSenior better for everyone.
                    </p>
                    <p className="text-purple-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                        <span>Thank you to every student who contributed.</span>
                    </p>
                </motion.div>

            </div>
        </section>
    );
};

export default CommunityContributorsSection;

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
    
    // Clean purple / slate gradient variants
    const gradients = [
        'from-purple-600 to-indigo-700',
        'from-indigo-600 to-purple-700',
        'from-slate-700 to-slate-900',
        'from-purple-700 to-violet-800'
    ];
    const avatarGradient = gradients[index % gradients.length];
    const isFounder = contributor.role && contributor.role.toLowerCase().includes('founder');

    return (
        <div
            className={`p-5 rounded-lg border transition-colors duration-150 flex flex-col items-center text-center group relative overflow-hidden shadow-none ${
                isFounder 
                    ? 'border-[#E9D5FF] dark:border-[#7C3AED]/30 bg-[#FAF5FF]/50 dark:bg-[#581C87]/15' 
                    : 'bg-white dark:bg-[#15181D] border-[#E5E7EB] dark:border-[#292E37] hover:border-[#D1D5DB] dark:hover:border-[#3E4451]'
            }`}
        >
            {/* Circular Avatar: Photo if available, else Initials */}
            <div className="relative mb-3">
                {contributor.avatar ? (
                    <img 
                        src={contributor.avatar} 
                        alt={contributor.name}
                        className="relative w-14 h-14 rounded-full object-cover border border-[#E5E7EB] dark:border-[#292E37]"
                    />
                ) : (
                    <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${avatarGradient} text-white font-bold text-base flex items-center justify-center border border-[#E5E7EB] dark:border-[#292E37] tracking-wider`}>
                        {initials}
                    </div>
                )}
            </div>

            {/* Contributor Name */}
            <h3 className="text-base font-semibold text-[#111827] dark:text-[#F3F4F6] tracking-tight group-hover:text-[#7C3AED] dark:group-hover:text-[#A78BFA] transition-colors">
                {contributor.name}
            </h3>

            {/* USN */}
            {contributor.usn && (
                <p className="text-[11px] font-medium text-[#6B7280] dark:text-[#71717A] font-mono tracking-wider uppercase mt-0.5">
                    {contributor.usn}
                </p>
            )}

            {/* Branch */}
            {contributor.branch && (
                <p className="text-xs text-[#4B5563] dark:text-[#A1A1AA] font-normal leading-relaxed mt-1.5 line-clamp-1 max-w-[220px]">
                    {contributor.branch}
                </p>
            )}

            {/* Role Badge */}
            <div className={`mt-4 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                isFounder 
                    ? 'bg-[#7C3AED] text-white border border-[#7C3AED]' 
                    : 'bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#6D28D9] dark:text-[#DDD6FE]'
            }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isFounder ? 'bg-white' : 'bg-[#7C3AED] dark:bg-[#A78BFA]'}`} />
                <span>{contributor.role || 'Community Contributor'}</span>
            </div>
        </div>
    );
};

const CommunityContributorsSection = ({ data }) => {
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

    if (data && data.isVisible === false) return null;

    // Ensure contributors are sorted by order field
    const sortedContributors = [...contributors].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <section id="contributors" className="py-20 px-6 relative bg-transparent border-b border-[#E5E7EB] dark:border-[#292E37]">
            <div className="max-w-6xl mx-auto relative z-10 space-y-10">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#A78BFA] text-xs font-medium uppercase tracking-wider mb-2">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Community Champions</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                        {data?.sectionTitle || 'Community Contributors'}
                    </h2>

                    <p className="text-[#4B5563] dark:text-[#A1A1AA] text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed">
                        {data?.subtitle || 'The students who helped strengthen the AskUrSenior community by supporting juniors, sharing resources, and contributing valuable information.'}
                    </p>
                </div>

                {/* Grid Layout: Desktop 4 cards (lg:grid-cols-4), Tablet 2 cards (sm:grid-cols-2), Mobile 1 card (grid-cols-1) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sortedContributors.map((contributor, index) => (
                        <ContributorCard 
                            key={contributor._id || contributor.usn || index} 
                            contributor={contributor} 
                            index={index} 
                        />
                    ))}
                </div>

                {/* Footer Appreciation Banner */}
                <div 
                    className="p-5 sm:p-6 rounded-lg bg-[#F8FAFC] dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] text-center max-w-3xl mx-auto"
                >
                    <p className="text-[#374151] dark:text-[#D1D5DB] text-xs sm:text-sm leading-relaxed font-normal mb-1.5">
                        Every contribution, whether sharing resources, guiding juniors, or helping the community, has played an important role in making AskUrSenior better for everyone.
                    </p>
                    <p className="text-[#7C3AED] dark:text-[#A78BFA] text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#A78BFA] fill-[#7C3AED] dark:fill-[#A78BFA]" />
                        <span>Thank you to every student who contributed.</span>
                    </p>
                </div>

            </div>
        </section>
    );
};

export default CommunityContributorsSection;

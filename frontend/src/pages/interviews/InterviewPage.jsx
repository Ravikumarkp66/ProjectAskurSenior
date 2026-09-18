import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { interviewExperiencesAPI } from '../../services/api';

// Sub-components
import InterviewHero from '../../components/interview/sheet/InterviewHero';
import InterviewToolbar from '../../components/interview/sheet/InterviewToolbar';
import InterviewSheetTable from '../../components/interview/sheet/InterviewSheetTable';
import InterviewMobileCardList from '../../components/interview/sheet/InterviewMobileCardList';
import InterviewEmptyState from '../../components/interview/sheet/InterviewEmptyState';
import InterviewSkeletonSheet from '../../components/interview/sheet/InterviewSkeletonSheet';

import { PlusCircle } from 'lucide-react';

const InterviewPage = () => {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchCompanies = async () => {
            try {
                const response = await interviewExperiencesAPI.getCompanies();
                const data = Array.isArray(response.data) ? response.data : [];
                
                if (data.length === 0 && response.status !== 200) {
                    if (isMounted) {
                        setCompanies([]);
                        setIsLoading(false);
                    }
                    return;
                }

                const processed = data.flatMap(comp => {
                    const companyName = String(comp.name || '').trim();
                    const nameUpper = companyName.toUpperCase();
                    const realCount = comp.experienceCount || 0;
                    const companyId = comp._id;
                    const nameSlug = companyName.toLowerCase().replace(/\s+/g, '-');

                    // Amazon — distinct 2026 & 2027 placement tracks
                    if (nameUpper === 'AMAZON') {
                        return [
                            { 
                                ...comp, 
                                companyId,
                                _navSlug: 'amazon--2026',
                                company: companyName, 
                                batch: 2026, 
                                role: 'Software Development Engineer', 
                                totalExperiences: 42, 
                                totalUpvotes: 191,
                                ctc: 'Role Based'
                            },
                            { 
                                ...comp, 
                                companyId,
                                _navSlug: 'amazon--2027',
                                company: companyName, 
                                batch: 2027, 
                                role: 'Software Development Engineer', 
                                totalExperiences: 64, 
                                totalUpvotes: 0,
                                ctc: 'Role Based'
                            }
                        ];
                    }

                    // Morgan Stanley — custom role and CTC display
                    if (nameUpper === 'MORGAN STANLEY') {
                        return [{ 
                            ...comp, 
                            companyId,
                            _navSlug: nameSlug,
                            company: companyName, 
                            batch: 2026, 
                            role: 'Intern (PPO)', 
                            totalExperiences: realCount, 
                            totalUpvotes: comp.upvotes || 0,
                            ctc: '87K - 1.07L'
                        }];
                    }

                    // Default mapping for all other active companies
                    return [{ 
                        ...comp, 
                        companyId,
                        _navSlug: nameSlug,
                        company: companyName, 
                        batch: comp.representativeBatch || '2025', 
                        role: comp.representativeRole || 'Software Development Engineer', 
                        totalExperiences: realCount, 
                        totalUpvotes: comp.upvotes || 0,
                        ctc: comp.representativeCtc || comp.ctc || 'Role Based'
                    }];
                });

                if (isMounted) {
                    setCompanies(processed);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Failed to fetch companies:', error);
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchCompanies();
        return () => {
            isMounted = false;
        };
    }, []);

    // Summary metrics for Hero
    const summaryStats = useMemo(() => {
        const uniqueCompanies = new Set();
        let totalStories = 0;

        companies.forEach(item => {
            uniqueCompanies.add(item.companyId || item._id);
            totalStories += (item.totalExperiences || item.experienceCount || 0);
        });

        return {
            totalCompanies: uniqueCompanies.size,
            totalStories
        };
    }, [companies]);

    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Clean, search-only filtering engine
    const filteredRoles = useMemo(() => {
        let result = [...companies];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(item => {
                const compName = String(item.company || item.name || '').toLowerCase();
                const role = String(item.role || '').toLowerCase();
                const batch = String(item.batch || '').toLowerCase();
                const industry = String(item.industry || '').toLowerCase();
                return compName.includes(query) || role.includes(query) || batch.includes(query) || industry.includes(query);
            });
        }

        // Default sort by most experiences/stories
        result.sort((a, b) => {
            return (b.totalExperiences || b.experienceCount || 0) - (a.totalExperiences || a.experienceCount || 0);
        });

        return result;
    }, [companies, searchQuery]);

    return (
        <div className="w-full">
            {/* 1. Centered Hero with Animated Counters & Top-Left "i" Recruitment Notes */}
            <InterviewHero 
                totalCompanies={summaryStats.totalCompanies}
                totalStories={summaryStats.totalStories}
            />

            {/* 2. Simplified Clean Search Toolbar with Dynamic Rotating Placeholder */}
            <InterviewToolbar 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                totalResults={filteredRoles.length}
            />

            {/* 3. The Placement Intelligence Sheet Matrix */}
            <div className="w-full mt-2">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <InterviewSkeletonSheet key="loading-skeleton" />
                    ) : filteredRoles.length === 0 ? (
                        <InterviewEmptyState 
                            key="empty-state" 
                            searchQuery={searchQuery} 
                            onReset={handleResetFilters} 
                        />
                    ) : (
                        <motion.div
                            key="content-sheet"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="w-full"
                        >
                            {/* Desktop Table (>= 1024px) */}
                            <div className="hidden lg:block">
                                <InterviewSheetTable items={filteredRoles} />
                            </div>

                            {/* Mobile & Tablet Compact Stacked List (< 1024px) */}
                            <div className="block lg:hidden">
                                <InterviewMobileCardList items={filteredRoles} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 4. Subdued Senior Contribution Footer Link */}
            {!isLoading && (
                <div className="mt-12 py-5 px-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Cleared an interview or received an offer?
                        </h4>
                        <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Share your rounds and questions to help junior batches prepare.
                        </p>
                    </div>
                    <Link
                        to="/home/interview/share"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors whitespace-nowrap"
                    >
                        <PlusCircle size={13} className="text-purple-600 dark:text-purple-400" />
                        <span>Share Experience</span>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default InterviewPage;

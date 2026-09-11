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

import { Sparkles, PlusCircle } from 'lucide-react';

const parseCtcNumeric = (ctcStr) => {
    if (!ctcStr) return 0;
    const str = String(ctcStr);
    const match = str.match(/(\d+(\.\d+)?)/);
    if (!match) return 0;
    let val = parseFloat(match[1]);
    if (/k/i.test(str) && !/lpa|lakh/i.test(str)) {
        // e.g. 87K/month is ~10 LPA
        val = val * 0.12;
    }
    return val;
};

const InterviewPage = () => {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter & search states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedBatch, setSelectedBatch] = useState('all');
    const [selectedCtcTier, setSelectedCtcTier] = useState('all');
    const [sortBy, setSortBy] = useState('most-stories');

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
        const batchSet = new Set();

        companies.forEach(item => {
            uniqueCompanies.add(item.companyId || item._id);
            totalStories += (item.totalExperiences || item.experienceCount || 0);
            if (item.batch) batchSet.add(String(item.batch));
        });

        const sortedBatches = Array.from(batchSet).sort().reverse();

        return {
            totalCompanies: uniqueCompanies.size,
            totalStories,
            batches: sortedBatches
        };
    }, [companies]);

    // Active filters flag
    const hasActiveFilters = useMemo(() => {
        return Boolean(
            searchQuery.trim() ||
            selectedCategory !== 'all' ||
            selectedBatch !== 'all' ||
            selectedCtcTier !== 'all' ||
            sortBy !== 'most-stories'
        );
    }, [searchQuery, selectedCategory, selectedBatch, selectedCtcTier, sortBy]);

    const handleResetFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedBatch('all');
        setSelectedCtcTier('all');
        setSortBy('most-stories');
    }, []);

    // Multi-dimensional filter & sort engine
    const filteredRoles = useMemo(() => {
        let result = [...companies];

        // 1. Text Search across name, role, batch, industry
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

        // 2. Category Filter (Product vs Service)
        if (selectedCategory !== 'all') {
            result = result.filter(item => {
                const itemType = String(item.type || '').toLowerCase();
                return itemType === selectedCategory.toLowerCase();
            });
        }

        // 3. Batch Filter
        if (selectedBatch !== 'all') {
            result = result.filter(item => String(item.batch) === selectedBatch);
        }

        // 4. CTC Tier Filter
        if (selectedCtcTier !== 'all') {
            result = result.filter(item => {
                const numericCtc = parseCtcNumeric(item.ctc || item.representativeCtc);
                if (selectedCtcTier === 'tier-high') return numericCtc >= 20;
                if (selectedCtcTier === 'tier-mid') return numericCtc >= 10 && numericCtc < 20;
                if (selectedCtcTier === 'tier-base') return numericCtc > 0 && numericCtc < 10;
                return true;
            });
        }

        // 5. Sorting
        result.sort((a, b) => {
            if (sortBy === 'most-stories') {
                return (b.totalExperiences || b.experienceCount || 0) - (a.totalExperiences || a.experienceCount || 0);
            }
            if (sortBy === 'latest-batch') {
                return Number(b.batch || 0) - Number(a.batch || 0);
            }
            if (sortBy === 'a-z') {
                const nameA = String(a.company || a.name || '');
                const nameB = String(b.company || b.name || '');
                return nameA.localeCompare(nameB);
            }
            if (sortBy === 'ctc-high') {
                return parseCtcNumeric(b.ctc || b.representativeCtc) - parseCtcNumeric(a.ctc || a.representativeCtc);
            }
            return 0;
        });

        return result;
    }, [companies, searchQuery, selectedCategory, selectedBatch, selectedCtcTier, sortBy]);

    return (
        <div className="w-full">
            {/* 1. Compact Hero with Live Stats & Recruitment Disclaimer */}
            <InterviewHero 
                totalCompanies={summaryStats.totalCompanies}
                totalStories={summaryStats.totalStories}
                batches={summaryStats.batches}
            />

            {/* 2. Unified Discovery Toolbar (Search + Category Tabs + Dropdown Filters + Sort) */}
            <InterviewToolbar 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedBatch={selectedBatch}
                setSelectedBatch={setSelectedBatch}
                selectedCtcTier={selectedCtcTier}
                setSelectedCtcTier={setSelectedCtcTier}
                sortBy={sortBy}
                setSortBy={setSortBy}
                totalResults={filteredRoles.length}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
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
                            transition={{ duration: 0.2 }}
                            className="w-full"
                        >
                            {/* Desktop 7-Column Dense Table (>= 1024px) */}
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

            {/* 4. Subdued Senior Contribution Footer Banner */}
            {!isLoading && (
                <div className="mt-14 p-6 rounded-2xl bg-gradient-to-r from-purple-900/10 via-white/[0.02] to-transparent border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Got placed recently or cleared an interview?</h4>
                            <p className="text-xs text-slate-400">Your questions and tips help the next SIT batch prepare with confidence.</p>
                        </div>
                    </div>
                    <Link
                        to="/home/interview/share"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-white uppercase tracking-wider transition-all whitespace-nowrap"
                    >
                        <PlusCircle size={14} className="text-purple-400" />
                        <span>Add Your Story</span>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default InterviewPage;

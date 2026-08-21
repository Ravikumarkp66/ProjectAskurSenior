import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Filter, 
    Users, 
    RotateCcw,
    ChevronDown,
    ChevronRight,
    Loader2,
    List
} from 'lucide-react';
import FacultyCard from '../../components/faculty/FacultyCard';
import FacultyProfileView from '../../components/faculty/FacultyProfileView';
import FacultyFeedbackIntroModal from '../../components/faculty/FacultyFeedbackIntroModal';
import FacultyFeedbackWorkspace from '../../components/faculty/FacultyFeedbackWorkspace';
import { FACULTY_DEPARTMENTS, TOP_FILTERS } from '../../data/facultyData';
import { facultyAPI } from '../../services/api';

const FacultyDirectoryPage = ({ isLightMode = false }) => {
    const { facultyId } = useParams();

    const [facultyList, setFacultyList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDepartment, setActiveDepartment] = useState('all');
    const [activeTopFilter, setActiveTopFilter] = useState('all');
    
    // View mode: 'directory' | 'profile' | 'intro_modal' | 'feedback'
    const [viewMode, setViewMode] = useState('directory');
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Fetch real faculty data from backend with instant session caching
    const fetchFacultyData = async () => {
        let hasCache = false;
        try {
            const cached = sessionStorage.getItem('cached_faculty_directory');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setFacultyList(parsed);
                    setIsLoading(false);
                    hasCache = true;
                }
            }
        } catch (e) {}

        if (!hasCache) {
            setIsLoading(true);
        }

        try {
            const res = await facultyAPI.getAll();
            let data = [];
            if (res && res.success && Array.isArray(res.data)) {
                data = res.data;
            } else if (Array.isArray(res)) {
                data = res;
            }
            if (data.length > 0) {
                setFacultyList(data);
                sessionStorage.setItem('cached_faculty_directory', JSON.stringify(data));
            }
        } catch (err) {
            console.error('Failed to fetch real faculty:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFacultyData();
    }, []);

    // Sync selectedFaculty from route URL parameter or state
    useEffect(() => {
        if (facultyId && facultyList.length > 0) {
            const found = facultyList.find(f => f.id === facultyId || f._id === facultyId || f.facultyId === facultyId);
            if (found) {
                setSelectedFaculty(found);
                setViewMode('profile');
            }
        }
    }, [facultyId, facultyList]);

    // Filter Logic
    const filteredFacultyList = useMemo(() => {
        return facultyList.filter(fac => {
            const query = searchQuery.trim().toLowerCase();
            const matchesQuery = !query || (
                (fac.name || '').toLowerCase().includes(query) ||
                (fac.designation || '').toLowerCase().includes(query) ||
                (fac.department || '').toLowerCase().includes(query) ||
                (fac.facultyId || '').toLowerCase().includes(query) ||
                (Array.isArray(fac.subjects) ? fac.subjects : []).some(sub => (sub || '').toLowerCase().includes(query))
            );

            let matchesDept = activeDepartment === 'all';
            if (!matchesDept) {
                const target = activeDepartment.toUpperCase();
                const actual = (fac.department || '').toUpperCase();
                matchesDept = actual === target ||
                    (target === 'ME' && actual === 'MECH') ||
                    (target === 'MECH' && actual === 'ME') ||
                    (target === 'AIDS' && (actual === 'AI&DS' || actual === 'AIML')) ||
                    (target === 'AIML' && (actual === 'AI&DS' || actual === 'AIDS'));
            }

            let matchesTopFilter = activeTopFilter === 'all';
            if (!matchesTopFilter) {
                const tagList = Array.isArray(fac.tags) ? fac.tags.map(t => t.toLowerCase()) : [];
                if (activeTopFilter === 'rating_4_5') matchesTopFilter = (fac.rating || 5) >= 4.5;
                else if (activeTopFilter === 'lab_faculty') matchesTopFilter = !!fac.isLabFaculty;
                else if (activeTopFilter === 'high_clarity') matchesTopFilter = tagList.some(t => t.includes('clarity') || t.includes('explanation'));
                else if (activeTopFilter === 'fair_grading') matchesTopFilter = tagList.some(t => t.includes('fair') || t.includes('grading'));
                else if (activeTopFilter === 'approachable') matchesTopFilter = tagList.some(t => t.includes('approachable') || t.includes('helpful') || t.includes('mentor'));
            }

            return matchesQuery && matchesDept && matchesTopFilter;
        });
    }, [facultyList, searchQuery, activeDepartment, activeTopFilter]);

    const handleViewProfile = (faculty) => {
        setSelectedFaculty(faculty);
        setViewMode('profile');
        if (faculty.id || faculty._id) {
            window.history.pushState({}, '', `/home/faculty-directory/${faculty.id || faculty._id}`);
        }
    };

    // Automatically trigger native browser Fullscreen API as soon as user clicks "Share Feedback"!
    const handleOpenFeedback = () => {
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn("Fullscreen request prevented:", err);
                });
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } catch (err) {
            console.warn("Fullscreen API call warning:", err);
        }

        setViewMode('intro_modal');
    };

    const handleContinueToFeedback = () => {
        setViewMode('feedback');
    };

    const handleCloseIntroModal = () => {
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.warn(err));
            }
        } catch (e) {}
        setViewMode('profile');
    };

    const handleBackToDirectory = () => {
        setSelectedFaculty(null);
        setViewMode('directory');
        window.history.pushState({}, '', `/home/faculty-directory`);
    };

    const handleAddReview = async (facultyId, reviewData) => {
        try {
            await facultyAPI.addReview(facultyId, reviewData);
            await fetchFacultyData();
            const updated = await facultyAPI.getAll();
            if (updated && updated.data) {
                const refreshedFac = updated.data.find(f => f.id === facultyId || f._id === facultyId);
                if (refreshedFac) setSelectedFaculty(refreshedFac);
            }
        } catch (err) {
            console.error('Error submitting review:', err);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setActiveDepartment('all');
        setActiveTopFilter('all');
    };

    const activeFilterCount = (activeDepartment !== 'all' ? 1 : 0) + (activeTopFilter !== 'all' ? 1 : 0);

    return (
        <div style={{
            padding: 0,
            height: '100vh',
            boxSizing: 'border-box',
            overflow: 'hidden',
            width: '100%',
        }}>
            {/* Unified Dashboard Section Container - Full Edge-to-Edge panel */}
            <div 
                style={{
                    background: isLightMode ? '#ffffff' : '#121622',
                    borderLeft: isLightMode ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRight: isLightMode ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderTop: 'none',
                    borderBottom: 'none',
                    borderRadius: '0px',
                    padding: '20px 24px',
                    height: '100vh',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                }}
                className="no-scrollbar"
            >
                {viewMode === 'feedback' && selectedFaculty ? (
                    /* FULL WORKSPACE CONTINUOUS FACULTY FEEDBACK FORM */
                    <FacultyFeedbackWorkspace
                        faculty={selectedFaculty}
                        onExit={() => setViewMode('profile')}
                        onViewInsights={() => setViewMode('profile')}
                        onReturnToDirectory={handleBackToDirectory}
                        onSubmitReview={handleAddReview}
                        isLightMode={isLightMode}
                    />
                ) : (viewMode === 'profile' || viewMode === 'intro_modal') && selectedFaculty ? (
                    /* FULL APPLICATION PAGE FACULTY PROFILE WORKSPACE */
                    <>
                        <FacultyProfileView
                            faculty={selectedFaculty}
                            onBack={handleBackToDirectory}
                            onOpenFeedback={handleOpenFeedback}
                            isLightMode={isLightMode}
                        />

                        {/* Voluntary Pre-Feedback Introduction Modal */}
                        <FacultyFeedbackIntroModal
                            faculty={selectedFaculty}
                            isOpen={viewMode === 'intro_modal'}
                            onClose={handleCloseIntroModal}
                            onContinue={handleContinueToFeedback}
                            isLightMode={isLightMode}
                        />
                    </>
                ) : (
                    /* FACULTY DIRECTORY GRID PAGE */
                    <>
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                                    Faculty Directory
                                </h1>
                                <p className="text-xs text-slate-400 font-medium mt-1">
                                    Explore real student reviews, ratings, and course insights across all 14 college departments.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold shadow-sm">
                                    {filteredFacultyList.length} Faculties
                                </span>
                            </div>
                        </div>

                        {/* Collapsible Filter Bar Section */}
                        <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-md ${
                            isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/10'
                        }`}>
                            {/* CLOSED / COMPACT BAR */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                        <List className="w-5 h-5" />
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-extrabold text-white">
                                            Search & Filter
                                        </span>
                                        {activeFilterCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                {activeFilterCount} Active
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Search Input Bar */}
                                <div className="relative flex-1 w-full max-w-xl">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search faculty by name, subject (e.g. DBMS, OOP), department..."
                                        className={`w-full pl-11 pr-10 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                            isLightMode
                                                ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                                                : 'bg-[#0B0F19] border-white/10 text-white placeholder-slate-500'
                                        }`}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300 hover:text-white"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {/* Filter Toggle Button */}
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all duration-200 active:scale-95 ${
                                            isFilterOpen || activeFilterCount > 0
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 border-amber-400 shadow-lg shadow-amber-500/20'
                                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                        }`}
                                        title="Toggle Filters"
                                    >
                                        <Filter className="w-4 h-4" />
                                        <span className="hidden sm:inline">Filters</span>
                                    </button>
                                </div>
                            </div>

                            {/* EXPANDED FILTER PANEL */}
                            <AnimatePresence>
                                {isFilterOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="pt-4 border-t border-white/10 space-y-4 overflow-hidden"
                                    >
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                                                <select
                                                    value={activeDepartment}
                                                    onChange={(e) => setActiveDepartment(e.target.value)}
                                                    className={`w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl border text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                                        isLightMode
                                                            ? 'bg-white border-slate-200 text-slate-800'
                                                            : 'bg-[#0B0F19] border-white/10 text-slate-200'
                                                    }`}
                                                >
                                                    {FACULTY_DEPARTMENTS.map((dept) => (
                                                        <option key={dept.id} value={dept.id}>
                                                            {dept.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>

                                            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                                                <select
                                                    value={activeTopFilter}
                                                    onChange={(e) => setActiveTopFilter(e.target.value)}
                                                    className={`w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl border text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                                        isLightMode
                                                            ? 'bg-white border-slate-200 text-slate-800'
                                                            : 'bg-[#0B0F19] border-white/10 text-slate-200'
                                                    }`}
                                                >
                                                    {TOP_FILTERS.map((tf) => (
                                                        <option key={tf.id} value={tf.id}>
                                                            Filter: {tf.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                            </div>

                                            {(activeDepartment !== 'all' || activeTopFilter !== 'all' || searchQuery) && (
                                                <button
                                                    onClick={handleResetFilters}
                                                    className="px-3 py-2 rounded-xl text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 border border-purple-500/20 bg-purple-500/10"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Reset Filters
                                                </button>
                                            )}

                                            <div className="ml-auto flex items-center gap-2">
                                                <button
                                                    onClick={() => setIsFilterOpen(false)}
                                                    className="p-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                                                    title="Collapse Filters"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Faculty Cards Grid Section */}
                        <div className="flex-1">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3 text-purple-400">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-sm font-medium text-slate-400">Loading faculty directory...</span>
                                </div>
                            ) : filteredFacultyList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
                                    {filteredFacultyList.map((fac) => (
                                        <FacultyCard
                                            key={fac.id || fac._id}
                                            faculty={fac}
                                            isLightMode={isLightMode}
                                            onViewProfile={handleViewProfile}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-white/5 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">No Faculty Found</h3>
                                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                                        No faculty matching your search query or selected filter criteria.
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={handleResetFilters}
                                            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-600/30"
                                        >
                                            Reset All Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FacultyDirectoryPage;

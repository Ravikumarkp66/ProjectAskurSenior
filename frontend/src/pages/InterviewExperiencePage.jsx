import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import InterviewExperienceCard from '../components/InterviewExperienceCard';
import { interviewExperienceAPI } from '../services/api';
import { deriveBranchFromUSN, toUiBranch } from '../utils/constants';
import ProfileModal from '../components/ProfileModal';

const InterviewExperiencePage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem('uiTheme');
            return saved === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [branchOverride, setBranchOverride] = useState(() => {
        try {
            return localStorage.getItem('branchOverride') || '';
        } catch {
            return '';
        }
    });
    const [currentBranch, setCurrentBranch] = useState(
        branchOverride || deriveBranchFromUSN(user?.usn) || toUiBranch(user?.currentBranch) || 'CS'
    );

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');

    const isLightMode = theme === 'light';

    useEffect(() => {
        const sync = () => {
            try {
                const saved = localStorage.getItem('uiTheme');
                setTheme(saved === 'light' ? 'light' : 'dark');
            } catch {
                setTheme('dark');
            }
        };
        window.addEventListener('uiThemeChange', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('uiThemeChange', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);

    const fetchExperiences = async () => {
        try {
            setLoading(true);
            const res = await interviewExperienceAPI.getExperiences();
            setExperiences(res.data.data);
        } catch (error) {
            console.error('Error fetching experiences:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchExperiences();
        }
    }, [isAuthenticated]);

    const roles = useMemo(() => {
        const uniqueRoles = new Set(experiences.map(e => e.role));
        return ['All', ...Array.from(uniqueRoles)];
    }, [experiences]);

    const filteredExperiences = useMemo(() => {
        return experiences.filter(e => {
            const matchesSearch = e.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.focus.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'All' || e.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [experiences, searchQuery, roleFilter]);

    if (loading || authLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isLightMode ? 'bg-white' : 'bg-primary-950'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <p className={`${isLightMode ? 'text-slate-600' : 'text-secondary-400'} font-medium animate-pulse`}>Fetching experiences...</p>
                </div>
            </div>
        );
    }

    const handleBranchOverrideChange = (nextBranch) => {
        const value = (nextBranch || '').toString();
        setBranchOverride(value);
        try {
            if (value) localStorage.setItem('branchOverride', value);
            else localStorage.removeItem('branchOverride');
        } catch {
            // ignore
        }
        if (value) setCurrentBranch(value);
    };

    return (
        <div className={`flex min-h-screen ${isLightMode ? 'bg-white text-slate-900' : 'bg-primary-950 text-secondary-100'}`}>
            <Sidebar
                currentBranch={currentBranch}
                cycle="P"
                branchOverride={branchOverride}
                onBranchOverrideChange={handleBranchOverrideChange}
                onProfileClick={() => setShowProfileModal(true)}
                isCollapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
            />

            <div className={`transition-all duration-300 w-full ${sidebarCollapsed ? 'sm:ml-20 sm:w-[calc(100%-5rem)]' : 'sm:ml-64 sm:w-[calc(100%-16rem)]'}`}>
                <TopBar
                    progress={100}
                    branch={currentBranch}
                    sidebarCollapsed={sidebarCollapsed}
                    theme={theme}
                />

                <div className="mt-24 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-10 text-center sm:text-left">
                            <h1 className="text-3xl font-extrabold tracking-tight mb-2 sm:text-4xl">Interview Experiences</h1>
                            <p className={`text-sm sm:text-base ${isLightMode ? 'text-slate-600' : 'text-secondary-400'}`}>
                                Real questions and insights from seniors who attended these interviews.
                            </p>
                        </div>

                        {/* Filters */}
                        <div className={`mb-8 p-4 rounded-2xl border flex flex-col md:flex-row gap-4 transition-all ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-primary-900/50 border-primary-800'
                            }`}>
                            <div className="flex-1 relative">
                                <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLightMode ? 'text-slate-400' : 'text-secondary-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by company, role, or focus..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition ${isLightMode
                                        ? 'bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-100'
                                        : 'bg-primary-950 border-primary-700 focus:border-primary-500 focus:ring-primary-900'
                                        }`}
                                />
                            </div>
                            <div className="w-full md:w-64">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none appearance-none cursor-pointer transition ${isLightMode
                                        ? 'bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-100'
                                        : 'bg-primary-950 border-primary-700 focus:border-primary-500 focus:ring-primary-900'
                                        }`}
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* List */}
                        {filteredExperiences.length === 0 ? (
                            <div className="text-center py-20">
                                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isLightMode ? 'bg-slate-100' : 'bg-primary-900'
                                    }`}>
                                    <svg className="w-10 h-10 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-2">No experiences found</h3>
                                <p className={isLightMode ? 'text-slate-500' : 'text-secondary-400'}>
                                    Try adjusting your search or filters to see more results.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                {filteredExperiences.map(exp => (
                                    <InterviewExperienceCard
                                        key={exp._id}
                                        experience={exp}
                                        isLightMode={isLightMode}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ProfileModal
                show={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                user={user}
                updateUser={updateUser}
                theme={theme}
            />
        </div>
    );
};

export default InterviewExperiencePage;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/hooks';
import ProfileModal from '../components/ProfileModal';
import { apiClient, userUploadAPI } from '../services/api';
import { deriveBranchFromUSN, toUiBranch, ALL_KNOWN_SUBJECTS, ISE_3RD_SEM_SUBJECTS, ISE_4TH_SEM_SUBJECTS, ISE_5TH_SEM_SUBJECTS, ISE_6TH_SEM_SUBJECTS, CSE_3RD_SEM_SUBJECTS, CSE_4TH_SEM_SUBJECTS, CSE_5TH_SEM_SUBJECTS, CSE_6TH_SEM_SUBJECTS, BRANCHES, FIRST_YEAR_SUBJECTS } from '../utils/constants';
import DocComments from '../components/DocComments';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { Search, Download, FileText, Upload, Filter, X, ArrowLeft, Eye, ExternalLink, Trash2, Edit, Check, Heart, TrendingUp, MessageSquare, Send, ThumbsUp, ThumbsDown, CornerDownRight, UserCheck, ShieldCheck, Clock, Bookmark, Trophy, Info } from 'lucide-react';

const AskFinderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();

    // Theme & Layout state
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
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

    const isLightMode = theme === 'light';

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedPaperType, setSelectedPaperType] = useState('');
    const [selectedYearLevel, setSelectedYearLevel] = useState('');
    const [selectedSubSemester, setSelectedSubSemester] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedDocType, setSelectedDocType] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' (approved only) or 'pending' (admin review)
    const [bookmarksOnly, setBookmarksOnly] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Data state
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [paperTypes, setPaperTypes] = useState([]);
    const [searchSummary, setSearchSummary] = useState({ total: 0, notes: 0, see: 0, internals: 0, others: 0 });

    // Pagination — Show More
    const ITEMS_PER_PAGE = 9;
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    // Upload state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadStep, setUploadStep] = useState(1); // 1: Academic Info, 2: Document Info
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadMetadata, setUploadMetadata] = useState({
        subjectName: '',
        subjectCode: '',
        semester: '', // Specific semester (e.g. 3rd Sem)
        yearLevel: '', // Year Level (e.g. 2nd Year)
        year: '',
        documentType: 'notes',
        paperType: '',
        tags: '',
        moduleInfo: '',
        pageCount: '',
        showContributorName: 'false',
        contributorName: '',
        contributorYear: '',
        contributorBranch: '',
        branch: '',
        usn: user?.usn || ''
    });

    const formatSize = (bytes) => {
        if (!bytes) return '0.00 MB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getTimeAgo = (date) => {
        if (!date) return 'Recently';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [editingDocTypeId, setEditingDocTypeId] = useState(null);
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [fetchingLeaderboard, setFetchingLeaderboard] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [pendingUploadsCount, setPendingUploadsCount] = useState(0);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchLeaderboard = async () => {
        setFetchingLeaderboard(true);
        try {
            const response = await apiClient.get('/leaderboard');
            setLeaderboardData(response.data || []);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setFetchingLeaderboard(false);
        }
    };

    useEffect(() => {
        if (showLeaderboardModal) {
            fetchLeaderboard();
        }
    }, [showLeaderboardModal]);

    useEffect(() => {
        const sync = () => {
            try {
                setTheme(localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark');
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

    // Read ?bookmarks=true from URL on page load
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('bookmarks') === 'true') {
            if (isAuthenticated) {
                setBookmarksOnly(true);
            } else {
                // If not logged in and they try the bookmarks link, show login modal
                setShowLoginModal(true);
            }
        }
    }, [location.search, isAuthenticated]);

    // Fetch pending uploads count for admin badge (from both systems)
    useEffect(() => {
        const fetchPendingCount = async () => {
            if (user?.isAdmin) {
                try {
                    const [docsRes, uploadsRes] = await Promise.all([
                        apiClient.get('/documents/search?status=pending&adminView=true'),
                        userUploadAPI.getUploads('pending')
                    ]);
                    
                    const docsCount = docsRes?.data?.documents?.length || (Array.isArray(docsRes?.data) ? docsRes.data.length : 0);
                    const uploadsCount = uploadsRes?.data?.items?.length || (Array.isArray(uploadsRes?.data) ? uploadsRes.data.length : 0);
                    
                    setPendingUploadsCount(docsCount + uploadsCount);
                } catch (error) {
                    console.error('Failed to fetch pending count:', error);
                }
            }
        };

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 120000);
        return () => clearInterval(interval);
    }, [user?.isAdmin, statusFilter]);

    useEffect(() => {
        // Fetch metadata for all users so filters are populated
        fetchMetadata();
    }, []);

    // Automatic Search when filters change
    useEffect(() => {
            handleSearch();
    }, [selectedSubject, selectedPaperType, selectedYearLevel, selectedSubSemester, selectedYear, selectedDocType, sortBy, statusFilter, bookmarksOnly, currentBranch]);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    // Pro Search state
    const [searchFocused, setSearchFocused] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [suggestions, setSuggestions] = useState({ subjects: [], papers: [], notes: [] });
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    const placeholders = [
        "Search subject, code, topic...",
        "Search Data Structures",
        "Search 22CS41",
        "Search PYQs",
        "Search Mathematics notes",
        "Search DBMS Papers"
    ];

    // Auto changing placeholder
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Keyboard shortcut '/'
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Suggestions Logic
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSuggestions({ subjects: [], papers: [], notes: [] });
            setShowSuggestions(false);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                const response = await apiClient.get(`/documents/suggestions?q=${encodeURIComponent(searchQuery)}`);
                setSuggestions(response.data);
                setShowSuggestions(true);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            }
        };

        fetchSuggestions();
    }, [searchQuery]);

    const handleKeyDown = (e) => {
        const totalItems = suggestions.subjects.length + suggestions.papers.length + suggestions.notes.length;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % totalItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            // Get the item at selectedIndex
            const allItems = [...suggestions.subjects, ...suggestions.papers, ...suggestions.notes];
            const item = allItems[selectedIndex];
            setSearchQuery(item.name);
            setShowSuggestions(false);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            inputRef.current?.blur();
        }
    };

    // Debounced Search when query changes
    useEffect(() => {
        handleSearch();
    }, [searchQuery]);

    const handleBranchOverrideChange = (nextBranch) => {
        const value = (nextBranch || '').toString();
        setBranchOverride(value);
        try {
            if (value) localStorage.setItem('branchOverride', value);
            else localStorage.removeItem('branchOverride');
        } catch { }
        if (value) setCurrentBranch(value);
    };

    const fetchMetadata = async () => {
        try {
            const [subjectsRes, paperTypesRes] = await Promise.all([
                apiClient.get('/documents/subjects'),
                apiClient.get('/documents/paper-types')
            ]);
            const backendSubjects = subjectsRes.data || [];
            // Merge backend subjects with known subjects — known ones first, then any new ones from backend
            const backendNames = backendSubjects.map(s => (s.name || s).toLowerCase());
            const extraFromBackend = backendSubjects.filter(s => {
                const n = (s.name || s).toLowerCase();
                return !ALL_KNOWN_SUBJECTS.some(k => k.name.toLowerCase() === n);
            });
            setSubjects([...ALL_KNOWN_SUBJECTS, ...extraFromBackend]);
            setPaperTypes(paperTypesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
            // Fallback to known subjects if backend fails
            setSubjects(ALL_KNOWN_SUBJECTS);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('q', searchQuery.toLowerCase());
            if (selectedSubject) params.append('subject', selectedSubject.toLowerCase());
            if (selectedPaperType) params.append('paperType', selectedPaperType.toLowerCase());
            if (selectedYearLevel) params.append('yearLevel', selectedYearLevel.toLowerCase());
            if (selectedSubSemester) params.append('semester', selectedSubSemester.toLowerCase());
            
            // Only filter by branch when user has explicitly chosen a year level (and it's not 1st Year — which is branch-agnostic)
            if (selectedYearLevel && selectedYearLevel !== '1st Year' && currentBranch) params.append('branch', currentBranch.toLowerCase());
            if (selectedYear) params.append('year', selectedYear.toLowerCase());
            if (selectedDocType) params.append('documentType', selectedDocType.toLowerCase());
            if (sortBy) params.append('sortBy', sortBy);
            
            if (user?.isAdmin) {
                if (statusFilter === 'pending') {
                    params.append('adminView', 'true');
                    params.append('status', 'pending');
                } else if (statusFilter === 'deleted') {
                    params.append('adminView', 'true');
                    params.append('status', 'deleted');
                }
            }
            if (bookmarksOnly) {
                params.append('bookmarksOnly', 'true');
            }

            const response = await apiClient.get(`/documents/search?${params.toString()}`);
            setDocuments(response.data.documents || response.data || []);
            setSearchSummary(response.data.summary || { total: 0, notes: 0, see: 0, internals: 0, others: 0 });
            setVisibleCount(ITEMS_PER_PAGE); // Reset pagination on every new search
        } catch (error) {
            console.error('Search failed:', error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (uploadFiles.length === 0 || !uploadMetadata.subjectName || !uploadMetadata.yearLevel) {
            alert('Please fill all required fields and select at least one file');
            return;
        }

        setUploadLoading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            // Append multiple files
            uploadFiles.forEach(file => {
                formData.append('files', file);
            });

            Object.keys(uploadMetadata).forEach(key => {
                if (uploadMetadata[key] !== undefined && uploadMetadata[key] !== '') {
                    // Don't lowercase moduleInfo, pageCount or name/year/branch
                    const skipLower = ['moduleInfo', 'pageCount', 'contributorName', 'contributorYear', 'contributorBranch'].includes(key);
                    const value = skipLower ? uploadMetadata[key] : (typeof uploadMetadata[key] === 'string' ? uploadMetadata[key].toLowerCase() : uploadMetadata[key]);
                    formData.append(key, value);
                }
            });

            const response = await apiClient.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                },
            });

            if (response.data.updatedUser && updateUser) {
                updateUser(response.data.updatedUser);
            }

            alert(user?.isAdmin ? 'Materials added successfully!' : 'Thank you! Your contributions have been submitted for admin approval.');
            setShowUploadModal(false);
            resetUploadForm();
            handleSearch();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploadLoading(false);
        }
    };

    const resetUploadForm = () => {
        setUploadFiles([]);
        setUploadStep(1);
        setUploadMetadata({
            subjectName: '', subjectCode: '', semester: '', yearLevel: '', year: '',
            documentType: 'notes', tags: '', moduleInfo: '', pageCount: '',
            showContributorName: 'false', contributorName: '', contributorYear: '', contributorBranch: '',
            branch: '',
            usn: user?.usn || ''
        });
        setUploadProgress(0);
    };

    const handleDownload = async (documentId) => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        try {
            const response = await apiClient.get(`/documents/${documentId}/download`);
            const downloadUrl = response.data.downloadUrl;
            window.location.href = downloadUrl;
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed to generate link');
        }
    };

    const handlePreview = async (documentId) => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        try {
            const response = await apiClient.get(`/documents/${documentId}/preview-url`);
            const previewUrl = response.data.previewUrl;
            setPreviewUrl(previewUrl);
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Preview failed:', error);
            alert('Failed to generate preview link');
        }
    };

    const handleDocDelete = async (documentId) => {
        // Optimistically remove from UI immediately — no page refresh
        const deleted = documents.find(d => d._id === documentId);
        setDocuments(prev => prev.filter(d => d._id !== documentId));
        setConfirmingDeleteId(null);

        // Also update summary counts instantly
        if (deleted) {
            setSearchSummary(prev => ({
                ...prev,
                total: Math.max(0, prev.total - 1),
                notes: deleted.documentType === 'notes' ? Math.max(0, prev.notes - 1) : prev.notes,
                see: deleted.documentType === 'see' ? Math.max(0, prev.see - 1) : prev.see,
                internals: deleted.documentType === 'internals' ? Math.max(0, prev.internals - 1) : prev.internals,
                others: deleted.documentType === 'others' ? Math.max(0, prev.others - 1) : prev.others,
            }));
        }

        // Clamp visibleCount so it never exceeds remaining docs
        setVisibleCount(v => Math.min(v, documents.length - 1));

        try {
            await apiClient.delete(`/documents/${documentId}`);
        } catch (error) {
            console.error('Delete failed:', error);
            // Rollback — put the doc back
            if (deleted) {
                setDocuments(prev => {
                    const idx = prev.findIndex((_, i) => i >= documents.indexOf(deleted));
                    const next = [...prev];
                    next.splice(Math.max(0, idx), 0, deleted);
                    return next;
                });
                if (deleted) {
                    setSearchSummary(prev => ({
                        ...prev,
                        total: prev.total + 1,
                        notes: deleted.documentType === 'notes' ? prev.notes + 1 : prev.notes,
                        see: deleted.documentType === 'see' ? prev.see + 1 : prev.see,
                        internals: deleted.documentType === 'internals' ? prev.internals + 1 : prev.internals,
                        others: deleted.documentType === 'others' ? prev.others + 1 : prev.others,
                    }));
                }
            }
            alert('Failed to delete document: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleApprove = async (documentId) => {
        // In "pending" view: remove the card instantly (it's no longer pending)
        // In normal view: mark it approved locally
        const isInPendingView = statusFilter === 'pending';

        if (isInPendingView) {
            // Remove instantly from the pending list
            setDocuments(prev => prev.filter(d => d._id !== documentId));
            setSearchSummary(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        } else {
            // Mark as approved in place
            setDocuments(prev => prev.map(d =>
                d._id === documentId ? { ...d, isApproved: true } : d
            ));
        }

        try {
            await apiClient.post(`/documents/${documentId}/approve`);
            fetchLeaderboard();
        } catch (error) {
            console.error('Approve failed:', error);
            // Rollback
            if (isInPendingView) {
                handleSearch();
            } else {
                setDocuments(prev => prev.map(d =>
                    d._id === documentId ? { ...d, isApproved: false } : d
                ));
            }
            alert('Approval failed');
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedSubject('');
        setSelectedPaperType('');
        setSelectedYearLevel('');
        setSelectedSubSemester('');
        setSelectedYear('');
        setSelectedDocType('');
        setSortBy('newest');
    };

    const handleUpdateFileName = async (documentId) => {
        if (!editValue.trim()) return;
        try {
            await apiClient.patch(`/documents/${documentId}`, { originalName: editValue });
            setEditingId(null);
            handleSearch();
        } catch (error) {
            console.error('Update failed:', error);
            alert('Update failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateDocumentType = async (documentId, newType) => {
        try {
            await apiClient.patch(`/documents/${documentId}`, { documentType: newType });
            setEditingDocTypeId(null);
            handleSearch();
        } catch (error) {
            console.error('Update failed:', error);
            alert('Update failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleLike = async (documentId) => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        // Optimistically update local state for immediate feedback
        setDocuments(prev => prev.map(doc => {
            if (doc._id === documentId) {
                const userId = (user?._id || user?.id)?.toString();
                if (!userId) return doc;

                const likes = Array.isArray(doc.likes) ? doc.likes.map(id => id.toString()) : [];
                const isLiked = likes.includes(userId);
                const newLikes = isLiked 
                    ? likes.filter(id => id !== userId)
                    : [...likes, userId];
                return { ...doc, likes: newLikes };
            }
            return doc;
        }));

        try {
            await apiClient.post(`/documents/${documentId}/like`);
        } catch (error) {
            console.error('Like failed:', error);
            // Rollback — re-fetch or revert local state if needed
            // For now, simpler to just log as the UI will eventually sync on next search/refresh
        }
    };

    const handleBookmark = async (documentId) => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        // Optimistically update local user state
        const currentBookmarks = Array.isArray(user?.bookmarks) ? user.bookmarks : [];
        const isBookmarked = currentBookmarks.includes(documentId);
        const newBookmarks = isBookmarked 
            ? currentBookmarks.filter(id => id !== documentId)
            : [...currentBookmarks, documentId];
        
        if (updateUser) {
            updateUser({ ...user, bookmarks: newBookmarks });
        }

        try {
            await apiClient.post(`/documents/${documentId}/bookmark`);
            // The server returns the final bookmark list in response.data.bookmarks, 
            // but the optimistic update means we don't need to wait for it.
        } catch (error) {
            console.error('Bookmark failed:', error);
            // Rollback if the server call fails.
            if (updateUser) {
                updateUser({ ...user, bookmarks: currentBookmarks });
            }
        }
    };

    if (authLoading) return <div className="min-h-screen bg-[#0a0a0b]" />;

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0b] text-white font-outfit'} flex flex-col pt-12`}>
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

                <Link to="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4 font-medium transition-colors">
                    <ArrowLeft size={16} />
                    <span>Back to Home</span>
                </Link>

                {/* Header Section (Blog-like) */}
                <div className="mb-12 text-center mt-4">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-4 tracking-tight">
                                ASK+ Finder
                            </h1>
                            <p className={`text-lg max-w-2xl mx-auto mb-8 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                Search and download study materials, PYQs, test papers, and notes shared by seniors.
                            </p>

                            {/* Search Bar */}
                            <div className="relative max-w-4xl mx-auto transition-all duration-300 ease-out z-50 px-4 sm:px-0" ref={searchRef} style={{ width: searchFocused ? '100%' : '90%', maxWidth: '850px' }}>
                                <form onSubmit={(e) => e.preventDefault()} className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
                                        <Search size={22} className={`transition-colors duration-300 ${isLightMode ? (searchFocused ? 'text-purple-600' : 'text-slate-400') : (searchFocused ? 'text-purple-400' : 'text-slate-500')}`} />
                                    </div>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setSearchFocused(true)}
                                        onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={placeholders[placeholderIndex]}
                                        className={`w-full border rounded-full py-5 pl-20 pr-10 outline-none transition-all duration-300 shadow-xl backdrop-blur-md text-lg
                                            ${isLightMode
                                                ? `bg-white border-slate-200 text-slate-900 ${searchFocused ? 'ring-4 ring-purple-500/10 border-purple-500 shadow-purple-500/5' : 'shadow-slate-200/50'}`
                                                : `bg-[#141416]/70 border-white/5 text-white ${searchFocused ? 'ring-4 ring-purple-500/20 border-purple-500 shadow-purple-900/40' : 'shadow-purple-900/10'}`
                                            }`}
                                    />
                                    <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                                        {!searchFocused && searchQuery === '' && (
                                            <kbd className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-500">
                                                <span>/</span>
                                            </kbd>
                                        )}
                                    </div>
                                </form>

                                {/* Suggestions Dropdown */}
                                <AnimatePresence>
                                    {searchFocused && showSuggestions && (suggestions.subjects.length > 0 || suggestions.papers.length > 0 || suggestions.notes.length > 0) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className={`absolute top-full left-0 right-0 mt-3 border rounded-3xl shadow-2xl overflow-hidden z-[100] ${isLightMode ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#141416]/95 border-white/10 shadow-black/50 backdrop-blur-2xl'}`}
                                        >
                                            <div className="max-h-[400px] overflow-y-auto p-3 custom-scrollbar">
                                                {/* Subjects */}
                                                {suggestions.subjects.length > 0 && (
                                                    <div className="mb-4 text-left">
                                                        <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                            Subjects
                                                        </div>
                                                        <div className="space-y-1">
                                                            {suggestions.subjects.map((s, idx) => {
                                                                const itemIdx = idx;
                                                                return (
                                                                    <button
                                                                        key={`as-s-${idx}`}
                                                                        onClick={() => { setSearchQuery(s.name); setShowSuggestions(false); }}
                                                                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all ${selectedIndex === itemIdx ? 'bg-purple-600 text-white shadow-lg' : isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <Search size={14} className={selectedIndex === itemIdx ? 'text-white' : 'text-purple-400'} />
                                                                            <span className="text-sm font-bold truncate">{s.name}</span>
                                                                        </div>
                                                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${selectedIndex === itemIdx ? 'bg-white/20 border-white/30 text-white' : isLightMode ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-500'}`}>{s.code}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* PYQs */}
                                                {suggestions.papers.length > 0 && (
                                                    <div className="mb-4 text-left">
                                                        <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            Past Year Papers
                                                        </div>
                                                        <div className="space-y-1">
                                                            {suggestions.papers.map((p, idx) => {
                                                                const itemIdx = suggestions.subjects.length + idx;
                                                                return (
                                                                    <button
                                                                        key={`as-p-${idx}`}
                                                                        onClick={() => { setSearchQuery(p.name); setShowSuggestions(false); }}
                                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedIndex === itemIdx ? 'bg-emerald-600 text-white shadow-lg' : isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}
                                                                    >
                                                                        <FileText size={14} className={selectedIndex === itemIdx ? 'text-white' : 'text-emerald-400'} />
                                                                        <div className="flex flex-col items-start overflow-hidden">
                                                                            <span className="text-sm font-bold truncate">{p.name}</span>
                                                                            <span className={`text-[10px] ${selectedIndex === itemIdx ? 'text-emerald-100' : 'text-slate-500'}`}>Official University Paper</span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                {suggestions.notes.length > 0 && (
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                            Curated Notes
                                                        </div>
                                                        <div className="space-y-1">
                                                            {suggestions.notes.map((n, idx) => {
                                                                const itemIdx = suggestions.subjects.length + suggestions.papers.length + idx;
                                                                return (
                                                                    <button
                                                                        key={`as-n-${idx}`}
                                                                        onClick={() => { setSearchQuery(n.name); setShowSuggestions(false); }}
                                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedIndex === itemIdx ? 'bg-amber-600 text-white shadow-lg' : isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}
                                                                    >
                                                                        <div className="w-3.5 h-3.5 border-2 border-amber-400 rounded-sm" />
                                                                        <div className="flex flex-col items-start overflow-hidden">
                                                                            <span className="text-sm font-bold truncate">{n.name}</span>
                                                                            <span className={`text-[10px] ${selectedIndex === itemIdx ? 'text-amber-100' : 'text-slate-500'}`}>Handwritten Study Material</span>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`p-3 border-t flex items-center justify-between text-[10px] font-bold ${isLightMode ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">↑↓</kbd> Navigate</span>
                                                    <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">Enter</kbd> Select</span>
                                                </div>
                                                <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10">Esc</kbd> Close</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Filters Section */}
                        <div className={`mb-10 p-5 rounded-2xl border transition-all ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141416]/60 border-white/5 backdrop-blur-sm'}`}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
                                <h3 className={`font-semibold flex items-center gap-2 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                                    <Filter size={18} /> Filters
                                    {(searchQuery || selectedSubject || selectedPaperType || selectedYearLevel || selectedSubSemester || selectedYear || selectedDocType || sortBy !== 'newest') && (
                                        <button 
                                            onClick={resetFilters}
                                            className="ml-4 text-[11px] font-black text-purple-400 hover:text-white uppercase tracking-widest bg-purple-500/20 hover:bg-purple-600 px-3 py-1.5 rounded-full border border-purple-500/30 transition-all active:scale-95 shadow-lg shadow-purple-500/10"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                    <div className="flex items-center gap-2 group/sort flex-1 sm:flex-none min-w-[150px]">
                                        <TrendingUp size={18} className={`flex-shrink-0 transition-colors ${isLightMode ? 'text-slate-400 group-focus-within/sort:text-purple-500' : 'text-purple-400 group-focus-within/sort:text-purple-300'}`} />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className={`w-full text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-all pr-8`}
                                            style={isLightMode
                                                ? { background: '#f8fafc', borderColor: '#e2e8f0', color: '#374151', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                                : { background: '#141416', borderColor: 'rgba(255,255,255,0.1)', color: '#cbd5e1', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a78bfa' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                            }
                                        >
                                            <option style={{background: isLightMode ? '#fff' : '#141416'}} value="newest">Sort By: Newest</option>
                                            <option style={{background: isLightMode ? '#fff' : '#141416'}} value="most-downloaded">Sort By: Popular</option>
                                            <option style={{background: isLightMode ? '#fff' : '#141416'}} value="most-liked">Sort By: Most Liked</option>
                                            <option style={{background: isLightMode ? '#fff' : '#141416'}} value="size-asc">Sort By: Smallest MB</option>
                                            <option style={{background: isLightMode ? '#fff' : '#141416'}} value="size-desc">Sort By: Largest MB</option>
                                            <option style={{background: isLightMode ? '#fff' : '#141416'}} value="recently-updated">Sort By: Last Updated</option>
                                        </select>
                                    </div>

                                    {/* Saved Items — always visible */}
                                    <button
                                        onClick={() => {
                                            if (!isAuthenticated) return setShowLoginModal(true);
                                            setBookmarksOnly(!bookmarksOnly);
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                                            bookmarksOnly
                                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                                                : `hover:bg-purple-500/10 hover:border-purple-500/30 ${isLightMode ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'}`
                                        }`}
                                        title={bookmarksOnly ? "Exit Saved Items" : "View Saved Items"}
                                    >
                                        <Bookmark size={16} fill={bookmarksOnly ? "currentColor" : "none"} />
                                        <span className="hidden sm:inline">Saved Items</span>
                                    </button>

                                    {/* Leaderboard Button */}
                                    <button
                                        onClick={() => setShowLeaderboardModal(true)}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                                            isLightMode 
                                                ? 'bg-white border-slate-200 text-slate-600 hover:bg-yellow-50 hover:border-yellow-200' 
                                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-yellow-500/10 hover:border-yellow-500/30'
                                        }`}
                                        title="View Leaderboard"
                                    >
                                        <Trophy size={16} className="text-yellow-500" />
                                        <span className="hidden sm:inline">Leaderboard</span>
                                    </button>

                                    {user?.isAdmin ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                                                    statusFilter === 'pending'
                                                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-lg shadow-amber-500/10'
                                                        : `hover:bg-purple-500/10 ${isLightMode ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'}`
                                                }`}
                                            >
                                                {statusFilter === 'pending' ? <Clock size={16} /> : <ShieldCheck size={16} />}
                                                <span>{statusFilter === 'pending' ? 'Exit Queue' : 'Review Queue'}</span>
                                                
                                                {statusFilter !== 'pending' && pendingUploadsCount > 0 && (
                                                    <span className="ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse shadow-lg shadow-red-500/20">
                                                        {pendingUploadsCount}
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setStatusFilter(statusFilter === 'deleted' ? 'all' : 'deleted')}
                                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                                                    statusFilter === 'deleted'
                                                        ? 'bg-red-500/20 border-red-500/40 text-red-500 shadow-lg shadow-red-500/10'
                                                        : `hover:bg-red-500/10 ${isLightMode ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'}`
                                                }`}
                                                title="View Recently Deleted"
                                            >
                                                <Trash2 size={16} />
                                                <span>{statusFilter === 'deleted' ? 'Exit Bin' : 'Recycle Bin'}</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setUploadMetadata(prev => ({ ...prev, showContributorName: 'false' }));
                                                    setShowUploadModal(true);
                                                }}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
                                            >
                                                <Upload size={16} />
                                                Add Material
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (!isAuthenticated) return setShowLoginModal(true);
                                                setUploadMetadata(prev => ({ ...prev, showContributorName: 'true' }));
                                                setShowUploadModal(true);
                                            }}
                                            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                                        >
                                            <UserCheck size={18} />
                                            <span className="hidden sm:inline">Contribute</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${(selectedYearLevel && selectedYearLevel !== '1st Year') ? (selectedYearLevel === '2nd Year' ? '6' : '5') : '4'} gap-4`}>
                                <select
                                    value={selectedYearLevel}
                                    onChange={(e) => { setSelectedYearLevel(e.target.value); setSelectedSubSemester(''); }}
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors"
                                    style={isLightMode
                                        ? { background: '#f8fafc', borderColor: '#e2e8f0', color: '#374151', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                        : { background: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a78bfa' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                    }
                                >
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="">Year Level</option>
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="1st Year" title="Physics/Chemistry Cycle">1st Year (Common)</option>
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="2nd Year">2nd Year</option>
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="3rd Year">3rd Year</option>
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="4th Year">4th Year</option>
                                </select>

                                {selectedYearLevel && selectedYearLevel === '2nd Year' && (
                                    <select
                                        value={selectedSubSemester}
                                        onChange={(e) => { setSelectedSubSemester(e.target.value); }}
                                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors"
                                        style={isLightMode
                                            ? { background: '#f8fafc', borderColor: '#e2e8f0', color: '#374151', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                            : { background: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a78bfa' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                        }
                                    >
                                        <option value="">Semester</option>
                                        <option value="3rd Sem">3rd Semester</option>
                                        <option value="4th Sem">4th Semester</option>
                                    </select>
                                )}

                                {selectedYearLevel && selectedYearLevel === '3rd Year' && (
                                    <select
                                        value={selectedSubSemester}
                                        onChange={(e) => { setSelectedSubSemester(e.target.value); }}
                                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors"
                                        style={isLightMode
                                            ? { background: '#f8fafc', borderColor: '#e2e8f0', color: '#374151', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                            : { background: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a78bfa' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                        }
                                    >
                                        <option value="">Semester</option>
                                        <option value="5th Sem">5th Semester</option>
                                        <option value="6th Sem">6th Semester</option>
                                    </select>
                                )}

                                {selectedYearLevel && selectedYearLevel !== '1st Year' && (
                                    <select
                                        value={currentBranch}
                                        onChange={(e) => { setCurrentBranch(e.target.value); handleBranchOverrideChange(e.target.value); }}
                                        className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors"
                                        style={isLightMode
                                            ? { background: '#f8fafc', borderColor: '#e2e8f0', color: '#374151', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                            : { background: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a78bfa' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }
                                        }
                                    >
                                        <option value="">Select Branch</option>
                                        {BRANCHES.map(b => (
                                            <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={b.code} value={b.code}>{b.code} - {b.name}</option>
                                        ))}
                                    </select>
                                )}

                                <select
                                    value={selectedSubject}
                                    onChange={(e) => { setSelectedSubject(e.target.value); }}
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors"
                                    style={isLightMode
                                        ? { background: '#f8fafc', borderColor: '#e2e8f0', color: '#374151' }
                                        : { background: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }
                                    }
                                >
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="">All Subjects</option>
                                    
                                    {selectedYearLevel === '2nd Year' && currentBranch === 'IS' && (
                                        <>
                                            {(selectedSubSemester === '' || selectedSubSemester === '3rd Sem') && (
                                                <optgroup label="3rd Sem (ISE)" style={{ background: isLightMode ? '#fff' : '#0a0a0b' }}>
                                                    {ISE_3RD_SEM_SUBJECTS.map((s, i) => (
                                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={`ise3-${i}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            {(selectedSubSemester === '' || selectedSubSemester === '4th Sem') && (
                                                <optgroup label="4th Sem (ISE)" style={{ background: isLightMode ? '#fff' : '#0a0a0b' }}>
                                                    {ISE_4TH_SEM_SUBJECTS.map((s, i) => (
                                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={`ise4-${i}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </>
                                    )}

                                    {selectedYearLevel === '3rd Year' && currentBranch === 'IS' && (
                                        <>
                                            {(selectedSubSemester === '' || selectedSubSemester === '5th Sem') && (
                                                <optgroup label="5th Sem (ISE)" style={{ background: isLightMode ? '#fff' : '#0a0a0b' }}>
                                                    {ISE_5TH_SEM_SUBJECTS.map((s, i) => (
                                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={`ise5-${i}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            {(selectedSubSemester === '' || selectedSubSemester === '6th Sem') && (
                                                <optgroup label="6th Sem (ISE)" style={{ background: isLightMode ? '#fff' : '#0a0a0b' }}>
                                                    {ISE_6TH_SEM_SUBJECTS.map((s, i) => (
                                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={`ise6-${i}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </>
                                    )}

                                    {selectedYearLevel === '2nd Year' && currentBranch === 'CS' && (
                                        <>
                                            {(selectedSubSemester === '' || selectedSubSemester === '3rd Sem') && (
                                                <optgroup label="3rd Sem (CSE)" style={{ background: isLightMode ? '#fff' : '#0a0a0b' }}>
                                                    {CSE_3RD_SEM_SUBJECTS.map((s, i) => (
                                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={`cse3-${i}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            {(selectedSubSemester === '' || selectedSubSemester === '4th Sem') && (
                                                <optgroup label="4th Sem (CSE)" style={{ background: isLightMode ? '#fff' : '#0a0a0b' }}>
                                                    {CSE_4TH_SEM_SUBJECTS.map((s, i) => (
                                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={`cse4-${i}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </>
                                    )}

                                    {selectedYearLevel === '3rd Year' && currentBranch === 'CS' && (
                                        <>
                                            {(selectedSubSemester === '' || selectedSubSemester === '5th Sem') && (
                                                <optgroup label="5th Sem (CSE)" style={{ background: isLightMode ? '#fff' : '#0a0a0b' }}>
                                                    {CSE_5TH_SEM_SUBJECTS.map((s, i) => (
                                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={`cse5-${i}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            {(selectedSubSemester === '' || selectedSubSemester === '6th Sem') && (
                                                <optgroup label="6th Sem (CSE)" style={{ background: isLightMode ? '#fff' : '#0a0a0b' }}>
                                                    {CSE_6TH_SEM_SUBJECTS.map((s, i) => (
                                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={`cse6-${i}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </>
                                    )}

                                    {subjects.filter(s => {
                                        const name = (s.name || s).toLowerCase();
                                        // Hide known ISE subjects (handled by optgroup)
                                        if (ALL_KNOWN_SUBJECTS.some(k => k.name.toLowerCase() === name)) return false;
                                        // If 2nd, 3rd, or 4th Year selected, hide 1st Year subjects
                                        const isAdvancedYear = selectedYearLevel && selectedYearLevel !== '1st Year';
                                        if (isAdvancedYear && FIRST_YEAR_SUBJECTS.some(f => {
                                            const firstYearName = f.toLowerCase();
                                            return name.includes(firstYearName) || firstYearName.includes(name);
                                        })) return false;
                                        return true;
                                    }).map((s, i) => (
                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={`extra-${i}`} value={s.name || s}>{s.name || s}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedDocType}
                                    onChange={(e) => { setSelectedDocType(e.target.value); }}
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors"
                                    style={isLightMode
                                        ? { background: '#f8fafc', borderColor: '#e2e8f0', color: '#374151' }
                                        : { background: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }
                                    }
                                >
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="">All Types</option>
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="notes">Notes</option>
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="internals">Internals</option>
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="see">SEE</option>
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="others">Others</option>
                                </select>

                                <select
                                    value={selectedYear}
                                    onChange={(e) => { setSelectedYear(e.target.value); }}
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-colors"
                                    style={isLightMode
                                        ? { background: '#f8fafc', borderColor: '#e2e8f0', color: '#374151' }
                                        : { background: '#0a0a0b', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }
                                    }
                                >
                                    <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} value="">Batch / Year</option>
                                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option style={{ background: isLightMode ? '#fff' : '#0a0a0b' }} key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* Layout Wrapper: Results + Sidebar */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Main Content Area */}
                            <div className="flex-1 w-full order-2 lg:order-1">
                                {loading ? (
                                    <div className="flex justify-center items-center py-20">
                                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                    </div>
                                ) : documents.length > 0 ? (
                                    <>
                                        {/* Results Count & Breakdown */}
                                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-8 w-1 bg-purple-500 rounded-full`}></div>
                                                <h2 className={`text-xl font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-100'}`}>
                                                    Found <span className="text-purple-500">{searchSummary.total}</span> Materials
                                                    {visibleCount < documents.length && (
                                                        <span className={`ml-2 text-sm font-normal ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            · showing {Math.min(visibleCount, documents.length)} of {documents.length}
                                                        </span>
                                                    )}
                                                </h2>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {searchSummary.notes > 0 && (
                                                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isLightMode ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                        Notes: {searchSummary.notes}
                                                    </span>
                                                )}
                                                {searchSummary.see > 0 && (
                                                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isLightMode ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                        SEE: {searchSummary.see}
                                                    </span>
                                                )}
                                                {searchSummary.internals > 0 && (
                                                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isLightMode ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                        Internals: {searchSummary.internals}
                                                    </span>
                                                )}
                                                {searchSummary.others > 0 && (
                                                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isLightMode ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                        Others: {searchSummary.others}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {documents.slice(0, visibleCount).map((doc) => {
                                                const isAdminReviewCard = user?.isAdmin && statusFilter === 'pending';

                                                if (isAdminReviewCard) {
                                                    return (
                                                        <div key={doc._id} className={`rounded-3xl border p-6 transition-all hover:shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500
                                                            ${isLightMode 
                                                                ? 'bg-white border-amber-200/60 shadow-lg shadow-amber-500/5' 
                                                                : 'bg-[#141416] border-amber-500/10 shadow-lg shadow-black/50'}`}
                                                        >
                                                            {/* Header section - Focus on Title and Status */}
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                                                            <FileText size={18} />
                                                                        </div>
                                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border
                                                                            ${isLightMode ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                                                            {doc.documentType || 'Doc'}
                                                                        </span>
                                                                    </div>
                                                                    <h3 className={`text-xl font-bold leading-tight line-clamp-2 ${isLightMode ? 'text-slate-800' : 'text-slate-100'}`}>
                                                                        {doc.subjectName}
                                                                        {doc.subjectCode && <span className="ml-2 text-sm opacity-40 font-mono">({doc.subjectCode})</span>}
                                                                    </h3>
                                                                </div>
                                                                <div className="px-3 py-1 rounded-full bg-amber-500 text-[#0a0a0b] text-[10px] font-black uppercase tracking-tighter animate-pulse shadow-lg shadow-amber-500/20">
                                                                    Pending Review
                                                                </div>
                                                            </div>

                                                            {/* Information body - Fast processing info */}
                                                            <div className={`space-y-3 p-4 rounded-2xl ${isLightMode ? 'bg-slate-50' : 'bg-white/[0.02]'}`}>
                                                                <div>
                                                                    <p className="text-[11px] uppercase font-black tracking-widest opacity-40 mb-1">Uploaded By</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                                                                            {(doc.contributor?.name || 'U').charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <span className="text-sm font-bold opacity-80">
                                                                            {doc.contributor?.name || 'Anonymous User'} 
                                                                            {doc.usn && <span className="ml-1.5 opacity-50 font-mono text-xs">({doc.usn})</span>}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-[11px] uppercase font-black tracking-widest opacity-40 mb-1">Context</p>
                                                                        <p className="text-xs font-bold">{doc.yearLevel} • {doc.semester || 'N/A'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[11px] uppercase font-black tracking-widest opacity-40 mb-1">File Source</p>
                                                                        <p className="text-xs font-mono opacity-60 truncate max-w-[120px]" title={doc.originalName}>{doc.originalName}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="pt-2 flex items-center gap-3 text-[10px] font-bold opacity-40 border-t border-white/5">
                                                                    <span className="flex items-center gap-1"><Download size={10} /> {formatSize(doc.fileSize)}</span>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1"><Clock size={10} /> {getTimeAgo(doc.createdAt)}</span>
                                                                </div>
                                                            </div>

                                                            {/* Action buttons hierarchy */}
                                                            <div className="mt-auto pt-4 border-t border-white/5">
                                                                {confirmingDeleteId === doc._id ? (
                                                                    <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in duration-200">
                                                                        <button 
                                                                            onClick={() => { setConfirmingDeleteId(null); handleDocDelete(doc._id); }}
                                                                            className="py-3 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-500/20"
                                                                        >
                                                                            Confirm Reject
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setConfirmingDeleteId(null)}
                                                                            className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${isLightMode ? 'bg-white border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        <button
                                                                            onClick={() => handlePreview(doc._id)}
                                                                            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl border transition-all hover:bg-white/5 ${isLightMode ? 'border-slate-200 text-slate-600' : 'border-white/10 text-slate-400'}`}
                                                                        >
                                                                            <Eye size={16} />
                                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Preview</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleApprove(doc._id)}
                                                                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-emerald-600 text-white font-bold transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                                                        >
                                                                            <Check size={16} />
                                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Approve</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setConfirmingDeleteId(doc._id)}
                                                                            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-rose-600/10 border border-rose-600/20 text-rose-500 font-bold transition-all hover:bg-rose-600 hover:text-white"
                                                                        >
                                                                            <X size={16} />
                                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">Reject</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={doc._id} className={`rounded-3xl border transition-all hover:-translate-y-2 hover:shadow-2xl overflow-hidden flex flex-col group
                                                        ${isLightMode
                                                            ? 'bg-white border-slate-200 hover:shadow-purple-500/10 hover:border-purple-300'
                                                            : 'bg-[#141416]/50 border-white/5 hover:border-purple-500/30 hover:shadow-purple-500/10'}`}
                                                    >
                                                        <div className="p-7 flex-1 flex flex-col relative">
                                                            {/* Top Right: Combined Tag & Status Layer */}
                                                            <div className="absolute top-7 right-7 flex items-center gap-2.5">
                                                                {user?.isAdmin && (
                                                                    <div className="flex items-center gap-1 opacity-30 group-hover:opacity-100 transition-all">
                                                                        <button 
                                                                            onClick={(e) => { 
                                                                                e.stopPropagation(); 
                                                                                setEditingDoc(doc);
                                                                                setShowEditModal(true);
                                                                            }}
                                                                            className={`p-1.5 rounded-lg transition-all hover:bg-purple-500 hover:text-white ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}
                                                                        >
                                                                            <Edit size={12} />
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(doc._id); }}
                                                                            className={`p-1.5 rounded-lg transition-all hover:bg-red-500 hover:text-white ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {doc.documentType === 'notes' && (
                                                                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm transition-transform group-hover:scale-105">
                                                                        Notes
                                                                    </span>
                                                                )}
                                                                {doc.documentType === 'see' && (
                                                                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm transition-transform group-hover:scale-105">
                                                                        SEE
                                                                    </span>
                                                                )}
                                                                {doc.documentType === 'internals' && (
                                                                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm transition-transform group-hover:scale-105">
                                                                        Internal
                                                                    </span>
                                                                )}
                                                                {doc.documentType === 'others' && (
                                                                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm transition-transform group-hover:scale-105">
                                                                        Others
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Header Layout - Balanced Alignment */}
                                                            <div className="flex gap-4 mb-6">
                                                                <div className={`p-2 h-fit rounded-xl border shrink-0 transition-all group-hover:rotate-6 ${
                                                                    doc.documentType === 'see' 
                                                                    ? (isLightMode ? 'bg-red-50 text-red-600 border-red-100' : 'bg-red-500/10 text-red-400 border-red-500/20')
                                                                    : doc.documentType === 'others'
                                                                    ? (isLightMode ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                                                                    : (isLightMode ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-blue-500/10 text-blue-400 border-blue-500/20')
                                                                }`}>
                                                                    <FileText size={18} />
                                                                </div>
                                                                
                                                                <div className="flex-1 pr-20 min-h-[48px]">
                                                                    <h3 className={`text-lg font-bold leading-tight mb-1 capitalize line-clamp-2 ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                                                                        {doc.subjectName}
                                                                    </h3>
                                                                    <p className={`text-[11px] font-bold opacity-30 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                                                        {doc.yearLevel} {doc.subjectCode && ` • ${doc.subjectCode.toUpperCase()}`}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Content Body - Clean & Bold Filename */}
                                                            <div className="space-y-4 mb-8">
                                                                <p className={`text-sm font-bold line-clamp-1 py-1 transition-colors ${isLightMode ? 'text-slate-800 hover:text-purple-600' : 'text-white/90 hover:text-purple-400'}`} title={doc.originalName}>
                                                                    {doc.originalName}
                                                                </p>
                                                                
                                                                {doc.contributor?.showName && (
                                                                    <div className="flex items-center gap-2 transition-all group-hover:translate-x-1">
                                                                        <UserCheck size={12} className="opacity-20" />
                                                                        <span className={`text-[11px] font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                                            By <span className={`transition-colors ${isLightMode ? 'text-slate-900' : 'text-slate-300'}`}>{doc.contributor.name}</span>
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Subtle Smart Footer */}
                                                            {confirmingDeleteId === doc._id && user?.isAdmin ? (
                                                                <div className="mt-auto pt-4 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                                                                    <button 
                                                                        onClick={() => { setConfirmingDeleteId(null); handleDocDelete(doc._id); }}
                                                                        className="flex-1 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600 shadow-lg shadow-red-500/20"
                                                                    >
                                                                        Confirm Delete
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setConfirmingDeleteId(null)}
                                                                        className={`ml-2 px-4 py-2 border rounded-lg text-[10px] font-bold ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5 opacity-40">
                                                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.1em]">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className={isLightMode ? 'text-slate-900' : 'text-white'}>
                                                                                {doc.fileSize > 0 ? formatSize(doc.fileSize) : '—'}
                                                                            </span>
                                                                        </div>
                                                                        <span className="w-1 h-1 rounded-full bg-current opacity-20"></span>
                                                                        <span>
                                                                            Updated {getTimeAgo(doc.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Modern Actions Block - High Logic Handling */}
                                                        <div className={`p-5 mt-auto border-t flex items-center gap-2.5 ${isLightMode ? 'bg-slate-50/50 border-slate-100' : 'bg-black/10 border-white/5'}`}>
                                                            {statusFilter === 'deleted' ? (
                                                                <>
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await userUploadAPI.restoreUpload(doc._id);
                                                                                handleSearch();
                                                                            } catch (e) {
                                                                                alert("Restore failed");
                                                                            }
                                                                        }}
                                                                        className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white transition-all hover:bg-emerald-700 hover:shadow-xl shadow-emerald-500/20 active:scale-95`}
                                                                    >
                                                                        <ArrowLeft size={14} strokeWidth={3} />
                                                                        Restore Material
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (window.confirm("Permanently delete this material? This cannot be undone.")) {
                                                                                try {
                                                                                    await userUploadAPI.permanentDeleteUpload(doc._id);
                                                                                    handleSearch();
                                                                                } catch (e) {
                                                                                    alert("Permanent delete failed");
                                                                                }
                                                                            }
                                                                        }}
                                                                        className={`px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all`}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => handlePreview(doc._id)}
                                                                        className={`px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all 
                                                                            ${isLightMode 
                                                                                ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-md' 
                                                                                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:shadow-lg shadow-black/20'}`}
                                                                    >
                                                                        Preview
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDownload(doc._id)}
                                                                        className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-purple-600 text-white transition-all hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-600/30 active:scale-95"
                                                                    >
                                                                        <Download size={14} strokeWidth={3} />
                                                                        Download
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        </div>

                                        {/* Show More button (below grid) + progress indicator */}
                                        {visibleCount < documents.length ? (
                                            <div className="mt-8 mb-20 flex flex-col items-center gap-4">
                                                {/* Progress bar */}
                                                <div className="w-full max-w-sm">
                                                    <div className="flex justify-between text-xs font-medium mb-2">
                                                        <span className={isLightMode ? 'text-slate-500' : 'text-slate-500'}>
                                                            Showing {visibleCount} of {documents.length}
                                                        </span>
                                                        <span className="text-purple-500 font-bold">
                                                            {Math.round((visibleCount / documents.length) * 100)}%
                                                        </span>
                                                    </div>
                                                    <div className={`h-1.5 rounded-full overflow-hidden ${isLightMode ? 'bg-slate-200' : 'bg-white/10'}`}>
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
                                                            style={{ width: `${Math.round((visibleCount / documents.length) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    id="show-more-materials-bottom"
                                                    onClick={() => setVisibleCount(v => Math.min(v + ITEMS_PER_PAGE, documents.length))}
                                                    className="group flex items-center gap-3 px-8 py-3.5 rounded-full border-2 border-purple-500/40 hover:border-purple-500 hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                                                >
                                                    <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                    Load {Math.min(ITEMS_PER_PAGE, documents.length - visibleCount)} more
                                                    <span className={`text-xs font-normal opacity-60 ${isLightMode ? 'text-slate-500' : ''}`}>
                                                        ({documents.length - visibleCount} remaining)
                                                    </span>
                                                </button>
                                            </div>
                                        ) : (
                                            /* End of results */
                                            <div className="mt-10 mb-20 flex flex-col items-center gap-3 text-center">
                                                <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-widest ${isLightMode ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                                    <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    You've seen all {documents.length} material{documents.length !== 1 ? 's' : ''}
                                                </div>
                                                <button
                                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                    className="text-xs text-purple-500 hover:text-purple-400 font-semibold hover:underline transition-colors"
                                                >
                                                    ↑ Back to top
                                                </button>
                                            </div>
                                        )}

                                    </>
                                ) : (
                                    <div className={`text-center py-20 px-6 rounded-3xl border border-dashed ${isLightMode ? 'bg-slate-50/50 border-slate-300' : 'bg-[#141416]/20 border-white/10'}`}>
                                        <div className="text-slate-500 mb-5 flex justify-center">
                                            <div className={`p-6 rounded-full ${isLightMode ? 'bg-slate-100' : 'bg-white/5'}`}>
                                                <Search size={40} className="opacity-50" />
                                            </div>
                                        </div>
                                        <h3 className={`text-2xl font-bold mb-3 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>No materials found</h3>
                                        <p className={`mb-8 max-w-md mx-auto ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Try adjusting your filters or search terms.</p>
                                        <button
                                            onClick={resetFilters}
                                            className={`px-8 py-3 rounded-full font-semibold transition-all shadow-md ${isLightMode ? 'bg-white border border-slate-200 text-slate-700' : 'bg-white/5 border border-white/10 text-white'}`}
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar: Top Performers */}
                            <aside className="w-full lg:w-80 shrink-0 space-y-6 order-1 lg:order-2">
                                <div className={`p-6 rounded-3xl border transition-all ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141416]/50 border-white/5'}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                                <Trophy size={20} />
                                            </div>
                                            <h3 className={`font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Top Performers</h3>
                                        </div>
                                        <button 
                                            onClick={() => setShowLeaderboardModal(true)}
                                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${isLightMode ? 'border-slate-200 text-slate-500 hover:bg-slate-50' : 'border-white/5 text-slate-400 hover:bg-white/5'}`}
                                        >
                                            View All
                                        </button>
                                    </div>

                                    {fetchingLeaderboard ? (
                                        <div className="space-y-4 py-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex items-center gap-4 animate-pulse">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-3 w-20 bg-white/5 rounded"></div>
                                                        <div className="h-2 w-12 bg-white/5 rounded"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (leaderboardData || []).length === 0 ? (
                                        <div className="py-8 text-center" key="lb-empty">
                                            <p className="text-xs text-slate-500 font-bold mb-1">No contributors yet</p>
                                            <p className="text-[10px] text-slate-600">Be the first to perform!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4" key="lb-list">
                                            {leaderboardData.slice(0, 3).map((performer, idx) => (
                                                <div 
                                                    key={idx}
                                                    className={`group p-3 rounded-2xl border transition-all flex items-center gap-4 ${isLightMode ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5 hover:border-purple-500/30'}`}
                                                >
                                                    <div className="relative">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                                                            idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                            idx === 1 ? 'bg-slate-400/20 text-slate-400' :
                                                            'bg-amber-700/20 text-amber-700'
                                                        }`}>
                                                            {performer.usn?.includes(' ') 
                                                                ? performer.usn.split(' ').map(n => n[0]).join('').slice(0, 2)
                                                                : performer.usn?.length > 5 ? performer.usn.slice(-3) : (performer.usn || '??')}
                                                        </div>
                                                        <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black border-2 ${
                                                            idx === 0 ? 'bg-yellow-500 text-yellow-900 border-white' :
                                                            idx === 1 ? 'bg-slate-300 text-slate-800 border-white' :
                                                            'bg-amber-600 text-amber-100 border-white'
                                                        }`}>
                                                            {idx + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-black truncate ${isLightMode ? 'text-slate-800' : 'text-slate-100'}`}>{performer.usn}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{performer.uploads} Uploads</span>
                                                            <div className={`w-1 h-1 rounded-full ${isLightMode ? 'bg-slate-300' : 'bg-white/10'}`}></div>
                                                            <span className="text-[10px] font-black text-purple-500">{performer.score} Pts</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <div className={`mt-4 p-4 rounded-2xl border flex flex-col gap-3 ${isLightMode ? 'bg-purple-50 border-purple-100' : 'bg-purple-500/10 border-purple-500/20'}`}>
                                                <div className="flex items-center gap-2">
                                                    <Info size={12} className="text-purple-500" />
                                                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider">How to top?</p>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                    Contribute verified materials to earn points. Each approved upload equals 10 points. 
                                                </p>
                                                <button 
                                                    onClick={() => setShowUploadModal(true)}
                                                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all"
                                                >
                                                    Start Contributing
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Branch Spotlight */}
                                <div className={`p-6 rounded-3xl border border-dashed ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#141416]/20 border-white/5'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                                            <Heart size={16} className="fill-current" />
                                        </div>
                                        <h4 className={`font-black text-sm ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Contribute & Shine</h4>
                                    </div>
                                    <p className="text-slate-500 text-xs leading-relaxed mb-4 font-medium">
                                        Make ASK+ the best study resource. Your name/USN will be featured across the platform!
                                    </p>
                                </div>
                            </aside>
                        </div>

                        {/* Global Discussion Section */}
                        <div className="mt-20 max-w-4xl mx-auto">
                            <div className={`p-8 rounded-3xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xl shadow-purple-500/5' : 'bg-[#141416]/50 border-white/5 shadow-2xl shadow-black/50'}`}>
                                <div className="flex flex-col items-center text-center mb-10">
                                    <div className={`p-4 rounded-2xl mb-4 ${isLightMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'}`}>
                                        <MessageSquare size={32} />
                                    </div>
                                    <h2 className={`text-3xl font-black tracking-tight mb-3 ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>
                                        Community Discussion
                                    </h2>
                                    <p className={`text-slate-500 max-w-md ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Found something helpful? Have a question about these materials? Join the conversation below.
                                    </p>
                                </div>
                                <DocComments documentId="ask-finder-global" user={user} isLightMode={isLightMode} />
                            </div>
                        </div>
                    </main>

            <ProfileModal
                show={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                user={user}
                updateUser={updateUser}
                theme={theme}
            />

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-outfit">
                    <div className={`rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border shadow-2xl animate-fade-in
                        ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#141416] border-white/10 text-white'}`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {user?.isAdmin ? 'Add New Material' : 'Contribute Material'}
                                <span className="ml-3 text-xs opacity-50 font-normal">Step {uploadStep}/2</span>
                            </h2>
                            <button onClick={() => { setShowUploadModal(false); resetUploadForm(); }} className={`p-2 rounded-full transition-colors ${isLightMode ? 'hover:bg-slate-100/80 text-slate-500' : 'hover:bg-white/10 text-slate-400'}`}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); if(uploadStep === 1) setUploadStep(2); else handleUpload(e); }}>
                            {uploadStep === 1 ? (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Year Level *</label>
                                            <select
                                                required
                                                value={uploadMetadata.yearLevel}
                                                onChange={(e) => {
                                                    const y = e.target.value;
                                                    setUploadMetadata({ 
                                                        ...uploadMetadata, 
                                                        yearLevel: y, 
                                                        semester: y === '1st Year' ? '1st Year' : '',
                                                        subjectName: '',
                                                        subjectCode: '' 
                                                    });
                                                }}
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                            >
                                                <option value="">Select Year</option>
                                                <option value="1st Year">1st Year (Common)</option>
                                                <option value="2nd Year">2nd Year</option>
                                                <option value="3rd Year">3rd Year</option>
                                                <option value="4th Year">4th Year</option>
                                            </select>
                                        </div>

                                        {uploadMetadata.yearLevel && uploadMetadata.yearLevel !== '1st Year' && (
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Branch *</label>
                                                <select
                                                    required
                                                    value={uploadMetadata.branch}
                                                    onChange={(e) => setUploadMetadata({ ...uploadMetadata, branch: e.target.value, subjectName: '', subjectCode: '' })}
                                                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                                >
                                                    <option value="">Select Branch</option>
                                                    {BRANCHES.map(b => (
                                                        <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {(uploadMetadata.yearLevel === '2nd Year' || uploadMetadata.yearLevel === '3rd Year' || uploadMetadata.yearLevel === '4th Year') && (
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Semester <span className="text-xs font-normal opacity-50 ml-1">(Optional)</span></label>
                                                <select
                                                    value={uploadMetadata.semester}
                                                    onChange={(e) => setUploadMetadata({ ...uploadMetadata, semester: e.target.value, subjectName: '', subjectCode: '' })}
                                                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                                >
                                                    <option value="">Select Semester</option>
                                                    {uploadMetadata.yearLevel === '2nd Year' ? (
                                                        <>
                                                            <option value="3rd Sem">3rd Semester</option>
                                                            <option value="4th Sem">4th Semester</option>
                                                        </>
                                                    ) : uploadMetadata.yearLevel === '3rd Year' ? (
                                                        <>
                                                            <option value="5th Sem">5th Semester</option>
                                                            <option value="6th Sem">6th Semester</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="7th Sem">7th Semester</option>
                                                            <option value="8th Sem">8th Semester</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Subject Name *</label>
                                            <select
                                                required
                                                value={uploadMetadata.subjectName}
                                                onChange={(e) => {
                                                    const sub = ALL_KNOWN_SUBJECTS.find(s => s.name === e.target.value)
                                                             || subjects.find(s => s.name === e.target.value);
                                                    setUploadMetadata({ 
                                                        ...uploadMetadata, 
                                                        subjectName: e.target.value,
                                                        subjectCode: sub?.code || ''
                                                    });
                                                }}
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                            >
                                                <option value="">Select Subject</option>
                                                <option value="General">General (Multiple Subjects/Papers)</option>
                                                
                                                {uploadMetadata.yearLevel === '2nd Year' && uploadMetadata.branch === 'IS' && (
                                                    <>
                                                        {(uploadMetadata.semester === '' || uploadMetadata.semester === '3rd Sem') && (
                                                            <optgroup label="3rd Semester (ISE)">
                                                                {ISE_3RD_SEM_SUBJECTS.map((s, i) => (
                                                                    <option key={`3-${i}`} value={s.name}>{s.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        {(uploadMetadata.semester === '' || uploadMetadata.semester === '4th Sem') && (
                                                            <optgroup label="4th Semester (ISE)">
                                                                {ISE_4TH_SEM_SUBJECTS.map((s, i) => (
                                                                    <option key={`4-${i}`} value={s.name}>{s.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </>
                                                )}

                                                {uploadMetadata.yearLevel === '2nd Year' && uploadMetadata.branch === 'CS' && (
                                                    <>
                                                        {(uploadMetadata.semester === '' || uploadMetadata.semester === '3rd Sem') && (
                                                            <optgroup label="3rd Semester (CSE)">
                                                                {CSE_3RD_SEM_SUBJECTS.map((s, i) => (
                                                                    <option key={`cse3-${i}`} value={s.name}>{s.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        {(uploadMetadata.semester === '' || uploadMetadata.semester === '4th Sem') && (
                                                            <optgroup label="4th Semester (CSE)">
                                                                {CSE_4TH_SEM_SUBJECTS.map((s, i) => (
                                                                    <option key={`cse4-${i}`} value={s.name}>{s.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </>
                                                )}

                                                {uploadMetadata.yearLevel === '3rd Year' && uploadMetadata.branch === 'CS' && (
                                                    <>
                                                        {(uploadMetadata.semester === '' || uploadMetadata.semester === '5th Sem') && (
                                                            <optgroup label="5th Semester (CSE)">
                                                                {CSE_5TH_SEM_SUBJECTS.map((s, i) => (
                                                                    <option key={`cse5-${i}`} value={s.name}>{s.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        {(uploadMetadata.semester === '' || uploadMetadata.semester === '6th Sem') && (
                                                            <optgroup label="6th Semester (CSE)">
                                                                {CSE_6TH_SEM_SUBJECTS.map((s, i) => (
                                                                    <option key={`cse6-${i}`} value={s.name}>{s.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </>
                                                )}

                                                {uploadMetadata.yearLevel === '3rd Year' && uploadMetadata.branch === 'IS' && (
                                                    <>
                                                        {(uploadMetadata.semester === '' || uploadMetadata.semester === '5th Sem') && (
                                                            <optgroup label="5th Semester (ISE)">
                                                                {ISE_5TH_SEM_SUBJECTS.map((s, i) => (
                                                                    <option key={`5-${i}`} value={s.name}>{s.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        {(uploadMetadata.semester === '' || uploadMetadata.semester === '6th Sem') && (
                                                            <optgroup label="6th Semester (ISE)">
                                                                {ISE_6TH_SEM_SUBJECTS.map((s, i) => (
                                                                    <option key={`6-${i}`} value={s.name}>{s.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </>
                                                )}

                                                {subjects.filter(s => {
                                                    const name = (s.name || s).toLowerCase();
                                                    if (ALL_KNOWN_SUBJECTS.some(k => k.name.toLowerCase() === name)) return false;
                                                    const isAdvancedYear = uploadMetadata.yearLevel && uploadMetadata.yearLevel !== '1st Year';
                                                    if (isAdvancedYear && FIRST_YEAR_SUBJECTS.some(f => {
                                                        const firstYearName = f.toLowerCase();
                                                        return name.includes(firstYearName) || firstYearName.includes(name);
                                                    })) return false;
                                                    return true;
                                                }).map((s, i) => (
                                                    <option key={`extra-${i}`} value={s.name || s}>{s.name || s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Subject Code</label>
                                            <input
                                                type="text" value={uploadMetadata.subjectCode}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, subjectCode: e.target.value })}
                                                placeholder="e.g. 21CS41"
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-5">
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                        >
                                            Continue <ArrowLeft size={16} className="rotate-180" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Document Type</label>
                                            <select
                                                value={uploadMetadata.documentType}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, documentType: e.target.value })}
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                            >
                                                <option value="notes">Notes</option>
                                                <option value="internals">Internals</option>
                                                <option value="see">SEE</option>
                                                <option value="others">Others</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Paper Year (Optional)</label>
                                            <input
                                                type="text" value={uploadMetadata.year} placeholder="e.g., 2023"
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, year: e.target.value })}
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Module Info</label>
                                            <input
                                                type="text" value={uploadMetadata.moduleInfo}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, moduleInfo: e.target.value })}
                                                placeholder="e.g., Module 2, M1-M3"
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Page Count</label>
                                            <input
                                                type="number" value={uploadMetadata.pageCount}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, pageCount: e.target.value })}
                                                placeholder="Optional"
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold mb-2">Tags (comma-separated)</label>
                                        <input
                                            type="text" value={uploadMetadata.tags}
                                            onChange={(e) => setUploadMetadata({ ...uploadMetadata, tags: e.target.value })}
                                            placeholder="e.g., tcp, routing, important"
                                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-purple-500/30' : 'bg-[#0a0a0b] border-white/10 focus:ring-purple-500/50'}`}
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold mb-2">Select Files (PDF, ZIP, 7z) *</label>
                                        <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-colors ${isLightMode ? 'border-purple-200 bg-purple-50/50 hover:bg-purple-50' : 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10'}`}>
                                            <input
                                                type="file" required multiple
                                                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                                                accept=".pdf,.zip,.7z"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="text-center pointer-events-none flex flex-col items-center justify-center gap-2">
                                                <Upload className="text-purple-500 mb-1" size={24} />
                                                <div className="flex flex-col">
                                                    <span className={`font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-100'}`}>
                                                        {uploadFiles.length > 0 
                                                            ? `${uploadFiles.length} file(s) selected` 
                                                            : 'Click or drag files here'}
                                                    </span>
                                                    <span className="text-[10px] opacity-60">You can select multiple PDF files</span>
                                                </div>
                                            </div>
                                        </div>
                                        {uploadFiles.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {uploadFiles.map((f, i) => (
                                                    <span key={i} className={`text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 truncate max-w-[150px]`}>
                                                        {f.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Contributor Section */}
                                    <div className={`mt-6 mb-8 p-5 rounded-2xl border ${isLightMode ? 'bg-purple-50 border-purple-100' : 'bg-purple-500/5 border-purple-500/10'}`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-purple-500 text-white">
                                                <UserCheck size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold leading-none mb-1">Contributor Credits</h3>
                                                <p className="text-[10px] opacity-60">Show your name as a contributor for these materials?</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 mb-4">
                                            {['true', 'false'].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setUploadMetadata(prev => ({ ...prev, showContributorName: val }))}
                                                    className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                                                        uploadMetadata.showContributorName === val
                                                            ? 'bg-purple-600 border-purple-600 text-white shadow-lg'
                                                            : `border-slate-200 ${isLightMode ? 'bg-white hover:bg-slate-50' : 'bg-black/20 hover:bg-white/5'}`
                                                    }`}
                                                >
                                                    {val === 'true' ? 'Yes, Credit Me' : 'Keep Anonymous'}
                                                </button>
                                            ))}
                                        </div>

                                        {uploadMetadata.showContributorName === 'true' && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Display Name</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. John Doe"
                                                        value={uploadMetadata.contributorName}
                                                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, contributorName: e.target.value }))}
                                                        className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${isLightMode ? 'bg-white' : 'bg-[#0a0a0b]'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Year</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. 3rd Year"
                                                        value={uploadMetadata.contributorYear}
                                                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, contributorYear: e.target.value }))}
                                                        className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${isLightMode ? 'bg-white' : 'bg-[#0a0a0b]'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Branch</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. CS / AI&DS"
                                                        value={uploadMetadata.contributorBranch}
                                                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, contributorBranch: e.target.value }))}
                                                        className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${isLightMode ? 'bg-white' : 'bg-[#0a0a0b]'}`}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {!user?.usn && (
                                            <div className="mt-6 pt-4 border-t border-purple-500/10 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Trophy size={14} className="text-yellow-500" />
                                                    <label className="text-[10px] font-bold uppercase opacity-60">Your USN (Required for Leaderboard) *</label>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    required
                                                    placeholder="e.g. 1SI21CS001"
                                                    value={uploadMetadata.usn}
                                                    maxLength={10}
                                                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, usn: e.target.value.toUpperCase() }))}
                                                    className={`w-full px-4 py-3 text-sm font-black rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${isLightMode ? 'bg-white' : 'bg-[#0a0a0b]'}`}
                                                />
                                                <p className="text-[10px] text-purple-500 mt-2 font-medium">This will be linked to your account for all future contributions.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`flex flex-col sm:flex-row gap-3 pt-8 border-t ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setUploadStep(1)}
                                            className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all ${isLightMode ? 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700' : 'bg-white/5 border border-white/5 hover:bg-white/10 text-white'}`}
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploadLoading}
                                            className="flex-[2] px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-black uppercase tracking-widest disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 active:scale-95"
                                        >
                                            {uploadLoading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                                            ) : (
                                                <><Upload size={18} /> Confirm & Post</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-fade-in">
                    <div className={`relative w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl overflow-hidden border shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)]
                        ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#0f0f12] border-white/10'}`}
                    >
                        {/* Header */}
                        <div className={`p-4 flex justify-between items-center border-b ${isLightMode ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                            <div className="items-center gap-3 hidden sm:flex">
                                <div className={`p-2 rounded-lg ${isLightMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'}`}>
                                    <Eye size={20} />
                                </div>
                                <h3 className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>Document Preview</h3>
                            </div>
                            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                                <button
                                    onClick={() => window.open(previewUrl, '_blank')}
                                    className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-bold flex-1 sm:flex-none justify-center
                                        ${isLightMode ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
                                    title="Open in new tab"
                                >
                                    <ExternalLink size={20} />
                                    <span>Pop Out</span>
                                </button>
                                <button
                                    onClick={() => { setShowPreviewModal(false); setPreviewUrl(''); }}
                                    className={`p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95
                                        ${isLightMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-black/20">
                            <iframe
                                src={`${previewUrl}#toolbar=1`}
                                className="w-full h-full border-none"
                                title="Document Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Login Required Modal */}
            <LoginRequiredModal 
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                featureName="Premium Study Materials"
                description="Sign in to download this material, save it for later, and access our complete question bank."
            />

            {/* Leaderboard Modal */}
            <AnimatePresence>
                {showLeaderboardModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[250] p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#0f0f12] border-white/10'}`}
                        >
                            {/* Header */}
                            <div className={`p-6 flex justify-between items-center border-b ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-500">
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className={`text-xl font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Leaderboard</h2>
                                            <button 
                                                onClick={() => setShowRules(!showRules)}
                                                className={`p-1 rounded-full transition-colors ${isLightMode ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/5 text-slate-400'}`}
                                            >
                                                <Info size={16} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">Top contributors of ASK+ Finder</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowLeaderboardModal(false)}
                                    className={`p-2 rounded-xl transition-all ${isLightMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Rules Callout */}
                            <AnimatePresence>
                                {showRules && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className={`${isLightMode ? 'bg-purple-50 border-b border-purple-100 text-slate-600' : 'bg-purple-500/10 border-b border-purple-500/20 text-slate-300'} overflow-hidden`}
                                    >
                                        <div className="p-5 text-sm">
                                            <h3 className="font-bold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                                                <Info size={14} /> Scoring Rules
                                            </h3>
                                            <ul className="space-y-1.5 text-xs opacity-80">
                                                <li>• Every uploaded material earns <span className="font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500">10 points</span></li>
                                                <li>• <span className="font-bold">Score = uploads × 10</span></li>
                                                <li>• Only verified (approved) uploads count toward your rank</li>
                                                <li>• Updates automatically when new materials are approved</li>
                                                <li>• Only USN is displayed for privacy and competition</li>
                                            </ul>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {fetchingLeaderboard ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                                        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Calculating Ranks...</p>
                                    </div>
                                ) : (leaderboardData || []).length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isLightMode ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-slate-600'}`}>
                                            <Trophy size={32} />
                                        </div>
                                        <p className="text-slate-400 font-bold">No contributions yet.</p>
                                        <p className="text-xs text-slate-500 mt-2">Be the first to contribute and top the board!</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Top 3 Highlight */}
                                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-10 items-end px-2 sm:px-4">
                                            {/* 2nd Place */}
                                            {leaderboardData[1] ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg border-2 border-slate-200">
                                                            <span className="text-white font-black text-[10px] sm:text-xs">{leaderboardData[1].usn?.length > 5 ? leaderboardData[1].usn.slice(-3) : (leaderboardData[1].usn || '??')}</span>
                                                        </div>
                                                        <div className="absolute -top-2 -right-2 bg-slate-300 text-slate-800 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-md border border-white/20">2</div>
                                                    </div>
                                                    <div className="text-center w-full">
                                                        <p className={`text-[10px] font-black truncate ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{leaderboardData[1].usn}</p>
                                                        <p className={`text-xs font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{leaderboardData[1].score} pts</p>
                                                    </div>
                                                </div>
                                            ) : <div />}

                                            {/* 1st Place */}
                                            {leaderboardData[0] ? (
                                                <div className="flex flex-col items-center gap-4">
                                                    <Trophy size={28} className="text-yellow-500 animate-bounce" />
                                                    <div className="relative">
                                                        <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(234,179,8,0.4)] border-2 border-yellow-300">
                                                            <span className="text-white font-black text-xs sm:text-sm">{leaderboardData[0].usn?.length > 5 ? leaderboardData[0].usn.slice(-3) : (leaderboardData[0].usn || '??')}</span>
                                                        </div>
                                                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-md border border-white/20">1</div>
                                                    </div>
                                                    <div className="text-center w-full">
                                                        <p className="text-[10px] sm:text-xs font-black text-yellow-500 truncate">{leaderboardData[0].usn}</p>
                                                        <p className={`text-sm font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{leaderboardData[0].score} pts</p>
                                                    </div>
                                                </div>
                                            ) : <div />}

                                            {/* 3rd Place */}
                                            {leaderboardData[2] ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center shadow-lg border-2 border-amber-500">
                                                            <span className="text-white font-black text-[10px] sm:text-xs">{leaderboardData[2].usn?.length > 5 ? leaderboardData[2].usn.slice(-3) : (leaderboardData[2].usn || '??')}</span>
                                                        </div>
                                                        <div className="absolute -top-2 -right-2 bg-amber-600 text-amber-100 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-md border border-white/20">3</div>
                                                    </div>
                                                    <div className="text-center w-full">
                                                        <p className={`text-[10px] font-black truncate ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{leaderboardData[2].usn}</p>
                                                        <p className={`text-xs font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{leaderboardData[2].score} pts</p>
                                                    </div>
                                                </div>
                                            ) : <div />}
                                        </div>

                                        {/* Full Leaderboard Table */}
                                        <div className={`rounded-2xl border overflow-hidden ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className={`text-[10px] font-black uppercase tracking-widest ${isLightMode ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-slate-400'}`}>
                                                        <th className="px-4 py-3">Rank</th>
                                                        <th className="px-4 py-3">User (USN)</th>
                                                        <th className="px-4 py-3">Uploads</th>
                                                        <th className="px-4 py-3 text-right">Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-white/5'}`}>
                                                    {leaderboardData.map((row, idx) => {
                                                        const isCurrentUser = user && row.usn === user.usn;
                                                        return (
                                                            <tr 
                                                                key={row._id || idx} 
                                                                className={`transition-colors ${isCurrentUser ? (isLightMode ? 'bg-purple-100' : 'bg-purple-500/10') : (isLightMode ? 'hover:bg-white' : 'hover:bg-white/5')}`}
                                                            >
                                                                <td className="px-4 py-3.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-xs font-black ${idx < 3 ? 'text-yellow-500' : 'text-slate-400'}`}>
                                                                            #{idx + 1}
                                                                        </span>
                                                                        {idx === 0 && <Trophy size={12} className="text-yellow-500" />}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    <span className={`text-xs font-bold ${isCurrentUser ? 'text-purple-500' : (isLightMode ? 'text-slate-700' : 'text-slate-300')}`}>
                                                                        {row.usn}
                                                                        {isCurrentUser && <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500 uppercase font-bold">You</span>}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3.5">
                                                                    <span className={`text-xs font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{row.uploads}</span>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-right">
                                                                    <span className={`text-xs font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{row.score}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer / User Rank */}
                            {user && !fetchingLeaderboard && (leaderboardData || []).length > 0 && (
                                <div className={`p-4 sm:p-5 flex justify-between items-center px-6 sm:px-8 border-t ${isLightMode ? 'bg-purple-50 border-purple-100' : 'bg-purple-600 border-purple-500'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isLightMode ? 'bg-purple-600 text-white' : 'bg-white/20 text-white'}`}>
                                            {(() => {
                                                const rank = leaderboardData.findIndex(r => r.usn === user.usn);
                                                return rank !== -1 ? `#${rank + 1}` : '-';
                                            })()}
                                        </div>
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase leading-none mb-1 ${isLightMode ? 'text-purple-600' : 'text-purple-200'}`}>Your Ranking</p>
                                            <p className={`text-xs font-black leading-none ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{user.usn}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[10px] font-bold uppercase leading-none mb-1 ${isLightMode ? 'text-purple-600' : 'text-purple-200'}`}>Current Score</p>
                                        <p className={`text-sm font-black leading-none ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{user.score || 0} pts</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Administrative Edit Modal */}
            <AnimatePresence>
                {showEditModal && editingDoc && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEditModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className={`relative w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#1a1b1e] border-white/5'}`}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                                        <Edit size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Edit Material</h3>
                                        <p className="text-xs opacity-50 font-medium">Update document metadata and properties</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowEditModal(false)}
                                    className={`p-2 rounded-xl border transition-all ${isLightMode ? 'border-slate-100 hover:bg-slate-50' : 'border-white/5 hover:bg-white/5'}`}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Subject Name</label>
                                        <input 
                                            type="text" 
                                            value={editingDoc.subjectName}
                                            onChange={(e) => setEditingDoc({...editingDoc, subjectName: e.target.value})}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/20 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="e.g. Mathematics"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Subject Code</label>
                                        <input 
                                            type="text" 
                                            value={editingDoc.subjectCode}
                                            onChange={(e) => setEditingDoc({...editingDoc, subjectCode: e.target.value.toUpperCase()})}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/20 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="e.g. 21MAT31"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Document Type</label>
                                        <select 
                                            value={editingDoc.documentType}
                                            onChange={(e) => setEditingDoc({...editingDoc, documentType: e.target.value})}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/20 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                        >
                                            <option value="notes">Notes</option>
                                            <option value="see">SEE (Semester End)</option>
                                            <option value="internals">Internals</option>
                                            <option value="others">Others</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Semester</label>
                                        <input 
                                            type="text" 
                                            value={editingDoc.semester}
                                            onChange={(e) => setEditingDoc({...editingDoc, semester: e.target.value})}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/20 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="e.g. 3rd Sem"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Year Level</label>
                                        <input 
                                            type="text" 
                                            value={editingDoc.yearLevel}
                                            onChange={(e) => setEditingDoc({...editingDoc, yearLevel: e.target.value})}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/20 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="e.g. 2nd Year"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">File Display Name</label>
                                        <input 
                                            type="text" 
                                            value={editingDoc.originalName}
                                            onChange={(e) => setEditingDoc({...editingDoc, originalName: e.target.value})}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-purple-500/20 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="FileName.pdf"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className={`p-6 border-t flex items-center gap-3 ${isLightMode ? 'bg-slate-50' : 'bg-white/[0.02] border-white/5'}`}>
                                <button 
                                    onClick={() => setShowEditModal(false)}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${isLightMode ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={async () => {
                                        setIsSaving(true);
                                        try {
                                            await userUploadAPI.updateUpload(editingDoc._id, {
                                                subjectName: editingDoc.subjectName,
                                                subjectCode: editingDoc.subjectCode,
                                                documentType: editingDoc.documentType,
                                                semester: editingDoc.semester,
                                                yearLevel: editingDoc.yearLevel,
                                                originalName: editingDoc.originalName
                                            });
                                            setShowEditModal(false);
                                            handleSearch(); // Refresh list
                                        } catch (err) {
                                            console.error("Save failed", err);
                                            alert("Failed to update document");
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="flex-[2] py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} strokeWidth={3} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AskFinderPage;

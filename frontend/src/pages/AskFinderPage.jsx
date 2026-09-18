import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/hooks';
import { useTheme } from '../context/ThemeContext';
import ProfileModal from '../components/ProfileModal';
import { apiClient, userUploadAPI } from '../services/api';
import { deriveBranchFromUSN, toUiBranch, toBackendBranch, BRANCHES } from '../utils/constants';
import { formatSize, getTimeAgo, formatFullDate, isBranchMatch, isYearMatch, deriveStudentScope } from '../utils/askUtils';
import LoginRequiredModal from '../components/LoginRequiredModal';
import {
    Search, Download, FileText, Upload, Filter, X, ArrowLeft, Eye, ExternalLink,
    Trash2, Edit, Check, Bookmark, Trophy, Info, ChevronDown, ChevronLeft, ChevronRight,
    SlidersHorizontal, RotateCcw, CheckCircle2, AlertCircle, ArrowUpDown, UserCheck
} from 'lucide-react';
import { logAcademicActivity } from '../utils/academicStreak';

const AskFinderPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
    const { isDark } = useTheme();
    const isLightMode = !isDark;
    const theme = isDark ? 'dark' : 'light';

    // Filters Collapsed / Enclosed state
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Layout & branch state
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
        branchOverride || 'ALL'
    );

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
    const [adminViewAll, setAdminViewAll] = useState(false);

    // Derive student academic scope (Branch & Year Level) from user profile / USN
    const studentScope = useMemo(() => deriveStudentScope(user), [user]);

    // Active scope (locked to student branch & year unless admin specifically overrides)
    const isEnforcingScope = studentScope.isScoped && (!user?.isAdmin || !adminViewAll);
    const activeBranch = isEnforcingScope ? studentScope.branch : currentBranch;
    const activeYearLevel = isEnforcingScope ? studentScope.yearLevel : selectedYearLevel;

    // Data state
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [paperTypes, setPaperTypes] = useState([]);
    const [searchSummary, setSearchSummary] = useState({ total: 0, notes: 0, see: 0, internals: 0, others: 0 });

    // CSES-style Pagination
    const ITEMS_PER_PAGE = 20;
    const [currentPage, setCurrentPage] = useState(1);
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

    useEffect(() => {
        // Fetch metadata, leaderboard & initial documents concurrently on mount
        fetchMetadata();
        fetchLeaderboard();
        handleSearch(true);
        logAcademicActivity({ type: 'ask_plus', label: 'Used Ask+' });

        // Cross-tab and window-focus live sync with Admin Panel
        let bc;
        try {
            bc = new BroadcastChannel('askursenior_materials_sync');
            bc.onmessage = (event) => {
                if (event.data?.type === 'MATERIAL_UPDATED') {
                    handleSearch(false);
                }
            };
        } catch (e) {}

        const handleStorage = (e) => {
            if (e.key === 'materials_last_updated') {
                handleSearch(false);
            }
        };
        const handleFocus = () => {
            handleSearch(false);
        };
        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);

        return () => {
            try { bc?.close(); } catch (e) {}
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const inputRef = useRef(null);

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

    // Ultra-smart multi-term & substring search matcher
    const smartSearchMatch = (field, query) => {
        if (!field || !query) return false;
        const str = String(field).toLowerCase();
        const q = String(query).toLowerCase().trim();
        if (!q) return true;

        // Direct substring match
        if (str.includes(q)) return true;

        // Clean match (ignore punctuation / spaces)
        const cleanStr = str.replace(/[^a-z0-9]/g, '');
        const cleanQ = q.replace(/[^a-z0-9]/g, '');
        if (cleanQ && cleanStr.includes(cleanQ)) return true;

        // Multi-word match (e.g. "maths pyq" -> checks if all words exist)
        const words = q.split(/\s+/).filter(Boolean);
        if (words.length > 1) {
            return words.every(w => {
                const cleanW = w.replace(/[^a-z0-9]/g, '');
                return str.includes(w) || (cleanW && cleanStr.includes(cleanW));
            });
        }

        return false;
    };


    // Semester match helper
    const isSemesterMatch = (doc, targetSem) => {
        if (!targetSem) return true;
        const targetNum = targetSem.replace(/[^0-9]/g, '');
        const docSemNum = String(doc.semester || '').replace(/[^0-9]/g, '');
        if (docSemNum && targetNum && docSemNum === targetNum) return true;
        return String(doc.semester || '').toLowerCase().includes(targetSem.toLowerCase());
    };

    // Context-Filtered Documents (matches all filters EXCEPT document type tab, used for stable tab counts)
    const contextFilteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            // Bookmarks filter
            if (bookmarksOnly) {
                const isBookmarked = Array.isArray(user?.bookmarks) && user.bookmarks.includes(doc._id);
                if (!isBookmarked) return false;
            }

            // Year Level filter (strictly enforced to student's year level when scoped)
            if (activeYearLevel && !isYearMatch(doc, activeYearLevel)) {
                return false;
            }

            // Branch filter (strictly enforced to student's branch + Common when scoped)
            if (activeBranch && activeBranch !== 'ALL') {
                if (!isBranchMatch(doc.branch, activeBranch, activeYearLevel)) {
                    return false;
                }
            }

            // Semester filter
            if (selectedSubSemester && !isSemesterMatch(doc, selectedSubSemester)) {
                return false;
            }

            // Subject filter
            if (selectedSubject && doc.subjectName !== selectedSubject) {
                return false;
            }

            // Text search query
            if (searchQuery.trim()) {
                const q = searchQuery.trim();
                const typeAliases = doc.documentType === 'see' ? 'pyq pyqs previous year question paper see exam'
                    : doc.documentType === 'notes' ? 'notes note study material'
                    : doc.documentType === 'internals' ? 'internals internal cie test'
                    : 'others other syllabus assignment';

                const combined = [
                    doc.subjectName || '',
                    doc.subjectCode || '',
                    doc.originalName || '',
                    doc.fileName || '',
                    doc.documentType || '',
                    typeAliases,
                    doc.tags || '',
                    doc.moduleInfo || '',
                    doc.semester || '',
                    doc.yearLevel || '',
                    doc.branch || '',
                    doc.contributor?.name || ''
                ].join(' ');

                if (!smartSearchMatch(combined, q)) {
                    return false;
                }
            }

            return true;
        });
    }, [documents, bookmarksOnly, user?.bookmarks, activeYearLevel, activeBranch, selectedSubSemester, selectedSubject, searchQuery]);

    // Live Contextual Tab Counts (stays stable when switching tabs)
    const tabCounts = useMemo(() => {
        const base = contextFilteredDocuments;
        return {
            all: base.length,
            notes: base.filter(d => d.documentType === 'notes').length,
            see: base.filter(d => d.documentType === 'see').length,
            internals: base.filter(d => d.documentType === 'internals').length,
            others: base.filter(d => d.documentType === 'others').length
        };
    }, [contextFilteredDocuments]);

    // Final Filtered Documents (tab filter + status + sort)
    const filteredDocuments = useMemo(() => {
        return contextFilteredDocuments.filter(doc => {
            // Document Type Tab
            if (selectedDocType) {
                if (selectedDocType === 'others') {
                    if (doc.documentType === 'notes' || doc.documentType === 'see' || doc.documentType === 'internals') {
                        return false;
                    }
                } else if (doc.documentType !== selectedDocType) {
                    return false;
                }
            }

            // Admin Status filter
            if (statusFilter === 'pending' && doc.isApproved) return false;
            if (statusFilter === 'approved' && !doc.isApproved) return false;

            return true;
        }).sort((a, b) => {
            if (sortBy === 'most-downloaded') return (b.downloadCount || 0) - (a.downloadCount || 0);
            if (sortBy === 'recently-updated') return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
            // Default newest
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [contextFilteredDocuments, selectedDocType, statusFilter, sortBy]);

    const totalCount = filteredDocuments.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

    const paginatedDocuments = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredDocuments.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredDocuments, currentPage]);

    // Semesters list derived from active year level
    const availableSemesters = useMemo(() => {
        const yl = activeYearLevel || selectedYearLevel;
        if (yl === '1st Year') return ['1st Sem', '2nd Sem'];
        if (yl === '2nd Year') return ['3rd Sem', '4th Sem'];
        if (yl === '3rd Year') return ['5th Sem', '6th Sem'];
        if (yl === '4th Year') return ['7th Sem', '8th Sem'];
        return ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'];
    }, [activeYearLevel, selectedYearLevel]);

    // Dynamic Filtered Academic Subjects derived from both MongoDB canonical subjects & loaded materials
    const availableSubjects = useMemo(() => {
        const subjectMap = new Map();

        const isNonSubject = (name) => {
            if (!name || typeof name !== 'string') return true;
            const n = name.trim().toLowerCase();
            return !n || n === 'general' || n === '—' || n === '-' || /course\s*material/i.test(n) || /link/i.test(n);
        };

        // 1. Add canonical subjects from API
        (subjects || []).forEach(s => {
            if (s.name && !isNonSubject(s.name)) {
                const normName = s.name.trim();
                const code = (s.code && s.code !== '—' && s.code !== '-') ? s.code.trim() : '';
                const key = code ? `${normName.toLowerCase()}::${code.toLowerCase()}` : normName.toLowerCase();
                subjectMap.set(key, {
                    name: normName,
                    code,
                    branch: s.branch || '',
                    year: s.year || ''
                });
            }
        });

        // 2. Add subjects from loaded documents
        (documents || []).forEach(doc => {
            const name = (doc.subjectName || '').trim();
            const code = (doc.subjectCode && doc.subjectCode !== '—' && doc.subjectCode !== '-') ? doc.subjectCode.trim() : '';
            const key = code ? `${name.toLowerCase()}::${code.toLowerCase()}` : name.toLowerCase();
            if (name && !isNonSubject(name) && !subjectMap.has(key)) {
                subjectMap.set(key, {
                    name: doc.subjectName.trim(),
                    code,
                    branch: doc.branch || '',
                    year: doc.yearLevel || doc.semester || ''
                });
            }
        });

        let list = Array.from(subjectMap.values());

        // Filter by active year level if active
        if (activeYearLevel) {
            const selNum = activeYearLevel.replace(/[^0-9]/g, '');
            list = list.filter(s => {
                if (!s.year || s.year === 'N/A') return false;
                const sYearStr = String(s.year).toLowerCase();
                const sNum = sYearStr.replace(/[^0-9]/g, '');
                return sNum === selNum || sYearStr.includes(activeYearLevel.toLowerCase());
            });
        }

        // Filter by active branch if active and not 1st Year
        if (activeBranch && activeBranch !== 'ALL' && activeYearLevel !== '1st Year') {
            const curB = toBackendBranch(activeBranch);
            list = list.filter(s => {
                if (!s.branch || s.branch === 'Common' || s.branch === 'COMMON' || s.branch === 'ALL') return true;
                const sB = toBackendBranch(s.branch);
                return sB === curB || s.branch === 'Common' || s.branch === 'COMMON';
            });
        }

        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [subjects, documents, activeYearLevel, activeBranch]);

    const handleBranchOverrideChange = (nextBranch) => {
        const value = (nextBranch || '').toString();
        setBranchOverride(value);
        try {
            if (value && value !== 'ALL') localStorage.setItem('branchOverride', value);
            else localStorage.removeItem('branchOverride');
        } catch { }
        if (value) setCurrentBranch(value);
    };

    const fetchMetadata = async () => {
        try {
            const subjectsRes = await apiClient.get('/documents/subjects');
            if (Array.isArray(subjectsRes.data)) {
                setSubjects(subjectsRes.data);
            }
        } catch (error) {
            console.warn('Failed to fetch subjects metadata:', error);
            setSubjects([]);
        }
    };

    const handleSearch = async (showLoadingSpinner = true) => {
        if (showLoadingSpinner && documents.length === 0) {
            setLoading(true);
        }
        try {
            // Load full set of materials for instant zero-latency client filtering
            const res = await apiClient.get('/documents/search');
            const docs = res.data.documents || res.data || [];
            setDocuments(docs);
            if (res.data.summary) {
                setSearchSummary(res.data.summary);
            }
        } catch (error) {
            console.error('Search failed:', error);
            if (documents.length === 0) setDocuments([]);
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

            alert('Thank you! Your contributions have been submitted for admin approval.');
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
        setBookmarksOnly(false);
        setCurrentBranch('ALL');
        setBranchOverride('');
        try { localStorage.removeItem('branchOverride'); } catch {}
        setCurrentPage(1);
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

    if (authLoading) return <div className="min-h-screen bg-[#fbfbfb] dark:bg-[#0a0a0b]" />;

    return (
        <div className="min-h-screen bg-[#fbfbfb] dark:bg-[#0a0a0b] text-gray-900 dark:text-zinc-100 font-sans flex flex-col pt-6 pb-16 transition-colors duration-150">
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {/* 1. Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-gray-200 dark:border-zinc-800">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                            Materials
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                            Browse notes, question papers, internals and other academic resources.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={() => {
                                if (!isAuthenticated) setShowLoginModal(true);
                                else {
                                    setBookmarksOnly(!bookmarksOnly);
                                    setCurrentPage(1);
                                }
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                                bookmarksOnly
                                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                            }`}
                            title="View Bookmarked Materials"
                        >
                            <Bookmark size={13} className={bookmarksOnly ? 'fill-current' : ''} />
                            <span>Saved</span>
                        </button>
                        <button
                            onClick={() => setShowLeaderboardModal(true)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                            title="View Leaderboard"
                        >
                            <Trophy size={13} className="text-amber-500" />
                            <span>Leaderboard</span>
                        </button>
                        <button
                            onClick={() => {
                                if (!isAuthenticated) setShowLoginModal(true);
                                else setShowUploadModal(true);
                            }}
                            className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                            <Upload size={13} />
                            <span>Contribute</span>
                        </button>
                    </div>
                </div>

                {/* 2. Integrated Search Bar */}
                <div className="relative mb-4">
                    <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); }} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500">
                            <Search size={16} />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search materials by title, subject or keyword..."
                            className="w-full text-xs sm:text-sm rounded-lg pl-9 pr-16 py-2.5 outline-none transition-colors border bg-white dark:bg-[#121316] border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-500"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center gap-1.5">
                            {searchQuery ? (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                                >
                                    <X size={14} />
                                </button>
                            ) : (
                                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500">
                                    /
                                </kbd>
                            )}
                        </div>
                    </form>
                </div>

                {/* 3. Segmented Navigation & Filters Toolbar */}
                <div className="space-y-3 mb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Segmented Type Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                            {[
                                { id: '', label: 'All', count: tabCounts.all },
                                { id: 'notes', label: 'Notes', count: tabCounts.notes },
                                { id: 'see', label: 'PYQs', count: tabCounts.see },
                                { id: 'internals', label: 'Internals', count: tabCounts.internals },
                                { id: 'others', label: 'Others', count: tabCounts.others }
                            ].map((tab) => {
                                const isActive = selectedDocType === tab.id;
                                return (
                                    <button
                                        key={tab.label}
                                        type="button"
                                        onClick={() => { setSelectedDocType(tab.id); setCurrentPage(1); }}
                                        className={`group px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 border cursor-pointer select-none ${
                                            isActive
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-semibold'
                                                : 'bg-white dark:bg-[#121316] border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/80 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-700 active:scale-[0.98]'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors ${
                                            isActive
                                                ? 'bg-blue-700 text-white'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700 group-hover:text-gray-900 dark:group-hover:text-zinc-200'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Filter Controls */}
                        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                            {/* Academic Scope Badge when student scope is active */}
                            {isEnforcingScope && (
                                <div
                                    className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 flex items-center gap-1.5 select-none"
                                    title={`Enforcing academic scope: ${activeBranch} (${activeYearLevel})`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                                    <span>{activeBranch} · {activeYearLevel}</span>
                                </div>
                            )}

                            {/* Subject Filter Dropdown */}
                            <select
                                value={selectedSubject}
                                onChange={(e) => { setSelectedSubject(e.target.value); setCurrentPage(1); }}
                                aria-label="Filter by subject"
                                className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121316] text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer max-w-[170px] sm:max-w-[220px] truncate"
                            >
                                <option value="">All Subjects ({availableSubjects.length})</option>
                                {availableSubjects.map((s, i) => {
                                    const hasCode = s.code && s.code !== '—' && s.code !== '-' && s.code.trim() !== '';
                                    const label = hasCode ? `${s.name} (${s.code})` : s.name;
                                    return (
                                        <option key={`sub-bar-${i}`} value={s.name}>{label}</option>
                                    );
                                })}
                            </select>

                            {/* Admin view toggle */}
                            {user?.isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAdminViewAll(!adminViewAll);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                                        adminViewAll
                                            ? 'border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30'
                                            : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                                    title="Toggle between student branch scope and all branches"
                                >
                                    {adminViewAll ? 'Admin: All Branches' : 'Scope: My Branch'}
                                </button>
                            )}

                            {(searchQuery || selectedSubject || selectedDocType || bookmarksOnly) && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="p-1.5 rounded-md border border-gray-200 dark:border-zinc-800 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                    title="Reset All Filters"
                                    aria-label="Reset all filters"
                                >
                                    <RotateCcw size={13} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Materials Structured CSES Table */}
                <div className="border border-gray-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#121316] overflow-hidden shadow-xs">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={`sk-${i}`} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800/60 last:border-0 animate-pulse">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-8 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                                        <div className="space-y-1.5 flex-1 max-w-md">
                                            <div className="w-3/4 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                                            <div className="w-1/2 h-3 bg-gray-100 dark:bg-zinc-800/60 rounded" />
                                        </div>
                                    </div>
                                    <div className="w-24 h-4 bg-gray-100 dark:bg-zinc-800/60 rounded hidden sm:block" />
                                    <div className="w-16 h-4 bg-gray-100 dark:bg-zinc-800/60 rounded" />
                                    <div className="w-28 h-6 bg-gray-200 dark:bg-zinc-800 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-200">No materials found</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                                Try adjusting your search query, branch or clearing filters.
                            </p>
                            <button
                                onClick={resetFilters}
                                className="mt-4 px-4 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/75 dark:bg-[#151619] text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                                            <th className="py-2.5 px-4">Material</th>
                                            <th className="py-2.5 px-4 w-44">Subject</th>
                                            <th className="py-2.5 px-3 w-24 text-center">Sem</th>
                                            <th className="py-2.5 px-3 w-24 text-center">Type</th>
                                            <th className="py-2.5 px-4 w-48 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                                        {paginatedDocuments.map((doc, idx) => {
                                            const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                                            const isBookmarked = Array.isArray(user?.bookmarks) && user.bookmarks.includes(doc._id);
                                            const typeLabel = doc.documentType === 'notes' ? 'Notes' : doc.documentType === 'see' ? 'PYQ' : doc.documentType === 'internals' ? 'Internal' : (doc.materialType || 'Other');

                                            return (
                                                <tr key={doc._id} className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/35 transition-colors group">
                                                    <td className="py-3 px-3 text-center text-gray-400 dark:text-zinc-500 font-mono text-[11px]">
                                                        {rowNum}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <span
                                                                onClick={() => handlePreview(doc._id)}
                                                                className="font-medium text-gray-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors text-sm truncate max-w-md"
                                                                title={doc.title || doc.originalName || doc.fileName}
                                                            >
                                                                {doc.title || doc.originalName || doc.fileName}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 dark:text-zinc-400">
                                                                <span className="font-medium text-gray-700 dark:text-zinc-300">{formatSize(doc.fileSize)}</span>
                                                                <span>·</span>
                                                                <span title={formatFullDate(doc.createdAt)}>Uploaded {getTimeAgo(doc.createdAt)}</span>
                                                                {doc.uploadedBy?.name && (
                                                                    <>
                                                                        <span>·</span>
                                                                        <span className="truncate max-w-[120px]" title={`Uploaded by ${doc.uploadedBy.name}`}>by {doc.uploadedBy.name}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-[11px] font-medium text-gray-700 dark:text-zinc-300">
                                                                {doc.subjectCode || '—'}
                                                            </span>
                                                            <span className="text-[11px] text-gray-500 dark:text-zinc-400 truncate max-w-[160px]" title={doc.subjectName}>
                                                                {doc.subjectName || 'General'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-center text-gray-600 dark:text-zinc-400 font-medium">
                                                        {doc.semester || doc.yearLevel || '—'}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200 dark:border-zinc-800 bg-gray-100/70 dark:bg-zinc-800/60 text-gray-700 dark:text-zinc-300">
                                                            {typeLabel}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleBookmark(doc._id)}
                                                                className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${
                                                                    isBookmarked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600'
                                                                }`}
                                                                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                                                            >
                                                                <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} />
                                                            </button>
                                                            <button
                                                                onClick={() => handlePreview(doc._id)}
                                                                className="px-2.5 py-1 rounded text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 transition-colors"
                                                            >
                                                                Preview
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownload(doc._id)}
                                                                className="px-2.5 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors flex items-center gap-1 shadow-xs"
                                                            >
                                                                <Download size={12} />
                                                                <span>Download</span>
                                                            </button>
                                                            {user?.isAdmin && (
                                                                <button
                                                                    onClick={() => { setEditingDoc(doc); setShowEditModal(true); }}
                                                                    className="p-1 rounded text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                                                                    title="Edit Material"
                                                                >
                                                                    <Edit size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile List View */}
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-zinc-800/60">
                                {paginatedDocuments.map((doc, idx) => {
                                    const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                                    const isBookmarked = Array.isArray(user?.bookmarks) && user.bookmarks.includes(doc._id);
                                    const typeLabel = doc.documentType === 'notes' ? 'Notes' : doc.documentType === 'see' ? 'PYQ' : doc.documentType === 'internals' ? 'Internal' : (doc.materialType || 'Other');

                                    return (
                                        <div key={doc._id} className="p-3.5 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                    <span className="text-[11px] font-mono text-gray-400 dark:text-zinc-500 mt-0.5">#{rowNum}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <h3
                                                            onClick={() => handlePreview(doc._id)}
                                                            className="text-xs font-semibold text-gray-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer line-clamp-2"
                                                        >
                                                            {doc.title || doc.originalName || doc.fileName}
                                                        </h3>
                                                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                                                            {doc.subjectCode ? `${doc.subjectCode} · ` : ''}{doc.subjectName || 'General'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleBookmark(doc._id)}
                                                    className={`p-1.5 rounded ${isBookmarked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500'}`}
                                                >
                                                    <Bookmark size={15} className={isBookmarked ? 'fill-current' : ''} />
                                                </button>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 dark:text-zinc-400">
                                                <span className="px-1.5 py-0.2 rounded border border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 font-medium text-[10px]">
                                                    {typeLabel}
                                                </span>
                                                <span>·</span>
                                                <span className="font-medium text-gray-700 dark:text-zinc-300">{formatSize(doc.fileSize)}</span>
                                                <span>·</span>
                                                <span title={formatFullDate(doc.createdAt)}>Uploaded {getTimeAgo(doc.createdAt)}</span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1.5">
                                                <button
                                                    onClick={() => handlePreview(doc._id)}
                                                    className="flex-1 py-1.5 rounded text-xs font-medium text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-center transition-colors"
                                                >
                                                    Preview
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(doc._id)}
                                                    className="flex-1 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white text-center flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <Download size={12} />
                                                    <span>Download</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 5. Pagination Bar */}
                            <div className="border-t border-gray-200 dark:border-zinc-800 px-4 py-3 bg-gray-50/60 dark:bg-[#151619] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                                <span className="text-gray-500 dark:text-zinc-400">
                                    Showing <span className="font-medium text-gray-900 dark:text-zinc-200">{totalCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-medium text-gray-900 dark:text-zinc-200">{totalCount}</span>
                                </span>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={currentPage === 1}
                                        className="px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ← Prev
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .reduce((acc, p, idx, arr) => {
                                            if (idx > 0 && p - arr[idx - 1] > 1) {
                                                acc.push('...');
                                            }
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((item, idx) => {
                                            if (item === '...') {
                                                return <span key={`dots-${idx}`} className="px-1 text-gray-400">…</span>;
                                            }
                                            const isCurrent = item === currentPage;
                                            return (
                                                <button
                                                    key={`p-${item}`}
                                                    onClick={() => { setCurrentPage(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                    className={`min-w-7 h-7 px-2 rounded text-xs font-medium transition-colors ${
                                                        isCurrent
                                                            ? 'bg-blue-600 text-white font-semibold'
                                                            : 'border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    {item}
                                                </button>
                                            );
                                        })}

                                    <button
                                        onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={currentPage === totalPages}
                                        className="px-2.5 py-1 rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
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
                                Contribute Material
                                <span className="ml-3 text-xs opacity-50 font-normal">Step {uploadStep}/2</span>
                            </h2>
                            <button onClick={() => { setShowUploadModal(false); resetUploadForm(); }} className={`p-2 rounded-full transition-colors ${isLightMode ? 'hover:bg-slate-100/80 text-slate-500' : 'hover:bg-white/10 text-slate-400'}`}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); if (uploadStep === 1) setUploadStep(2); else handleUpload(e); }}>
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
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
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
                                                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
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
                                                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
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
                                                    const sub = subjects.find(s => s.name === e.target.value);
                                                    setUploadMetadata({
                                                        ...uploadMetadata,
                                                        subjectName: e.target.value,
                                                        subjectCode: sub?.code || ''
                                                    });
                                                }}
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
                                            >
                                                <option value="">Select Subject</option>
                                                <option value="General">General (Multiple Subjects/Papers)</option>

                                                {subjects.filter(s => {
                                                    // 1. Filter by Year Level if selected
                                                    if (uploadMetadata.yearLevel) {
                                                        const yearMap = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4 };
                                                        const targetYear = yearMap[uploadMetadata.yearLevel];
                                                        if (s.year !== undefined && s.year !== targetYear) return false;
                                                    }
                                                    // 2. Filter by Branch if selected (and not 1st Year)
                                                    if (uploadMetadata.yearLevel !== '1st Year' && uploadMetadata.branch) {
                                                        const targetBranch = toBackendBranch(uploadMetadata.branch);
                                                        if (s.branch && s.branch !== targetBranch && s.branch.toUpperCase() !== 'COMMON') return false;
                                                    }
                                                    // 3. Filter by Semester if selected
                                                    if (uploadMetadata.semester) {
                                                        const targetSemNum = parseInt(uploadMetadata.semester.replace(/[^0-9]/g, ''), 10);
                                                        if (s.semester && s.semester !== targetSemNum) return false;
                                                    }
                                                    return true;
                                                }).map((s, i) => (
                                                    <option key={`sub-${i}`} value={s.name}>{s.name} ({s.code})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Subject Code</label>
                                            <input
                                                type="text" value={uploadMetadata.subjectCode}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, subjectCode: e.target.value })}
                                                placeholder="e.g. 21CS41"
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-5">
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
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
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 appearance-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
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
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Module Info</label>
                                            <input
                                                type="text" value={uploadMetadata.moduleInfo}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, moduleInfo: e.target.value })}
                                                placeholder="e.g., Module 2, M1-M3"
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Page Count</label>
                                            <input
                                                type="number" value={uploadMetadata.pageCount}
                                                onChange={(e) => setUploadMetadata({ ...uploadMetadata, pageCount: e.target.value })}
                                                placeholder="Optional"
                                                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold mb-2">Tags (comma-separated)</label>
                                        <input
                                            type="text" value={uploadMetadata.tags}
                                            onChange={(e) => setUploadMetadata({ ...uploadMetadata, tags: e.target.value })}
                                            placeholder="e.g., tcp, routing, important"
                                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-[#0a0a0b] border-white/10 focus:ring-blue-500/50 focus:border-blue-500'}`}
                                        />
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold mb-2">Select Files (PDF, ZIP, 7z) *</label>
                                        <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-colors ${isLightMode ? 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/60' : 'border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50'}`}>
                                            <input
                                                type="file" required multiple
                                                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
                                                accept=".pdf,.zip,.7z"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="text-center pointer-events-none flex flex-col items-center justify-center gap-2">
                                                <Upload className="text-blue-600 dark:text-blue-400 mb-1" size={24} />
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
                                                    <span key={i} className={`text-[10px] px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 truncate max-w-[150px]`}>
                                                        {f.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Contributor Section */}
                                    <div className={`mt-6 mb-8 p-5 rounded-2xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-900/40 border-zinc-800'}`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-lg bg-blue-600 text-white">
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
                                                    className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all border ${uploadMetadata.showContributorName === val
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
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
                                                        className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#0a0a0b] border-zinc-800'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Year</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 3rd Year"
                                                        value={uploadMetadata.contributorYear}
                                                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, contributorYear: e.target.value }))}
                                                        className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#0a0a0b] border-zinc-800'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase opacity-60 mb-2">Branch</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. CS / AI&DS"
                                                        value={uploadMetadata.contributorBranch}
                                                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, contributorBranch: e.target.value }))}
                                                        className={`w-full px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#0a0a0b] border-zinc-800'}`}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {!user?.usn && (
                                            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
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
                                                    className={`w-full px-4 py-3 text-sm font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#0a0a0b] border-zinc-800'}`}
                                                />
                                                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 font-medium">This will be linked to your account for all future contributions.</p>
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
                                            className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
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
                    <div className={`relative w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl overflow-hidden border shadow-2xl
                        ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#0f0f12] border-white/10'}`}
                    >
                        {/* Header */}
                        <div className={`p-4 flex justify-between items-center border-b ${isLightMode ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                            <div className="items-center gap-3 hidden sm:flex">
                                <div className={`p-2 rounded-lg ${isLightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-950/40 text-blue-400'}`}>
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
                                        className={`${isLightMode ? 'bg-blue-50/60 border-b border-blue-100 text-slate-700' : 'bg-blue-950/20 border-b border-blue-900/30 text-slate-300'} overflow-hidden`}
                                    >
                                        <div className="p-5 text-sm">
                                            <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                <Info size={14} /> Scoring Rules
                                            </h3>
                                            <ul className="space-y-1.5 text-xs opacity-80">
                                                <li>• Every uploaded material earns <span className="font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">10 points</span></li>
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
                                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
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
                                                                className={`transition-colors ${isCurrentUser ? (isLightMode ? 'bg-blue-50' : 'bg-blue-950/20') : (isLightMode ? 'hover:bg-white' : 'hover:bg-white/5')}`}
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
                                                                    <span className={`text-xs font-bold ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : (isLightMode ? 'text-slate-700' : 'text-slate-300')}`}>
                                                                        {row.usn}
                                                                        {isCurrentUser && <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase font-bold">You</span>}
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
                                <div className={`p-4 sm:p-5 flex justify-between items-center px-6 sm:px-8 border-t ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs bg-blue-600 text-white">
                                            {(() => {
                                                const rank = leaderboardData.findIndex(r => r.usn === user.usn);
                                                return rank !== -1 ? `#${rank + 1}` : '-';
                                            })()}
                                        </div>
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase leading-none mb-1 ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>Your Ranking</p>
                                            <p className={`text-xs font-black leading-none ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{user.usn}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[10px] font-bold uppercase leading-none mb-1 ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>Current Score</p>
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
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                                        <Edit size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-bold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Edit Material</h3>
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
                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Subject Name</label>
                                        <input
                                            type="text"
                                            value={editingDoc.subjectName}
                                            onChange={(e) => setEditingDoc({ ...editingDoc, subjectName: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="e.g. Mathematics"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Subject Code</label>
                                        <input
                                            type="text"
                                            value={editingDoc.subjectCode}
                                            onChange={(e) => setEditingDoc({ ...editingDoc, subjectCode: e.target.value.toUpperCase() })}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="e.g. 21MAT31"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Document Type</label>
                                        <select
                                            value={editingDoc.documentType}
                                            onChange={(e) => setEditingDoc({ ...editingDoc, documentType: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                        >
                                            <option value="notes">Notes</option>
                                            <option value="see">SEE (Semester End)</option>
                                            <option value="internals">Internals</option>
                                            <option value="others">Others</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Semester</label>
                                        <input
                                            type="text"
                                            value={editingDoc.semester}
                                            onChange={(e) => setEditingDoc({ ...editingDoc, semester: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="e.g. 3rd Sem"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Year Level</label>
                                        <input
                                            type="text"
                                            value={editingDoc.yearLevel}
                                            onChange={(e) => setEditingDoc({ ...editingDoc, yearLevel: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="e.g. 2nd Year"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">File Display Name</label>
                                        <input
                                            type="text"
                                            value={editingDoc.title || editingDoc.originalName || ''}
                                            onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value, originalName: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'}`}
                                            placeholder="FileName.pdf"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className={`p-6 border-t flex items-center gap-3 ${isLightMode ? 'bg-slate-50' : 'bg-white/[0.02] border-white/5'}`}>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${isLightMode ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsSaving(true);
                                        try {
                                            const newTitle = (editingDoc.title || editingDoc.originalName || '').trim();
                                            await apiClient.patch(`/documents/${editingDoc._id}`, {
                                                title: newTitle,
                                                originalFileName: newTitle,
                                                documentType: editingDoc.documentType,
                                                semester: editingDoc.semester,
                                                yearLevel: editingDoc.yearLevel
                                            });

                                            setDocuments(prev => prev.map(d => d._id === editingDoc._id ? {
                                                ...d,
                                                title: newTitle,
                                                originalName: newTitle,
                                                originalFileName: newTitle,
                                                fileName: newTitle,
                                                documentType: editingDoc.documentType,
                                                semester: editingDoc.semester,
                                                yearLevel: editingDoc.yearLevel
                                            } : d));

                                            setShowEditModal(false);
                                        } catch (err) {
                                            console.error("Save failed, attempting userUpload fallback", err);
                                            try {
                                                await userUploadAPI.updateUpload(editingDoc._id, {
                                                    subjectName: editingDoc.subjectName,
                                                    subjectCode: editingDoc.subjectCode,
                                                    documentType: editingDoc.documentType,
                                                    semester: editingDoc.semester,
                                                    yearLevel: editingDoc.yearLevel,
                                                    originalName: editingDoc.title || editingDoc.originalName
                                                });
                                                handleSearch();
                                                setShowEditModal(false);
                                            } catch (fallbackErr) {
                                                console.error("Fallback failed", fallbackErr);
                                                alert("Failed to update document");
                                            }
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import { apiClient, notificationAPI, subjectAPI, uploadAPI, userUploadAPI } from '../services/api';

const Sidebar = ({
    currentBranch,
    cycle,
    showProfile,
    onProfileClick,
    subjectSearch,
    onSubjectSearchChange,
    isCollapsed,
    onCollapsedChange
}) => {
    const navigate = useNavigate();
    const { user, logout, updateUser } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackError, setFeedbackError] = useState('');
    const [feedbackStats, setFeedbackStats] = useState({ total: 0, avgRating: 0 });
    const [latestFeedback, setLatestFeedback] = useState(null);
    const [feedbackMetaLoading, setFeedbackMetaLoading] = useState(false);

    const [showBugModal, setShowBugModal] = useState(false);
    const [bugTitle, setBugTitle] = useState('');
    const [bugDescription, setBugDescription] = useState('');
    const [bugSubmitting, setBugSubmitting] = useState(false);
    const [bugError, setBugError] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [showAdminUploadModal, setShowAdminUploadModal] = useState(false);
    const [showUserUploadModal, setShowUserUploadModal] = useState(false);

    const [adminSubjects, setAdminSubjects] = useState([]);
    const [adminSubjectsLoading, setAdminSubjectsLoading] = useState(false);
    const [adminUploadLoading, setAdminUploadLoading] = useState(false);
    const [adminUploadError, setAdminUploadError] = useState('');
    const [adminSubjectId, setAdminSubjectId] = useState('');
    const [adminContentType, setAdminContentType] = useState('');
    const [adminFiles, setAdminFiles] = useState([]);
    const [adminUploadProgress, setAdminUploadProgress] = useState(0);
    const [adminUploadFileIndex, setAdminUploadFileIndex] = useState(0);
    const [adminUploadFileTotal, setAdminUploadFileTotal] = useState(0);

    const [userSubjects, setUserSubjects] = useState([]);
    const [userSubjectsLoading, setUserSubjectsLoading] = useState(false);
    const [userUploadLoading, setUserUploadLoading] = useState(false);
    const [userUploadError, setUserUploadError] = useState('');
    const [userSubjectCode, setUserSubjectCode] = useState('');
    const [userContentType, setUserContentType] = useState('');
    const [userFiles, setUserFiles] = useState([]);
    const [userUploadProgress, setUserUploadProgress] = useState(0);
    const [userUploadFileIndex, setUserUploadFileIndex] = useState(0);
    const [userUploadFileTotal, setUserUploadFileTotal] = useState(0);

    // Fetch notifications from backend
    const fetchNotifications = useCallback(async () => {
        try {
            setNotificationsLoading(true);
            const response = await notificationAPI.getNotifications(currentBranch, cycle, 30);
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // Fallback to empty array on error
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setNotificationsLoading(false);
        }
    }, [currentBranch, cycle]);

    // Fetch notifications on mount and when branch/cycle changes
    useEffect(() => {
        fetchNotifications();
        // Set up polling for new notifications every 2 minutes
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead(currentBranch, cycle);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem('uiTheme');
            return saved === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('uiTheme', theme);
            window.dispatchEvent(new Event('uiThemeChange'));
        } catch {
            // ignore
        }
    }, [theme]);

    const isLightMode = theme === 'light';

    const sidebarClasses = useMemo(() => {
        if (isLightMode) {
            return {
                shell: 'bg-white text-slate-700',
                border: 'border-slate-200',
                panel: 'bg-slate-50',
                panelHover: 'hover:bg-slate-100',
                title: 'text-slate-900',
                accent: 'text-purple-700',
                accentHover: 'hover:text-purple-800',
                itemHover: 'hover:bg-slate-100'
            };
        }
        return {
            shell: 'bg-primary-900 text-secondary-500',
            border: 'border-primary-700',
            panel: 'bg-dark-100',
            panelHover: 'hover:bg-dark-50',
            title: 'text-secondary-100',
            accent: 'text-primary-600',
            accentHover: 'hover:text-primary-500',
            itemHover: 'hover:bg-dark-100'
        };
    }, [isLightMode]);

    const closeFeedbackModal = () => {
        setShowFeedbackModal(false);
        setFeedbackSubmitting(false);
        setFeedbackError('');
    };

    const loadFeedbackMeta = async () => {
        setFeedbackMetaLoading(true);
        try {
            const [statsRes, latestRes] = await Promise.all([
                apiClient.get('/feedback/stats'),
                apiClient.get('/feedback/me/latest')
            ]);
            setFeedbackStats(statsRes?.data?.stats || { total: 0, avgRating: 0 });
            setLatestFeedback(latestRes?.data?.item || null);
        } catch {
            // ignore
        } finally {
            setFeedbackMetaLoading(false);
        }
    };

    const closeBugModal = () => {
        setShowBugModal(false);
        setBugSubmitting(false);
        setBugError('');
    };

    const submitFeedback = async () => {
        if (!feedbackRating || feedbackSubmitting) return;
        setFeedbackSubmitting(true);
        setFeedbackError('');
        try {
            await apiClient.post('/feedback', {
                rating: feedbackRating,
                message: feedbackMessage?.trim() ? feedbackMessage.trim() : undefined
            });
            setFeedbackRating(0);
            setFeedbackMessage('');
            await loadFeedbackMeta();
            closeFeedbackModal();
        } catch (e) {
            setFeedbackError(e?.response?.data?.error || 'Failed to submit feedback');
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const submitBug = async () => {
        if (!bugTitle.trim() || !bugDescription.trim() || bugSubmitting) return;
        setBugSubmitting(true);
        setBugError('');
        try {
            await apiClient.post('/bugs', {
                title: bugTitle.trim(),
                description: bugDescription.trim(),
                pageUrl: window.location.href
            });
            setBugTitle('');
            setBugDescription('');
            closeBugModal();
        } catch (e) {
            setBugError(e?.response?.data?.error || 'Failed to submit bug report');
        } finally {
            setBugSubmitting(false);
        }
    };


    const loadAdminSubjects = async () => {
        if (!user?.isAdmin) return;
        setAdminSubjectsLoading(true);
        setAdminUploadError('');
        try {
            const allBranches = ['CS', 'IS', 'EC', 'EE', 'ME', 'CV', 'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT', 'CI', 'BT', 'IM', 'CH', 'ET', 'EI'];
            const cycles = ['P', 'C'];
            const promises = [];
            for (const branch of allBranches) {
                for (const cycleCode of cycles) {
                    promises.push(
                        subjectAPI.getSubjectsByBranch(branch, cycleCode)
                            .then((response) => ({ branch, cycle: cycleCode, subjects: response.data || [] }))
                            .catch(() => ({ branch, cycle: cycleCode, subjects: [] }))
                    );
                }
            }

            const results = await Promise.all(promises);
            const allSubjects = [];

            results.forEach(({ branch, cycle, subjects }) => {
                subjects.forEach((subject) => {
                    allSubjects.push({
                        ...subject,
                        branch,
                        cycle
                    });
                });
            });

            const subjectsByCode = new Map();
            allSubjects.forEach((subject) => {
                const code = String(subject.code || '').trim();
                if (!code || subjectsByCode.has(code)) return;
                subjectsByCode.set(code, subject);
            });

            const uniqueSubjects = Array.from(subjectsByCode.values());
            uniqueSubjects.sort((a, b) => String(a.code).localeCompare(String(b.code)));
            setAdminSubjects(uniqueSubjects);
        } catch (error) {
            console.error('Error loading admin subjects:', error);
            setAdminUploadError('Failed to load subjects');
        } finally {
            setAdminSubjectsLoading(false);
        }
    };

    const loadUserSubjects = async () => {
        setUserSubjectsLoading(true);
        setUserUploadError('');
        try {
            const response = await subjectAPI.getSubjectsByBranch(currentBranch, cycle);
            setUserSubjects(response.data || []);
        } catch (error) {
            console.error('Error loading user subjects:', error);
            setUserUploadError('Failed to load subjects');
        } finally {
            setUserSubjectsLoading(false);
        }
    };

    useEffect(() => {
        if (showAdminUploadModal && user?.isAdmin && adminSubjects.length === 0) {
            loadAdminSubjects();
        }
    }, [showAdminUploadModal, user?.isAdmin]);

    useEffect(() => {
        if (showUserUploadModal && userSubjects.length === 0) {
            loadUserSubjects();
        }
    }, [showUserUploadModal, currentBranch, cycle]);

    const resetAdminUploadForm = () => {
        setAdminSubjectId('');
        setAdminContentType('');
        setAdminFiles([]);
        setAdminUploadProgress(0);
        setAdminUploadFileIndex(0);
        setAdminUploadFileTotal(0);
    };

    const resetUserUploadForm = () => {
        setUserSubjectCode('');
        setUserContentType('');
        setUserFiles([]);
        setUserUploadProgress(0);
        setUserUploadFileIndex(0);
        setUserUploadFileTotal(0);
    };

    const mapContentType = (type) => type;

    const getUploadPercent = (event) => {
        if (!event || !event.total) return 0;
        return Math.min(100, Math.round((event.loaded / event.total) * 100));
    };

    const isZipFile = (file) => {
        if (!file) return false;
        const name = String(file.name || '').toLowerCase();
        const type = String(file.type || '').toLowerCase();
        return name.endsWith('.zip') || type === 'application/zip' || type === 'application/x-zip-compressed';
    };

    const isPdfFile = (file) => {
        if (!file) return false;
        const name = String(file.name || '').toLowerCase();
        const type = String(file.type || '').toLowerCase();
        return name.endsWith('.pdf') || type === 'application/pdf';
    };

    const handleAdminUploadSubmit = async (e) => {
        e.preventDefault();
        if (!adminSubjectId || adminFiles.length === 0) {
            setAdminUploadError('Please fill all required fields');
            return;
        }

        const zipFile = adminFiles.find(isZipFile);
        if (zipFile && adminFiles.length > 1) {
            setAdminUploadError('Upload only one ZIP file at a time');
            return;
        }

        if (!zipFile && !adminContentType) {
            setAdminUploadError('Please select a content type for PDF uploads');
            return;
        }

        if (!zipFile && adminFiles.some((file) => !isPdfFile(file))) {
            setAdminUploadError('Only PDF files are supported');
            return;
        }

        const totalFiles = zipFile ? 1 : adminFiles.length;
        setAdminUploadFileTotal(totalFiles);
        setAdminUploadFileIndex(0);
        setAdminUploadProgress(0);
        setAdminUploadLoading(true);
        setAdminUploadError('');

        try {
            if (zipFile) {
                setAdminUploadFileIndex(1);
                const response = await uploadAPI.uploadSubjectZip(adminSubjectId, zipFile, {
                    onUploadProgress: (event) => {
                        setAdminUploadProgress(getUploadPercent(event));
                    }
                });
                console.log('Admin ZIP upload response:', response);
            } else {
                for (let index = 0; index < adminFiles.length; index += 1) {
                    const file = adminFiles[index];
                    setAdminUploadFileIndex(index + 1);
                    setAdminUploadProgress(0);
                    const response = await uploadAPI.uploadSubjectFiles(
                        adminSubjectId,
                        mapContentType(adminContentType),
                        [file],
                        {
                            onUploadProgress: (event) => {
                                setAdminUploadProgress(getUploadPercent(event));
                            }
                        }
                    );
                    console.log('Admin upload response:', response);
                }
            }

            resetAdminUploadForm();
            setShowAdminUploadModal(false);
            alert('Upload complete. Study materials updated for all branches.');
        } catch (error) {
            console.error('Admin upload error details:', {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
                fullError: error
            });
            setAdminUploadError(error?.response?.data?.error || error?.message || 'Upload failed');
        } finally {
            setAdminUploadLoading(false);
            setAdminUploadProgress(0);
            setAdminUploadFileIndex(0);
            setAdminUploadFileTotal(0);
        }
    };

    const handleUserUploadSubmit = async (e) => {
        e.preventDefault();
        if (!userSubjectCode || !userContentType || userFiles.length === 0) {
            setUserUploadError('Please fill all required fields');
            return;
        }

        const totalFiles = userFiles.length;
        setUserUploadFileTotal(totalFiles);
        setUserUploadFileIndex(0);
        setUserUploadProgress(0);
        setUserUploadLoading(true);
        setUserUploadError('');

        try {
            const formData = new FormData();
            userFiles.forEach((file) => formData.append('files', file));
            formData.append('contentType', userContentType);
            formData.append('subjectCode', userSubjectCode);

            console.log('User upload formData:', {
                filesCount: userFiles.length,
                contentType: userContentType,
                subjectCode: userSubjectCode
            });

            const response = await userUploadAPI.createUpload(formData, {
                onUploadProgress: (event) => {
                    const percent = getUploadPercent(event);
                    setUserUploadProgress(percent);
                    if (totalFiles > 0) {
                        const estimatedCount = Math.min(
                            totalFiles,
                            Math.max(1, Math.round((percent / 100) * totalFiles))
                        );
                        setUserUploadFileIndex(estimatedCount);
                    }
                }
            });
            console.log('User upload response:', response);

            resetUserUploadForm();
            setShowUserUploadModal(false);
            alert('Upload sent to admin for review.');
        } catch (error) {
            console.error('User upload error details:', {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
                fullError: error
            });
            setUserUploadError(error?.response?.data?.error || error?.message || 'Upload failed');
        } finally {
            setUserUploadLoading(false);
            setUserUploadProgress(0);
            setUserUploadFileIndex(0);
            setUserUploadFileTotal(0);
        }
    };

    return (
        <>
            {/* Mobile Menu Button - Fixed top left on mobile only */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`sm:hidden fixed top-4 left-4 z-50 h-10 w-10 rounded-lg flex items-center justify-center shadow-lg ${isLightMode ? 'bg-white border border-slate-200' : 'bg-primary-900 border border-primary-700'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="sm:hidden fixed inset-0 bg-black/60 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar - Responsive */}
            <div
                className={`${sidebarClasses.shell} h-screen fixed left-0 top-0 shadow-lg flex flex-col transition-all duration-300 z-40 overflow-hidden
                    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                    sm:translate-x-0 
                    ${isCollapsed ? 'w-64 sm:w-20' : 'w-64'}
                `}
            >
                {/* Header with Collapse Button */}
                <div className={`p-4 border-b ${sidebarClasses.border} flex items-center justify-between`}>
                    {!isCollapsed && (
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7 18V6l10 6-10 6z" fill="currentColor" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className={`text-xl font-extrabold leading-tight ${sidebarClasses.accent}`}>AskUrSenior</h1>
                                    <p className="text-[11px] text-gray-400/70 -mt-0.5">Academic Tracker</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => onCollapsedChange?.(!isCollapsed)}
                        className={`hidden sm:flex ${sidebarClasses.accent} ${sidebarClasses.accentHover} transition ml-auto h-11 w-11 items-center justify-center`}
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {/* Core Learning Zone */}
                    <div className="space-y-1">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className={`${isCollapsed ? 'justify-center' : ''} w-full flex items-center gap-3 p-3 rounded-xl transition ${sidebarClasses.panel} ${sidebarClasses.panelHover}`}
                            title="Dashboard"
                        >
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {!isCollapsed && <span className="text-sm font-semibold">Dashboard</span>}
                        </button>

                        <button
                            onClick={() => navigate('/interview-experiences')}
                            className={`${isCollapsed ? 'justify-center' : ''} w-full flex items-center gap-3 p-3 rounded-xl transition ${sidebarClasses.panel} ${sidebarClasses.panelHover}`}
                            title="Interview Experiences"
                        >
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                            </svg>
                            {!isCollapsed && <span className="text-sm font-semibold text-left">Interview Experiences</span>}
                        </button>

                        <button
                            onClick={() => navigate('/calculator')}
                            className={`${isCollapsed ? 'justify-center' : ''} w-full flex items-center gap-3 p-3 rounded-xl transition ${sidebarClasses.panel} ${sidebarClasses.panelHover}`}
                            title="CGPA Calculator"
                        >
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            {!isCollapsed && <span className="text-sm font-semibold">CGPA Calculator</span>}
                        </button>
                    </div>

                    {/* Billing/Plan Zone */}
                    <div className="pt-2 border-t border-white/5 space-y-1">
                        <button
                            onClick={() => navigate('/subscription')}
                            className={`${isCollapsed ? 'justify-center' : ''} w-full flex items-center gap-3 p-3 rounded-xl transition ${sidebarClasses.panel} ${sidebarClasses.panelHover}`}
                            title="Subscription"
                        >
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {!isCollapsed && (
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="text-sm font-semibold">Subscription</span>
                                    {user?.subscription === 'free' && (
                                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Upgrade to ASK+</span>
                                    )}
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Contribution Zone */}
                    <div className="pt-2 border-t border-white/5 space-y-1">
                        <button
                            onClick={() => (user?.isAdmin ? setShowAdminUploadModal(true) : setShowUserUploadModal(true))}
                            className={`${isCollapsed ? 'justify-center' : ''} w-full flex items-center gap-3 p-3 rounded-xl transition ${sidebarClasses.panel} ${sidebarClasses.panelHover}`}
                            title="Upload Materials"
                        >
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                            </svg>
                            {!isCollapsed && (
                                <div className="text-left">
                                    <p className="text-sm font-semibold">Upload Materials</p>
                                    <p className="text-[10px] text-slate-500">Contribute & review</p>
                                </div>
                            )}
                        </button>
                    </div>
                </nav>

                {/* Profile (bottom) */}
                {!isCollapsed && (
                    <div className={`p-4 border-t ${sidebarClasses.border}`}>
                        <button
                            type="button"
                            onClick={() => setShowProfileMenu((v) => !v)}
                            className={`w-full ${sidebarClasses.panel} ${sidebarClasses.panelHover} rounded-xl p-3 transition text-left`}
                            title="Profile menu"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden border border-white/20">
                                    {user?.profilePicture ? (
                                        <img
                                            src={user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profilePicture}`}
                                            alt={user.usn}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        (user?.usn || 'U').slice(0, 1).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-semibold ${sidebarClasses.title} truncate`}>{user?.usn}</p>
                                    <div className="mt-0.5 flex flex-col gap-0.5">
                                        <p className={`text-[10px] truncate ${user?.subscription === 'askplus'
                                            ? (user?.subscriptionExpiry && (new Date(user.subscriptionExpiry) - new Date()) < 3 * 24 * 60 * 60 * 1000 ? 'text-amber-500 font-bold' : 'text-slate-400')
                                            : 'text-slate-500'
                                            }`}>
                                            {user?.subscription === 'askplus'
                                                ? `ASK+ Active • ${user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Lifetime'}`
                                                : 'Free Learning Plan'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <svg
                                        className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
                            </div>
                        </button>

                        {showProfileMenu && (
                            <div className={`mt-3 ${sidebarClasses.panel} rounded-xl overflow-hidden border ${sidebarClasses.border}`}>
                                <div className="px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className={`text-sm font-semibold ${sidebarClasses.title} truncate`}>{user?.name || user?.usn}</p>
                                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 border border-emerald-400/20 text-[11px]">
                                                {currentBranch}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={onProfileClick}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                    title="My Profile"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 20.25a7.5 7.5 0 0115 0" />
                                    </svg>
                                    <span>My Profile</span>
                                </button>

                                {user?.isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate('/admin');
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                        title="Admin Panel"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>Admin Panel</span>
                                    </button>
                                )}

                                {/* Upgrade button for free users only (not admin) */}
                                {user?.subscription === 'free' && !user?.isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate('/pricing');
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition`}
                                        title="Upgrade to ASK+"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Upgrade to ASK+</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setFeedbackError('');
                                        setFeedbackRating(0);
                                        setFeedbackMessage('');
                                        loadFeedbackMeta();
                                        setShowFeedbackModal(true);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                    title="Send feedback"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h8M5 20l2-2h12a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v14z" />
                                    </svg>
                                    <span>Feedback</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setBugError('');
                                        setBugTitle('');
                                        setBugDescription('');
                                        setShowBugModal(true);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                    title="Report a bug"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Report a Bug</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const token = localStorage.getItem('authToken');
                                        window.location.href = `https://askursenior.onrender.com/api/discord/login?token=${token}`;
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold bg-[#5865F2]/10 text-[#5865F2] hover:bg-[#5865F2]/20 transition`}
                                    title="Connect Discord"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152c-.03-.0044-.059-.0069-.0785.0371-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.5868 0-.1635-.3847-.4058-.8742-.6177-1.2495-.0195-.044-.0485-.0415-.0785-.037a19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294.03.0093.059.0068.0842-.0276.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914.03-.0247.059-.0346.0775-.0105 3.9278 1.7933 8.18 1.7933 12.0614 0 .0185-.0241.0475-.0142.0775.0105.1201.0991.246.1971.3718.2914.03-.0241.059-.0142-.0066.1277 12.2986 12.2986 0 1 1-1.8722.8923.0761.0761 0 0 0-.0416.1057c.3528.6991.7644 1.3638 1.226 1.9942.0252.0344.0542.0369.0842.0276 1.9516-.6066 3.9401-1.5218 5.9929-3.0294a.081.081 0 00.0312-.0561c.4991-5.2263-.8382-9.7231-3.5204-13.6603-.012-.0175-.0245-.0252-.0321-.0277z"></path>
                                    </svg>
                                    <span>Connect Discord</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                    title="Toggle theme"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
                                    </svg>
                                    <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowNotificationModal(true)}
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                    title="Notifications"
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="relative">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                                            </svg>
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </span>
                                        <span>Notifications</span>
                                    </span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <div className={`h-px ${sidebarClasses.border} opacity-60`} />

                                <button
                                    type="button"
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition"
                                    title="Logout"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                                    </svg>
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {showFeedbackModal && (
                    <ModalShell
                        isLightMode={isLightMode}
                        title="Feedback"
                        onClose={() => closeFeedbackModal()}
                    >
                        <div className="space-y-4">
                            <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-secondary-200'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="font-semibold">Average rating</div>
                                    <div className="font-extrabold">{feedbackMetaLoading ? '...' : `${feedbackStats.avgRating}/5`}</div>
                                </div>
                                <div className={`mt-1 text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>
                                    {feedbackMetaLoading ? 'Loading...' : `${feedbackStats.total} total feedbacks`}
                                </div>
                            </div>

                            <div className={`rounded-xl border px-3 py-2 ${isLightMode ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                                <div className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Your last feedback</div>
                                {!latestFeedback ? (
                                    <div className={`mt-2 text-sm ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}>No feedback yet.</div>
                                ) : (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>
                                                {latestFeedback?.createdAt ? new Date(latestFeedback.createdAt).toLocaleString() : ''}
                                            </div>
                                            <div className="text-sm font-extrabold text-amber-500">{latestFeedback.rating}/5</div>
                                        </div>
                                        <div className={`mt-2 text-sm whitespace-pre-wrap ${isLightMode ? 'text-slate-700' : 'text-secondary-200'}`}>
                                            {latestFeedback.message ? latestFeedback.message : 'No message'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Rating
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setFeedbackRating(v)}
                                            className={`h-10 w-10 rounded-xl border text-lg font-extrabold transition ${feedbackRating >= v
                                                ? isLightMode
                                                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                                                    : 'bg-amber-500/10 border-amber-400/20 text-amber-300'
                                                : isLightMode
                                                    ? 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50'
                                                    : 'bg-white/5 border-white/10 text-secondary-500 hover:bg-white/10'
                                                }`}
                                            aria-label={`Rate ${v} star`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                                <p className={`mt-2 text-xs ${isLightMode ? 'text-gray-500' : 'text-secondary-500'}`}>
                                    {feedbackRating ? `You selected ${feedbackRating}/5` : 'Select a rating to submit'}
                                </p>
                            </div>

                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Message (optional)
                                </p>
                                <textarea
                                    value={feedbackMessage}
                                    onChange={(e) => setFeedbackMessage(e.target.value)}
                                    rows={4}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                        }`}
                                    placeholder="Tell us what you liked, what to improve, or any suggestions..."
                                />
                            </div>

                            {feedbackError && (
                                <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>
                                    {feedbackError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => closeFeedbackModal()}
                                    className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'
                                        }`}
                                    disabled={feedbackSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitFeedback}
                                    className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${feedbackRating && !feedbackSubmitting ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-600/40 cursor-not-allowed'
                                        }`}
                                    disabled={!feedbackRating || feedbackSubmitting}
                                >
                                    {feedbackSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {showAdminUploadModal && (
                    <ModalShell
                        isLightMode={isLightMode}
                        title="Admin Upload"
                        onClose={() => {
                            setShowAdminUploadModal(false);
                            setAdminUploadError('');
                        }}
                    >
                        <form onSubmit={handleAdminUploadSubmit} className="space-y-4">
                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Subject
                                </label>
                                <select
                                    value={adminSubjectId}
                                    onChange={(e) => setAdminSubjectId(e.target.value)}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white text-slate-900 focus:border-purple-500/60'
                                        }`}
                                >
                                    <option value="">Select a subject</option>
                                    {adminSubjects.map((subject) => (
                                        <option key={subject._id} value={subject._id}>
                                            {subject.code}
                                        </option>
                                    ))}
                                </select>
                                {adminSubjectsLoading && (
                                    <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                        Loading subjects...
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Content Type
                                </label>
                                <select
                                    value={adminContentType}
                                    onChange={(e) => {
                                        setAdminContentType(e.target.value);
                                    }}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white text-slate-900 focus:border-purple-500/60'
                                        }`}
                                >
                                    <option value="">Select content type</option>
                                    <option value="notes">Notes</option>
                                    <option value="pyqs">PYQs</option>
                                    <option value="questionBanks">Question Banks</option>
                                    <option value="syllabus">Syllabus</option>
                                    <option value="resources">Resources</option>
                                </select>
                            </div>

                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Files
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setAdminFiles(Array.from(e.target.files || []))}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white text-slate-900 focus:border-purple-500/60'
                                        }`}
                                    accept=".pdf,.zip"
                                />
                                <p className={`mt-1 text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                    Upload PDFs or a single ZIP with notes/, pyqs/, questionBanks/, syllabus/, resources/.
                                </p>
                            </div>

                            {adminUploadError && (
                                <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>
                                    {adminUploadError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdminUploadModal(false)}
                                    className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'
                                        }`}
                                    disabled={adminUploadLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${adminUploadLoading
                                        ? 'bg-purple-600/40 cursor-not-allowed'
                                        : 'bg-purple-600 hover:bg-purple-500'
                                        }`}
                                    disabled={adminUploadLoading}
                                >
                                    {adminUploadLoading ? (
                                        <div className="relative h-full w-full">
                                            <div className="absolute inset-0 rounded-lg bg-white/20" />
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-lg bg-white/70 transition-all duration-200"
                                                style={{ width: `${adminUploadProgress}%` }}
                                            />
                                            <div className="relative z-10 flex h-full items-center justify-between px-3 text-[11px] text-white">
                                                <span>{`Uploading ${adminUploadFileIndex || 0} of ${adminUploadFileTotal || 0} files`}</span>
                                                <span>{`${adminUploadProgress}%`}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        'Upload'
                                    )}
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {showUserUploadModal && (
                    <ModalShell
                        isLightMode={isLightMode}
                        title="Upload Materials"
                        onClose={() => {
                            setShowUserUploadModal(false);
                            setUserUploadError('');
                        }}
                    >
                        <form onSubmit={handleUserUploadSubmit} className="space-y-4">
                            <div className={`rounded-xl border px-3 py-2 text-xs ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-secondary-300'}`}>
                                Your upload is sent to admin review. Approved materials appear in study materials.
                            </div>

                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Subject
                                </label>
                                <select
                                    value={userSubjectCode}
                                    onChange={(e) => {
                                        setUserSubjectCode(e.target.value);
                                    }}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white text-slate-900 focus:border-purple-500/60'
                                        }`}
                                >
                                    <option value="">Select a subject</option>
                                    {userSubjects.map((subject) => (
                                        <option key={subject.code} value={subject.code}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                                {userSubjectsLoading && (
                                    <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                        Loading subjects...
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Content Type
                                </label>
                                <select
                                    value={userContentType}
                                    onChange={(e) => {
                                        setUserContentType(e.target.value);
                                    }}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white text-slate-900 focus:border-purple-500/60'
                                        }`}
                                >
                                    <option value="">Select content type</option>
                                    <option value="notes">Notes</option>
                                    <option value="pyqs">PYQs</option>
                                    <option value="questionBanks">Question Banks</option>
                                    <option value="syllabus">Syllabus</option>
                                    <option value="resources">Resources</option>
                                </select>
                            </div>

                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Files
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setUserFiles(Array.from(e.target.files || []))}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white text-slate-900 focus:border-purple-500/60'
                                        }`}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                />
                            </div>

                            {userUploadError && (
                                <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>
                                    {userUploadError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUserUploadModal(false)}
                                    className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'
                                        }`}
                                    disabled={userUploadLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${userUploadLoading
                                        ? 'bg-purple-600/40 cursor-not-allowed'
                                        : 'bg-purple-600 hover:bg-purple-500'
                                        }`}
                                    disabled={userUploadLoading}
                                >
                                    {userUploadLoading ? (
                                        <div className="relative h-full w-full">
                                            <div className="absolute inset-0 rounded-lg bg-white/20" />
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-lg bg-white/70 transition-all duration-200"
                                                style={{ width: `${userUploadProgress}%` }}
                                            />
                                            <div className="relative z-10 flex h-full items-center justify-between px-3 text-[11px] text-white">
                                                <span>{`Uploading ${userUploadFileIndex || 0} of ${userUploadFileTotal || 0} files`}</span>
                                                <span>{`${userUploadProgress}%`}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        'Submit'
                                    )}
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {showBugModal && (
                    <ModalShell
                        isLightMode={isLightMode}
                        title="Report a Bug"
                        onClose={() => closeBugModal()}
                    >
                        <div className="space-y-4">
                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Title
                                </p>
                                <input
                                    value={bugTitle}
                                    onChange={(e) => setBugTitle(e.target.value)}
                                    className={`mt-2 h-10 w-full rounded-xl border px-3 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                        }`}
                                    placeholder="Short summary (e.g., Subject list not loading)"
                                />
                            </div>

                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Description
                                </p>
                                <textarea
                                    value={bugDescription}
                                    onChange={(e) => setBugDescription(e.target.value)}
                                    rows={5}
                                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                        }`}
                                    placeholder="What happened? What did you expect? Steps to reproduce..."
                                />
                            </div>

                            <div className={`rounded-xl border px-3 py-2 text-xs ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-secondary-300'}`}>
                                <div className="font-semibold">Page URL</div>
                                <div className="mt-1 break-all">{typeof window !== 'undefined' ? window.location.href : ''}</div>
                            </div>

                            {bugError && (
                                <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>
                                    {bugError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => closeBugModal()}
                                    className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'
                                        }`}
                                    disabled={bugSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitBug}
                                    className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${bugTitle.trim() && bugDescription.trim() && !bugSubmitting
                                        ? 'bg-purple-600 hover:bg-purple-500'
                                        : 'bg-purple-600/40 cursor-not-allowed'
                                        }`}
                                    disabled={!bugTitle.trim() || !bugDescription.trim() || bugSubmitting}
                                >
                                    {bugSubmitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {showNotificationModal && (
                    <ModalShell
                        isLightMode={isLightMode}
                        title="Notifications"
                        onClose={() => {
                            setShowNotificationModal(false);
                            // Mark all as read when closing
                            handleMarkAllAsRead();
                        }}
                    >
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {notificationsLoading ? (
                                <div className={`text-center py-8 ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-sm">Loading notifications...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className={`text-center py-8 ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                                    </svg>
                                    <p className="text-sm">No notifications yet</p>
                                    <p className="text-xs mt-1 opacity-70">New content uploads will appear here</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const isUnread = !notification.isRead;
                                    const typeColors = {
                                        notes: 'bg-green-500/15 text-green-400 border-green-400/20',
                                        pyqs: 'bg-purple-500/15 text-purple-400 border-purple-400/20',
                                        questionBanks: 'bg-blue-500/15 text-blue-400 border-blue-400/20',
                                        syllabus: 'bg-orange-500/15 text-orange-400 border-orange-400/20',
                                        feature: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/20',
                                        update: 'bg-blue-500/15 text-blue-400 border-blue-400/20',
                                        announcement: 'bg-amber-500/15 text-amber-400 border-amber-400/20'
                                    };
                                    const typeLabels = {
                                        notes: 'Notes',
                                        pyqs: 'PYQs',
                                        questionBanks: 'Q-Bank',
                                        syllabus: 'Syllabus',
                                        feature: 'New Feature',
                                        update: 'Update',
                                        announcement: 'Announcement'
                                    };
                                    return (
                                        <div
                                            key={notification._id}
                                            className={`rounded-xl border p-4 transition ${isLightMode
                                                ? isUnread
                                                    ? 'border-purple-200 bg-purple-50'
                                                    : 'border-slate-200 bg-slate-50'
                                                : isUnread
                                                    ? 'border-purple-500/30 bg-purple-500/10'
                                                    : 'border-white/10 bg-white/5'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-secondary-100'}`}>
                                                            {notification.title}
                                                        </h3>
                                                        {isUnread && (
                                                            <span className="inline-flex items-center rounded-full bg-purple-500 text-white px-2 py-0.5 text-[10px] font-semibold">
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`mt-1 text-sm ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}>
                                                        {notification.message}
                                                    </p>
                                                    {notification.subjectCode && (
                                                        <div className={`mt-2 text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                                            📍 {notification.subjectCode}
                                                            {notification.moduleName && ` ΓåÆ ${notification.moduleName}`}
                                                        </div>
                                                    )}
                                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                        <span className={`text-xs ${isLightMode ? 'text-slate-400' : 'text-secondary-500'}`}>
                                                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) : ''}
                                                        </span>
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${typeColors[notification.type] || typeColors.update
                                                            }`}>
                                                            {typeLabels[notification.type] || 'Update'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ModalShell>
                )}

                {/* Footer */}
            </div >
        </>
    );
};

const ModalShell = ({ isLightMode, title, onClose, children }) => {
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
                aria-label="Close modal"
            />
            <div
                className={`relative w-full max-w-lg rounded-2xl border shadow-xl ${isLightMode
                    ? 'border-slate-200 bg-white text-slate-900'
                    : 'border-white/10 bg-primary-900 text-secondary-100'
                    }`}
            >
                <div className={`flex items-center justify-between px-5 py-4 border-b ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <h2 className="text-base font-extrabold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`h-9 w-9 rounded-lg ${isLightMode ? 'hover:bg-slate-100' : 'hover:bg-white/5'} transition`}
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export default Sidebar;

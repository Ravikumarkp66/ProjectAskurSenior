import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import DashboardOverview from './DashboardOverview';
import UserManagementPage from './UserManagementPage';
import PaymentManagementPage from './PaymentManagementPage';
import { apiClient, subjectAPI, uploadAPI, userUploadAPI } from '../services/api';
import { articleAPI } from '../services/articleAPI';
import { useAuth } from '../utils/hooks';
import { FileText, Plus } from 'lucide-react';

const AdminPanel = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.isAdmin;

    // Redirect if not admin
    useEffect(() => {
        if (!isAdmin) {
            navigate('/login');
        }
    }, [isAdmin, navigate]);

    const [activeTab, setActiveTab] = useState('users');

    // Reviews state
    const [reviewsActiveTab, setReviewsActiveTab] = useState('feedback');
    const [feedbackItems, setFeedbackItems] = useState([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState('');
    const [bugItems, setBugItems] = useState([]);
    const [bugLoading, setBugLoading] = useState(false);
    const [bugError, setBugError] = useState('');
    const [userItems, setUserItems] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState('');
    const [resolvingId, setResolvingId] = useState('');
    const [userUploads, setUserUploads] = useState([]);
    const [userUploadsLoading, setUserUploadsLoading] = useState(false);
    const [userUploadsError, setUserUploadsError] = useState('');
    const [userUploadActionId, setUserUploadActionId] = useState('');



    // Articles state
    const [articles, setArticles] = useState([]);
    const [articlesLoading, setArticlesLoading] = useState(false);



    const [theme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const isLightMode = theme === 'light';

    // Reviews functions
    const loadFeedback = async () => {
        setFeedbackLoading(true);
        setFeedbackError('');
        try {
            const res = await apiClient.get('/feedback');
            setFeedbackItems(res?.data?.items || []);
        } catch (e) {
            setFeedbackError(e?.response?.data?.error || 'Failed to load feedback');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const loadBugs = async () => {
        setBugLoading(true);
        setBugError('');
        try {
            const res = await apiClient.get('/bugs');
            setBugItems(res?.data?.items || []);
        } catch (e) {
            setBugError(e?.response?.data?.error || 'Failed to load bug reports');
        } finally {
            setBugLoading(false);
        }
    };

    const loadUsers = async () => {
        setUsersLoading(true);
        setUsersError('');
        try {
            console.log('Loading users...');
            const res = await apiClient.get('/auth/users');
            console.log('Users response:', res.data);
            const users = res?.data?.users || [];
            console.log(`Loaded ${users.length} users`);
            setUserItems(users);
        } catch (e) {
            console.error('Error loading users:', e);
            setUsersError(e?.response?.data?.error || 'Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    const markBugAsResolved = async (bugId) => {
        setResolvingId(bugId);
        try {
            await apiClient.patch(`/bugs/${bugId}/status`, { status: 'resolved' });
            setBugItems(prev => prev.map(bug =>
                bug._id === bugId ? { ...bug, status: 'resolved' } : bug
            ));
        } catch (error) {
            console.error('Failed to resolve bug:', error);
        } finally {
            setResolvingId('');
        }
    };

    const loadUserUploads = async () => {
        setUserUploadsLoading(true);
        setUserUploadsError('');
        try {
            const res = await userUploadAPI.getUploads('pending');
            setUserUploads(res?.data?.items || []);
        } catch (error) {
            console.error('Failed to load user uploads:', error);
            setUserUploadsError(error?.response?.data?.error || 'Failed to load user uploads');
        } finally {
            setUserUploadsLoading(false);
        }
    };

    const handlePreviewUpload = async (uploadId) => {
        try {
            const res = await userUploadAPI.getUploadUrl(uploadId);
            if (res?.data?.url) {
                window.open(res.data.url, '_blank', 'noopener,noreferrer');
            }
        } catch (error) {
            console.error('Failed to preview upload:', error);
            alert(error?.response?.data?.error || 'Failed to preview upload');
        }
    };

    const handleApproveUpload = async (uploadId) => {
        setUserUploadActionId(uploadId);
        try {
            await userUploadAPI.approveUpload(uploadId);
            await loadUserUploads();
        } catch (error) {
            console.error('Failed to approve upload:', error);
            alert(error?.response?.data?.error || 'Failed to approve upload');
        } finally {
            setUserUploadActionId('');
        }
    };

    const handleDeleteUpload = async (uploadId) => {
        if (!confirm('Delete this upload permanently? This will remove it from S3 as well.')) {
            return;
        }
        setUserUploadActionId(uploadId);
        try {
            await userUploadAPI.deleteUpload(uploadId);
            await loadUserUploads();
        } catch (error) {
            console.error('Failed to delete upload:', error);
            alert(error?.response?.data?.error || 'Failed to delete upload');
        } finally {
            setUserUploadActionId('');
        }
    };

    const loadArticles = async () => {
        setArticlesLoading(true);
        try {
            const data = await articleAPI.getArticles();
            setArticles(data || []);
        } catch (error) {
            console.error('Failed to load articles:', error);
        } finally {
            setArticlesLoading(false);
        }
    };




    // Load data on mount and tab change
    useEffect(() => {
        if (activeTab === 'reviews') {
            if (reviewsActiveTab === 'feedback') loadFeedback();
            else if (reviewsActiveTab === 'bugs') loadBugs();
            else if (reviewsActiveTab === 'uploads') loadUserUploads();
        } else if (activeTab === 'articles') {
            loadArticles();
        }
    }, [activeTab, reviewsActiveTab]);

        if (activeTab === 'articles') {
            loadArticles();
        }



    if (!isAdmin) {
        return null;
    }

    return (
        <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>

            {activeTab === 'users' && <UserManagementPage />}
            {activeTab === 'payments' && <PaymentManagementPage />}
            {activeTab === 'reviews' && (
                <div className="space-y-6">
                    <div>
                        <h1 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                            Reviews & Reports
                        </h1>
                        <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            Manage user feedback, bug reports, and user accounts
                        </p>
                    </div>

                    {/* Reviews Tab Navigation */}
                    <div className={`border-b ${isLightMode ? 'border-gray-200' : 'border-gray-700'}`}>
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { id: 'feedback', label: 'Feedback' },
                                { id: 'bugs', label: 'Bug Reports' },
                                { id: 'uploads', label: 'User Uploads' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setReviewsActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition ${reviewsActiveTab === tab.id
                                        ? isLightMode
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-blue-400 text-blue-400'
                                        : isLightMode
                                            ? 'border-transparent text-gray-500 hover:text-gray-700'
                                            : 'border-transparent text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Reviews Content */}
                    {reviewsActiveTab === 'feedback' && (
                        <div className="space-y-4">
                            {feedbackLoading && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <span className="ml-2">Loading feedback...</span>
                                    </div>
                                </div>
                            )}
                            {feedbackError && (
                                <div className="text-red-500 text-center py-4">{feedbackError}</div>
                            )}
                            {!feedbackLoading && feedbackItems.length === 0 && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No feedback yet
                                </div>
                            )}
                            {feedbackItems.map((item) => (
                                <div key={item._id} className={`p-4 rounded-lg border ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <svg key={star} className={`w-4 h-4 ${star <= item.rating ? 'text-yellow-400' : isLightMode ? 'text-gray-300' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <span className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {item.message && (
                                                <p className={`mt-2 ${isLightMode ? 'text-gray-800' : 'text-gray-200'}`}>
                                                    {item.message}
                                                </p>
                                            )}
                                            <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                From: {item.user?.usn || 'Unknown user'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {reviewsActiveTab === 'bugs' && (
                        <div className="space-y-4">
                            {bugLoading && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <span className="ml-2">Loading bug reports...</span>
                                    </div>
                                </div>
                            )}
                            {bugError && (
                                <div className="text-red-500 text-center py-4">{bugError}</div>
                            )}
                            {!bugLoading && bugItems.length === 0 && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No bug reports yet
                                </div>
                            )}
                            <div className="space-y-8">
                                {/* Active Bugs Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-lg font-bold flex items-center gap-2 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                            Active Bug Reports
                                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 ml-2">
                                                {bugItems.filter(item => item.status !== 'resolved').length} Pending
                                            </span>
                                        </h3>
                                    </div>
                                    
                                    {bugItems.filter(item => item.status !== 'resolved').length === 0 ? (
                                        <div className={`p-8 text-center rounded-xl border border-dashed ${isLightMode ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-gray-800/20 border-gray-700 text-gray-400'}`}>
                                            All bugs have been squashed! No pending reports.
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {bugItems.filter(item => item.status !== 'resolved').map((item) => (
                                                <div key={item._id} className={`p-5 rounded-xl border shadow-sm transition-all hover:shadow-md ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'}`}>
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                                    Issue #{item._id.slice(-4)}
                                                                </span>
                                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                    {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            <h4 className={`text-base font-bold mb-1 truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                                                {item.title}
                                                            </h4>
                                                            <p className={`text-sm leading-relaxed mb-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                                                {item.description}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-4 text-[11px] pt-3 border-t border-slate-200/10">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-[8px]">
                                                                        {(item.user?.usn || 'U').charAt(0)}
                                                                    </div>
                                                                    <span className={isLightMode ? 'text-slate-700 font-semibold' : 'text-slate-300 font-semibold'}>{item.user?.usn || 'Unknown'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                                                                    <span className="opacity-60 truncate max-w-[200px]">{item.pageUrl}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => markBugAsResolved(item._id)}
                                                            disabled={resolvingId === item._id}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 whitespace-nowrap ${isLightMode
                                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                                                                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40'
                                                            } disabled:opacity-50`}
                                                        >
                                                            {resolvingId === item._id ? (
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                                            )}
                                                            {resolvingId === item._id ? 'Squashing...' : 'Resolve'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Solved Bugs Section */}
                                {bugItems.filter(item => item.status === 'resolved').length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-slate-200/10">
                                        <h3 className={`text-lg font-bold flex items-center gap-2 ${isLightMode ? 'text-gray-900' : 'text-slate-400'}`}>
                                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                            Solved Bugs
                                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 ml-2">
                                                {bugItems.filter(item => item.status === 'resolved').length} Fixed
                                            </span>
                                        </h3>
                                        
                                        <div className="grid gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                            {bugItems.filter(item => item.status === 'resolved').map((item) => (
                                                <div key={item._id} className={`p-4 rounded-xl border border-dashed transition-all ${isLightMode ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-800/20 border-slate-700'}`}>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className={`text-sm font-bold truncate line-through ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                                                    {item.title}
                                                                </h4>
                                                                <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-tight bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                                    Fixed
                                                                </span>
                                                            </div>
                                                            <p className={`text-[11px] truncate ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                Reported by {item.user?.usn || 'Unknown'} on {new Date(item.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {reviewsActiveTab === 'uploads' && (
                        <div className="space-y-4">
                            {userUploadsLoading && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <span className="ml-2">Loading user uploads...</span>
                                    </div>
                                </div>
                            )}

                            {userUploadsError && (
                                <div className="text-red-500 text-center py-4">{userUploadsError}</div>
                            )}

                            {!userUploadsLoading && userUploads.length === 0 && !userUploadsError && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No pending user uploads
                                </div>
                            )}

                            {userUploads.map((item) => (
                                <div key={item._id} className={`p-4 rounded-lg border ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded ${item.contentType === 'notes' ? 'bg-green-100 text-green-800' :
                                                    item.contentType === 'pyqs' ? 'bg-purple-100 text-purple-800' :
                                                        item.contentType === 'questionBanks' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {item.contentType}
                                                </span>
                                                <span className={`text-xs ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {item.subjectCode}{item.moduleNumber ? ` • Module ${item.moduleNumber}` : ''}
                                                </span>
                                            </div>
                                            <h4 className={`mt-2 font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                                {item.title}
                                            </h4>
                                            {item.description && (
                                                <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {item.description}
                                                </p>
                                            )}
                                            <p className={`text-xs mt-2 ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                Uploaded by: {item.uploadedBy?.usn || item.uploadedBy?.email || 'Unknown'} • {new Date(item.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handlePreviewUpload(item._id)}
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition ${isLightMode
                                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                                    }`}
                                            >
                                                Preview
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleApproveUpload(item._id)}
                                                disabled={userUploadActionId === item._id}
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition ${userUploadActionId === item._id
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : isLightMode
                                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                                    }`}
                                            >
                                                {userUploadActionId === item._id ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUpload(item._id)}
                                                disabled={userUploadActionId === item._id}
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition ${userUploadActionId === item._id
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : isLightMode
                                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                                    }`}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}


            {activeTab === 'articles' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                Article Management
                            </h1>
                            <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                Create and manage student guides on AskUrSenior
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/articles/create')}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                        >
                            <Plus size={18} />
                            Create Article
                        </button>
                    </div>

                    <div className={`mt-8 p-6 rounded-lg border ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                        <h3 className={`text-lg font-semibold mb-6 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                            Published Articles
                        </h3>

                        {articlesLoading ? (
                            <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <span className="ml-2">Loading articles...</span>
                                </div>
                            </div>
                        ) : articles.length === 0 ? (
                            <div className={`text-center py-12 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>No articles published yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {articles.map((article) => (
                                    <div key={article._id} className={`p-4 rounded-lg border flex items-center justify-between ${isLightMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-700/50 border-gray-600'}`}>
                                        <div className="flex gap-4 items-center">
                                            {article.coverImage ? (
                                                <img src={article.coverImage} alt={article.title} className="w-16 h-16 object-cover rounded-md" />
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-700 rounded-md flex items-center justify-center text-slate-400">
                                                    <FileText size={24} />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className={`font-semibold text-lg ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                                    {article.title}
                                                </h4>
                                                <div className={`text-sm mt-1 flex gap-4 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    <span>By {article.author}</span>
                                                    <span>•</span>
                                                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{article.views || 0} views</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => window.open(`/blog/${article.slug}`, '_blank')}
                                            className={`px-4 py-2 rounded-md font-medium transition ${isLightMode ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                                        >
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminPanel;
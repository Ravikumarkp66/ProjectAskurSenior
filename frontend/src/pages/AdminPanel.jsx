import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import DashboardOverview from './DashboardOverview';
import UserManagementPage from './UserManagementPage';
import { apiClient, subjectAPI, uploadAPI, userUploadAPI } from '../services/api';
import { useAuth } from '../utils/hooks';

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

    const [activeTab, setActiveTab] = useState('reviews');

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

    // Study materials state
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Manage content state
    const [manageSubject, setManageSubject] = useState('');
    const [uploadedContent, setUploadedContent] = useState([]);
    const [loadingContent, setLoadingContent] = useState(false);
    const [deletingContent, setDeletingContent] = useState('');

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
            await apiClient.patch(`/bugs/${bugId}`, { status: 'resolved' });
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

    // Study materials functions
    const loadSubjects = async () => {
        try {
            // Load from ALL branches and cycles - admin should see EVERYTHING
            const allBranches = ['CS', 'IS', 'EC', 'EE', 'ME', 'CV', 'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT', 'CI', 'BT', 'IM', 'CH', 'ET', 'EI'];
            const cycles = ['P', 'C'];
            let allSubjects = [];
            
            console.log('Loading subjects from all branches for admin panel...');
            
            // Load subjects from all branches and cycles
            const promises = [];
            for (const branch of allBranches) {
                for (const cycle of cycles) {
                    promises.push(
                        subjectAPI.getSubjectsByBranch(branch, cycle)
                            .then(response => ({ branch, cycle, subjects: response.data || [] }))
                            .catch(() => ({ branch, cycle, subjects: [] })) // Silent fail
                    );
                }
            }
            
            const results = await Promise.all(promises);
            
            // Combine all results and track all branches for each subject code
            results.forEach(({ branch, cycle, subjects }) => {
                subjects.forEach(subject => {
                    const existingSubject = allSubjects.find(s => s.code === subject.code);
                    if (!existingSubject) {
                        allSubjects.push({
                            code: subject.code,
                            name: subject.name,
                            credits: subject.credits,
                            modules: subject.modules || [],
                            branches: [`${branch}(${cycle})`] // Track branch and cycle
                        });
                    } else {
                        // Add branch-cycle combination to existing subject
                        const branchCycle = `${branch}(${cycle})`;
                        if (!existingSubject.branches.includes(branchCycle)) {
                            existingSubject.branches.push(branchCycle);
                        }
                        // Update modules if this version has more modules
                        if (subject.modules && subject.modules.length > existingSubject.modules.length) {
                            existingSubject.modules = subject.modules;
                        }
                    }
                });
            });
            
            // Sort by subject name for better UX
            allSubjects.sort((a, b) => a.name.localeCompare(b.name));
            
            setSubjects(allSubjects);
            
            console.log(`Loaded ${allSubjects.length} unique subjects across all branches:`, 
                allSubjects.map(s => `${s.code}: ${s.branches.join(', ')}`));
            
        } catch (error) {
            console.error('Error loading subjects:', error);
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    };


    // Load data on mount and tab change
    useEffect(() => {
        if (activeTab === 'reviews') {
            if (reviewsActiveTab === 'feedback') loadFeedback();
            else if (reviewsActiveTab === 'bugs') loadBugs();
            else if (reviewsActiveTab === 'users') loadUsers();
            else if (reviewsActiveTab === 'uploads') loadUserUploads();
        } else if (activeTab === 'materials') {
            loadSubjects();
        }
    }, [activeTab, reviewsActiveTab]);

    // Initial load on component mount
    useEffect(() => {
        if (activeTab === 'materials') {
            loadSubjects();
        }
    }, []);

    const manageSubjectData = subjects.find(s => s.code === manageSubject);

    // Load uploaded content for a subject
    const loadUploadedContent = async (subjectCode) => {
        if (!subjectCode) return;
        
        setLoadingContent(true);
        try {
            const response = await subjectAPI.getSubjectsByCode(subjectCode);
            const subjectsWithCode = response.data || [];
            
            if (subjectsWithCode.length > 0) {
                // Get first subject as reference (all should have same content)
                const subject = subjectsWithCode[0];
                const contentList = [];
                
                ['notes', 'pyqs', 'questionBanks', 'syllabus', 'resources'].forEach(type => {
                    if (subject[type] && subject[type].length > 0) {
                        subject[type].forEach(item => {
                            const displayType = type === 'pyqs'
                                ? 'PYQs'
                                : type === 'questionBanks'
                                    ? 'Question Banks'
                                    : type === 'syllabus'
                                        ? 'Syllabus'
                                        : type === 'resources'
                                            ? 'Resources'
                                            : 'Notes';
                            contentList.push({
                                ...item,
                                contentType: type,
                                level: 'subject',
                                displayType
                            });
                        });
                    }
                });
                
                setUploadedContent(contentList);
            } else {
                setUploadedContent([]);
            }
        } catch (error) {
            console.error('Error loading content:', error);
            alert('Failed to load uploaded content');
        } finally {
            setLoadingContent(false);
        }
    };

    // Delete content from all branches
    const handleDeleteContent = async (content) => {
        if (!confirm(`Are you sure you want to delete "${content.title}" from ALL branches?\n\nThis action cannot be undone.`)) {
            return;
        }
        
        setDeletingContent(content._id);
        try {
            await uploadAPI.bulkDeleteSubjectContent(
                manageSubject,
                content.contentType,
                content.title
            );
            
            alert('Content deleted successfully from all branches!');
            loadUploadedContent(manageSubject);
        } catch (error) {
            console.error('Error deleting content:', error);
            alert(error.response?.data?.error || 'Failed to delete content');
        } finally {
            setDeletingContent('');
        }
    };

    // Load content when manage subject changes
    useEffect(() => {
        if (manageSubject) {
            loadUploadedContent(manageSubject);
        } else {
            setUploadedContent([]);
        }
    }, [manageSubject]);

    if (!isAdmin) {
        return null;
    }

    return (
        <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'users' && <UserManagementPage />}
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
                                { id: 'uploads', label: 'User Uploads' },
                                { id: 'users', label: 'Users' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setReviewsActiveTab(tab.id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition ${
                                        reviewsActiveTab === tab.id
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
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                            {bugItems.map((item) => (
                                <div key={item._id} className={`p-4 rounded-lg border ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                                    {item.title}
                                                </h3>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    item.status === 'resolved' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <p className={`mt-2 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                                                {item.description}
                                            </p>
                                            <div className={`text-sm mt-2 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                <p>From: {item.user?.usn || 'Unknown user'}</p>
                                                <p>Page: {item.pageUrl}</p>
                                                <p>Date: {new Date(item.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        {item.status !== 'resolved' && (
                                            <button
                                                onClick={() => markBugAsResolved(item._id)}
                                                disabled={resolvingId === item._id}
                                                className={`ml-4 px-3 py-1 text-sm font-medium rounded-md transition ${
                                                    isLightMode
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                                                } disabled:opacity-50`}
                                            >
                                                {resolvingId === item._id ? 'Resolving...' : 'Mark Resolved'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {reviewsActiveTab === 'users' && (
                        <div className="space-y-4">
                            {usersLoading && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                        <span className="ml-2">Loading users...</span>
                                    </div>
                                </div>
                            )}
                            {usersError && (
                                <div className="text-red-500 text-center py-4">{usersError}</div>
                            )}
                            
                            {/* Debug info - remove in production */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                    <strong>Debug:</strong> usersLoading: {usersLoading.toString()}, 
                                    userItems.length: {userItems.length}, 
                                    usersError: {usersError || 'none'}
                                </div>
                            )}
                            
                            {!usersLoading && userItems.length === 0 && !usersError && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No users found
                                </div>
                            )}
                            <div className="grid gap-4">
                                {userItems.map((user) => (
                                    <div key={user._id} className={`p-4 rounded-lg border ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                {(user.usn || 'U').slice(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className={`font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                                    {user.usn}
                                                </p>
                                                <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {user.email}
                                                </p>
                                                <p className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    Branch: {user.branch} | Joined: {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {reviewsActiveTab === 'uploads' && (
                        <div className="space-y-4">
                            {userUploadsLoading && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                                                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                                    item.contentType === 'notes' ? 'bg-green-100 text-green-800' :
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
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                                    isLightMode
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
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                                    userUploadActionId === item._id
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
                                                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                                    userUploadActionId === item._id
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

            {activeTab === 'materials' && (
                <div className="space-y-6">
                    <div>
                        <h1 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                            Study Materials Management
                        </h1>
                        <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            Manage study materials across all subjects
                        </p>
                    </div>

                    {loading ? (
                        <div className={`text-center py-12 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <p>Loading subjects and study materials...</p>
                        </div>
                    ) : (
                        <>
                        {/* Manage Uploaded Content Section */}
                        <div className={`mt-8 p-6 rounded-lg border ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                            <h3 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                Manage Uploaded Content
                                <span className={`block text-sm font-normal mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                    View and delete content from all branches
                                </span>
                            </h3>

                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                                    Select Subject to Manage
                                </label>
                                <select
                                    value={manageSubject}
                                    onChange={(e) => setManageSubject(e.target.value)}
                                    className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        isLightMode
                                            ? 'bg-white border-gray-300 text-gray-900'
                                            : 'bg-gray-700 border-gray-600 text-white'
                                    }`}
                                >
                                    <option value="">Select a subject to view content</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.code} value={subject.code}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {loadingContent && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                        <span className="ml-2">Loading content...</span>
                                    </div>
                                </div>
                            )}

                            {manageSubject && !loadingContent && uploadedContent.length === 0 && (
                                <div className={`text-center py-8 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No content uploaded yet for this subject
                                </div>
                            )}

                            {manageSubject && !loadingContent && uploadedContent.length > 0 && (
                                <div className="space-y-3">
                                    {manageSubjectData && (
                                        <div className={`text-sm mb-4 p-3 rounded ${isLightMode ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-300'}`}>
                                            <strong>Branches:</strong> {manageSubjectData.branches.join(', ')}
                                            <br />
                                            <strong>Total Content:</strong> {uploadedContent.length} items
                                        </div>
                                    )}

                                    {uploadedContent.map((content) => (
                                        <div
                                            key={content._id}
                                            className={`p-4 rounded-lg border flex items-start justify-between ${
                                                isLightMode ? 'bg-gray-50 border-gray-200' : 'bg-gray-700/50 border-gray-600'
                                            }`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                                        content.displayType === 'Notes' ? 'bg-green-100 text-green-800' :
                                                        content.displayType === 'PYQs' ? 'bg-purple-100 text-purple-800' :
                                                        content.displayType === 'Question Banks' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {content.displayType}
                                                    </span>
                                                </div>
                                                <h4 className={`font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                                    {content.title}
                                                </h4>
                                                {content.description && (
                                                    <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                        {content.description}
                                                    </p>
                                                )}
                                                <p className={`text-xs mt-2 ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    Uploaded: {new Date(content.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteContent(content)}
                                                disabled={deletingContent === content._id}
                                                className={`ml-4 px-4 py-2 rounded-md font-medium transition flex items-center gap-2 ${
                                                    deletingContent === content._id
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : isLightMode
                                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                                            : 'bg-red-500 hover:bg-red-600 text-white'
                                                } disabled:opacity-50`}
                                            >
                                                {deletingContent === content._id ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Deleting...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        <span>Delete</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        </>
                    )}
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminPanel;
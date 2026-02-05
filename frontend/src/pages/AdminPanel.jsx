import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import GameifiedLoader from '../components/GameifiedLoader';
import { apiClient, subjectAPI, uploadAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useAuth } from '../utils/hooks';

const CONTENT_TYPES = {
    notes: { label: 'Notes', hasModules: true },
    pyqs: { label: 'PYQs', hasModules: false },
    questionBanks: { label: 'Question Banks', hasModules: false },
    syllabus: { label: 'Syllabus', hasModules: false }
};

const getBackendContentType = (frontendType) => {
    if (frontendType === 'syllabus') {
        return 'syllabus';
    }
    if (['notes', 'pyqs', 'questionBanks'].includes(frontendType)) {
        return frontendType;
    }
    return 'resources';
};

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

    // Study materials state
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedContentType, setSelectedContentType] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

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

    // Study materials functions
    const loadSubjects = async () => {
        try {
            // Only try the branches that actually work (from your logs)
            const workingBranches = ['CS', 'IS', 'EC', 'EE', 'ME'];
            let allSubjects = [];
            
            // Load subjects from all working branches in parallel for speed
            const promises = workingBranches.map(async (branch) => {
                try {
                    const response = await subjectAPI.getSubjectsByBranch(branch);
                    return response.data || [];
                } catch {
                    return []; // Silent fail, return empty array
                }
            });
            
            const results = await Promise.all(promises);
            
            // Combine all results and remove duplicates by subject code
            results.forEach(subjects => {
                subjects.forEach(subject => {
                    if (!allSubjects.find(s => s.code === subject.code)) {
                        allSubjects.push(subject);
                    }
                });
            });
            
            setSubjects(allSubjects);
            
            // Only log if there's an issue
            if (allSubjects.length === 0) {
                console.warn('No subjects found. Check if backend is running.');
            }
            
        } catch (error) {
            console.error('Error loading subjects:', error);
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!file) {
            alert('Please select a file to upload');
            return;
        }
        if (!selectedSubject) {
            alert('Please select a subject');
            return;
        }
        if (!selectedContentType) {
            alert('Please select a content type');
            return;
        }
        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        const contentTypeConfig = CONTENT_TYPES[selectedContentType];
        if (contentTypeConfig.hasModules && !selectedModule) {
            alert('Please select a module for this content type');
            return;
        }

        setUploadLoading(true);

        try {
            let uploadResponse;
            
            if (contentTypeConfig.hasModules) {
                // Module-level content (notes) - use legacy notes upload endpoint
                uploadResponse = await uploadAPI.uploadNotes(selectedSubject, selectedModule, file);
            } else {
                // Subject-level content (syllabus, resources) - use content endpoint
                uploadResponse = await uploadAPI.uploadSubjectContent(
                    selectedSubject, 
                    getBackendContentType(selectedContentType), 
                    file, 
                    title.trim(), 
                    description.trim()
                );
            }
            
            alert('File uploaded successfully!');
            
            // Reset form
            setFile(null);
            setTitle('');
            setDescription('');
            setSelectedModule('');
            
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';
            
        } catch (error) {
            console.error('Upload failed:', error);
            
            let errorMessage = 'Upload failed. ';
            
            if (error.response?.status === 404) {
                errorMessage += 'Backend server is not running or API endpoint not found.';
            } else if (error.response?.status === 401) {
                errorMessage += 'You need to be logged in as admin.';
            } else if (error.response?.status === 413) {
                errorMessage += 'File is too large.';
            } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                errorMessage += 'Cannot connect to server. Make sure backend is running on port 5000.';
            } else {
                errorMessage += error.response?.data?.error || error.message || 'Please try again.';
            }
            
            alert(errorMessage);
        } finally {
            setUploadLoading(false);
        }
    };

    // Load data on mount and tab change
    useEffect(() => {
        if (activeTab === 'reviews') {
            if (reviewsActiveTab === 'feedback') loadFeedback();
            else if (reviewsActiveTab === 'bugs') loadBugs();
            else if (reviewsActiveTab === 'users') loadUsers();
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

    const selectedSubjectData = subjects.find(s => s._id === selectedSubject);
    const contentTypeConfig = selectedContentType ? CONTENT_TYPES[selectedContentType] : null;

    if (!isAdmin) {
        return null;
    }

    return (
        <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
            <GameifiedLoader 
                isLoading={uploadLoading} 
                loadingText="Uploading Study Material" 
                variant="upload"
                tips={[
                    "📤 Your file is being uploaded to help students learn!",
                    "🏆 Every upload contributes to the knowledge base",
                    "⚡ Large files might take a moment - quality education takes time",
                    "🎓 You're making a difference by sharing educational content",
                    "🚀 Almost done! Your material will be available soon"
                ]}
            />
            
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
                </div>
            )}

            {activeTab === 'materials' && (
                <div className="space-y-6">
                    <div>
                        <h1 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                            Study Materials Management
                        </h1>
                        <p className={`text-sm mt-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                            Upload and manage study materials for all subjects
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
                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className={`p-6 rounded-lg border ${isLightMode ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
                                <h3 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                    Upload Study Material
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                                            Subject *
                                        </label>
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                isLightMode
                                                    ? 'bg-white border-gray-300 text-gray-900'
                                                    : 'bg-gray-700 border-gray-600 text-white'
                                            }`}
                                            required
                                        >
                                            <option value="">Select a subject</option>
                                            {subjects.length === 0 && !loading ? (
                                                <option disabled>No subjects found - check console</option>
                                            ) : (
                                                subjects.map((subject) => (
                                                    <option key={subject._id} value={subject._id}>
                                                        {subject.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {subjects.length === 0 && !loading && (
                                            <p className={`text-xs mt-1 ${isLightMode ? 'text-red-500' : 'text-red-400'}`}>
                                                No subjects loaded. Make sure backend server is running on port 5000.
                                            </p>
                                        )}
                                        {loading && (
                                            <p className={`text-xs mt-1 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Loading subjects...
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                                            Content Type *
                                        </label>
                                        <select
                                            value={selectedContentType}
                                            onChange={(e) => {
                                                setSelectedContentType(e.target.value);
                                                setSelectedModule('');
                                            }}
                                            className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                isLightMode
                                                    ? 'bg-white border-gray-300 text-gray-900'
                                                    : 'bg-gray-700 border-gray-600 text-white'
                                            }`}
                                            required
                                        >
                                            <option value="">Select content type</option>
                                            {Object.entries(CONTENT_TYPES).map(([key, config]) => (
                                                <option key={key} value={key}>
                                                    {config.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {contentTypeConfig?.hasModules && selectedSubjectData && (
                                        <div className="md:col-span-2">
                                            <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                                                Module *
                                            </label>
                                            <select
                                                value={selectedModule}
                                                onChange={(e) => setSelectedModule(e.target.value)}
                                                className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    isLightMode
                                                        ? 'bg-white border-gray-300 text-gray-900'
                                                        : 'bg-gray-700 border-gray-600 text-white'
                                                }`}
                                                required
                                            >
                                                <option value="">Select a module</option>
                                                {selectedSubjectData.modules?.map((module) => (
                                                    <option key={module._id} value={module._id}>
                                                        Module {module.number}: {module.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="md:col-span-2">
                                        <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                isLightMode
                                                    ? 'bg-white border-gray-300 text-gray-900'
                                                    : 'bg-gray-700 border-gray-600 text-white'
                                            }`}
                                            placeholder="Enter title for the material"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                                            Description (optional)
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                isLightMode
                                                    ? 'bg-white border-gray-300 text-gray-900'
                                                    : 'bg-gray-700 border-gray-600 text-white'
                                            }`}
                                            placeholder="Enter description (optional)"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                                            File *
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                isLightMode
                                                    ? 'bg-white border-gray-300 text-gray-900'
                                                    : 'bg-gray-700 border-gray-600 text-white'
                                            }`}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                                            required
                                        />
                                        <p className={`text-xs mt-1 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            Supported formats: PDF, DOC, DOCX, PPT, PPTX
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        type="submit"
                                        disabled={uploadLoading || !file || !selectedSubject || !selectedContentType || !title.trim() || (contentTypeConfig?.hasModules && !selectedModule)}
                                        className={`w-full md:w-auto px-6 py-2 rounded-md font-medium transition flex items-center gap-2 ${
                                            uploadLoading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : isLightMode
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {uploadLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <span>Upload Material</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminPanel;
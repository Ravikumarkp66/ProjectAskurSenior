import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectAPI, uploadAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const CONTENT_TYPES = {
    notes: { label: 'Notes', icon: 'notes', color: 'green' },
    pyqs: { label: 'PYQs', icon: 'pyq', color: 'purple' },
    questionBanks: { label: 'Question Banks', icon: 'qbank', color: 'blue' },
    syllabus: { label: 'Syllabus', icon: 'syllabus', color: 'orange' }
};

const ContentIcon = ({ type, className = "w-5 h-5" }) => {
    const icons = {
        notes: (
            <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3.5H14C14.5523 3.5 15 3.94772 15 4.5V16.5L12.5 15L10 16.5L7.5 15L5 16.5V4.5C5 3.94772 5.44772 3.5 6 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M7 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        pyq: (
            <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3H5C3.89543 3 3 3.89543 3 5V9M9 3H15M9 3V7M15 3H19C20.1046 3 21 3.89543 21 5V9M15 3V7M3 9V15M3 9H7M21 9V15M21 9H17M3 15V19C3 20.1046 3.89543 21 5 21H9M3 15H7M21 15V19C21 20.1046 20.1046 21 19 21H15M21 15H17M9 21H15M9 21V17M15 21V17" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
        qbank: (
            <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
        ),
        syllabus: (
            <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 12H15M9 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        )
    };
    return icons[type] || icons.notes;
};

const AdminStudyMaterialsPage = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const isAdmin = user?.isAdmin;

    const [allSubjects, setAllSubjects] = useState([]);
    const [uniqueSubjects, setUniqueSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjectContent, setSubjectContent] = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('notes');
    const [selectedModule, setSelectedModule] = useState(null);
    const [uploadModal, setUploadModal] = useState({ show: false, type: '', moduleNumber: null });
    const [uploadLoading, setUploadLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfTitle, setPdfTitle] = useState('');

    const [theme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const isLightMode = theme === 'light';

    // Redirect non-admins
    useEffect(() => {
        if (!isAdmin) {
            navigate('/dashboard');
        }
    }, [isAdmin, navigate]);

    // Load all subjects and group by code
    useEffect(() => {
        loadAllSubjects();
    }, []);

    const loadAllSubjects = async () => {
        try {
            setLoading(true);
            // Fetch subjects from multiple branches to get all unique codes
            const branches = ['CS', 'IS', 'EC', 'EE', 'ME', 'CV', 'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS'];
            const cycles = ['P', 'C'];
            
            const allSubjectsMap = new Map();
            
            for (const branch of branches) {
                for (const cycle of cycles) {
                    try {
                        const response = await subjectAPI.getSubjectsByBranch(branch, cycle);
                        const subjects = response.data || [];
                        subjects.forEach(subject => {
                            const code = subject.code.toUpperCase();
                            if (!allSubjectsMap.has(code)) {
                                allSubjectsMap.set(code, {
                                    code,
                                    name: subject.name,
                                    _id: subject._id,
                                    credits: subject.credits,
                                    branches: [{ branch, cycle, _id: subject._id }],
                                    modules: subject.modules
                                });
                            } else {
                                const existing = allSubjectsMap.get(code);
                                existing.branches.push({ branch, cycle, _id: subject._id });
                            }
                        });
                    } catch (e) {
                        // Skip branches that fail
                    }
                }
            }

            const uniqueList = Array.from(allSubjectsMap.values()).sort((a, b) => 
                a.name.localeCompare(b.name)
            );
            setUniqueSubjects(uniqueList);
        } catch (error) {
            console.error('Error loading subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSubjectContent = async (subject) => {
        try {
            setContentLoading(true);
            setSelectedSubject(subject);
            const response = await subjectAPI.getSubjectContent(subject._id);
            setSubjectContent(response.data);
            if (response.data.modules?.length > 0) {
                setSelectedModule(response.data.modules[0].moduleNumber);
            }
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setContentLoading(false);
        }
    };

    const handleViewContent = async (contentType, contentId, moduleNumber = null) => {
        if (!selectedSubject) return;
        try {
            let response;
            if (moduleNumber) {
                response = await subjectAPI.getModuleContentUrl(selectedSubject._id, moduleNumber, contentType, contentId);
            } else {
                response = await subjectAPI.getContentUrl(selectedSubject._id, contentType, contentId);
            }
            setPdfUrl(response.data.url);
            setPdfTitle(response.data.title);
            setShowPdfModal(true);
        } catch (error) {
            console.error('Error getting content URL:', error);
            alert(error.response?.data?.error || 'Failed to load content');
        }
    };

    const handleUploadClick = (contentType, moduleNumber = null) => {
        setUploadModal({ show: true, type: contentType, moduleNumber });
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const file = formData.get('file');
        const title = formData.get('title');
        const description = formData.get('description');

        if (!file || !title) {
            alert('Please provide both file and title');
            return;
        }

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file only');
            return;
        }

        setUploadLoading(true);
        try {
            const { type, moduleNumber } = uploadModal;
            
            // Use bulk upload API to upload to ALL subjects with this code
            if (moduleNumber) {
                await uploadAPI.bulkUploadModuleContent(selectedSubject.code, moduleNumber, type, file, title, description);
            } else {
                await uploadAPI.bulkUploadSubjectContent(selectedSubject.code, type, file, title, description);
            }
            
            alert(`Content uploaded successfully to all branches with code ${selectedSubject.code}!`);
            setUploadModal({ show: false, type: '', moduleNumber: null });
            loadSubjectContent(selectedSubject); // Refresh content
        } catch (error) {
            console.error('Error uploading:', error);
            alert(error.response?.data?.error || 'Upload failed');
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDeleteContent = async (contentType, title, moduleNumber = null) => {
        if (!confirm('Are you sure you want to delete this content from ALL branches?')) return;

        try {
            // Use bulk delete API to delete from ALL subjects with this code
            if (moduleNumber) {
                await uploadAPI.bulkDeleteModuleContent(selectedSubject.code, moduleNumber, contentType, title);
            } else {
                await uploadAPI.bulkDeleteSubjectContent(selectedSubject.code, contentType, title);
            }
            alert('Content deleted from all branches successfully');
            loadSubjectContent(selectedSubject);
        } catch (error) {
            console.error('Error deleting:', error);
            alert(error.response?.data?.error || 'Delete failed');
        }
    };

    const getColorClasses = (color, variant = 'bg') => {
        const colors = {
            green: {
                bg: isLightMode ? 'bg-green-100 text-green-700 border-green-300' : 'bg-green-600/20 text-green-300 border-green-400/40',
                hover: isLightMode ? 'hover:bg-green-200' : 'hover:bg-green-600/30'
            },
            purple: {
                bg: isLightMode ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-purple-600/20 text-purple-300 border-purple-400/40',
                hover: isLightMode ? 'hover:bg-purple-200' : 'hover:bg-purple-600/30'
            },
            blue: {
                bg: isLightMode ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-blue-600/20 text-blue-300 border-blue-400/40',
                hover: isLightMode ? 'hover:bg-blue-200' : 'hover:bg-blue-600/30'
            },
            orange: {
                bg: isLightMode ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-orange-600/20 text-orange-300 border-orange-400/40',
                hover: isLightMode ? 'hover:bg-orange-200' : 'hover:bg-orange-600/30'
            }
        };
        return colors[color]?.[variant] || colors.green[variant];
    };

    const getGradientColor = (color, variant = 'normal') => {
        const gradients = {
            green: {
                normal: 'from-green-500 via-emerald-500 to-teal-500',
                hover: 'hover:from-green-500/20 hover:via-emerald-500/20 hover:to-teal-500/20'
            },
            purple: {
                normal: 'from-purple-500 via-violet-500 to-indigo-500',
                hover: 'hover:from-purple-500/20 hover:via-violet-500/20 hover:to-indigo-500/20'
            },
            blue: {
                normal: 'from-blue-500 via-cyan-500 to-indigo-500',
                hover: 'hover:from-blue-500/20 hover:via-cyan-500/20 hover:to-indigo-500/20'
            },
            orange: {
                normal: 'from-orange-500 via-red-500 to-pink-500',
                hover: 'hover:from-orange-500/20 hover:via-red-500/20 hover:to-pink-500/20'
            }
        };
        return gradients[color]?.[variant] || gradients.green[variant];
    };

    const filteredSubjects = uniqueSubjects.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderContentList = (items, contentType, moduleNumber = null, color = 'green') => {
        return (
            <div className="space-y-3">
                {items?.map((item) => (
                    <div
                        key={item._id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition ${
                            isLightMode ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-dark-100 border-white/10 hover:border-white/20'
                        }`}
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 rounded-lg border ${getColorClasses(color)}`}>
                                <ContentIcon type={CONTENT_TYPES[contentType]?.icon || 'notes'} className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className={`font-medium ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    {item.title}
                                </h4>
                                {item.description && (
                                    <p className={`text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleViewContent(contentType, item._id, moduleNumber)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition ${getColorClasses(color)} ${getColorClasses(color, 'hover')}`}
                            >
                                View
                            </button>
                            <button
                                onClick={() => handleDeleteContent(contentType, item.title, moduleNumber)}
                                className={`p-1.5 rounded-lg transition ${
                                    isLightMode ? 'text-red-600 hover:bg-red-100' : 'text-red-400 hover:bg-red-600/20'
                                }`}
                                title="Delete from all branches"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}

                {/* Upload Button */}
                <button
                    onClick={() => handleUploadClick(contentType, moduleNumber)}
                    className={`group w-full flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed transition-all duration-200 ${
                        isLightMode 
                            ? 'border-slate-300 text-slate-500 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/50 hover:shadow-lg' 
                            : 'border-white/20 text-secondary-400 hover:border-primary-500 hover:text-primary-400 hover:bg-primary-600/10 hover:shadow-lg'
                    }`}
                >
                    <div className={`p-3 rounded-xl transition-colors ${
                        isLightMode 
                            ? 'bg-slate-100 group-hover:bg-primary-100' 
                            : 'bg-white/10 group-hover:bg-primary-500/20'
                    }`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-base">
                            🚀 NEW UPLOAD UI - {CONTENT_TYPES[contentType]?.label || contentType}
                        </div>
                        <div className={`text-sm mt-1 ${isLightMode ? 'text-slate-400' : 'text-secondary-500'}`}>
                            Upload to all {selectedSubject?.branches?.length || 0} branch(es)
                        </div>
                    </div>
                </button>
            </div>
        );
    };

    if (!isAdmin) {
        return null;
    }

    if (loading) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${isLightMode ? 'bg-white' : 'bg-primary-950'}`}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-700 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className={isLightMode ? 'text-slate-600' : 'text-secondary-400'}>Loading subjects...</p>
                </div>
            </div>
        );
    }

    const currentModule = subjectContent?.modules?.find(m => m.moduleNumber === selectedModule);

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-slate-50' : 'bg-primary-950'}`}>
            {/* Header */}
            <div className={`sticky top-0 z-40 border-b ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className={`p-2 rounded-lg transition ${
                                    isLightMode ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-secondary-300'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                    Admin Study Materials
                                </h1>
                                <p className={`text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                    Upload content for all branches at once
                                </p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            isLightMode ? 'bg-purple-100 text-purple-700' : 'bg-purple-600/20 text-purple-300'
                        }`}>
                            Admin Only
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Subject List */}
                    <div className={`lg:col-span-1 rounded-xl border p-4 h-fit ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search subjects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-lg border transition ${
                                    isLightMode
                                        ? 'bg-white border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                                        : 'bg-dark-50 border-white/10 focus:border-primary-500 text-white placeholder-secondary-500'
                                }`}
                            />
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {filteredSubjects.map((subject) => (
                                <button
                                    key={subject.code}
                                    onClick={() => loadSubjectContent(subject)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                                        selectedSubject?.code === subject.code
                                            ? isLightMode
                                                ? 'bg-primary-100 text-primary-700 border border-primary-300'
                                                : 'bg-primary-600/20 text-primary-300 border border-primary-500/40'
                                            : isLightMode
                                                ? 'hover:bg-slate-50 text-slate-700 border border-transparent'
                                                : 'hover:bg-white/5 text-secondary-300 border border-transparent'
                                    }`}
                                >
                                    <div className="font-medium">{subject.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                            {subject.code}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            isLightMode ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-secondary-400'
                                        }`}>
                                            {subject.branches.length} branch{subject.branches.length > 1 ? 'es' : ''}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-2">
                        {!selectedSubject ? (
                            <div className={`rounded-xl border p-12 text-center ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                                <svg className={`w-16 h-16 mx-auto mb-4 ${isLightMode ? 'text-slate-300' : 'text-secondary-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <h3 className={`text-lg font-semibold mb-2 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                    Select a Subject
                                </h3>
                                <p className={`${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                    Choose a subject from the list to manage its study materials
                                </p>
                            </div>
                        ) : contentLoading ? (
                            <div className={`rounded-xl border p-12 text-center ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                                <div className="w-12 h-12 border-4 border-primary-700 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                                <p className={isLightMode ? 'text-slate-600' : 'text-secondary-400'}>Loading content...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Subject Info */}
                                <div className={`rounded-xl border p-4 ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                                {selectedSubject.name}
                                            </h2>
                                            <p className={`text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                                {selectedSubject.code} • {selectedSubject.credits} Credits
                                            </p>
                                        </div>
                                        <div className={`text-right ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}>
                                            <p className="text-sm font-medium">Available in:</p>
                                            <p className="text-xs">
                                                {selectedSubject.branches.map(b => `${b.branch} (${b.cycle})`).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Tabs */}
                                <div className={`flex flex-wrap gap-2 p-1 rounded-xl ${isLightMode ? 'bg-slate-100' : 'bg-dark-100'}`}>
                                    {Object.entries(CONTENT_TYPES).map(([key, { label }]) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveTab(key)}
                                            className={`flex-1 min-w-[80px] px-4 py-2.5 text-sm font-semibold rounded-lg transition ${
                                                activeTab === key
                                                    ? isLightMode
                                                        ? 'bg-white text-slate-900 shadow-sm'
                                                        : 'bg-primary-600 text-white'
                                                    : isLightMode
                                                        ? 'text-slate-600 hover:text-slate-900'
                                                        : 'text-secondary-400 hover:text-white'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Syllabus Tab - Subject Level */}
                                {activeTab === 'syllabus' && (
                                    <div className={`rounded-xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                                        <h3 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                            Syllabus
                                        </h3>
                                        {renderContentList(subjectContent?.syllabus || [], 'syllabus', null, 'orange')}
                                    </div>
                                )}

                                {/* Module-based Content */}
                                {['notes', 'pyqs', 'questionBanks'].includes(activeTab) && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* Module Selector */}
                                        <div className={`md:col-span-1 rounded-xl border p-4 h-fit ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                                            <h4 className={`text-sm font-semibold mb-3 ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}>
                                                Modules
                                            </h4>
                                            <div className="space-y-1">
                                                {subjectContent?.modules?.map((module) => (
                                                    <button
                                                        key={module.moduleNumber}
                                                        onClick={() => setSelectedModule(module.moduleNumber)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                                                            selectedModule === module.moduleNumber
                                                                ? isLightMode
                                                                    ? 'bg-primary-100 text-primary-700'
                                                                    : 'bg-primary-600/20 text-primary-300'
                                                                : isLightMode
                                                                    ? 'hover:bg-slate-50 text-slate-700'
                                                                    : 'hover:bg-white/5 text-secondary-300'
                                                        }`}
                                                    >
                                                        {module.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Content List */}
                                        <div className={`md:col-span-3 rounded-xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-dark-100 border-white/10'}`}>
                                            <h3 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                                {currentModule?.title} - {CONTENT_TYPES[activeTab]?.label}
                                            </h3>
                                            {currentModule && renderContentList(
                                                currentModule[activeTab] || [],
                                                activeTab,
                                                selectedModule,
                                                CONTENT_TYPES[activeTab]?.color
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PDF Preview Modal */}
            {showPdfModal && pdfUrl && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setShowPdfModal(false)}
                >
                    <div 
                        className={`relative w-full max-w-5xl h-[90vh] rounded-lg overflow-hidden ${
                            isLightMode ? 'bg-white' : 'bg-dark-100'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${
                            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-dark-50 border-white/10'
                        }`}>
                            <h3 className={`font-semibold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                                {pdfTitle}
                            </h3>
                            <div className="flex items-center gap-2">
                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                                        isLightMode
                                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                            : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30'
                                    }`}
                                >
                                    Open in New Tab
                                </a>
                                <button
                                    onClick={() => setShowPdfModal(false)}
                                    className={`p-2 rounded-lg transition ${
                                        isLightMode ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-white'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <iframe
                            src={pdfUrl}
                            className="w-full h-[calc(90vh-60px)]"
                            title={pdfTitle}
                        />
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {uploadModal.show && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setUploadModal({ show: false, type: '', moduleNumber: null })}
                >
                    <div 
                        className={`relative w-full max-w-md rounded-xl overflow-hidden ${
                            isLightMode ? 'bg-white' : 'bg-dark-100'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`px-6 py-4 border-b ${
                            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-dark-50 border-white/10'
                        }`}>
                            <h3 className={`text-lg font-semibold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                                Upload {CONTENT_TYPES[uploadModal.type]?.label}
                            </h3>
                            <p className={`text-sm ${isLightMode ? 'text-slate-500' : 'text-secondary-400'}`}>
                                {selectedSubject?.code} • {uploadModal.moduleNumber ? `Module ${uploadModal.moduleNumber}` : 'Subject Level'}
                            </p>
                            <p className={`text-xs mt-1 ${isLightMode ? 'text-amber-600' : 'text-amber-400'}`}>
                                ⚠️ This will be uploaded to all {selectedSubject?.branches.length} branch(es)
                            </p>
                        </div>
                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-slate-700' : 'text-secondary-200'}`}>
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition focus:outline-none ${
                                        isLightMode
                                            ? 'bg-slate-50 border-slate-200 focus:border-primary-500 focus:bg-white'
                                            : 'bg-dark-50 border-white/10 focus:border-primary-500 text-white focus:bg-dark-100'
                                    }`}
                                    placeholder="e.g., Data Structures - Complete Notes"
                                />
                            </div>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-slate-700' : 'text-secondary-200'}`}>
                                    Description (Optional)
                                </label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition resize-none focus:outline-none ${
                                        isLightMode
                                            ? 'bg-slate-50 border-slate-200 focus:border-primary-500 focus:bg-white'
                                            : 'bg-dark-50 border-white/10 focus:border-primary-500 text-white focus:bg-dark-100'
                                    }`}
                                    placeholder="Add a brief description of the content..."
                                />
                            </div>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-3 ${isLightMode ? 'text-slate-700' : 'text-secondary-200'}`}>
                                    Upload PDF File *
                                </label>
                                <div 
                                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition hover:border-primary-400 ${
                                        isLightMode
                                            ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                                            : 'border-white/20 bg-dark-50 hover:bg-dark-100 hover:border-primary-500'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        name="file"
                                        accept=".pdf"
                                        required
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            const fileName = file ? file.name : 'No file selected';
                                            const fileSize = file ? (file.size / (1024 * 1024)).toFixed(2) : 0;
                                            const display = document.getElementById('file-display');
                                            if (display) {
                                                display.innerHTML = file 
                                                    ? `<strong>${fileName}</strong><br><span class="text-sm opacity-75">${fileSize} MB</span>`
                                                    : 'Drop PDF file here or click to browse';
                                            }
                                        }}
                                    />
                                    <div className="flex flex-col items-center">
                                        <svg className={`w-12 h-12 mb-3 ${isLightMode ? 'text-slate-400' : 'text-secondary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <div 
                                            id="file-display"
                                            className={`text-sm font-medium ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}
                                        >
                                            Drop PDF file here or click to browse
                                        </div>
                                        <p className={`text-xs mt-2 ${isLightMode ? 'text-slate-400' : 'text-secondary-500'}`}>
                                            Maximum file size: 50MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`flex items-center gap-3 p-4 rounded-xl ${
                                isLightMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-700/30'
                            }`}>
                                <svg className={`w-5 h-5 ${isLightMode ? 'text-amber-600' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <div>
                                    <p className={`text-sm font-medium ${isLightMode ? 'text-amber-800' : 'text-amber-200'}`}>
                                        Bulk Upload Warning
                                    </p>
                                    <p className={`text-xs ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
                                        This file will be uploaded to all {selectedSubject?.branches.length} branch(es) for {selectedSubject?.code}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setUploadModal({ show: false, type: '', moduleNumber: null })}
                                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition ${
                                        isLightMode
                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadLoading}
                                    className="flex-1 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploadLoading ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                                            </svg>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                                            </svg>
                                            Upload to All Branches
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudyMaterialsPage;

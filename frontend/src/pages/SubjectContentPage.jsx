import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subjectAPI } from '../services/api';
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
                <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
        syllabus: (
            <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 12H15M9 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        )
    };
    return icons[type] || icons.notes;
};

const SubjectContentPage = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [subject, setSubject] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('notes');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfTitle, setPdfTitle] = useState('');
    const [showPdfModal, setShowPdfModal] = useState(false);

    const [theme] = useState(() => {
        try {
            return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });
    const isLightMode = theme === 'light';

    useEffect(() => {
        loadContent();
    }, [subjectId]);

    const loadContent = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await subjectAPI.getSubjectContent(subjectId);
            const data = response.data;

            if (!data) {
                setError('Subject not found');
                return;
            }

            setSubject(data);

            // Simplified content loading - just use current subject's content for now
            const flattenedContent = {
                notes: data.notes || [],
                pyqs: data.pyqs || [],
                questionBanks: data.questionBanks || [],
                syllabus: data.syllabus || []
            };

            setContent(flattenedContent);
        } catch (error) {
            console.error('Error loading content:', error);
            if (error.response?.status === 404) {
                setError('Subject not found');
            } else {
                setError('Failed to load content. Please try again.');
            }
            setContent({ notes: [], pyqs: [], questionBanks: [], syllabus: [] });
        } finally {
            setLoading(false);
        }
    };

    const handleViewContent = async (contentType, contentId) => {
        try {
            const response = await subjectAPI.getContentUrl(subjectId, contentType, contentId);
            setPdfUrl(response.data.url);
            setPdfTitle(response.data.title);
            setShowPdfModal(true);
        } catch (error) {
            console.error('Error getting content URL:', error);
            alert(error.response?.data?.error || 'Failed to load content');
        }
    };

    const getGradientColor = (color) => {
        const gradients = {
            green: isLightMode ? 'from-green-500 to-emerald-600' : 'from-green-400 to-emerald-500',
            purple: isLightMode ? 'from-purple-500 to-violet-600' : 'from-purple-400 to-violet-500',
            blue: isLightMode ? 'from-blue-500 to-indigo-600' : 'from-blue-400 to-indigo-500',
            orange: isLightMode ? 'from-orange-500 to-red-600' : 'from-orange-400 to-red-500'
        };
        return gradients[color] || gradients.green;
    };

    const renderContentList = (contentType) => {
        if (!content || !content[contentType]) return null;
        const items = content[contentType];
        const { color } = CONTENT_TYPES[contentType];

        if (items.length === 0) {
            return (
                <div className="text-center py-12">
                    <ContentIcon type={contentType} className={`w-16 h-16 mx-auto mb-4 ${isLightMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <p className={`${isLightMode ? 'text-gray-500' : 'text-gray-400'} text-lg`}>
                        No {CONTENT_TYPES[contentType].label.toLowerCase()} available yet
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {items.map((item, index) => (
                    <div
                        key={item._id || index}
                        className={`${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 border ${isLightMode ? 'border-gray-200' : 'border-gray-700'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getGradientColor(color)} flex items-center justify-center flex-shrink-0`}>
                                    <ContentIcon type={contentType} className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'} text-lg mb-1`}>
                                        {item.title}
                                    </h4>
                                    {item.description && (
                                        <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleViewContent(contentType, item._id)}
                                className={`px-6 py-2 text-sm font-medium rounded-lg transition bg-gradient-to-r ${getGradientColor(color)} text-white hover:shadow-lg hover:scale-105`}
                            >
                                View
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${isLightMode ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className={`${isLightMode ? 'text-gray-700' : 'text-gray-300'} font-semibold`}>Loading content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${isLightMode ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'} mb-2`}>
                        {error}
                    </h2>
                    <p className={`${isLightMode ? 'text-gray-600' : 'text-gray-400'} mb-6`}>
                        The content you're looking for might have been moved or doesn't exist.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-gray-50' : 'bg-gray-900'}`}>
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-lg ${isLightMode ? 'bg-white hover:bg-gray-50' : 'bg-gray-800 hover:bg-gray-700'} shadow-lg transition-colors`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className={`text-3xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'} mb-2`}>
                                {subject?.subjectInfo?.name || subject?.name || ''}
                            </h1>
                            <p className={`${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>
                                Access comprehensive study materials, previous year questions, and resources.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area with Sidebar */}
                <div className="flex gap-6">
                    {/* Compact Sidebar Navigation */}
                    <div className={`w-64 ${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-xl shadow-lg p-4 h-fit sticky top-6`}>
                        <h3 className={`text-lg font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'} mb-4`}>
                            Study Materials
                        </h3>
                        <nav className="space-y-2">
                            {Object.entries(CONTENT_TYPES).map(([type, config]) => (
                                <button
                                    key={type}
                                    onClick={() => setActiveTab(type)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === type
                                        ? `bg-gradient-to-r ${getGradientColor(config.color)} text-white shadow-lg`
                                        : `${isLightMode ? 'hover:bg-gray-50' : 'hover:bg-gray-700'} ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === type
                                        ? 'bg-white/20'
                                        : isLightMode
                                            ? `bg-${config.color}-100`
                                            : `bg-${config.color}-600/20`
                                        }`}>
                                        <ContentIcon type={config.icon} className={`w-4 h-4 ${activeTab === type
                                            ? 'text-white'
                                            : isLightMode
                                                ? `text-${config.color}-600`
                                                : `text-${config.color}-400`
                                            }`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-medium ${activeTab === type ? 'text-white' : ''}`}>
                                            {config.label}
                                        </div>
                                        <div className={`text-xs ${activeTab === type
                                            ? 'text-white/80'
                                            : isLightMode
                                                ? 'text-gray-500'
                                                : 'text-gray-400'
                                            }`}>
                                            {content && content[type] ? `${content[type].length} items` : '0 items'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {/* Content Header */}
                        <div className={`${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-xl shadow-lg p-6 mb-6`}>
                            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4 bg-gradient-to-r ${getGradientColor(CONTENT_TYPES[activeTab]?.color)} text-white`}>
                                <ContentIcon type={CONTENT_TYPES[activeTab]?.icon} className="w-4 h-4 mr-2" />
                                {CONTENT_TYPES[activeTab]?.label} Library
                            </div>
                            <h1 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'} mb-2`}>
                                {CONTENT_TYPES[activeTab]?.label} Collection
                            </h1>
                            <p className={`${isLightMode ? 'text-gray-600' : 'text-gray-300'}`}>
                                Browse all available {CONTENT_TYPES[activeTab]?.label.toLowerCase()} for this subject.
                            </p>
                        </div>

                        {/* Content List */}
                        <div className={`${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-xl shadow-lg p-6`}>
                            {renderContentList(activeTab)}
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Modal */}
            {showPdfModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-lg w-full max-w-4xl h-[80vh] flex flex-col`}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className={`text-lg font-semibold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                {pdfTitle}
                            </h3>
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className={`p-2 rounded-lg ${isLightMode ? 'hover:bg-gray-100' : 'hover:bg-gray-700'} transition-colors`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 p-4">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full rounded-lg"
                                title={pdfTitle}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectContentPage;
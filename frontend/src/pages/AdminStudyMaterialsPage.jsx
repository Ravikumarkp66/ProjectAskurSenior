import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectAPI, uploadAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const CONTENT_TYPES = {
    notes: { label: 'Notes', hasModules: true },
    pyqs: { label: 'PYQs', hasModules: false },
    questionBanks: { label: 'Question Banks', hasModules: false },
    syllabus: { label: 'Syllabus', hasModules: false }
};

// Map frontend content types to backend expected values
const getBackendContentType = (frontendType) => {
    // For module-level endpoints, use exact content type names
    // For subject-level endpoints, map to 'resources' except syllabus
    if (frontendType === 'syllabus') {
        return 'syllabus';
    }
    // For module-level content, return exact type for validation
    if (['notes', 'pyqs', 'questionBanks'].includes(frontendType)) {
        return frontendType;
    }
    // Fallback for subject-level content
    return 'resources';
};

const AdminStudyMaterialsPage = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const isAdmin = user?.isAdmin;

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

    // Redirect non-admins
    useEffect(() => {
        if (!isAdmin) {
            navigate('/dashboard');
        }
    }, [isAdmin, navigate]);

    // Load all subjects
    useEffect(() => {
        loadAllSubjects();
    }, []);

    const loadAllSubjects = async () => {
        try {
            setLoading(true);
            const branches = ['CS', 'IS', 'EC', 'EE', 'ME', 'CV', 'CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS'];
            const cycles = ['P', 'C'];
            
            const allSubjectsMap = new Map();
            
            for (const branch of branches) {
                for (const cycle of cycles) {
                    try {
                        const response = await subjectAPI.getSubjectsByBranch(branch, cycle);
                        const subjects = response.data || [];
                        subjects.forEach(subject => {
                            const code = subject.code?.toUpperCase();
                            if (code && !allSubjectsMap.has(code)) {
                                allSubjectsMap.set(code, {
                                    code,
                                    name: subject.name,
                                    credits: subject.credits,
                                    modules: subject.modules || []
                                });
                            }
                        });
                    } catch (e) {
                        // Skip branches that fail
                    }
                }
            }

            const uniqueList = Array.from(allSubjectsMap.values()).sort((a, b) => 
                b.credits - a.credits
            );
            setSubjects(uniqueList);
        } catch (error) {
            console.error('Error loading subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedSubjectData = () => {
        return subjects.find(s => s.code === selectedSubject);
    };

    const handleSubjectChange = (e) => {
        setSelectedSubject(e.target.value);
        setSelectedModule(''); // Reset module selection
    };

    const handleContentTypeChange = (e) => {
        setSelectedContentType(e.target.value);
        setSelectedModule(''); // Reset module selection
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type !== 'application/pdf') {
            // Better UX: Show error message in UI instead of alert
            console.error('Invalid file type. Please upload PDF only.');
            e.target.value = '';
            setFile(null);
            return;
        }
        setFile(selectedFile);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedSubject || !selectedContentType || !file || !title) {
            // Better UX: Show validation message in UI
            console.error('Please fill all required fields');
            return;
        }

        setUploadLoading(true);
        try {
            const contentType = CONTENT_TYPES[selectedContentType];
            const backendContentType = getBackendContentType(selectedContentType);
            
            if (contentType.hasModules && selectedModule && selectedModule !== 'all') {
                // Upload to specific module
                await uploadAPI.bulkUploadModuleContent(
                    selectedSubject, 
                    parseInt(selectedModule), 
                    backendContentType, 
                    file, 
                    title, 
                    description
                );
                alert(`${contentType.label} uploaded successfully to Module ${selectedModule} for all branches!`);
            } else {
                // Upload to subject level (or all modules)
                await uploadAPI.bulkUploadSubjectContent(
                    selectedSubject, 
                    backendContentType, 
                    file, 
                    title, 
                    description
                );
                alert(`${contentType.label} uploaded successfully to all branches!`);
            }

            // Reset form
            setSelectedSubject('');
            setSelectedContentType('');
            setSelectedModule('');
            setFile(null);
            setTitle('');
            setDescription('');
            document.querySelector('form').reset();

        } catch (error) {
            console.error('Error uploading:', error);
            alert(error.response?.data?.error || 'Failed to upload content');
        } finally {
            setUploadLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${isLightMode ? 'bg-gray-50' : 'bg-gray-900'} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className={`${isLightMode ? 'text-gray-700' : 'text-gray-300'} font-semibold`}>Loading subjects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-gray-50' : 'bg-gray-900'}`}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-lg ${isLightMode ? 'bg-white hover:bg-gray-50' : 'bg-gray-800 hover:bg-gray-700'} border ${isLightMode ? 'border-gray-200' : 'border-gray-700'} transition-colors`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                                Admin Study Materials
                            </h1>
                            <p className={`${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                Upload content for all branches at once
                            </p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        Admin Only
                    </span>
                </div>

                {/* Upload Form */}
                <div className={`max-w-2xl mx-auto ${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-lg p-8`}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Subject Selection */}
                        <div>
                            <label className={`block text-sm font-medium ${isLightMode ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
                                Select Subject *
                            </label>
                            <select
                                value={selectedSubject}
                                onChange={handleSubjectChange}
                                className={`w-full p-3 border rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                required
                            >
                                <option value="">Choose a subject...</option>
                                {subjects.map(subject => (
                                    <option key={subject.code} value={subject.code}>
                                        {subject.name} ({subject.code}) - {subject.credits} Credits
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Content Type Selection */}
                        <div>
                            <label className={`block text-sm font-medium ${isLightMode ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
                                Content Type *
                            </label>
                            <select
                                value={selectedContentType}
                                onChange={handleContentTypeChange}
                                className={`w-full p-3 border rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                required
                            >
                                <option value="">Choose content type...</option>
                                {Object.entries(CONTENT_TYPES).map(([key, config]) => (
                                    <option key={key} value={key}>
                                        {config.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Module Selection (only for Notes) */}
                        {selectedContentType && CONTENT_TYPES[selectedContentType].hasModules && getSelectedSubjectData()?.modules?.length > 0 && (
                            <div>
                                <label className={`block text-sm font-medium ${isLightMode ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
                                    Module
                                </label>
                                <select
                                    value={selectedModule}
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                    className={`w-full p-3 border rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                >
                                    <option value="">Choose module...</option>
                                    <option value="all">All Modules</option>
                                    {getSelectedSubjectData().modules.map(module => (
                                        <option key={module.moduleNumber} value={module.moduleNumber}>
                                            Module {module.moduleNumber}: {module.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* File Upload */}
                        <div>
                            <label className={`block text-sm font-medium ${isLightMode ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
                                Upload File (PDF only) *
                            </label>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className={`w-full p-3 border rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                required
                            />
                        </div>

                        {/* Title */}
                        <div>
                            <label className={`block text-sm font-medium ${isLightMode ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
                                Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter content title"
                                className={`w-full p-3 border rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className={`block text-sm font-medium ${isLightMode ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter content description"
                                rows="3"
                                className={`w-full p-3 border rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={uploadLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {uploadLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload to All Branches
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminStudyMaterialsPage;
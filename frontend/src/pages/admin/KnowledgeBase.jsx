import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/api';
import axios from 'axios';

const CATEGORIES = [
    'College Rules',
    'Attendance',
    'Placements',
    'Exams',
    'Hostel',
    'FAQs',
    'General'
];

const KnowledgeBase = () => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [title, setTitle] = useState('');
    const [toastMsg, setToastMsg] = useState(null); // { type: 'success' | 'error', message: '' }
    const [stats, setStats] = useState({ total: 0, processed: 0, chunked: 0, totalChunks: 0 });
    const fileInputRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToastMsg({ message, type });
        setTimeout(() => setToastMsg(null), 4000);
    };

    useEffect(() => {
        fetchDocuments(true);
    }, []);

    // Polling effect
    useEffect(() => {
        const hasProcessing = documents.some(doc => doc.processingStatus === 'processing');
        let interval;
        
        if (hasProcessing) {
            interval = setInterval(() => {
                fetchDocuments(false);
            }, 3000); // Poll every 3 seconds
        }
        
        return () => {
            if (interval) clearInterval(interval);
        }
    }, [documents]);

    const fetchDocuments = async (showLoader = true) => {
        try {
            if (showLoader) setIsLoading(true);
            const response = await apiClient.get('/knowledge-base');
            setDocuments(response.data.documents || []);
            setStats(response.data.stats || { total: 0, processed: 0, chunked: 0, totalChunks: 0 });
        } catch (error) {
            if (showLoader) showToast('Failed to fetch knowledge documents', 'error');
            console.error(error);
        } finally {
            if (showLoader) setIsLoading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = (file) => {
        if (file.type !== 'application/pdf') {
            showToast('Only PDF files are allowed', 'error');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            showToast('File size must be less than 20MB', 'error');
            return;
        }
        setSelectedFile(file);
        if (!title) {
            // Remove .pdf extension for default title
            setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !title) {
            showToast('Please provide a title and select a file', 'error');
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // Step 1: Get presigned URL from backend
            const urlResponse = await apiClient.get('/knowledge-base/upload-url', {
                params: {
                    fileName: selectedFile.name,
                    fileType: selectedFile.type,
                    category: selectedCategory
                }
            });

            const { uploadUrl, s3Key, fileUrl } = urlResponse.data;

            // Step 2: Upload directly to S3
            await axios.put(uploadUrl, selectedFile, {
                headers: {
                    'Content-Type': selectedFile.type
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            // Step 3: Save metadata to backend
            const metadataResponse = await apiClient.post('/knowledge-base/upload', {
                title,
                category: selectedCategory,
                fileUrl,
                s3Key,
                fileSize: selectedFile.size
            });

            showToast('Document uploaded successfully!', 'success');
            
            // Add to list, update stats, and reset form
            setDocuments(prev => [metadataResponse.data.document, ...prev]);
            setStats(prev => ({ ...prev, total: prev.total + 1 }));
            setSelectedFile(null);
            setTitle('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            setTimeout(() => setUploadProgress(0), 1000);
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to upload document', 'error');
            console.error(error);
            setUploadProgress(0);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document? This cannot be undone.')) {
            return;
        }

        try {
            await apiClient.delete(`/knowledge-base/${id}`);
            const docToDelete = documents.find(doc => doc._id === id);
            setDocuments(prev => prev.filter(doc => doc._id !== id));
            if (docToDelete) {
                setStats(prev => ({
                    total: Math.max(0, prev.total - 1),
                    processed: docToDelete.isProcessed ? Math.max(0, prev.processed - 1) : prev.processed,
                    chunked: docToDelete.isChunked ? Math.max(0, prev.chunked - 1) : prev.chunked,
                    totalChunks: Math.max(0, prev.totalChunks - (docToDelete.chunkCount || 0))
                }));
            }
            showToast('Document deleted successfully', 'success');
        } catch (error) {
            showToast('Failed to delete document', 'error');
            console.error(error);
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <div className="flex-1 p-8 font-outfit max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FileText className="w-8 h-8 text-purple-400" />
                    Knowledge Base
                </h1>
                <p className="text-slate-400 mt-2">Manage AI support documents and rulebooks</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Upload & Stats Section */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Stats Card */}
                    <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[50px] pointer-events-none" />
                        <h2 className="text-xl font-bold text-white mb-4">Knowledge Stats</h2>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Documents</p>
                                <p className="text-2xl font-bold text-white">{stats.total}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Processed</p>
                                <p className="text-2xl font-bold text-purple-400">{stats.processed}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Chunked</p>
                                <p className="text-2xl font-bold text-blue-400">{stats.chunked}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Chunks</p>
                                <p className="text-2xl font-bold text-green-400">{stats.totalChunks}</p>
                            </div>
                        </div>
                    </div>

                    {/* Upload Card */}
                    <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                        {/* Subtle background glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

                        <h2 className="text-xl font-bold text-white mb-6">Upload Document</h2>

                        <div className="space-y-4 relative z-10">
                            {/* Title Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Document Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. College Rulebook 2024"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                />
                            </div>

                            {/* Category Select */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-[#13131a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all cursor-pointer [&>option]:bg-[#13131a]"
                                >
                                    {CATEGORIES.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Drag & Drop Area */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">File (PDF only)</label>
                                <div 
                                    className={`
                                        border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                        ${dragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 hover:border-white/40 hover:bg-white/[0.02]'}
                                        ${selectedFile ? 'border-green-500/50 bg-green-500/5' : ''}
                                    `}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    
                                    {selectedFile ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                                            </div>
                                            <p className="text-white font-medium text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                                            <p className="text-slate-400 text-xs mt-1">{formatBytes(selectedFile.size)}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:bg-white/10 transition-colors">
                                                <Upload className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-300 font-medium text-sm">Click or drag PDF to upload</p>
                                            <p className="text-slate-500 text-xs mt-1">Max file size: 20MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={handleUpload}
                                disabled={isUploading || !selectedFile || !title}
                                className={`
                                    w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-6 relative overflow-hidden
                                    ${(isUploading || !selectedFile || !title) 
                                        ? 'bg-white/5 text-slate-500 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                    }
                                `}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Upload Document
                                    </>
                                )}

                                {/* Progress Bar Overlay */}
                                {isUploading && (
                                    <div 
                                        className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" 
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Document List */}
                <div className="lg:col-span-2">
                    <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 shadow-2xl h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Uploaded Documents</h2>
                            <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">
                                {documents.length} Total
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-2xl">
                                <FileText className="w-16 h-16 text-slate-600 mb-4" />
                                <h3 className="text-white font-bold text-lg mb-2">📄 No knowledge documents uploaded yet</h3>
                                <p className="text-slate-400 text-sm max-w-[280px]">
                                    Upload PDFs to build the ASK+ AI knowledge base.
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10">
                                {documents.map(doc => (
                                    <div 
                                        key={doc._id}
                                        className="bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] p-4 rounded-xl flex items-center justify-between transition-all group"
                                    >
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                                                <File className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {doc.processingStatus === 'processing' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20"><Loader2 className="w-3 h-3 animate-spin" /> Processing</span>}
                                                    {doc.processingStatus === 'ready' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20"><CheckCircle2 className="w-3 h-3" /> Ready</span>}
                                                    {doc.processingStatus === 'failed' && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20"><AlertCircle className="w-3 h-3" /> Failed</span>}
                                                    <h4 className="text-white font-semibold text-sm truncate">{doc.title}</h4>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                                    <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                                        {doc.category}
                                                    </span>
                                                    <span className="text-slate-500 text-xs">
                                                        {formatBytes(doc.fileSize)}
                                                    </span>
                                                    {doc.processingStatus === 'ready' && (
                                                        <>
                                                            <span className="text-blue-400 text-xs font-medium">
                                                                • {doc.chunkCount} Chunks
                                                            </span>
                                                            <span className="text-blue-400 text-xs font-medium">
                                                                • {doc.chunkCount} Embeddings
                                                            </span>
                                                            {doc.processingTimeMs > 0 && (
                                                                <span className="text-slate-400 text-xs font-medium">
                                                                    • {(doc.processingTimeMs / 1000).toFixed(1)} sec
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pl-4 shrink-0">
                                            <a 
                                                href={doc.fileUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                                title="View PDF"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </a>
                                            <button 
                                                onClick={() => handleDelete(doc._id)}
                                                className="p-2 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Document"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Toast Notification */}
            {toastMsg && (
                <div className={`fixed bottom-8 right-8 z-50 px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-5
                    ${toastMsg.type === 'success' 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }
                `}>
                    {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium text-sm">{toastMsg.message}</span>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBase;

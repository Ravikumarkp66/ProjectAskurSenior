import React from 'react';
import { motion } from 'framer-motion';

const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ResourceCard = ({ resource, onPreview, onDownload, onDelete, showDelete, color = '#8B5CF6' }) => {
    const {
        originalName,
        fileName,
        subjectName,
        subjectCode,
        fileSize,
        moduleInfo
    } = resource;

    // Use moduleInfo for title if available, otherwise fallback to filename
    let title = 'Document';
    if (moduleInfo && moduleInfo !== 'all') {
        title = `Module ${moduleInfo}`;
    } else {
        title = fileName || originalName || 'Document';
    }

    // Stripped version of title for subject (removing extension)
    const displayTitle = title.replace(/\.[^/.]+$/, "");

    const subjectText = subjectName ? `${subjectName} ${subjectCode ? `(${subjectCode})` : ''}` : 'Subject';
    const sizeStr = formatBytes(fileSize);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="resource-card group flex flex-col rounded-3xl p-5"
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                willChange: 'transform',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,245,184,0.1), 0 2px 10px rgba(139,92,246,0.12)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--card-border)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Header: Title and Delete Button */}
            <div className="flex justify-between items-start gap-3 mb-1.5">
                <h3
                    className="font-bold text-lg leading-snug line-clamp-2 pr-2"
                    style={{ color: 'var(--card-text-title)' }}
                    title={displayTitle}
                >
                    {displayTitle}
                </h3>
                {showDelete && onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(resource); }}
                        className="text-neutral-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10 shrink-0"
                        title="Delete Document"
                    >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Subject Label */}
            <p className="card-sub text-xs font-medium truncate mb-2" style={{ color: 'var(--card-text-sub)' }}>
                {subjectText}
            </p>

            {/* File Type & Info Details */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-4 select-none" style={{ color: 'var(--card-text-sub)' }}>
                <span className="text-red-400 uppercase font-bold">PDF</span>
                <span className="opacity-40">•</span>
                {resource.pageCount ? (
                    <>
                        <span>{resource.pageCount} Pages</span>
                        <span className="opacity-40">•</span>
                    </>
                ) : null}
                <span>{sizeStr}</span>
            </div>

            {/* Visual Thumbnail Area */}
            <div
                className="card-preview-area rounded-2xl h-48 flex items-center justify-center relative overflow-hidden mb-5"
                style={{
                    background: 'var(--card-preview-bg)',
                    border: '1px solid var(--card-border)',
                }}
            >
                {resource.thumbnailGenerated && resource.thumbnailUrl ? (
                    <div className="w-full h-full">
                        <img 
                            src={resource.thumbnailUrl} 
                            alt={`${displayTitle} thumbnail`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { 
                                e.target.style.display = 'none'; 
                                if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.classList.remove('hidden');
                                    e.target.nextElementSibling.classList.add('flex');
                                }
                            }}
                        />
                        <div className="hidden absolute inset-0 w-full h-full flex-col items-center justify-center" style={{ background: 'var(--card-preview-bg)', zIndex: -1 }}>
                            <svg className="card-preview-icon w-14 h-14 text-emerald-500 opacity-80 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="card-preview-label text-[10px] font-bold tracking-widest uppercase px-4 text-center line-clamp-1" style={{ color: 'var(--card-text-sub)' }}>
                                Preview Available
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <svg className="card-preview-icon w-14 h-14 text-emerald-500 opacity-80 mb-3 transition-transform duration-500 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="card-preview-label text-[10px] font-bold tracking-widest uppercase px-4 text-center line-clamp-1" style={{ color: 'var(--card-text-sub)' }}>
                            {displayTitle}
                        </span>
                    </div>
                )}
                {/* Glow Overlay */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 70%)' }}
                />
            </div>

            {/* Bottom Buttons */}
            <div className="flex gap-3 mt-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(resource); }}
                    className="btn-preview flex-1 h-11 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                    style={{
                        background: 'var(--card-btn-secondary-bg)',
                        color: 'var(--card-btn-secondary-text)',
                        border: '1px solid var(--card-btn-secondary-border)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-btn-secondary-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-btn-secondary-bg)'; }}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDownload(resource); }}
                    className="btn-download flex-1 h-11 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition duration-200 hover:-translate-y-0.5 shadow-lg shadow-emerald-500/5 cursor-pointer"
                    style={{ background: 'linear-gradient(90deg, #00d09c, #7b3ff2)' }}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                </button>
            </div>
        </motion.div>
    );
};

export default ResourceCard;

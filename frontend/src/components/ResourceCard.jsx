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
        title = originalName || fileName || 'Document';
    }

    const subjectText = subjectName ? `${subjectName} ${subjectCode ? `(${subjectCode})` : ''}` : 'Subject';
    const sizeStr = formatBytes(fileSize);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: `0 12px 40px ${color}15` }}
            transition={{ duration: 0.2 }}
            className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 h-[360px]"
            style={{ 
                background: 'rgba(255,255,255,0.015)', 
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}40`;
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.015)';
            }}
        >
            {/* ═════════ TOP SECTION ═════════ */}
            <div className="px-5 pt-5 pb-3 flex flex-col gap-1 z-10 shrink-0">
                <div className="flex justify-between items-start gap-3">
                    <h3 className="text-[16px] font-bold text-white truncate leading-tight flex-1">
                        {title}
                    </h3>
                    <div className="flex items-center gap-3 shrink-0">
                        {showDelete && onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(resource); }}
                                className="text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
                                title="Delete Document"
                            >
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                        <span className="text-red-400">PDF</span>
                        {resource.pageCount ? (
                            <>
                                <span className="opacity-40">•</span>
                                <span>{resource.pageCount} Pages</span>
                            </>
                        ) : null}
                        <span className="opacity-40">•</span>
                        <span>{sizeStr}</span>
                        </div>
                    </div>
                </div>
                <p className="text-[12px] text-slate-500 font-medium truncate">
                    {subjectText}
                </p>
            </div>

            {/* ═════════ MIDDLE SECTION (THUMBNAIL) ═════════ */}
            <div className="flex-1 px-5 pb-5 relative z-0 overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                {resource.thumbnailGenerated && resource.thumbnailUrl ? (
                    <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                        <img 
                            src={resource.thumbnailUrl} 
                            alt={`${title} thumbnail`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { 
                                e.target.style.display = 'none'; 
                                if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.classList.remove('hidden');
                                    e.target.nextElementSibling.classList.add('flex');
                                }
                            }}
                        />
                        <div className="hidden absolute inset-0 w-full h-full flex-col items-center justify-center bg-[#1e1e2d]" style={{ zIndex: -1 }}>
                            {/* FALLBACK IF IMAGE FAILS TO LOAD */}
                            <svg className="w-14 h-14 mb-4 drop-shadow-2xl opacity-80" style={{ color: color }} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                            </svg>
                            <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase px-4 text-center line-clamp-1">
                                {originalName || fileName || 'Document Preview'}
                            </span>
                        </div>
                        {/* Hover Glow for Image */}
                        <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(circle at 50% 50%, ${color}20 0%, transparent 80%)` }}
                        />
                    </div>
                ) : (
                    <div 
                        className="w-full h-full rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
                            border: '1px solid rgba(255,255,255,0.04)',
                            boxShadow: 'inset 0 2px 20px rgba(255,255,255,0.02)'
                        }}
                    >
                        {/* Inner styling elements for premium glassmorphism */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        
                        <svg className="w-14 h-14 mb-4 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" 
                            style={{ color: color, opacity: 0.8 }} 
                            fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                        </svg>
                        
                        <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase px-4 text-center line-clamp-1">
                            {originalName || fileName || 'Document Preview'}
                        </span>
                        
                        {/* Hover Glow */}
                        <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(circle at 50% 50%, ${color}15 0%, transparent 70%)` }}
                        />
                    </div>
                )}
            </div>

            {/* ═════════ BOTTOM SECTION ═════════ */}
            <div className="px-5 pb-5 pt-0 flex gap-3 z-10 shrink-0 mt-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onPreview(resource); }}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold transition-all duration-200"
                    style={{ 
                        background: 'rgba(255,255,255,0.06)', 
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDownload(resource); }}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                    style={{ 
                        background: `linear-gradient(135deg, ${color}, #6B21A8)`,
                        boxShadow: `0 4px 15px ${color}40`
                    }}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                </button>
            </div>
        </motion.div>
    );
};

export default ResourceCard;

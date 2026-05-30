import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Ensure pdf.js worker is loaded from CDN for zero-config Vite compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfPreviewModal = ({ material, onClose }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);

    if (!material) return null;

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setLoading(false);
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    
    const nextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
    const prevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[90vh] bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shrink-0">
                                <span className="text-xs font-bold text-purple-300">PDF</span>
                            </div>
                            <h3 className="text-white font-semibold truncate pr-4 text-sm sm:text-base">
                                {material.title}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <a 
                                href={material.fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                download
                                className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
                                title="Download PDF"
                            >
                                <Download className="w-4 h-4" />
                            </a>
                            <button 
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 rounded-lg transition-all border border-white/5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5 text-xs text-slate-300">
                        <div className="flex items-center gap-3">
                            <button onClick={handleZoomOut} className="p-1 hover:text-white transition-colors" disabled={scale <= 0.5}>
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-medium">{Math.round(scale * 100)}%</span>
                            <button onClick={handleZoomIn} className="p-1 hover:text-white transition-colors" disabled={scale >= 2.5}>
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {numPages && (
                            <div className="flex items-center gap-3 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                <button onClick={prevPage} disabled={pageNumber <= 1} className="p-0.5 hover:text-white disabled:opacity-30">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-medium min-w-[60px] text-center">
                                    {pageNumber} <span className="text-slate-500">/</span> {numPages}
                                </span>
                                <button onClick={nextPage} disabled={pageNumber >= numPages} className="p-0.5 hover:text-white disabled:opacity-30">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PDF Viewer Area */}
                    <div className="flex-1 overflow-auto bg-[#050508] relative flex justify-center py-6 px-4">
                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400 gap-3 z-20 bg-[#050508]">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium animate-pulse">Loading Document...</span>
                            </div>
                        )}
                        
                        <Document
                            file={material.fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={(error) => {
                                console.error('Error loading PDF:', error);
                                setLoading(false);
                            }}
                            className="flex flex-col items-center"
                            loading={null}
                        >
                            <div className="shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 bg-white">
                                <Page 
                                    pageNumber={pageNumber} 
                                    scale={scale} 
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="max-w-full"
                                />
                            </div>
                        </Document>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PdfPreviewModal;

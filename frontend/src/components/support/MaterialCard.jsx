import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, BookOpen } from 'lucide-react';

const MaterialCard = ({ material, onPreview }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col bg-[#12121a] border border-purple-500/20 rounded-xl overflow-hidden hover:border-purple-500/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
        >
            <div className="flex items-start p-3 gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shrink-0 border border-white/5">
                    <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                    <h4 className="text-white font-semibold text-sm truncate" title={material.title}>
                        {material.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {material.subjectCode || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                            {material.documentType || 'Material'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border-t border-white/5">
                <button 
                    onClick={() => onPreview(material)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors border border-white/5"
                >
                    <Eye className="w-3.5 h-3.5 text-slate-300" />
                    Preview
                </button>
                <a 
                    href={material.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-xs font-medium transition-colors border border-purple-500/30"
                >
                    <Download className="w-3.5 h-3.5" />
                    Download
                </a>
            </div>
        </motion.div>
    );
};

export default MaterialCard;

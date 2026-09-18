import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Centered, accessible modal shell for AskUrSenior Academic Tools.
 * Combines modern SaaS shell styling with responsive mobile-adaptive layout.
 */
export default function AcademicToolModal({
    isOpen,
    onClose,
    title,
    subtitle,
    subjectBadge,
    icon: Icon,
    children,
    footer,
    isDirty = false,
    onRequestClose
}) {
    const modalRef = useRef(null);

    const handleCloseAttempt = () => {
        if (onRequestClose) {
            onRequestClose();
        } else {
            onClose();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                e.stopPropagation();
                handleCloseAttempt();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isDirty]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="academic-modal-title"
        >
            {/* Dimmed backdrop with subtle blur */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
                onClick={handleCloseAttempt}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div
                ref={modalRef}
                className="relative w-full max-w-[740px] max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-lg bg-[#0d1117] border border-slate-800 shadow-2xl text-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* CSES Minimalist Header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-800 bg-[#161b22]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {Icon && (
                            <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                                <Icon size={14} strokeWidth={2} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 id="academic-modal-title" className="text-xs sm:text-sm font-mono font-bold text-slate-100 uppercase tracking-wide truncate">
                                    {title}
                                </h2>
                                {subjectBadge && (
                                    <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                        [{subjectBadge}]
                                    </span>
                                )}
                            </div>
                            {subtitle && (
                                <p className="text-[11px] font-mono text-slate-400 truncate">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={handleCloseAttempt}
                        aria-label="Close modal"
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Mobile Subject Badge (if narrow screen) */}
                {subjectBadge && (
                    <div className="sm:hidden px-4 py-1.5 bg-[#161b22] border-b border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-300">[{subjectBadge}]</span>
                    </div>
                )}

                {/* Modal Body / Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5 custom-scrollbar bg-[#0d1117]">
                    {children}
                </div>

                {/* CSES Footer */}
                {footer && (
                    <div className="px-4 sm:px-5 py-3 border-t border-slate-800 bg-[#161b22] flex items-center justify-between gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

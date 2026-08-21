/* ═══════════════════════════════════════════════════════════════════
   ResolveConfirmModal Component
   Confirmation dialog to mark item query as RESOLVED
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

const ResolveConfirmModal = ({ isOpen, onClose, item, onConfirmResolve }) => {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-[#161B22] border border-[#21262D] rounded-2xl shadow-2xl overflow-hidden z-10 my-auto p-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={26} />
                </div>

                <h3 className="text-base font-bold text-[#E6EDF3]">Mark as Resolved?</h3>
                <p className="text-xs text-[#8B949E] mt-1.5 leading-relaxed">
                    Has <span className="font-semibold text-[#E6EDF3]">"{item.title}"</span> been returned to its rightful owner? Marking as resolved will move it to the Resolved section.
                </p>

                <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262D] text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
                    >
                        Not Yet
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirmResolve(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <CheckCircle2 size={13} />
                        Confirm Resolved
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResolveConfirmModal;

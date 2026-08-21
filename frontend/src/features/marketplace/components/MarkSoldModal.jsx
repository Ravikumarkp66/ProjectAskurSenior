/* ═══════════════════════════════════════════════════════════════════
   MarkSoldModal Component
   Confirmation dialog to mark a marketplace item as SOLD
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const MarkSoldModal = ({ isOpen, onClose, item, onConfirmSold }) => {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-[#161B22] border border-[#21262D] rounded-2xl shadow-2xl overflow-hidden z-10 my-auto p-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={26} />
                </div>

                <h3 className="text-base font-bold text-[#E6EDF3]">Mark as Sold?</h3>
                <p className="text-xs text-[#8B949E] mt-1.5 leading-relaxed">
                    Mark <span className="font-semibold text-[#E6EDF3]">"{item.title}"</span> as sold? It will no longer appear in active marketplace listings.
                </p>

                <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262D] text-[#E6EDF3] hover:bg-[#30363D] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirmSold(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
                    >
                        <CheckCircle2 size={14} />
                        Mark as Sold
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MarkSoldModal;

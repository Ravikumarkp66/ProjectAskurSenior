/* ═══════════════════════════════════════════════════════════════════
   DeleteListingModal Component
   Confirmation dialog for deleting a marketplace listing
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const DeleteListingModal = ({ isOpen, onClose, item, onConfirmDelete }) => {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-[#161B22] border border-[#21262D] rounded-2xl shadow-2xl overflow-hidden z-10 my-auto p-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle size={24} />
                </div>

                <h3 className="text-base font-bold text-[#E6EDF3]">Delete Listing?</h3>
                <p className="text-xs text-[#8B949E] mt-1.5 leading-relaxed">
                    Delete <span className="font-semibold text-[#E6EDF3]">"{item.title}"</span>? This action cannot be undone.
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
                        onClick={() => onConfirmDelete(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                    >
                        <Trash2 size={13} />
                        Delete Listing
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteListingModal;

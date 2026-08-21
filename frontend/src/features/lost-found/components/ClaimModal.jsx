/* ═══════════════════════════════════════════════════════════════════
   ClaimModal Component
   Contact/Claim modal when a student clicks "This might be mine" / "I found this item"
═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { X, HelpCircle, Send } from 'lucide-react';

const ClaimModal = ({ isOpen, onClose, item, onSubmitClaim }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    if (!isOpen || !item) return null;

    const isFoundType = item.type === 'found';
    const modalTitle = isFoundType ? 'Is this your item?' : 'Did you find this item?';
    const promptText = isFoundType
        ? 'Why do you think this belongs to you? (e.g. unique marks, contents, wallpaper, laptop brand)'
        : 'Where did you find it or how can you help return it to the poster?';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a short explanation to verify ownership');
            return;
        }
        onSubmitClaim(item.id, reason.trim());
        setReason('');
        setError('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#161B22] border-t sm:border border-[#21262D] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 my-0 sm:my-auto p-4 sm:p-5">
                {/* Mobile Drag Indicator Handle */}
                <div className="w-10 h-1 bg-[#30363D] rounded-full mx-auto mb-2.5 sm:hidden shrink-0" />

                <div className="flex items-center justify-between pb-3 border-b border-[#21262D]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                            <HelpCircle size={18} />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-[#E6EDF3]">{modalTitle}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-[#8B949E] hover:text-[#E6EDF3]">
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-3 text-xs text-[#8B949E] bg-[#0D1117] p-3 rounded-xl border border-[#21262D]">
                    <p className="font-semibold text-[#E6EDF3] line-clamp-1">{item.title}</p>
                    <p className="mt-0.5">Location: {item.location}</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                            Verification Note <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            rows={4}
                            placeholder={promptText}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none focus:border-orange-500/50 transition-colors resize-none"
                        />
                        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
                    </div>

                    <p className="text-[11px] text-[#8B949E] italic">
                        Submitting will create a private 1-on-1 chat with the poster to verify details securely.
                    </p>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#21262D]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262D] text-[#E6EDF3] hover:bg-[#30363D]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                        >
                            <Send size={13} />
                            Send Claim
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClaimModal;

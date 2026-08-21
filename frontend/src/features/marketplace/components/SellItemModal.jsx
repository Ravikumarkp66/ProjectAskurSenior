/* ═══════════════════════════════════════════════════════════════════
   SellItemModal Component
   Modal Dialog wrapping MarketplaceForm for creating/editing listing
═══════════════════════════════════════════════════════════════════ */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import MarketplaceForm from './MarketplaceForm';

const SellItemModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box — Bottom sheet on mobile (< sm), centered modal on desktop (>= sm) */}
            <div className="relative w-full max-w-lg bg-[#161B22] border-t sm:border border-[#21262D] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 my-0 sm:my-auto max-h-[90vh] flex flex-col">
                {/* Mobile Drag Indicator Handle */}
                <div className="w-10 h-1 bg-[#30363D] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-[#21262D] shrink-0">
                    <h2 className="text-sm sm:text-lg font-extrabold text-[#E6EDF3]">
                        {initialData ? 'Edit Marketplace Listing' : 'Sell Something on Campus'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#21262D] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Container */}
                <div className="p-4 sm:p-5 max-h-[80vh] overflow-y-auto">
                    <MarketplaceForm
                        initialData={initialData}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

export default SellItemModal;

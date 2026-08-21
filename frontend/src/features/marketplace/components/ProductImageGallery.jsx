/* ═══════════════════════════════════════════════════════════════════
   ProductImageGallery Component
   Hero photo display with thumbnail strip & lightbox modal
═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { ImageOff, Maximize2, X } from 'lucide-react';
import { getImageFallback } from '../utils/marketplace.utils';

const ProductImageGallery = ({ images = [], category, title }) => {
    const defaultImg = getImageFallback(category);
    const gallery = (images && images.length > 0) ? images : [defaultImg];

    const [selectedIdx, setSelectedIdx] = useState(0);
    const [imgError, setImgError] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);

    const activeImage = imgError ? defaultImg : gallery[selectedIdx] || defaultImg;

    return (
        <div className="space-y-3">
            {/* Main Hero Photo Container */}
            <div
                onClick={() => setShowLightbox(true)}
                className="relative w-full aspect-4/3 sm:aspect-square bg-[#0D1117] border border-[#21262D] rounded-2xl overflow-hidden cursor-pointer group"
            >
                {activeImage ? (
                    <img
                        src={activeImage}
                        alt={title}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#8B949E]">
                        <ImageOff size={36} className="mb-2" />
                        <span className="text-xs">No image provided</span>
                    </div>
                )}

                <div className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={16} />
                </div>
            </div>

            {/* Thumbnail Selector Strip */}
            {gallery.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                    {gallery.map((img, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedIdx(i)}
                            className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                                selectedIdx === i
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-95'
                                    : 'border-[#21262D] opacity-70 hover:opacity-100'
                            }`}
                        >
                            <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Fullscreen Lightbox Modal */}
            {showLightbox && activeImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setShowLightbox(false)}
                >
                    <button
                        type="button"
                        onClick={() => setShowLightbox(false)}
                        className="absolute top-4 right-4 p-2 text-white bg-white/10 hover:bg-white/20 rounded-full"
                    >
                        <X size={20} />
                    </button>
                    <img
                        src={activeImage}
                        alt={title}
                        className="max-w-full max-h-[90vh] object-contain rounded-xl"
                    />
                </div>
            )}
        </div>
    );
};

export default ProductImageGallery;

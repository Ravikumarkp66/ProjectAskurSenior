/* ═══════════════════════════════════════════════════════════════════
   ImageUploader Component
   Multi-photo picker (up to 5 images) with local FileReader preview
═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { UploadCloud, X, Star, Image as ImageIcon } from 'lucide-react';

const ImageUploader = ({ images = [], onChangeImages, maxImages = 5 }) => {
    const [error, setError] = useState(null);

    const handleFiles = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (images.length + files.length > maxImages) {
            setError(`You can upload a maximum of ${maxImages} photos.`);
            return;
        }

        setError(null);
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                setError('Each image must be under 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                onChangeImages(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleRemove = (index) => {
        onChangeImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span className="font-bold uppercase tracking-wider">Product Photos</span>
                <span>{images.length} / {maxImages} max</span>
            </div>

            {/* Photos Preview Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl bg-[#0D1117] border border-[#21262D] overflow-hidden group">
                        <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />

                        {/* Primary Badge on 1st image */}
                        {i === 0 && (
                            <div className="absolute top-1.5 left-1.5 bg-emerald-500/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                                <Star size={9} className="fill-white" />
                                Main
                            </div>
                        )}

                        {/* Delete button */}
                        <button
                            type="button"
                            onClick={() => handleRemove(i)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors opacity-80 group-hover:opacity-100"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                {/* Upload Trigger Box if under max limit */}
                {images.length < maxImages && (
                    <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-[#21262D] hover:border-emerald-500/40 bg-[#0D1117] cursor-pointer transition-colors p-2 text-center">
                        <UploadCloud size={20} className="text-[#8B949E] mb-1" />
                        <span className="text-[11px] font-semibold text-[#E6EDF3]">+ Add</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFiles}
                            className="hidden"
                        />
                    </label>
                )}
            </div>

            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
};

export default ImageUploader;

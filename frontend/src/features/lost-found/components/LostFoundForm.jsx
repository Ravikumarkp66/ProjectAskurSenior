/* ═══════════════════════════════════════════════════════════════════
   LostFoundForm Component
   Fast, accessible form for reporting Lost or Found items
═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { UploadCloud, AlertCircle, MapPin, Calendar } from 'lucide-react';

const LostFoundForm = ({ initialData, onSubmit, onCancel }) => {
    const isEditMode = !!initialData;

    const [type, setType] = useState(initialData?.type || 'lost');
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [location, setLocation] = useState(initialData?.location || '');
    const [date, setDate] = useState(initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [image, setImage] = useState(initialData?.image || null);
    const [imagePreview, setImagePreview] = useState(initialData?.image || null);

    const [errors, setErrors] = useState({});

    // Handle local image selection with FileReader
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, image: 'Image size should be under 5MB' }));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result);
            setImagePreview(reader.result);
            setErrors(prev => ({ ...prev, image: null }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    const validate = () => {
        const newErrors = {};
        if (!title.trim()) newErrors.title = 'Item name is required';
        if (!description.trim()) newErrors.description = 'Please provide a short description';
        if (!location.trim()) newErrors.location = 'Location is required';
        if (!date) newErrors.date = 'Date is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        onSubmit({
            type,
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            date: new Date(date).toISOString(),
            image: imagePreview
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-[#E6EDF3]">
            {/* Step 1: What happened choice */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8B949E]">
                    What happened? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setType('lost')}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                            type === 'lost'
                                ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
                                : 'bg-[#0D1117] border-[#21262D] text-[#8B949E] hover:border-[#30363D]'
                        }`}
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${type === 'lost' ? 'bg-orange-500' : 'bg-[#30363D]'}`} />
                        I Lost Something
                    </button>

                    <button
                        type="button"
                        onClick={() => setType('found')}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                            type === 'found'
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                                : 'bg-[#0D1117] border-[#21262D] text-[#8B949E] hover:border-[#30363D]'
                        }`}
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${type === 'found' ? 'bg-emerald-500' : 'bg-[#30363D]'}`} />
                        I Found Something
                    </button>
                </div>
            </div>

            {/* Item Name */}
            <div>
                <label htmlFor="lf-item-title" className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                    Item Name <span className="text-red-400">*</span>
                </label>
                <input
                    id="lf-item-title"
                    type="text"
                    placeholder="e.g. Black Leather Wallet, Casio Scientific Calculator"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0D1117] border text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none transition-colors ${
                        errors.title ? 'border-red-500/80 focus:ring-1 focus:ring-red-500' : 'border-[#21262D] focus:border-orange-500/50'
                    }`}
                />
                {errors.title && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
                <label htmlFor="lf-item-description" className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                    Description <span className="text-red-400">*</span>
                </label>
                <textarea
                    id="lf-item-description"
                    rows={3}
                    placeholder="Describe the item, distinctive marks, contents, or circumstances..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0D1117] border text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none transition-colors resize-none ${
                        errors.description ? 'border-red-500/80 focus:ring-1 focus:ring-red-500' : 'border-[#21262D] focus:border-orange-500/50'
                    }`}
                />
                {errors.description && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.description}</p>}
            </div>

            {/* Location & Date side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="lf-item-location" className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                        Location <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
                        <input
                            id="lf-item-location"
                            type="text"
                            placeholder="e.g. ISE Block 2nd Floor, Central Library"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D1117] border text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none transition-colors ${
                                errors.location ? 'border-red-500/80' : 'border-[#21262D] focus:border-orange-500/50'
                            }`}
                        />
                    </div>
                    {errors.location && <p className="text-xs text-red-400 mt-1">{errors.location}</p>}
                </div>

                <div>
                    <label htmlFor="lf-item-date" className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                        Date <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
                        <input
                            id="lf-item-date"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D1117] border text-xs sm:text-sm text-[#E6EDF3] outline-none transition-colors ${
                                errors.date ? 'border-red-500/80' : 'border-[#21262D] focus:border-orange-500/50'
                            }`}
                        />
                    </div>
                    {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
                </div>
            </div>

            {/* Photo Upload Area */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                    Photos (Optional)
                </label>

                {imagePreview ? (
                    <div className="relative w-full h-40 bg-[#0D1117] border border-[#21262D] rounded-xl overflow-hidden group">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <label className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-semibold hover:bg-white/30 cursor-pointer backdrop-blur-md">
                                Replace Photo
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="px-3 py-1.5 rounded-lg bg-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/50 backdrop-blur-md"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#21262D] hover:border-orange-500/40 bg-[#0D1117] rounded-xl cursor-pointer transition-colors p-4 text-center">
                        <UploadCloud size={24} className="text-[#8B949E] mb-1" />
                        <span className="text-xs font-semibold text-[#E6EDF3]">Click to upload photo preview</span>
                        <span className="text-[10px] text-[#8B949E] mt-0.5">PNG, JPG up to 5MB</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                )}
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#21262D]">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: type === 'lost' ? '#F97316' : '#10B981',
                        boxShadow: type === 'lost' ? '0 4px 16px rgba(249,115,22,0.3)' : '0 4px 16px rgba(16,185,129,0.3)'
                    }}
                >
                    {isEditMode ? 'Save Changes' : 'Raise Query'}
                </button>
            </div>
        </form>
    );
};

export default LostFoundForm;

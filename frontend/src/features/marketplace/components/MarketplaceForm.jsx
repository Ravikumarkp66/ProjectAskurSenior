/* ═══════════════════════════════════════════════════════════════════
   MarketplaceForm Component
   Fast, accessible form for creating & editing marketplace listings
═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { AlertCircle, MapPin, IndianRupee } from 'lucide-react';
import { CATEGORIES, CONDITIONS } from '../constants/marketplace.constants';
import ImageUploader from './ImageUploader';

const MarketplaceForm = ({ initialData, onSubmit, onCancel }) => {
    const isEditMode = !!initialData;

    const [title, setTitle] = useState(initialData?.title || '');
    const [category, setCategory] = useState(initialData?.category || 'BOOKS');
    const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : '');
    const [condition, setCondition] = useState(initialData?.condition || 'GOOD');
    const [description, setDescription] = useState(initialData?.description || '');
    const [location, setLocation] = useState(initialData?.location || 'SIT Campus');
    const [images, setImages] = useState(initialData?.images || []);

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!title.trim()) newErrors.title = 'Item name is required';
        if (!price || isNaN(price) || Number(price) <= 0) newErrors.price = 'Please enter a valid price in ₹';
        if (!description.trim()) newErrors.description = 'Please provide a short description';
        if (!location.trim()) newErrors.location = 'Campus location is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        onSubmit({
            title: title.trim(),
            category,
            price: Number(price),
            condition,
            description: description.trim(),
            location: location.trim(),
            images
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-[#E6EDF3]">
            {/* Multi-Photo Uploader */}
            <ImageUploader
                images={images}
                onChangeImages={setImages}
                maxImages={5}
            />

            {/* Item Name */}
            <div>
                <label htmlFor="mk-item-title" className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                    Item Name <span className="text-red-400">*</span>
                </label>
                <input
                    id="mk-item-title"
                    type="text"
                    placeholder="e.g. Engineering Mathematics Book, Casio Scientific Calculator"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0D1117] border text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none transition-colors ${
                        errors.title ? 'border-red-500/80 focus:ring-1 focus:ring-red-500' : 'border-[#21262D] focus:border-emerald-500/50'
                    }`}
                />
                {errors.title && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.title}</p>}
            </div>

            {/* Category & Price in one row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Dropdown */}
                <div>
                    <label htmlFor="mk-item-category" className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                        Category <span className="text-red-400">*</span>
                    </label>
                    <select
                        id="mk-item-category"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs sm:text-sm text-[#E6EDF3] outline-none focus:border-emerald-500/50 cursor-pointer"
                    >
                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-[#161B22]">
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Price Input */}
                <div>
                    <label htmlFor="mk-item-price" className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                        Price (₹) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">₹</span>
                        <input
                            id="mk-item-price"
                            type="number"
                            min="0"
                            placeholder="250"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className={`w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#0D1117] border text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none transition-colors ${
                                errors.price ? 'border-red-500/80' : 'border-[#21262D] focus:border-emerald-500/50'
                            }`}
                        />
                    </div>
                    {errors.price && <p className="text-xs text-red-400 mt-1">{errors.price}</p>}
                </div>
            </div>

            {/* Condition Selection Radio Pills */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1.5">
                    Condition <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CONDITIONS.map(cond => (
                        <button
                            key={cond.id}
                            type="button"
                            onClick={() => setCondition(cond.id)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                condition === cond.id
                                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm'
                                    : 'bg-[#0D1117] border-[#21262D] text-[#8B949E] hover:border-[#30363D]'
                            }`}
                        >
                            {cond.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <label htmlFor="mk-item-description" className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                    Description <span className="text-red-400">*</span>
                </label>
                <textarea
                    id="mk-item-description"
                    rows={3}
                    placeholder="Describe the item, how long it was used, inclusions, or reason for selling..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0D1117] border text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none transition-colors resize-none ${
                        errors.description ? 'border-red-500/80 focus:ring-1 focus:ring-red-500' : 'border-[#21262D] focus:border-emerald-500/50'
                    }`}
                />
                {errors.description && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.description}</p>}
            </div>

            {/* Campus Location */}
            <div>
                <label htmlFor="mk-item-location" className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                    Location <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
                    <input
                        id="mk-item-location"
                        type="text"
                        placeholder="e.g. SIT Campus, Hostel 4, Main Canteen"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D1117] border text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none transition-colors ${
                            errors.location ? 'border-red-500/80' : 'border-[#21262D] focus:border-emerald-500/50'
                        }`}
                    />
                </div>
                {errors.location && <p className="text-xs text-red-400 mt-1">{errors.location}</p>}
            </div>

            {/* Form Actions */}
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
                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isEditMode ? 'Save Changes' : 'Post Listing'}
                </button>
            </div>
        </form>
    );
};

export default MarketplaceForm;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { campusHubAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TYPES = [
    { value: 'sell',    label: 'Sell Something' },
    { value: 'buy',     label: 'Want to Buy' },
    { value: 'lost',    label: 'Lost Item' },
    { value: 'found',   label: 'Found Item' },
    { value: 'service', label: 'Offer a Service' },
    { value: 'room',    label: 'Roommate / Room' },
];
const PRICE_TYPES = ['sell', 'service', 'room'];

const Label = ({ children }) => (
    <label className="block text-[11px] font-semibold text-[#8B949E] uppercase tracking-widest mb-1.5">
        {children}
    </label>
);

const inputClass = "w-full px-3.5 py-2.5 rounded-lg bg-[#0D1117] border border-[#21262D] text-[#E6EDF3] placeholder-[#8B949E]/50 text-sm focus:border-[#1D9E75]/60 focus:ring-1 focus:ring-[#1D9E75]/30 outline-none transition-colors";

/**
 * ListingForm — student modal to post a marketplace / lost+found listing.
 */
const ListingForm = ({ onClose, onCreated }) => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'sell',
        price: '',
        contactNumber: '',
        images: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');
    const [imageUrls, setImageUrls] = useState(['', '', '']);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleImageUrlChange = (i, val) => {
        const next = [...imageUrls];
        next[i] = val;
        setImageUrls(next);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            setError('Title and description are required.');
            return;
        }
        setLoading(true); setError('');
        try {
            const images = imageUrls.filter(u => u.trim());
            const payload = {
                title:         form.title.trim(),
                description:   form.description.trim(),
                type:          form.type,
                contactNumber: form.contactNumber.trim() || undefined,
                images,
                ...(PRICE_TYPES.includes(form.type) && form.price
                    ? { price: Number(form.price) }
                    : {}),
            };
            const res = await campusHubAPI.createListing(payload);
            toast.success('Listing posted!');
            onCreated(res.data);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to post listing.');
        } finally {
            setLoading(false);
        }
    };

    const showPrice = PRICE_TYPES.includes(form.type);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                    className="relative w-full max-w-lg bg-[#161B22] border border-[#21262D] rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262D]">
                        <div>
                            <h2 className="text-base font-bold text-[#E6EDF3]">New Listing</h2>
                            <p className="text-xs text-[#8B949E] mt-0.5">Post something for the campus community</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B949E] hover:text-white hover:bg-[#21262D] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
                        {error && (
                            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <div>
                            <Label>Listing Type *</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => set('type', t.value)}
                                        className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-colors text-center ${
                                            form.type === t.value
                                                ? 'bg-[#1D9E75]/15 border-[#1D9E75]/40 text-[#34D399]'
                                                : 'bg-transparent border-[#21262D] text-[#8B949E] hover:border-[#30363D]'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Title *</Label>
                            <input className={inputClass} placeholder="e.g. Canon DSLR Camera for sale"
                                value={form.title} onChange={e => set('title', e.target.value)} />
                        </div>

                        <div>
                            <Label>Description *</Label>
                            <textarea className={`${inputClass} resize-none`} rows={3}
                                placeholder="Describe the item, condition, location…"
                                value={form.description} onChange={e => set('description', e.target.value)} />
                        </div>

                        {showPrice && (
                            <div>
                                <Label>Price (₹)</Label>
                                <input type="number" min="0" className={inputClass}
                                    placeholder="0 for free"
                                    value={form.price} onChange={e => set('price', e.target.value)} />
                            </div>
                        )}

                        <div>
                            <Label>Contact Number</Label>
                            <input className={inputClass} placeholder="+91 98765 43210"
                                value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} />
                        </div>

                        {/* Image URLs (up to 3) */}
                        <div>
                            <Label>Image URLs (up to 3, optional)</Label>
                            <div className="space-y-2">
                                {imageUrls.map((url, i) => (
                                    <input key={i} className={inputClass}
                                        placeholder={`Image URL ${i + 1}`}
                                        value={url} onChange={e => handleImageUrlChange(i, e.target.value)} />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg bg-[#1D9E75] hover:bg-[#18876A] text-white font-bold text-sm transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Posting…' : 'Post Listing'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ListingForm;

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { campusHubAPI } from '../../services/api';
import { useAuth } from '../../utils/hooks';
import { timeAgo } from './HubCard';
import toast from 'react-hot-toast';

const PILLAR_LABEL = { ann: 'Announcement', mkt: 'Marketplace', lost: 'Lost & Found' };

const Field = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-widest text-[#8B949E] font-semibold">{label}</span>
        <span className="text-sm text-[#E6EDF3]">{value || '—'}</span>
    </div>
);

/**
 * HubDetail — slide-in panel from the right showing full item detail.
 * Keeps the feed visible (not a full-screen modal).
 */
const HubDetail = ({ item, onClose, onDelete, onPin }) => {
    const { user } = useAuth();
    const isAdmin = user?.isAdmin;
    const [showContact, setShowContact] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const panelRef = useRef(null);

    // close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    // close on Escape
    useEffect(() => {
        const handle = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [onClose]);

    const handleDelete = async () => {
        if (!window.confirm('Delete this item permanently?')) return;
        setDeleting(true);
        try {
            if (item.pillar === 'ann') {
                await campusHubAPI.deleteAnnouncement(item._id);
            } else {
                await campusHubAPI.deleteListing(item._id);
            }
            toast.success('Deleted');
            onDelete(item._id);
            onClose();
        } catch {
            toast.error('Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const handlePin = async () => {
        try {
            await campusHubAPI.pinAnnouncement(item._id);
            toast.success(item.isPinned ? 'Unpinned' : 'Pinned');
            onPin(item._id);
        } catch {
            toast.error('Failed to update pin');
        }
    };

    const pillarColor = {
        ann:  'text-[#A78BFA]',
        mkt:  'text-[#34D399]',
        lost: 'text-[#F87171]',
    }[item.pillar] || 'text-[#A78BFA]';

    return (
        <AnimatePresence>
            <motion.div
                ref={panelRef}
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="fixed top-0 right-0 h-full w-full max-w-[420px] z-50 bg-[#0D1117] border-l border-[#21262D] overflow-y-auto shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262D] sticky top-0 bg-[#0D1117] z-10">
                    <span className={`text-xs font-bold uppercase tracking-widest ${pillarColor}`}>
                        {PILLAR_LABEL[item.pillar] || 'Item'}
                    </span>
                    <div className="flex items-center gap-2">
                        {isAdmin && item.pillar === 'ann' && (
                            <button
                                onClick={handlePin}
                                title={item.isPinned ? 'Unpin' : 'Pin'}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B949E] hover:text-[#A78BFA] hover:bg-[#7C3AED]/10 transition-colors"
                            >
                                <svg className="w-4 h-4" fill={item.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B949E] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8B949E] hover:text-white hover:bg-[#21262D] transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 px-5 py-5 space-y-5">
                    {/* Title */}
                    <div>
                        {item.isPinned && (
                            <div className="flex items-center gap-1.5 mb-2">
                                <div className="w-1 h-1 rounded-full bg-[#7C3AED]" />
                                <span className="text-[10px] font-bold text-[#A78BFA] uppercase tracking-widest">Pinned</span>
                            </div>
                        )}
                        <h2 className="text-lg font-bold text-[#E6EDF3] leading-snug">{item.title}</h2>
                        <p className="text-xs text-[#8B949E] mt-1">
                            {timeAgo(item.createdAt)} · {item.createdBy?.name || 'Unknown'}
                        </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                        {item.category && (
                            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/20">
                                {item.category}
                            </span>
                        )}
                        {item.type && (
                            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border bg-[#1D9E75]/10 text-[#34D399] border-[#1D9E75]/20">
                                {item.type}
                            </span>
                        )}
                        {item.priority && (
                            <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${
                                item.priority === 'high'   ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                item.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                                {item.priority} priority
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-[#161B22] rounded-lg border border-[#21262D] p-4">
                        <p className="text-sm text-[#E6EDF3] leading-relaxed whitespace-pre-wrap">{item.description}</p>
                    </div>

                    {/* Structured fields grid */}
                    <div className="grid grid-cols-2 gap-4 bg-[#161B22] rounded-lg border border-[#21262D] p-4">
                        {item.pillar === 'ann' && (
                            <>
                                <Field label="Views" value={item.views ?? 0} />
                                <Field label="Category" value={item.category} />
                                <Field label="Priority" value={item.priority} />
                                {item.expiresAt && (
                                    <Field label="Expires" value={new Date(item.expiresAt).toLocaleDateString()} />
                                )}
                            </>
                        )}
                        {(item.pillar === 'mkt' || item.pillar === 'lost') && (
                            <>
                                <Field label="Type" value={item.type} />
                                {item.price && <Field label="Price" value={`₹${item.price.toLocaleString()}`} />}
                                {item.status && <Field label="Status" value={item.status} />}
                                {item.expiresAt && (
                                    <Field label="Expires" value={new Date(item.expiresAt).toLocaleDateString()} />
                                )}
                            </>
                        )}
                    </div>

                    {/* Images */}
                    {item.images?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-[#8B949E] uppercase tracking-widest">Images</p>
                            <div className="grid grid-cols-3 gap-2">
                                {item.images.map((src, i) => (
                                    <img key={i} src={src} alt={`img-${i}`}
                                        className="w-full h-24 object-cover rounded-lg border border-[#21262D]"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer CTA */}
                <div className="px-5 py-4 border-t border-[#21262D] space-y-2 sticky bottom-0 bg-[#0D1117]">
                    {item.pillar === 'ann' && (
                        <div className="text-xs text-[#8B949E] text-center">
                            Viewed by {item.viewedBy?.length || 0} student{item.viewedBy?.length !== 1 ? 's' : ''}
                        </div>
                    )}

                    {(item.pillar === 'mkt') && (
                        <>
                            {!showContact ? (
                                <button
                                    onClick={() => setShowContact(true)}
                                    className="w-full py-2.5 rounded-lg bg-[#1D9E75]/15 border border-[#1D9E75]/30 text-[#34D399] text-sm font-semibold hover:bg-[#1D9E75]/25 transition-colors"
                                >
                                    Contact Seller
                                </button>
                            ) : (
                                <div className="w-full py-2.5 rounded-lg bg-[#1D9E75]/10 border border-[#1D9E75]/20 text-center">
                                    <p className="text-xs text-[#8B949E]">Contact</p>
                                    <p className="text-sm font-bold text-[#34D399]">{item.contactNumber || 'Not provided'}</p>
                                </div>
                            )}
                        </>
                    )}

                    {item.pillar === 'lost' && (
                        <div className="grid grid-cols-2 gap-2">
                            <button className="py-2.5 rounded-lg bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-sm font-semibold hover:bg-[#F87171]/20 transition-colors">
                                I Lost This
                            </button>
                            <button className="py-2.5 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-sm font-semibold hover:bg-[#34D399]/20 transition-colors">
                                I Found This
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default HubDetail;

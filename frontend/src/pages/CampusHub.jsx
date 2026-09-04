import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import HubFeed from '../components/campusHub/HubFeed';
import HubDetail from '../components/campusHub/HubDetail';
import ListingForm from '../components/campusHub/ListingForm';

/* ── Tab definition ──────────────────────────────────────────────── */
const TABS = [
    { id: 'all',  label: 'All' },
    { id: 'ann',  label: 'Announcements' },
    { id: 'lost', label: 'Lost & Found' },
    { id: 'mkt',  label: 'Marketplace' },
];

const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'pinned', label: 'Pinned first' },
];

/* ══════════════════════════════════════════════════════════════════
   CAMPUS HUB PAGE
══════════════════════════════════════════════════════════════════ */
const CampusHub = ({ initialTab }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [tab,    setTab]    = useState(initialTab || 'all');
    const [sort,   setSort]   = useState('newest');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        if (initialTab) setTab(initialTab);
    }, [initialTab]);

    const [selected,   setSelected]   = useState(null);   // item for detail panel
    const [showMktForm, setShowMktForm] = useState(false);
    const [refreshKey, setRefreshKey]  = useState(0);

    /* Debounce search */
    const debounceRef = useRef(null);
    const handleSearchChange = (val) => {
        setSearchInput(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setSearch(val), 400);
    };

    /* Mark all announcements as viewed when landing on this page */
    // (achieved automatically — the feed GET triggers view tracking on the detail endpoint)

    const handleItemCreated = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    const handleDelete = useCallback((id) => {
        setRefreshKey(k => k + 1);
        setSelected(null);
    }, []);

    const handlePin = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    return (
        <div className="min-h-screen bg-[#0D1117] text-[#E6EDF3]">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="border-b border-[#21262D] bg-[#0D1117] sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#E6EDF3] tracking-tight">
                                Campus Hub
                            </h1>
                            <p className="text-sm text-[#8B949E] mt-0.5">
                                Everything happening in college
                            </p>
                        </div>

                        {/* Stats row (placeholder — can be wired to real data) */}
                        <div className="hidden sm:flex items-center gap-4 mt-1">
                            <div className="text-right">
                                <p className="text-[10px] text-[#8B949E] uppercase tracking-widest">Posts today</p>
                                <p className="text-sm font-bold text-[#A78BFA]">—</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-[#8B949E] uppercase tracking-widest">Active listings</p>
                                <p className="text-sm font-bold text-[#34D399]">—</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Tab bar ──────────────────────────────────── */}
                    <div className="flex items-center gap-1.5 mt-4 overflow-x-auto no-scrollbar">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={[
                                    'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                                    tab === t.id
                                        ? 'bg-[#7C3AED] text-white'
                                        : 'text-[#8B949E] hover:text-[#E6EDF3] bg-[#161B22] border border-[#21262D] hover:border-[#30363D]',
                                ].join(' ')}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 py-5">
                {/* ── Search + Sort bar ────────────────────────── */}
                <div className="flex items-center gap-2 mb-5">
                    {/* Search */}
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B949E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search announcements, listings…"
                            value={searchInput}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#161B22] border border-[#21262D] text-[#E6EDF3] placeholder-[#8B949E]/60 text-sm focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/20 outline-none transition-colors"
                        />
                    </div>

                    {/* Sort */}
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-[#161B22] border border-[#21262D] text-[#E6EDF3] text-sm outline-none focus:border-[#7C3AED]/50 cursor-pointer"
                    >
                        {SORTS.map(s => (
                            <option key={s.value} value={s.value} className="bg-[#161B22]">{s.label}</option>
                        ))}
                    </select>
                </div>

                {/* ── Feed ─────────────────────────────────────── */}
                <div className={selected ? 'pr-0 lg:pr-[440px] transition-all duration-300' : ''}>
                    <HubFeed
                        tab={tab}
                        search={search}
                        sort={sort}
                        refreshKey={refreshKey}
                        onSelect={setSelected}
                    />
                </div>
            </div>

            {/* ── Floating + Post buttons ──────────────────────── */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
                <button
                    onClick={() => setShowMktForm(true)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                    style={{
                        background: '#1D9E75',
                        boxShadow: '0 4px 24px rgba(29,158,117,0.4)'
                    }}
                    title="Post Marketplace Listing"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Post Listing
                </button>
            </div>

            {/* ── Detail panel ────────────────────────────────── */}
            {selected && (
                <HubDetail
                    item={selected}
                    onClose={() => setSelected(null)}
                    onDelete={handleDelete}
                />
            )}

            {/* ── Forms ───────────────────────────────────────── */}
            {showMktForm && (
                <ListingForm
                    onClose={() => setShowMktForm(false)}
                    onCreated={handleItemCreated}
                />
            )}
        </div>
    );
};

export default CampusHub;

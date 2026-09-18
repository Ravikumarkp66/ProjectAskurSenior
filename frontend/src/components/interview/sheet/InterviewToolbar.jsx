import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const SEARCH_EXAMPLES = [
    'Amazon',
    'Microsoft',
    'Google',
    'SDE',
    'Data Analyst',
    '2026',
    '2027'
];

const InterviewToolbar = ({
    searchQuery,
    setSearchQuery,
    totalResults = 0
}) => {
    const searchInputRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [exampleIndex, setExampleIndex] = useState(0);

    // Keyboard shortcut '/' to focus search input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement !== searchInputRef.current) {
                const targetTag = document.activeElement?.tagName?.toLowerCase();
                if (targetTag !== 'input' && targetTag !== 'textarea') {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Rotate placeholder text when idle and not focused
    useEffect(() => {
        if (isFocused || searchQuery) return;

        const interval = setInterval(() => {
            setExampleIndex(prev => (prev + 1) % SEARCH_EXAMPLES.length);
        }, 2200);

        return () => clearInterval(interval);
    }, [isFocused, searchQuery]);

    const dynamicPlaceholder = isFocused || searchQuery
        ? 'Search company, role, batch...'
        : `Search company, role, batch... (e.g. "${SEARCH_EXAMPLES[exampleIndex]}")`;

    return (
        <div className="w-full my-7">
            {/* Top Separator */}
            <div className="w-full border-t border-zinc-200 dark:border-white/[0.08]" />

            {/* Centered Search Bar */}
            <div className="py-4">
                <div className="max-w-xl mx-auto px-2">
                    <div className="relative flex items-center">
                        <Search 
                            size={16} 
                            className="absolute left-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none transition-colors" 
                        />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={dynamicPlaceholder}
                            className="w-full h-10 pl-9 pr-14 bg-zinc-50/70 hover:bg-zinc-100/70 dark:bg-[#0e1117] dark:hover:bg-[#12151c] focus:bg-white dark:focus:bg-[#0f1218] border border-zinc-300 dark:border-white/[0.08] focus:border-purple-500/60 dark:focus:border-purple-500/60 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none transition-all font-mono"
                        />
                        <div className="absolute right-3 flex items-center gap-1">
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        searchInputRef.current?.focus();
                                    }}
                                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors"
                                    title="Clear search"
                                    aria-label="Clear search"
                                >
                                    <X size={13} />
                                </button>
                            ) : (
                                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-white/[0.06] border border-zinc-300 dark:border-white/10 text-[9px] font-mono text-zinc-500 dark:text-zinc-400 select-none">
                                    /
                                </kbd>
                            )}
                        </div>
                    </div>

                    {/* Subtle Result Count Info */}
                    <div className="flex items-center justify-between px-1.5 pt-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        <span>
                            {totalResults} {totalResults === 1 ? 'track' : 'placement tracks'}
                        </span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-purple-600 dark:text-purple-400 hover:underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Separator */}
            <div className="w-full border-b border-zinc-200 dark:border-white/[0.08]" />
        </div>
    );
};

export default InterviewToolbar;

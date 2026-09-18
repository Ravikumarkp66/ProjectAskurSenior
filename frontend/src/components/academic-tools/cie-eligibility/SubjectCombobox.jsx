import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, BookOpen } from 'lucide-react';
import { detectEvaluationType, EVALUATION_CONFIGS } from '../../../utils/cieEligibilityEngine';

export default function SubjectCombobox({
    subjects = [],
    selectedSubject,
    onSelectSubject,
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSubjects = useMemo(() => {
        if (!searchQuery.trim()) return subjects;
        const q = searchQuery.toLowerCase().trim();
        return subjects.filter((s) => {
            const name = (s.subjectName || s.customName || s.name || '').toLowerCase();
            const code = (s.subjectCode || s.customCode || s.code || '').toLowerCase();
            return name.includes(q) || code.includes(q);
        });
    }, [subjects, searchQuery]);

    const getSubjectTypeBadge = (subj) => {
        const type = detectEvaluationType(subj);
        const config = EVALUATION_CONFIGS[type];
        return config ? config.userFacingName : (subj.category || 'Theory');
    };

    const selectedName = selectedSubject
        ? (selectedSubject.subjectName || selectedSubject.customName || selectedSubject.name || 'Selected Subject')
        : '';
    const selectedCode = selectedSubject
        ? (selectedSubject.subjectCode || selectedSubject.customCode || selectedSubject.code || '')
        : '';
    const selectedCredits = selectedSubject
        ? (selectedSubject.registeredCredits ?? selectedSubject.credits ?? 0)
        : 0;

    return (
        <div className="relative w-full" ref={containerRef}>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Subject
            </label>

            {/* Combobox Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(!isOpen);
                        setTimeout(() => inputRef.current?.focus(), 50);
                    }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded bg-[#161b22] border text-left transition-colors ${
                    isOpen
                        ? 'border-slate-500'
                        : 'border-slate-800 hover:border-slate-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {selectedSubject ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                            <BookOpen size={13} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-100 truncate font-sans">
                                {selectedName}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 font-mono">
                                <span className="text-slate-200 font-semibold">{selectedCode}</span>
                                <span className="text-slate-600">•</span>
                                <span>{selectedCredits} {selectedCredits === 1 ? 'Credit' : 'Credits'}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">[{getSubjectTypeBadge(selectedSubject)}]</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <span className="text-xs font-mono text-slate-400">Select a course...</span>
                )}

                <ChevronDown
                    size={15}
                    className={`text-slate-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded bg-[#161b22] border border-slate-700 shadow-xl overflow-hidden animate-in fade-in duration-100">
                    {/* Search Input Bar */}
                    <div className="p-2 border-b border-slate-800 bg-[#0d1117]">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-black/40 border border-slate-700 focus-within:border-slate-500">
                            <Search size={13} className="text-slate-400 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter course by code or name..."
                                className="w-full bg-transparent text-xs font-mono text-slate-100 placeholder-slate-500 outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="text-[10px] font-mono text-slate-400 hover:text-white px-1"
                                >
                                    clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Subject List */}
                    <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 custom-scrollbar" role="listbox">
                        {filteredSubjects.length === 0 ? (
                            <div className="py-5 text-center text-xs font-mono text-slate-500">
                                No course matched "{searchQuery}"
                            </div>
                        ) : (
                            filteredSubjects.map((s) => {
                                const id = s.registeredSubjectId || s._id || s.id;
                                const selectedId = selectedSubject?.registeredSubjectId || selectedSubject?._id || selectedSubject?.id;
                                const isSelected = id === selectedId;
                                const name = s.subjectName || s.customName || s.name;
                                const code = s.subjectCode || s.customCode || s.code;
                                const credits = s.registeredCredits ?? s.credits ?? 0;
                                const typeLabel = getSubjectTypeBadge(s);

                                return (
                                    <div
                                        key={id}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => {
                                            onSelectSubject(s);
                                            setIsOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-slate-800 border-l-2 border-emerald-400 text-slate-100'
                                                : 'hover:bg-slate-800/60 text-slate-300'
                                        }`}
                                    >
                                        <div className="min-w-0 pr-2">
                                            <div className="text-xs font-medium text-slate-200 truncate font-sans">
                                                {name}
                                            </div>
                                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                                                <span className="text-slate-100 font-semibold">{code}</span>
                                                <span className="text-slate-600">•</span>
                                                <span>{credits} Cr</span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-slate-400">[{typeLabel}]</span>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <span className="text-[11px] font-mono font-bold text-emerald-400">
                                                [SELECTED]
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

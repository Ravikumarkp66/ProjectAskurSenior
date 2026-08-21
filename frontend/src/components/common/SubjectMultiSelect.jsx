import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X, BookOpen } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/* ═══════════════════════════════════════════════════════════════════
   SEARCHABLE MULTI-SELECT SUBJECT PICKER COMPONENT (SINGLE SEARCH BAR)
═══════════════════════════════════════════════════════════════════ */
const SubjectMultiSelect = ({
    subjects = [],
    selectedIds = new Set(),
    onChange,
    readOnly = false,
    placeholder = "Search or select subjects..."
}) => {
    const themeContext = useTheme();
    const isDark = themeContext ? themeContext.isDark : true;

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Normalize selectedIds as a Set
    const selectedSet = useMemo(() => {
        if (selectedIds instanceof Set) return selectedIds;
        if (Array.isArray(selectedIds)) return new Set(selectedIds);
        return new Set();
    }, [selectedIds]);

    // Snapshot of selected IDs when dropdown opens to keep item positions stable while picking
    const initialSelectedSetRef = useRef(new Set());

    useEffect(() => {
        if (isOpen) {
            initialSelectedSetRef.current = new Set(selectedSet);
        }
    }, [isOpen]);

    // Filter & sort subjects (uses snapshot when open so items don't jump on click)
    const filteredSubjects = useMemo(() => {
        let list = subjects;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = subjects.filter(s => 
                s.name?.toLowerCase().includes(q) || 
                s.code?.toLowerCase().includes(q)
            );
        }

        const snapshot = isOpen ? initialSelectedSetRef.current : selectedSet;

        return [...list].sort((a, b) => {
            const aSelected = snapshot.has(a._id);
            const bSelected = snapshot.has(b._id);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return 0;
        });
    }, [subjects, searchQuery, isOpen, selectedSet]);

    // Live calculation of selected subjects and total credits
    const selectedList = useMemo(() => {
        return subjects.filter(s => selectedSet.has(s._id));
    }, [subjects, selectedSet]);

    const totalSelectedCount = selectedList.length;
    const totalCreditsSum = useMemo(() => {
        return selectedList.reduce((sum, s) => sum + (s.credits || 0), 0);
    }, [selectedList]);

    // Click outside listener to close dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Toggle individual subject selection
    const handleToggleSubject = (subjectId) => {
        if (readOnly) return;
        const nextSet = new Set(selectedSet);
        if (nextSet.has(subjectId)) {
            nextSet.delete(subjectId);
        } else {
            nextSet.add(subjectId);
        }
        if (onChange) onChange(nextSet);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            
            {/* SINGLE TOP SEARCH / SELECTOR BAR */}
            <div
                style={{
                    width: '100%',
                    minHeight: 52,
                    padding: '10px 18px',
                    borderRadius: 14,
                    backgroundColor: isDark ? '#0F0926' : '#FFFFFF',
                    border: isOpen ? '1.5px solid #8B5CF6' : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0'),
                    color: isDark ? '#F1F5F9' : '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    boxShadow: isOpen ? '0 0 20px rgba(139, 92, 246, 0.25)' : (isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(139, 92, 246, 0.08)'),
                    transition: 'all 0.2s ease',
                    cursor: readOnly ? 'default' : 'pointer'
                }}
                onClick={(e) => {
                    if (!readOnly && !isOpen) {
                        setIsOpen(true);
                    }
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <Search size={18} color={isOpen ? '#8B5CF6' : (isDark ? '#94A3B8' : '#64748B')} style={{ flexShrink: 0 }} />
                    
                    {isOpen ? (
                        /* SINGLE ACTIVE SEARCH INPUT */
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search subjects by name or code..."
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: isDark ? '#F1F5F9' : '#0F172A',
                                fontSize: 14,
                                fontWeight: 600,
                                outline: 'none',
                                fontFamily: 'Outfit, sans-serif'
                            }}
                        />
                    ) : (
                        /* CLOSED STATE DISPLAY */
                        <span style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: totalSelectedCount > 0 ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#64748B'),
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {totalSelectedCount > 0 
                                ? `${totalSelectedCount} subjects selected (${totalCreditsSum} credits)` 
                                : placeholder}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {searchQuery && isOpen && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery('');
                            }}
                            style={{ background: 'none', border: 'none', color: isDark ? '#94A3B8' : '#64748B', cursor: 'pointer', padding: 2 }}
                        >
                            <X size={16} />
                        </button>
                    )}

                    {!isOpen && totalSelectedCount > 0 && (
                        <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                            color: isDark ? '#8B5CF6' : '#7C3AED',
                            padding: '3px 10px',
                            borderRadius: 8,
                            border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                            {totalSelectedCount} Selected
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!readOnly) setIsOpen(!isOpen);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                        <ChevronDown 
                            size={18} 
                            color={isDark ? "#94A3B8" : "#64748B"} 
                            style={{
                                transition: 'transform 0.2s ease',
                                transform: isOpen ? 'rotate(180deg)' : 'none'
                            }} 
                        />
                    </button>
                </div>
            </div>

            {/* DROPDOWN / POPOVER SELECTOR PANEL */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    zIndex: 60,
                    backgroundColor: isDark ? '#0F0926' : '#FFFFFF',
                    border: isDark ? '1.5px solid rgba(139, 92, 246, 0.4)' : '1.5px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 18,
                    boxShadow: isDark ? '0 20px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(139, 92, 246, 0.2)' : '0 12px 36px rgba(139, 92, 246, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 340
                }}>
                    
                    {/* SUBJECT LIST AREA */}
                    <div style={{
                        overflowY: 'auto',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        flex: 1
                    }}>
                        {filteredSubjects.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: isDark ? '#64748B' : '#94A3B8', fontSize: 13 }}>
                                {searchQuery ? `No subjects found matching "${searchQuery}"` : "No curriculum subjects available for this semester."}
                            </div>
                        ) : (
                            filteredSubjects.map(subj => {
                                const isSelected = selectedSet.has(subj._id);
                                return (
                                    <div
                                        key={subj._id}
                                        onClick={() => handleToggleSubject(subj._id)}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: 12,
                                            backgroundColor: isSelected ? (isDark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(139, 92, 246, 0.1)') : 'transparent',
                                            border: isSelected ? (isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)') : '1px solid transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                            <div style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: 6,
                                                border: isSelected ? 'none' : (isDark ? '1.5px solid rgba(255, 255, 255, 0.2)' : '1.5px solid rgba(148, 163, 184, 0.4)'),
                                                backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                <span style={{
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    color: isSelected ? (isDark ? '#FFFFFF' : '#6D28D9') : (isDark ? '#E2E8F0' : '#1E293B'),
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {subj.name}
                                                </span>
                                                <span style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B', fontFamily: 'monospace' }}>
                                                    {subj.code} {subj.category ? `· ${subj.category}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <span style={{
                                            fontSize: 12,
                                            fontWeight: 800,
                                            color: isSelected ? (isDark ? '#8B5CF6' : '#7C3AED') : (isDark ? '#94A3B8' : '#64748B'),
                                            backgroundColor: isSelected ? (isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.12)') : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                                            padding: '3px 10px',
                                            borderRadius: 8,
                                            border: isSelected ? '1px solid rgba(139, 92, 246, 0.3)' : (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)')
                                        }}>
                                            {subj.credits ?? 0} Cr
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* FOOTER ACTION / LIVE SUMMARY */}
                    <div style={{
                        padding: '10px 14px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: '#080415',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>
                            {totalSelectedCount} selected · <strong style={{ color: '#8B5CF6' }}>{totalCreditsSum} credits</strong>
                        </span>
                        
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            style={{
                                backgroundColor: '#8B5CF6',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: 12,
                                fontWeight: 800,
                                padding: '6px 16px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Done
                        </button>
                    </div>

                </div>
            )}

        </div>
    );
};

export default SubjectMultiSelect;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDown, 
    ChevronRight, 
    Search, 
    X, 
    Layers, 
    BookOpen, 
    Sparkles, 
    FileText,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════
   MY SUBJECTS SIDEBAR
   • Matches SubjectSidebar visual language
   • Subject → Module Accordion hierarchy
   • Real-time search filter across subjects and module names
═══════════════════════════════════════════════════════════════════ */

const MySubjectsSidebar = ({
    subjects = [],
    loading = false,
    activeSubjectId,
    activeModuleId,
    expandedSubjectId,
    onToggleExpandSubject,
    onSelectModule,
    searchQuery,
    onSearchChange,
    className = '',
    onCloseMobileDrawer
}) => {
    // Filter subjects by search
    const filteredSubjects = useMemo(() => {
        if (!searchQuery.trim()) return subjects;
        const q = searchQuery.toLowerCase().trim();
        return subjects.filter(s => {
            const matchesName = s.name?.toLowerCase().includes(q);
            const matchesCode = s.code?.toLowerCase().includes(q);
            const matchesModule = s.modules?.some(m => 
                m.name?.toLowerCase().includes(q) || 
                `module ${m.moduleNumber}`.toLowerCase().includes(q)
            );
            return matchesName || matchesCode || matchesModule;
        });
    }, [subjects, searchQuery]);

    return (
        <aside
            className={`my-subjects-sidebar flex flex-col h-full select-none ${className}`}
            style={{
                width: '100%',
                background: 'var(--sidebar-bg, #0e091b)',
                borderRight: '1px solid var(--sidebar-border, rgba(139, 92, 246, 0.14))',
                overflow: 'hidden',
                boxSizing: 'border-box'
            }}
        >
            {/* ── Sidebar Header ────────────────────────────────────────── */}
            <div 
                style={{
                    padding: '16px 14px 12px 16px',
                    borderBottom: '1px solid var(--sidebar-border, rgba(139, 92, 246, 0.12))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                background: 'rgba(139, 92, 246, 0.15)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#c4b5fd'
                            }}
                        >
                            <Layers size={15} strokeWidth={2} />
                        </div>
                        <div>
                            <span 
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: '#a78bfa'
                                }}
                            >
                                Registered
                            </span>
                            <h2 
                                style={{
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em',
                                    color: '#f1f5f9',
                                    margin: 0,
                                    lineHeight: 1.2
                                }}
                            >
                                My Subjects
                            </h2>
                        </div>
                    </div>

                    <span 
                        style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '12px',
                            background: 'rgba(0, 245, 184, 0.1)',
                            border: '1px solid rgba(0, 245, 184, 0.25)',
                            color: '#00f5b8'
                        }}
                    >
                        {subjects.length} enrolled
                    </span>
                </div>

                {/* ── Search Input ── */}
                <div 
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <Search 
                        size={14} 
                        style={{
                            position: 'absolute',
                            left: '10px',
                            color: 'rgba(148, 163, 184, 0.6)',
                            pointerEvents: 'none'
                        }}
                    />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search subjects or modules..."
                        style={{
                            width: '100%',
                            height: '34px',
                            padding: '0 28px 0 32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#f8fafc',
                            fontSize: '12px',
                            outline: 'none',
                            transition: 'border-color 0.2s, background 0.2s'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                            e.target.style.background = 'rgba(139, 92, 246, 0.06)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                        }}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(148, 163, 184, 0.6)',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Subjects Accordion List ────────────────────────────────── */}
            <div 
                className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-none"
                style={{
                    overscrollBehavior: 'contain',
                    scrollbarWidth: 'none'
                }}
            >
                {loading ? (
                    <div className="space-y-2 p-1">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="animate-pulse flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                            >
                                <div className="flex items-center gap-2.5 flex-1">
                                    <div className="w-3.5 h-3.5 rounded bg-white/10 shrink-0" />
                                    <div 
                                        className="h-3.5 rounded bg-white/10" 
                                        style={{ width: `${60 + (i * 7) % 35}%` }} 
                                    />
                                </div>
                                <div className="w-10 h-3.5 rounded bg-white/10 shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : filteredSubjects.length === 0 ? (
                    <div 
                        style={{
                            padding: '32px 16px',
                            textAlign: 'center',
                            color: 'rgba(148, 163, 184, 0.5)',
                            fontSize: '12px'
                        }}
                    >
                        No registered subjects found matching &ldquo;{searchQuery}&rdquo;
                    </div>
                ) : (
                    filteredSubjects.map((subject) => {
                        const isExpanded = expandedSubjectId === subject.id || (searchQuery.trim().length > 0);
                        const isCurrentSubjectActive = activeSubjectId === subject.id;

                        return (
                            <div 
                                key={subject.id}
                                className="subject-accordion-group"
                                style={{
                                    borderRadius: '10px',
                                    background: isCurrentSubjectActive 
                                        ? 'rgba(139, 92, 246, 0.05)' 
                                        : 'transparent',
                                    border: isCurrentSubjectActive 
                                        ? '1px solid rgba(139, 92, 246, 0.18)' 
                                        : '1px solid transparent',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {/* ── Subject Row Button (Expand/Collapse) ── */}
                                <button
                                    type="button"
                                    onClick={() => onToggleExpandSubject(subject.id)}
                                    style={{
                                        width: '100%',
                                        padding: '9px 10px 9px 10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '8px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        outline: 'none',
                                        borderRadius: '8px'
                                    }}
                                    className="hover:bg-white/5 transition-colors"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                        {/* Expand Chevron */}
                                        <span 
                                            style={{
                                                color: isCurrentSubjectActive ? '#a78bfa' : 'rgba(148, 163, 184, 0.7)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'transform 0.2s ease',
                                                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
                                            }}
                                        >
                                            <ChevronDown size={15} strokeWidth={2.2} />
                                        </span>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div 
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: isCurrentSubjectActive ? 650 : 500,
                                                    color: isCurrentSubjectActive ? '#f8fafc' : 'rgba(226, 232, 240, 0.85)',
                                                    lineHeight: 1.35,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                title={subject.name}
                                            >
                                                {subject.name}
                                            </div>
                                        </div>
                                    </div>

                                    {subject.code && (
                                        <span 
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                background: isCurrentSubjectActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                color: isCurrentSubjectActive ? '#c4b5fd' : 'rgba(148, 163, 184, 0.7)',
                                                letterSpacing: '0.02em',
                                                flexShrink: 0
                                            }}
                                        >
                                            {subject.code}
                                        </span>
                                    )}
                                </button>

                                {/* ── Sub-level Modules (Accordion Content) ── */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div 
                                                style={{
                                                    padding: '2px 6px 8px 18px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '2px',
                                                    borderLeft: '1px dashed rgba(139, 92, 246, 0.2)',
                                                    marginLeft: '16px',
                                                    marginBottom: '4px'
                                                }}
                                            >
                                                {subject.modules?.map((mod) => {
                                                    const isModActive = isCurrentSubjectActive && activeModuleId === mod.id;

                                                    return (
                                                        <button
                                                            key={mod.id}
                                                            type="button"
                                                            onClick={() => {
                                                                onSelectModule(subject, mod);
                                                                if (onCloseMobileDrawer) onCloseMobileDrawer();
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '6px 10px 6px 10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                gap: '8px',
                                                                borderRadius: '6px',
                                                                textAlign: 'left',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                outline: 'none',
                                                                background: isModActive 
                                                                    ? 'linear-gradient(90deg, rgba(0, 245, 184, 0.12), rgba(139, 92, 246, 0.08))' 
                                                                    : 'transparent',
                                                                borderLeft: isModActive ? '2.5px solid #00f5b8' : '2.5px solid transparent',
                                                                color: isModActive ? '#00f5b8' : 'rgba(148, 163, 184, 0.75)',
                                                                fontWeight: isModActive ? 600 : 450,
                                                                fontSize: '12px',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                            className={isModActive ? '' : 'hover:bg-white/[0.04] hover:text-slate-200'}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                                                                <span 
                                                                    style={{
                                                                        fontSize: '10px',
                                                                        fontWeight: 700,
                                                                        color: isModActive ? '#00f5b8' : 'rgba(167, 139, 250, 0.7)',
                                                                        flexShrink: 0
                                                                    }}
                                                                >
                                                                    M{mod.moduleNumber}
                                                                </span>
                                                                <span 
                                                                    style={{
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                        flex: 1
                                                                    }}
                                                                    title={mod.name}
                                                                >
                                                                    {mod.name || `Module ${mod.moduleNumber}`}
                                                                </span>
                                                            </div>

                                                            {isModActive && (
                                                                <div 
                                                                    style={{
                                                                        width: 5,
                                                                        height: 5,
                                                                        borderRadius: '50%',
                                                                        background: '#00f5b8',
                                                                        boxShadow: '0 0 8px #00f5b8',
                                                                        flexShrink: 0
                                                                    }}
                                                                />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <div 
                style={{
                    padding: '10px 14px',
                    borderTop: '1px solid var(--sidebar-border, rgba(139, 92, 246, 0.12))',
                    background: 'rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Link
                    to="/student-academics/subjects"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#a78bfa',
                        textDecoration: 'none'
                    }}
                    className="hover:underline"
                >
                    <BookOpen size={13} />
                    <span>Manage Registration</span>
                </Link>
                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.4)' }}>
                    v2.0
                </span>
            </div>
        </aside>
    );
};

export default MySubjectsSidebar;

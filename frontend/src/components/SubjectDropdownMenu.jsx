import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown } from 'lucide-react';
import SubjectSearch from './SubjectSearch';
import SubjectList from './SubjectList';

const SubjectDropdownMenu = ({
    isOpen,
    onClose,
    subjects = [],
    filteredSubjects = [],
    subjectSearch = '',
    onSearchChange,
    activeSubjectId,
    onSelectSubject,
    loading = false,
    pinnedIds = [],
    onTogglePin
}) => {
    const dropdownRef = useRef(null);

    const handleSelect = (subj) => {
        onSelectSubject(subj);
        onClose();
    };

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                top: '52px', // Directly beneath the mobile sticky header
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 90,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                {/* Dimmed / Blurred Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)'
                    }}
                />

                {/* Dropdown Container */}
                <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -10, scaleY: 0.96 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -10, scaleY: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'relative',
                        width: 'calc(100% - 24px)',
                        maxWidth: '480px',
                        maxHeight: '65vh',
                        background: 'var(--dialog-bg)',
                        border: '1px solid var(--dialog-border)',
                        borderRadius: '16px',
                        marginTop: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-lg), 0 0 20px rgba(124, 58, 237, 0.15)',
                        transformOrigin: 'top center',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Fixed Top Search Bar */}
                    <div style={{ flexShrink: 0, paddingBottom: '4px' }}>
                        <SubjectSearch value={subjectSearch} onChange={onSearchChange} />
                    </div>

                    {/* Scrollable Subject List ONLY */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0 6px 12px',
                        maxHeight: 'calc(65vh - 60px)',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        <SubjectList
                            subjects={filteredSubjects}
                            activeId={activeSubjectId}
                            onSelect={handleSelect}
                            loading={loading}
                            pinnedIds={pinnedIds}
                            onTogglePin={onTogglePin}
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SubjectDropdownMenu;

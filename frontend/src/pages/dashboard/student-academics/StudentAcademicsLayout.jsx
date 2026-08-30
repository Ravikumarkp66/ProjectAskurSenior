import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, BookOpen, Clock, 
    Settings, ChevronRight, ArrowLeft, Loader2, 
    AlertCircle, ChevronDown, CheckCircle2, Lock 
} from 'lucide-react';
import { StudentAcademicsProvider, useStudentAcademics } from '../../../contexts/StudentAcademicsContext';
import SemestersSection from './sections/SemestersSection';
import SubjectsSection from './sections/SubjectsSection';
import TimetableSettings from '../settings/TimetableSettings';
import AcademicSettingsSection from './sections/AcademicSettingsSection';

const NAV_TABS = [
    { id: 'semesters', label: '1. Semesters', path: 'semesters', icon: Layers, emoji: '📚' },
    { id: 'subjects', label: '2. Subjects', path: 'subjects', icon: BookOpen, emoji: '📖' },
    { id: 'settings', label: '3. Academic Settings', path: 'settings', icon: Settings, emoji: '⚙' },
    { id: 'timetable', label: '4. Timetable', path: 'timetable', icon: Clock, emoji: '🗓' },
];

const InnerLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { 
        loading, 
        error, 
        semestersData, 
        currentSemester, 
        selectedSemester, 
        selectSemester, 
        isFinalized 
    } = useStudentAcademics();

    // Determine current active tab from pathname
    const activeTab = NAV_TABS.find(tab => location.pathname.includes(`/student-academics/${tab.path}`))?.id || 'semesters';
    const activeTabObj = NAV_TABS.find(t => t.id === activeTab) || NAV_TABS[0];

    const handleNavigateTab = (tabPath) => {
        navigate(`/student-academics/${tabPath}`);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '320px',
                gap: '12px',
                color: 'rgba(148, 163, 184, 0.5)'
            }}>
                <Loader2 className="animate-spin" size={26} color="#a78bfa" />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Loading Student Academics...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '24px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                maxWidth: '500px',
                margin: '40px auto',
                textAlign: 'center'
            }}>
                <AlertCircle size={28} color="#f87171" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Failed to load academic records</h3>
                <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 14px' }}>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '6px 16px',
                        borderRadius: '8px',
                        background: '#7c3aed',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    const renderActiveSection = () => {
        switch (activeTab) {
            case 'subjects':
                return <SubjectsSection />;
            case 'timetable':
                return <TimetableSettings isEmbedded={true} semester={selectedSemester} />;
            case 'settings':
                return <AcademicSettingsSection />;
            case 'semesters':
            default:
                return <SemestersSection onNavigateTab={handleNavigateTab} />;
        }
    };

    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 32px)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* ══════════════════════════════════════════════════════════════
                DESKTOP LAYOUT (≥ 768px) — exact Edit Profile structure
            ══════════════════════════════════════════════════════════════ */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '260px 1fr',
                    gap: '16px',
                    width: '100%',
                    height: '100%',
                }}
                className="hidden md:grid"
            >
                {/* ── Left Navigation Column ─────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '16px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        height: '100%',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Back to Home link */}
                    <Link
                        to="/home"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: 'rgba(148, 163, 184, 0.65)',
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'color 0.15s',
                            cursor: 'pointer',
                            alignSelf: 'flex-start'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(148, 163, 184, 0.65)'}
                    >
                        <ArrowLeft size={12} />
                        <span>Back to Home</span>
                    </Link>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
                            Student Academics
                        </h2>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)', fontWeight: 500 }}>
                            Academic management workspace
                        </span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '4px 0' }} />

                    {/* Navigation list */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        {NAV_TABS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleNavigateTab(item.path)}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        color: isActive ? '#a78bfa' : 'rgba(148, 163, 184, 0.65)',
                                        background: isActive
                                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(99, 102, 241, 0.12))'
                                            : 'transparent',
                                        border: isActive
                                            ? '1px solid rgba(139, 92, 246, 0.25)'
                                            : '1px solid transparent',
                                        boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                                        fontSize: '12.5px',
                                        fontWeight: isActive ? 600 : 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textDecoration: 'none',
                                        transition: 'all 0.18s',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        width: '100%'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                            e.currentTarget.style.color = 'rgba(148, 163, 184, 0.85)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'rgba(148, 163, 184, 0.65)';
                                        }
                                    }}
                                >
                                    <Icon size={14} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Bottom Status tag */}
                    <div style={{
                        marginTop: 'auto',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: 'rgba(148, 163, 184, 0.6)'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#c4b5fd' }}>
                            <CheckCircle2 size={11} color="#34d399" /> Structure synced
                        </span>
                        <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>Sem {selectedSemester}</span>
                    </div>
                </motion.div>

                {/* ── Right Content Column ───────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    style={{
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        minWidth: 0,
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'auto',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Compact Workspace Header Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(148, 163, 184, 0.6)' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>Student Academics</span>
                            <ChevronRight size={12} />
                            <span style={{ color: '#a78bfa', fontWeight: 600 }}>{activeTabObj.label}</span>
                        </div>

                        {/* Semester Switcher Pill */}
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                background: 'rgba(19, 18, 26, 0.7)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#e2e8f0',
                                cursor: 'pointer'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: isFinalized ? '#a78bfa' : '#34d399'
                                }} />
                                <span>Semester {selectedSemester}</span>
                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 400 }}>
                                    {isFinalized ? '· Finalized 🔒' : '· Active ●'}
                                </span>
                                <ChevronDown size={12} color="#a78bfa" />
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => selectSemester(Number(e.target.value))}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0,
                                        cursor: 'pointer',
                                        width: '100%',
                                        height: '100%'
                                    }}
                                >
                                    {semestersData.map(s => (
                                        <option key={s.semester} value={s.semester} style={{ background: '#0f0a1e', color: '#fff' }}>
                                            Semester {s.semester} {s.semester === currentSemester ? '(Current Active)' : s.status === 'completed' ? '(Finalized)' : '(Upcoming)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                        >
                            {renderActiveSection()}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MOBILE LAYOUT (< 768px)
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex md:hidden flex-col gap-3 w-full h-full p-2 box-border">
                {/* Horizontal Tab Bar */}
                <div className="flex w-full overflow-x-auto scrollbar-none gap-1.5 pb-1">
                    {NAV_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleNavigateTab(tab.path)}
                                style={{
                                    flexShrink: 0,
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    background: isActive
                                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(99, 102, 241, 0.2))'
                                        : 'rgba(19, 18, 26, 0.6)',
                                    border: isActive
                                        ? '1px solid rgba(139, 92, 246, 0.4)'
                                        : '1px solid rgba(255, 255, 255, 0.06)',
                                    color: isActive ? '#c4b5fd' : 'rgba(148, 163, 184, 0.7)'
                                }}
                            >
                                <Icon size={13} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Mobile */}
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    overflowY: 'auto',
                    background: 'rgba(19, 18, 26, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '14px',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                        >
                            {renderActiveSection()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const StudentAcademicsLayout = () => {
    return (
        <StudentAcademicsProvider>
            <InnerLayout />
        </StudentAcademicsProvider>
    );
};

export default StudentAcademicsLayout;

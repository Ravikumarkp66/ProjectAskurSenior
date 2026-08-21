import React from 'react';
import { Calculator, Table, ChevronDown } from 'lucide-react';

const SgpaHeader = ({
    selectedSemester,
    availableSemesters = [],
    onSemesterChange,
    activeTab,
    onTabChange,
    globalSeeMax,
    onGlobalSeeMaxToggle
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginBottom: 24
        }}>
            {/* Top Row: Title + Semester Switcher */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(59, 130, 246, 0.25))',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a78bfa'
                    }}>
                        <Calculator size={22} />
                    </div>
                    <div>
                        <h1 style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: '#f8fafc',
                            margin: 0,
                            letterSpacing: '-0.02em'
                        }}>
                            SGPA Calculator
                        </h1>
                        <p style={{
                            fontSize: 13,
                            color: '#94a3b8',
                            margin: '2px 0 0',
                            fontWeight: 400
                        }}>
                            Calculate your semester result and track your academic performance.
                        </p>
                    </div>
                </div>

                {/* Top Right: Semester Switcher Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedSemester}
                            onChange={(e) => onSemesterChange(Number(e.target.value))}
                            style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                background: 'rgba(15, 23, 42, 0.85)',
                                border: '1px solid rgba(139, 92, 246, 0.35)',
                                borderRadius: 12,
                                padding: '10px 38px 10px 16px',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#e2e8f0',
                                cursor: 'pointer',
                                outline: 'none',
                                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
                            }}
                        >
                            {availableSemesters.map((semObj) => (
                                <option key={semObj.semester} value={semObj.semester} style={{ background: '#0f172a', color: '#e2e8f0' }}>
                                    Semester {semObj.semester} {semObj.isCurrent ? '• Current' : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            style={{
                                position: 'absolute',
                                right: 14,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8',
                                pointerEvents: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Sub Row: SEE Format Preference & View Tabs */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                paddingTop: 4,
                borderTop: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
                {/* 2 Main Tabs Only: Result Entry | Semester Summary */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    padding: 4,
                    borderRadius: 12
                }}>
                    <button
                        onClick={() => onTabChange('entry')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 18px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: activeTab === 'entry' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                            color: activeTab === 'entry' ? '#ffffff' : '#94a3b8',
                            boxShadow: activeTab === 'entry' ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none'
                        }}
                    >
                        <Calculator size={15} />
                        <span>Result Entry</span>
                    </button>

                    <button
                        onClick={() => onTabChange('summary')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 18px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: activeTab === 'summary' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                            color: activeTab === 'summary' ? '#ffffff' : '#94a3b8',
                            boxShadow: activeTab === 'summary' ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none'
                        }}
                    >
                        <Table size={15} />
                        <span>Semester Summary</span>
                    </button>
                </div>

                {/* SEE Preference Switcher */}
                {activeTab === 'entry' && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        padding: '5px 12px',
                        borderRadius: 12
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                            SEE entered as:
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button
                                onClick={() => onGlobalSeeMaxToggle(100)}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: globalSeeMax === 100 ? '#7c3aed' : 'transparent',
                                    color: globalSeeMax === 100 ? '#ffffff' : '#94a3b8'
                                }}
                            >
                                / 100
                            </button>
                            <button
                                onClick={() => onGlobalSeeMaxToggle(50)}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: globalSeeMax === 50 ? '#7c3aed' : 'transparent',
                                    color: globalSeeMax === 50 ? '#ffffff' : '#94a3b8'
                                }}
                            >
                                / 50
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SgpaHeader;

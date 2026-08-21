import React from 'react';
import { Sparkles, Calendar, RotateCw, FileSpreadsheet, LayoutGrid } from 'lucide-react';

const CieHeader = ({
    selectedSemester,
    availableSemesters = [],
    onSelectSemester,
    activeTab,
    onTabChange,
    isRefreshing,
    onRefresh
}) => {
    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(30, 27, 46, 0.7) 0%, rgba(18, 15, 29, 0.8) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '18px 24px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                {/* Title & Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#c4b5fd'
                    }}>
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                                CIE Analyzer
                            </h1>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '20px',
                                background: 'rgba(124, 58, 237, 0.2)',
                                color: '#a78bfa',
                                border: '1px solid rgba(124, 58, 237, 0.3)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                SIT Engine
                            </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                            Continuous Internal Evaluation analysis & eligibility tracking.
                        </p>
                    </div>
                </div>

                {/* Semester Switcher & Refresh */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '6px 12px' }}>
                        <Calendar size={14} color="#a78bfa" />
                        <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>Sem</span>
                        <select
                            value={selectedSemester}
                            onChange={(e) => onSelectSemester(Number(e.target.value))}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 700,
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {availableSemesters.map(sem => (
                                <option key={sem} value={sem} style={{ background: '#120f1d', color: '#fff' }}>
                                    Semester {sem}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        title="Recalculate CIE"
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <RotateCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* View Mode Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '14px'
            }}>
                <button
                    type="button"
                    onClick={() => onTabChange('entry')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'entry' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(255, 255, 255, 0.04)',
                        color: activeTab === 'entry' ? '#fff' : '#94a3b8',
                        boxShadow: activeTab === 'entry' ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <LayoutGrid size={15} />
                    <span>CIE Entry & Analysis</span>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('summary')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: activeTab === 'summary' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'rgba(255, 255, 255, 0.04)',
                        color: activeTab === 'summary' ? '#fff' : '#94a3b8',
                        boxShadow: activeTab === 'summary' ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <FileSpreadsheet size={15} />
                    <span>CIE Summary</span>
                </button>
            </div>
        </div>
    );
};

export default CieHeader;

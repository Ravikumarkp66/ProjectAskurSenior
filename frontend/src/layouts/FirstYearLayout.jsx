import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import { apiClient } from '../services/api';

/* ═══════════════════════════════════════════════════════════════════
   FIRST YEAR LAYOUT
   Sidebar (search + subject list + Home/Track + avatar) on the left,
   <Outlet/> on the right renders SubjectContentPage for whichever
   subject is selected, via the nested route:
     /dashboard/first-year/subject/:subjectId/content
═══════════════════════════════════════════════════════════════════ */
const FirstYearLayout = () => {
    const navigate = useNavigate();
    const { subjectId } = useParams();
    const { user } = useAuth();

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        let mounted = true;
        apiClient.get('/documents/subjects')
            .then(res => {
                if (!mounted) return;
                const raw = res.data || [];
                const list = raw.map(s => (typeof s === 'string' ? { id: s, name: s } : { id: s._id || s.code || s.name, name: s.name }));
                setSubjects(list);
            })
            .catch(() => { if (mounted) setSubjects([]); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return subjects;
        const q = search.trim().toLowerCase();
        return subjects.filter(s => s.name.toLowerCase().includes(q));
    }, [subjects, search]);

    const activeId = subjectId ? decodeURIComponent(subjectId) : null;

    const goToSubject = (s) => {
        navigate(`/dashboard/first-year/subject/${encodeURIComponent(s.id)}/content`);
    };

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            minHeight: 0,
            background: '#080416',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(139,92,246,0.12)',
        }}>
            {/* ── Sidebar ── */}
            <div style={{
                width: 290,
                minWidth: 290,
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(180deg,#0b0420 0%,#070312 100%)',
                borderRight: '1px solid rgba(139,92,246,0.12)',
            }}>
                {/* Back to dashboard */}
                <div style={{ padding: '12px 12px 0 12px' }}>
                    <button
                        onClick={() => navigate('/plus')}
                        style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'rgba(139,92,246,0.08)',
                            border: '1px solid rgba(139,92,246,0.2)',
                            color: '#a78bfa', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16,
                        }}
                        title="Back to dashboard"
                    >
                        ←
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '12px' }}>
                    <div 
                        className="rounded-xl flex items-center gap-2"
                        style={{
                            background: '#181028',
                            border: '1px solid #581c87',
                            padding: '10px 14px',
                        }}
                    >
                        <span style={{ fontSize: 13, color: 'rgba(139,92,246,0.6)' }}>🔍</span>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search subjects..."
                            style={{
                                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                color: '#E2E8F0', fontSize: 13,
                            }}
                        />
                    </div>
                </div>

                {/* Subject list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} style={{
                                height: 36, borderRadius: 8, marginBottom: 4,
                                background: 'rgba(139,92,246,0.05)',
                            }} />
                        ))
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: 16, fontSize: 12, color: 'rgba(148,163,184,0.5)', textAlign: 'center' }}>
                            No subjects found
                        </div>
                    ) : filtered.map(s => {
                        const isActive = activeId === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => goToSubject(s)}
                                className="w-full text-left px-4 py-3 rounded-xl transition duration-200 cursor-pointer border-none outline-none mb-1 text-[13px] flex items-center justify-between"
                                style={{
                                    color: isActive ? '#00f5b8' : 'rgba(203,213,225,0.8)',
                                    fontWeight: isActive ? 700 : 500,
                                    background: isActive ? 'rgba(139,92,246,0.14)' : 'transparent',
                                    borderLeft: isActive ? '3px solid #a78bfa' : '3px solid transparent',
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(88, 28, 135, 0.2)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span>{s.name}</span>
                                {isActive && <span className="text-[10px] text-[#00f5b8]">●</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Home / Track buttons */}
                <div style={{
                    display: 'flex', gap: 8, padding: '10px 12px',
                    borderTop: '1px solid rgba(139,92,246,0.1)',
                }}>
                    <button
                        onClick={() => navigate('/plus')}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '8px 0', borderRadius: 8,
                            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)',
                            color: '#c4b5fd', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        🏠 Home
                    </button>
                    <button
                        onClick={() => navigate('/academic-setup')}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '8px 0', borderRadius: 8,
                            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)',
                            color: '#c4b5fd', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        📍 Track
                    </button>
                </div>

                {/* User strip */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px',
                    borderTop: '1px solid rgba(139,92,246,0.08)',
                }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                        {(user?.usn || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.usn || 'Student'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
                {activeId ? (
                    <Outlet />
                ) : (
                    <div style={{
                        height: '100%', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 10,
                        color: 'rgba(148,163,184,0.45)',
                    }}>
                        <div style={{ fontSize: 28 }}>📘</div>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>Select a subject from the sidebar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FirstYearLayout;

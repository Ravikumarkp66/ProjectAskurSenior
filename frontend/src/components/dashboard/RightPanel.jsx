import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import {
    Check,
    CheckCircle2,
    ClipboardList,
    Expand,
    Pencil,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { documentsAPI, authAPI } from '../../services/api';
import AcademicStreakWidget from './AcademicStreakWidget';

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════ */
const CARD_STYLE = {
    background: 'var(--dashboard-panel-bg)',
    border: '1px solid var(--dashboard-panel-border)',
    borderRadius: 18,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: 'var(--dashboard-panel-shadow)',
    transition: 'all 0.22s ease',
};

const PLACEHOLDER_STYLE = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px dashed rgba(139,92,246,0.1)',
    borderRadius: 10,
    background: 'rgba(139,92,246,0.01)',
    textAlign: 'center',
};

/* ═══════════════════════════════════════════════════════════════════
   REUSABLE DASHBOARD WIDGET COMPONENT
═══════════════════════════════════════════════════════════════════ */
const DashboardWidget = ({ title, subtitle, children }) => (
    <div style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid var(--dashboard-widget-divider)',
    }}>
        {title && (
            <div style={{ margin: '0 0 16px 0' }}>
                <p style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--dashboard-widget-title)',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: 0,
                }}>
                    {title}
                </p>
                {subtitle && (
                    <p style={{
                        color: 'var(--theme-text-muted)',
                        fontSize: 11,
                        fontWeight: 500,
                        margin: '4px 0 0 0',
                        lineHeight: 1.35,
                    }}>
                        {subtitle}
                    </p>
                )}
            </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   WIDGET 1: STUDENT DETAILS
═══════════════════════════════════════════════════════════════════ */
const StudentDetailsWidget = ({ user: initialUser }) => {
    // Use the user from AuthContext directly — it already has
    // the correct CloudFront profile picture URL from the V2 login DTO.
    const [profile, setProfile] = useState(initialUser);

    useEffect(() => {
        setProfile(initialUser);
    }, [initialUser]);

    const initials = profile?.name
        ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : profile?.email?.[0]?.toUpperCase() || '?';

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.startsWith('http')) return pic;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${pic}`;
    };

    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [profile?.profilePicture]);

    return (
        <DashboardWidget title="Student Details" icon="👤">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(139,92,246,0.3)',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.2))',
                    color: '#c4b5fd',
                    fontSize: 16,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}>
                    {profile?.profilePicture && !imgError ? (
                        <img 
                            src={getProfilePicUrl(profile.profilePicture)} 
                            alt="" 
                            onError={() => setImgError(true)} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    ) : (
                        initials
                    )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#f8fafc',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {profile?.name || 'Guest Student'}
                    </p>
                    <p style={{
                        fontSize: 11,
                        color: 'rgba(148,163,184,0.5)',
                        margin: '2px 0 0 0',
                        fontWeight: 500,
                        fontFamily: 'monospace',
                    }}>
                        USN: {profile?.usn || 'N/A'}
                    </p>
                </div>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginTop: 16,
                borderTop: '1px solid rgba(139,92,246,0.08)',
                paddingTop: 12,
            }}>
                <div>
                    <p style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', margin: 0, fontWeight: 600, letterSpacing: '0.04em' }}>Semester</p>
                    <p style={{ fontSize: 13, color: '#f8fafc', margin: '4px 0 0 0', fontWeight: 600 }}>
                        {profile?.semester ? `${profile.semester}th Sem` : 'Not Set'}
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', textTransform: 'uppercase', margin: 0, fontWeight: 600, letterSpacing: '0.04em' }}>CGPA</p>
                    <p style={{ fontSize: 13, color: '#f8fafc', margin: '4px 0 0 0', fontWeight: 600 }}>
                        {profile?.academicProfile?.cgpa !== undefined && profile?.academicProfile?.cgpa !== null ? profile.academicProfile.cgpa : ''}
                    </p>
                </div>
            </div>
        </DashboardWidget>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   RIGHT PANEL MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const useAnimatedNumber = (value, duration = 850) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let frameId;
        const startTime = performance.now();
        const startValue = displayValue;
        const delta = value - startValue;

        const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(startValue + delta * eased));

            if (progress < 1) {
                frameId = requestAnimationFrame(tick);
            }
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [value, duration]);

    return displayValue;
};

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius - 1}
            outerRadius={outerRadius + 5}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            cornerRadius={8}
        />
    );
};

const MaterialsLegendRow = ({ item, index, isActive, onEnter, onLeave }) => {
    const animatedValue = useAnimatedNumber(item.value);

    return (
        <button
            type="button"
            className={isActive ? 'materials-legend-row active' : 'materials-legend-row'}
            onMouseEnter={() => onEnter(index)}
            onMouseLeave={onLeave}
            style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', width: '100%', gap: '12px' }}
        >
            <span className="materials-legend-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className="materials-legend-dot" style={{ background: item.color }} />
                <span>{item.name}</span>
            </span>
            <span className="materials-legend-metric" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '6px', marginLeft: 'auto' }}>
                <span className="materials-legend-value" style={{ fontWeight: 800 }}>{animatedValue.toLocaleString()}</span>
                <span className="materials-legend-percent" style={{ opacity: 0.75 }}>({item.percent}%)</span>
            </span>
        </button>
    );
};

const MaterialsOverviewWidget = () => {
    const [stats, setStats] = useState({ notes: 0, pyqs: 0, others: 0 });
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchStats = async () => {
            try {
                const response = await documentsAPI.getMaterialsOverview();
                if (!mounted) return;

                setStats({
                    notes: Number(response.data?.notes || 0),
                    pyqs: Number(response.data?.pyqs || 0),
                    others: Number(response.data?.others || 0),
                });
            } catch (error) {
                console.error('Failed to fetch materials overview', error);
            }
        };

        fetchStats();
        return () => {
            mounted = false;
        };
    }, []);

    const total = stats.notes + stats.pyqs + stats.others;
    const animatedTotal = useAnimatedNumber(total);

    const data = useMemo(() => [
        { key: 'notes', name: 'Notes', value: stats.notes, color: '#10B981' },
        { key: 'pyqs', name: 'PYQs', value: stats.pyqs, color: '#F59E0B' },
        { key: 'others', name: 'Others', value: stats.others, color: '#A855F7' },
    ].map(item => ({
        ...item,
        percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
    })), [stats, total]);

    const chartData = total > 0 ? data : [{ key: 'empty', name: 'Empty', value: 1, color: 'rgba(255,255,255,0.08)' }];

    return (
        <div style={{
            margin: '16px 14px',
            padding: '20px 18px',
            borderRadius: '22px',
            background: '#121622',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            position: 'relative',
        }}>
            {/* Top Capsule Header with Info Icon */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '100%',
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '999px',
                    padding: '5px 18px',
                    color: '#F8FAFC',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                }}>
                    Materials Overview
                </div>

                <div 
                    title="All approved materials in library"
                    style={{
                        position: 'absolute',
                        right: 0,
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        fontFamily: 'serif',
                        cursor: 'pointer',
                    }}
                >
                    i
                </div>
            </div>

            {/* Donut & Legend Container */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                alignItems: 'center',
                gap: '16px',
                paddingTop: '4px',
            }}>
                {/* Left Glowing Donut Ring */}
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius="72%"
                                outerRadius="90%"
                                startAngle={90}
                                endAngle={-270}
                                paddingAngle={total > 0 ? 5 : 0}
                                cornerRadius={6}
                                activeIndex={activeIndex}
                                isAnimationActive
                                animationDuration={800}
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={entry.key}
                                        fill={entry.color}
                                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text (355 / Line / Materials) */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}>
                        <span style={{
                            fontSize: '22px',
                            fontWeight: 800,
                            color: '#FFFFFF',
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                        }}>
                            {animatedTotal.toLocaleString()}
                        </span>
                        <div style={{
                            width: '28px',
                            height: '1px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            margin: '4px 0 3px 0',
                        }} />
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}>
                            Materials
                        </span>
                    </div>
                </div>

                {/* Right Legend List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {data.map((item, index) => (
                        <div
                            key={item.key}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'opacity 0.18s ease',
                                opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: item.color,
                                    boxShadow: `0 0 8px ${item.color}80`,
                                }} />
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#CBD5E1',
                                }}>
                                    {item.name}
                                </span>
                            </div>

                            <span style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#F8FAFC',
                                fontFamily: 'monospace',
                            }}>
                                {item.value} <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>({item.percent}%)</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DAILY_FILTERS = [
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
    { key: 'missed', label: 'Missed' },
];

const formatDueLine = (task) => {
    if (!task.dueDate) return 'No due date';

    const now = new Date();
    const due = new Date(`${task.dueDate}T00:00:00`);
    const isToday = due.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = due.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const DailyPlannerWidget = () => {
    const [tasks, setTasks] = useState([]);
    const [activeFilter, setActiveFilter] = useState('ongoing');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);
    const [form, setForm] = useState({
        title: '',
        dueDate: '',
        notes: '',
    });

    const getEffectiveStatus = (task) => {
        if (task.status === 'completed') return 'completed';
        if (!task.dueDate) return 'ongoing';
        const now = new Date();
        const dueAt = new Date(`${task.dueDate}T23:59`);
        return dueAt < now ? 'missed' : 'ongoing';
    };

    const tasksWithStatus = useMemo(
        () => tasks.map((task) => ({ ...task, effectiveStatus: getEffectiveStatus(task) })),
        [tasks]
    );

    const counts = useMemo(() => ({
        ongoing: tasksWithStatus.filter((task) => task.effectiveStatus === 'ongoing').length,
        completed: tasksWithStatus.filter((task) => task.effectiveStatus === 'completed').length,
        missed: tasksWithStatus.filter((task) => task.effectiveStatus === 'missed').length,
    }), [tasksWithStatus]);

    const filteredTasks = useMemo(
        () => tasksWithStatus.filter((task) => task.effectiveStatus === activeFilter),
        [tasksWithStatus, activeFilter]
    );

    const progress = useMemo(() => {
        const todayIso = new Date().toISOString().slice(0, 10);
        const todayTasks = tasksWithStatus.filter((task) => task.dueDate === todayIso);
        const target = todayTasks.length > 0 ? todayTasks : tasksWithStatus;
        if (target.length === 0) return 0;

        const done = target.filter((task) => task.effectiveStatus === 'completed').length;
        return Math.round((done / target.length) * 100);
    }, [tasksWithStatus]);

    const openCreateModal = () => {
        setEditingId(null);
        setForm({
            title: '',
            dueDate: '',
            notes: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (task) => {
        setEditingId(task.id);
        setForm({
            title: task.title,
            dueDate: task.dueDate || '',
            notes: task.notes || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSaveTask = (event) => {
        event.preventDefault();
        const trimmedTitle = form.title.trim();
        if (!trimmedTitle) return;

        const payload = {
            title: trimmedTitle,
            dueDate: form.dueDate,
            notes: form.notes.trim(),
        };

        if (editingId) {
            setTasks((prev) => prev.map((task) => (
                task.id === editingId
                    ? { ...task, ...payload }
                    : task
            )));
        } else {
            setTasks((prev) => [{
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                status: 'ongoing',
                createdAt: new Date().toISOString(),
                ...payload,
            }, ...prev]);
        }

        setIsModalOpen(false);
    };

    const toggleComplete = (taskId) => {
        setTasks((prev) => prev.map((task) => (
            task.id === taskId
                ? { ...task, status: task.status === 'completed' ? 'ongoing' : 'completed' }
                : task
        )));
    };

    const deleteTask = (taskId) => {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
    };

    if (!isExpanded) {
        return (
            <div
                onClick={() => setIsExpanded(true)}
                style={{
                    margin: '16px 14px',
                    padding: '12px 18px',
                    borderRadius: '22px',
                    background: '#121622',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                }}
            >
                <div style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '5px 22px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                }}>
                    <span>Daily Planner</span>
                    <span style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '999px',
                        padding: '1px 8px',
                        fontSize: '11px',
                        color: '#F8FAFC',
                    }}>
                        {tasks.length}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(true);
                    }}
                    title="Expand Daily Planner"
                    style={{
                        position: 'absolute',
                        right: '16px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <Expand size={13} color="#94A3B8" />
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="daily-planner-card" style={{ margin: '16px 14px', background: '#121622', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="daily-planner-header">
                    <h3>Daily Planner</h3>
                    <div className="daily-planner-actions">
                        <button type="button" className="planner-header-button" onClick={openCreateModal}>
                            <Plus size={14} />
                            Add Task
                        </button>
                        <button type="button" className="planner-icon-button" aria-label="Minimize planner" onClick={() => setIsExpanded(false)}>
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div className="daily-planner-filters" role="tablist" aria-label="Task status filters">
                    {DAILY_FILTERS.map((filter) => (
                        <button
                            key={filter.key}
                            type="button"
                            role="tab"
                            aria-selected={activeFilter === filter.key}
                            className={activeFilter === filter.key ? 'planner-filter-tab active' : 'planner-filter-tab'}
                            onClick={() => setActiveFilter(filter.key)}
                        >
                            {filter.label} ({counts[filter.key]})
                        </button>
                    ))}
                </div>

                {filteredTasks.length === 0 ? (
                    <div className="planner-empty-state">
                        <div className="planner-empty-icon" aria-hidden="true">
                            <ClipboardList size={26} />
                        </div>
                        <p>Plan your day</p>
                        <span>Stay organized by adding today&apos;s academic tasks.</span>
                        <button type="button" className="planner-empty-cta" onClick={openCreateModal}>
                            <Plus size={14} />
                            Add your first task
                        </button>
                    </div>
                ) : (
                    <div className="planner-task-list" aria-live="polite">
                        {filteredTasks.map((task) => {
                            const isCompleted = task.effectiveStatus === 'completed';
                            return (
                                <div
                                    key={task.id}
                                    className={isCompleted ? 'planner-task-row is-completed' : 'planner-task-row'}
                                    onMouseEnter={() => setHoveredRow(task.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <button
                                        type="button"
                                        className={isCompleted ? 'planner-check-button checked' : 'planner-check-button'}
                                        onClick={() => toggleComplete(task.id)}
                                        aria-label={isCompleted ? 'Mark task ongoing' : 'Mark task complete'}
                                    >
                                        {isCompleted ? <Check size={12} /> : <span className="planner-check-dot" />}
                                    </button>

                                    <div className="planner-task-main">
                                        <p className="planner-task-title">{task.title}</p>
                                        <div className="planner-task-meta">
                                            <span>Due: {formatDueLine(task)}</span>
                                        </div>
                                        {task.notes && <p className="planner-task-note">{task.notes}</p>}
                                    </div>

                                    <div className={hoveredRow === task.id ? 'planner-task-actions visible' : 'planner-task-actions'}>
                                        <button type="button" onClick={() => openEditModal(task)} aria-label="Edit task">
                                            <Pencil size={12} />
                                        </button>
                                        <button type="button" onClick={() => deleteTask(task.id)} aria-label="Delete task">
                                            <Trash2 size={12} />
                                        </button>
                                        {!isCompleted && (
                                            <button type="button" onClick={() => toggleComplete(task.id)} aria-label="Mark complete">
                                                <CheckCircle2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="planner-progress-wrap">
                    <div className="planner-progress-head">
                        <span>Today&apos;s Progress</span>
                        <strong>{progress}%</strong>
                    </div>
                    <div className="planner-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                        <div className="planner-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="planner-modal-backdrop" role="presentation" onClick={closeModal}>
                    <div className="planner-modal" role="dialog" aria-modal="true" aria-label="Add task" onClick={(event) => event.stopPropagation()}>
                        <div className="planner-modal-head">
                            <h4>{editingId ? 'Edit Task' : 'Add Task'}</h4>
                            <button type="button" className="planner-icon-button" aria-label="Close" onClick={closeModal}>
                                <X size={14} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTask} className="planner-form-grid">
                            <label>
                                Task Title
                                <input
                                    required
                                    value={form.title}
                                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                                    placeholder="Revise Module 4"
                                />
                            </label>

                            <label>
                                Date
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                                />
                            </label>

                            <label>
                                Notes (optional)
                                <textarea
                                    value={form.notes}
                                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                                    rows={3}
                                    placeholder="Add reminders or context"
                                />
                            </label>

                            <button type="submit" className="planner-save-button">
                                <CheckCircle2 size={14} />
                                Save
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const RightPanel = () => {
    const { user } = useContext(AuthContext);

    return (
        <div style={{
            padding: 0,
            height: '100vh',
            boxSizing: 'border-box',
            overflow: 'hidden',
            width: '100%',
        }}>
            <div style={{
                ...CARD_STYLE,
                borderRadius: '0px',
                borderTop: 'none',
                borderBottom: 'none',
                borderRight: 'none',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                minHeight: '100vh',
                height: '100vh',
                overflowY: 'auto',
            }} className="no-scrollbar">
                <MaterialsOverviewWidget user={user} />

                <AcademicStreakWidget user={user} />

                <DailyPlannerWidget />
            </div>
        </div>
    );
};

export {
    StudentDetailsWidget,
    MaterialsOverviewWidget,
    AcademicStreakWidget,
    DailyPlannerWidget
};

export default RightPanel;

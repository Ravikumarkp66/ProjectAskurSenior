import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import {
    ArrowRight,
    Check,
    CheckCircle2,
    ClipboardList,
    Expand,
    Lock,
    Pencil,
    Plus,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { documentsAPI } from '../../services/api';
import { logAcademicActivity } from '../../utils/academicStreak';
import AcademicStreakWidget from './AcademicStreakWidget';

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS (CSES Sheet Style)
═══════════════════════════════════════════════════════════════════ */
const CARD_STYLE = {
    background: 'var(--dashboard-panel-bg)',
    border: '1px solid var(--dashboard-panel-border)',
    borderRadius: 8,
    boxShadow: 'none',
    transition: 'all 0.2s ease-out',
};

/* ═══════════════════════════════════════════════════════════════════
   REUSABLE DASHBOARD WIDGET (CSES Monospace Headers)
═══════════════════════════════════════════════════════════════════ */
const DashboardWidget = ({ title, subtitle, children }) => (
    <div className="p-4 sm:p-5 flex flex-col border-b border-slate-100 dark:border-white/[0.06]">
        {title && (
            <div className="mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title}
                </span>
                {subtitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-sans">
                        {subtitle}
                    </p>
                )}
            </div>
        )}
        <div className="flex-1 flex flex-col">
            {children}
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   WIDGET 1: STUDENT DETAILS (CSES Technical Strip)
═══════════════════════════════════════════════════════════════════ */
const StudentDetailsWidget = ({ user: initialUser }) => {
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
        <div className="mx-3.5 my-3 p-4 rounded-lg border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] flex flex-col gap-3 text-[#111827] dark:text-[#F3F4F6]">
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    STUDENT PROFILE
                </span>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-sm font-bold flex items-center justify-center overflow-hidden shrink-0">
                    {profile?.profilePicture && !imgError ? (
                        <img 
                            src={getProfilePicUrl(profile.profilePicture)} 
                            alt="" 
                            onError={() => setImgError(true)} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        initials
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate text-slate-900 dark:text-white m-0 font-sans">
                        {profile?.name || 'Guest Student'}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 m-0 uppercase">
                        USN: {profile?.usn || 'N/A'}
                    </p>
                </div>
            </div>

            {/* CSES Summary Strip */}
            <div className="grid grid-cols-2 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] divide-x divide-slate-200/80 dark:divide-white/[0.08] py-2 px-3">
                <div className="flex flex-col pr-2">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        SEMESTER
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {profile?.semester ? `SEM ${profile.semester}` : 'NOT SET'}
                    </span>
                </div>
                <div className="flex flex-col pl-3">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        CGPA
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {profile?.academicProfile?.cgpa !== undefined && profile?.academicProfile?.cgpa !== null ? profile.academicProfile.cgpa : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED NUMBER HELPER
═══════════════════════════════════════════════════════════════════ */
const useAnimatedNumber = (value, duration = 750) => {
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

const STATIC_MATERIALS_STATS = {
    notes: 248,
    pyqs: 132,
    others: 45,
};

/* ═══════════════════════════════════════════════════════════════════
   WIDGET 2: MATERIALS OVERVIEW (CSES Sheet Style)
═══════════════════════════════════════════════════════════════════ */
const MaterialsOverviewWidget = ({ isStatic }) => {
    const { isDark } = useTheme();
    const { hasPlusAccess, isAuthenticated } = useContext(AuthContext);
    const isFreeOrUnauthenticated = isStatic !== undefined ? isStatic : (!isAuthenticated || !hasPlusAccess);

    const [stats, setStats] = useState(() => (
        isFreeOrUnauthenticated ? STATIC_MATERIALS_STATS : { notes: 0, pyqs: 0, others: 0 }
    ));
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        // Zero backend API calls for non-logged in users and non-plus users
        if (isFreeOrUnauthenticated) {
            setStats(STATIC_MATERIALS_STATS);
            return;
        }

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
    }, [isFreeOrUnauthenticated]);

    const total = stats.notes + stats.pyqs + stats.others;
    const animatedTotal = useAnimatedNumber(total);

    const data = useMemo(() => [
        { key: 'notes', name: 'Notes', value: stats.notes, color: '#10B981' },
        { key: 'pyqs', name: 'PYQs', value: stats.pyqs, color: '#F59E0B' },
        { key: 'others', name: 'Others', value: stats.others, color: '#8B5CF6' },
    ].map(item => ({
        ...item,
        percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
    })), [stats, total]);

    const emptyChartColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
    const chartData = total > 0 ? data : [{ key: 'empty', name: 'Empty', value: 1, color: emptyChartColor }];

    return (
        <div className="mx-3.5 my-3 p-4 rounded-lg border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] flex flex-col gap-3.5 text-[#111827] dark:text-[#F3F4F6]">
            {/* ── HEADER ────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    MATERIALS OVERVIEW
                </span>
                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 select-none">
                    TOTAL: {animatedTotal.toLocaleString()}
                </span>
            </div>

            {/* ── DONUT & CSES BREAKDOWN TABLE ───────────────────────── */}
            <div className="grid grid-cols-[100px_1fr] items-center gap-3">
                {/* Donut Ring */}
                <div className="relative w-[100px] h-[100px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius="68%"
                                outerRadius="88%"
                                startAngle={90}
                                endAngle={-270}
                                paddingAngle={total > 0 ? 4 : 0}
                                cornerRadius={4}
                                activeIndex={activeIndex}
                                isAnimationActive
                                animationDuration={700}
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={entry.key}
                                        fill={entry.color}
                                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Monospace Count */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="font-mono text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">
                            {animatedTotal.toLocaleString()}
                        </span>
                        <div className="w-5 h-[1px] bg-slate-200 dark:bg-white/10 my-1" />
                        <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            DOCS
                        </span>
                    </div>
                </div>

                {/* CSES Legend Rows */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    {data.map((item, index) => (
                        <div
                            key={item.key}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                activeIndex === index
                                    ? 'bg-purple-50/60 dark:bg-purple-500/15 border-purple-300/60 dark:border-purple-500/30'
                                    : 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10'
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate font-sans">
                                    {item.name}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-1.5 font-mono shrink-0">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {item.value}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    ({item.percent}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   WIDGET 3: DAILY PLANNER (CSES Sheet Style)
═══════════════════════════════════════════════════════════════════ */
const DAILY_FILTERS = [
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
    { key: 'missed', label: 'Missed' },
];

const INITIAL_PLANNER_TASKS = [
    {
        id: 'task-1',
        title: 'Revise Module 4 Algorithms',
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'ongoing',
        notes: 'Dynamic Programming & Graphs',
    },
    {
        id: 'task-2',
        title: 'Complete Operating Systems Lab 3',
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'completed',
        notes: 'Process synchronization semaphore implementation',
    },
    {
        id: 'task-3',
        title: 'Review DBMS Normalization notes',
        dueDate: '',
        status: 'ongoing',
        notes: 'BCNF vs 3NF decomposition examples',
    },
];

const getInitialTasks = () => {
    try {
        const saved = localStorage.getItem('ask_daily_planner_tasks');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // ignore localStorage errors
    }
    return INITIAL_PLANNER_TASKS;
};

const getDueBadge = (task) => {
    if (!task.dueDate) return null;
    if (task.effectiveStatus === 'missed') {
        return {
            label: 'OVERDUE',
            classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
    }
    const due = new Date(`${task.dueDate}T00:00:00`);
    const now = new Date();
    if (due.toDateString() === now.toDateString()) {
        return {
            label: 'TODAY',
            classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
    }
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (due.toDateString() === tomorrow.toDateString()) {
        return {
            label: 'TMRW',
            classes: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        };
    }
    return {
        label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase(),
        classes: 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10',
    };
};

const DailyPlannerWidget = ({ isStatic }) => {
    const { hasPlusAccess, isAuthenticated } = useContext(AuthContext);
    const isFreeOrUnauthenticated = isStatic !== undefined ? isStatic : (!isAuthenticated || !hasPlusAccess);

    const [tasks, setTasks] = useState(() => (
        isFreeOrUnauthenticated ? INITIAL_PLANNER_TASKS : getInitialTasks()
    ));
    const [activeFilter, setActiveFilter] = useState('ongoing');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        title: '',
        dueDate: '',
        notes: '',
    });

    useEffect(() => {
        if (isFreeOrUnauthenticated) return;
        try {
            localStorage.setItem('ask_daily_planner_tasks', JSON.stringify(tasks));
        } catch {
            // ignore localStorage errors
        }
    }, [tasks, isFreeOrUnauthenticated]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    const getEffectiveStatus = (task) => {
        if (task.status === 'completed') return 'completed';
        if (!task.dueDate) return 'ongoing';
        const now = new Date();
        const dueAt = new Date(`${task.dueDate}T23:59:59`);
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
            dueDate: new Date().toISOString().slice(0, 10),
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
                id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                status: 'ongoing',
                createdAt: new Date().toISOString(),
                ...payload,
            }, ...prev]);
        }

        setIsModalOpen(false);
    };

    const toggleComplete = (taskId) => {
        setTasks((prev) => prev.map((task) => {
            if (task.id === taskId) {
                const newStatus = task.status === 'completed' ? 'ongoing' : 'completed';
                if (newStatus === 'completed') {
                    // Log academic activity for streak calendar
                    logAcademicActivity({
                        type: 'planner_task',
                        label: `Completed: ${task.title}`
                    });
                    window.dispatchEvent(new Event('academic-streak:updated'));
                }
                return { ...task, status: newStatus };
            }
            return task;
        }));
    };

    const deleteTask = (taskId) => {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
    };

    if (!isExpanded) {
        return (
            <div
                onClick={() => setIsExpanded(true)}
                className="mx-3.5 my-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-between group bg-white dark:bg-[#15181D] border-[#E5E7EB] dark:border-[#292E37] hover:border-[#2563EB] dark:hover:border-[#3B82F6] text-[#111827] dark:text-[#F3F4F6]"
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-500/10 border border-purple-200/60 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <ClipboardList size={13} />
                    </div>
                    <span className="font-mono text-xs font-bold tracking-tight text-slate-800 dark:text-slate-200">
                        DAILY PLANNER
                    </span>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/20">
                        [ {counts.completed}/{tasks.length} SOLVED ]
                    </span>
                </div>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(true);
                    }}
                    title="Expand Daily Planner"
                    className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors cursor-pointer"
                >
                    <Expand size={13} />
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="mx-3.5 my-3 p-4 rounded-lg border transition-all duration-200 flex flex-col gap-3.5 bg-white dark:bg-[#15181D] border-[#E5E7EB] dark:border-[#292E37] text-[#111827] dark:text-[#F3F4F6]">
                {/* ── CSES HEADER ────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            DAILY PLANNER
                        </span>
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/20 truncate">
                            [ {counts.completed}/{tasks.length} SOLVED ]
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold font-mono text-white bg-purple-600 hover:bg-purple-500 shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                            <Plus size={12} />
                            <span>+TASK</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            aria-label="Minimize planner"
                            title="Minimize planner"
                            className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200/80 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                            <X size={13} />
                        </button>
                    </div>
                </div>

                {/* ── CSES SEGMENTED FILTER TABS ─────────────────────── */}
                <div className="grid grid-cols-3 p-1 rounded-lg bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] gap-1" role="tablist" aria-label="Task status filters">
                    {DAILY_FILTERS.map((filter) => {
                        const isActive = activeFilter === filter.key;
                        return (
                            <button
                                key={filter.key}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveFilter(filter.key)}
                                className={`py-1 px-1.5 rounded-md text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-white dark:bg-purple-600/25 text-purple-700 dark:text-purple-300 font-bold border border-slate-200/80 dark:border-purple-500/30 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium border border-transparent'
                                }`}
                            >
                                <span>{filter.label}</span>
                                <span className={`text-[9px] font-bold px-1 py-0.1 rounded ${
                                    isActive
                                        ? 'bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300'
                                        : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                                }`}>
                                    {counts[filter.key]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── CSES TASK ROWS ─────────────────────────────────── */}
                {filteredTasks.length === 0 ? (
                    <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-white/[0.02]">
                        <ClipboardList size={18} className="text-slate-400 dark:text-slate-500 mb-1.5" />
                        <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 m-0">
                            NO {activeFilter.toUpperCase()} TASKS
                        </p>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2.5">
                            {activeFilter === 'ongoing'
                                ? 'All caught up! Add a new task to maintain your streak.'
                                : activeFilter === 'completed'
                                ? 'No solved tasks in this view yet.'
                                : 'Zero overdue tasks.'}
                        </span>
                        {activeFilter === 'ongoing' && (
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold font-mono rounded-md border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all cursor-pointer"
                            >
                                <Plus size={12} />
                                ADD FIRST TASK
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto pr-0.5 no-scrollbar" aria-live="polite">
                        {filteredTasks.map((task, idx) => {
                            const isCompleted = task.effectiveStatus === 'completed';
                            const isMissed = task.effectiveStatus === 'missed';
                            const dueBadge = getDueBadge(task);
                            const indexStr = String(idx + 1).padStart(2, '0');

                            return (
                                <div
                                    key={task.id}
                                    className={`group relative flex items-start gap-2 p-2 rounded-lg border transition-all duration-150 ${
                                        isCompleted
                                            ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-500/20'
                                            : isMissed
                                            ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200/40 dark:border-rose-500/20'
                                            : 'bg-slate-50/70 hover:bg-white dark:bg-white/[0.02] dark:hover:bg-white/[0.05] border-slate-200/60 hover:border-slate-300 dark:border-white/[0.05] dark:hover:border-white/10'
                                    }`}
                                >
                                    {/* CSES Index Number */}
                                    <span className={`font-mono text-[10px] font-bold pt-0.5 w-4 text-center shrink-0 select-none ${
                                        isCompleted
                                            ? 'text-emerald-600/70 dark:text-emerald-400/70'
                                            : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                        {indexStr}
                                    </span>

                                    {/* Checkbox */}
                                    <button
                                        type="button"
                                        onClick={() => toggleComplete(task.id)}
                                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                                            isCompleted
                                                ? 'bg-emerald-500 border border-emerald-500 text-white shadow-xs'
                                                : 'border border-slate-300 dark:border-slate-600 hover:border-purple-500 dark:hover:border-purple-400 bg-white dark:bg-slate-900/40'
                                        }`}
                                        aria-label={isCompleted ? 'Mark ongoing' : 'Mark completed'}
                                    >
                                        {isCompleted && <Check size={11} strokeWidth={3} />}
                                    </button>

                                    {/* Task Info */}
                                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className={`text-xs font-semibold leading-snug break-words m-0 font-sans ${
                                                isCompleted
                                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                                    : 'text-slate-800 dark:text-slate-200'
                                            }`}>
                                                {task.title}
                                            </p>

                                            {/* CSES Status Tag */}
                                            {isCompleted ? (
                                                <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30">
                                                    SOLVED
                                                </span>
                                            ) : dueBadge ? (
                                                <span className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${dueBadge.classes}`}>
                                                    {dueBadge.label}
                                                </span>
                                            ) : null}
                                        </div>

                                        {task.notes && (
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 break-words font-normal m-0 font-sans">
                                                {task.notes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 shrink-0 pt-0.5">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(task)}
                                            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                            aria-label="Edit task"
                                            title="Edit task"
                                        >
                                            <Pencil size={11} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteTask(task.id)}
                                            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                                            aria-label="Delete task"
                                            title="Delete task"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── CSES SHEET PROGRESS STRIP ──────────────────────── */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            SHEET PROGRESS
                        </span>
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                            {counts.completed}/{tasks.length} • {progress}%
                        </span>
                    </div>
                    <div
                        className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden border border-slate-200/60 dark:border-white/[0.06]"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                    >
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ── CSES ADD / EDIT TASK MODAL ─────────────────────────── */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
                    role="presentation"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-sm rounded-xl bg-white dark:bg-[#0D111C] border border-slate-200 dark:border-white/10 shadow-2xl p-5 flex flex-col gap-4 text-slate-900 dark:text-white"
                        role="dialog"
                        aria-modal="true"
                        aria-label={editingId ? 'Edit Task' : 'Add Task'}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white m-0">
                                {editingId ? 'EDIT TASK' : 'ADD NEW TASK'}
                            </h4>
                            <button
                                type="button"
                                onClick={closeModal}
                                aria-label="Close"
                                className="w-6 h-6 rounded-md border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTask} className="flex flex-col gap-3">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                                TASK TITLE
                                <input
                                    required
                                    value={form.title}
                                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Revise Module 4 Algorithms"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all font-sans font-normal"
                                />
                            </label>

                            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                                DUE DATE
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-all font-mono font-normal [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </label>

                            <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                                NOTES (OPTIONAL)
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    placeholder="Add references, textbook sections, or checklist items..."
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all font-sans font-normal resize-none"
                                />
                            </label>

                            <button
                                type="submit"
                                className="w-full py-2 px-4 mt-1 rounded-lg text-xs font-mono font-bold text-white bg-purple-600 hover:bg-purple-500 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                                <CheckCircle2 size={13} />
                                {editingId ? 'UPDATE TASK' : 'ADD TO SHEET'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR PLUS LOCK (PLUS ONLY GATING)
═══════════════════════════════════════════════════════════════════ */
const SidebarPlusLock = ({ isAuthenticated, onAction }) => {
    return (
        <div className="w-full max-w-[275px] p-5 rounded-lg border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] flex flex-col items-center text-center gap-3.5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {/* Lock Icon */}
            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] dark:bg-[#1B1F26] border border-[#DBEAFE] dark:border-[#292E37] text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center shrink-0">
                <Lock size={18} className="stroke-[2]" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFBEB] dark:bg-[#1B1F26] border border-[#D97706]/30 dark:border-[#D97706]/25 text-[#D97706]">
                <Sparkles size={10} className="shrink-0" />
                <span className="text-[10px] font-medium" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>PLUS ONLY</span>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-1.5">
                <h3 className="text-[13px] font-semibold text-[#111827] dark:text-[#F3F4F6] m-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {isAuthenticated ? 'AskUrSenior Plus' : 'Student Assistant'}
                </h3>
                <p className="text-[12px] text-[#4B5563] dark:text-[#A1A1AA] leading-[18px] m-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {isAuthenticated
                        ? 'The Activity Heatmap, Daily Planner, and Materials Overview are exclusive to Plus members.'
                        : 'Sign in to access your activity streak heatmap, daily task sheet, and library analytics.'}
                </p>
            </div>

            {/* Feature List */}
            <div className="w-full flex flex-col gap-2 py-2.5 px-3 rounded-lg border border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26] text-left">
                {['Academic Streak Heatmap', 'Daily Task Sheet & Solver', 'Library Materials Analytics'].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-[#374151] dark:text-[#D1D5DB]">
                        <div className="w-4 h-4 rounded-full bg-[#EFF6FF] dark:bg-[#1B1F26] border border-[#BFDBFE] dark:border-[#292E37] flex items-center justify-center shrink-0">
                            <Check size={10} className="text-[#2563EB] dark:text-[#3B82F6] stroke-[3]" />
                        </div>
                        <span className="text-[12px] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{feature}</span>
                    </div>
                ))}
            </div>

            {/* CTA Button */}
            <button
                type="button"
                onClick={onAction}
                className="w-full py-2.5 px-4 rounded-[6px] text-[13px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                style={{ fontFamily: 'Inter, sans-serif', transition: 'background-color 150ms ease-out' }}
            >
                <span>{isAuthenticated ? 'Upgrade to Plus' : 'Login to Access'}</span>
                <ArrowRight size={14} className="stroke-[2]" />
            </button>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   RIGHT PANEL MAIN CONTAINER
═══════════════════════════════════════════════════════════════════ */
const RightPanel = () => {
    const { user, isAuthenticated, hasPlusAccess } = useContext(AuthContext);
    const isStatic = !isAuthenticated || !hasPlusAccess;
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLockAction = () => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
        } else {
            navigate('/pricing');
        }
    };

    return (
        <div style={{
            padding: 0,
            height: '100vh',
            boxSizing: 'border-box',
            overflow: 'hidden',
            width: '100%',
            position: 'relative',
        }}>
            <div style={{
                ...CARD_STYLE,
                borderRadius: '0px',
                borderTop: 'none',
                borderBottom: 'none',
                borderRight: 'none',
                borderLeft: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}`,
                minHeight: '100vh',
                height: '100vh',
                overflowY: hasPlusAccess ? 'auto' : 'hidden',
                position: 'relative',
            }} className="no-scrollbar">
                {hasPlusAccess ? (
                    <>
                        <MaterialsOverviewWidget user={user} />
                        <AcademicStreakWidget user={user} />
                        <DailyPlannerWidget />
                    </>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center p-4">
                        <SidebarPlusLock
                            isAuthenticated={isAuthenticated}
                            onAction={handleLockAction}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export {
    StudentDetailsWidget,
    MaterialsOverviewWidget,
    AcademicStreakWidget,
    DailyPlannerWidget,
    SidebarPlusLock
};

export default RightPanel;

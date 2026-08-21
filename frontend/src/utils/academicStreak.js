import { addDays, differenceInCalendarDays, format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

const STORAGE_KEY = 'askursenior_academic_activity_log_v1';
const COUNTED_ACTIVITY_TYPES = new Set([
    'subject',
    'notes_preview',
    'notes_download',
    'pyqs',
    'ask_plus',
    'planner_task',
]);

const ACTIVITY_LABELS = {
    dashboard: 'Opened Dashboard',
    subject: 'Opened Subject',
    notes_preview: 'Previewed Notes',
    notes_download: 'Downloaded Notes',
    pyqs: 'Opened PYQs',
    ask_plus: 'Used Ask+',
    planner_task: 'Completed Planner Task',
};

const safeRead = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const safeWrite = (entries) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-800)));
    } catch {
        // Ignore storage write failures in constrained environments.
    }
};

export const logAcademicActivity = ({ type, label, date = new Date(), meta = {} }) => {
    if (!type) return null;
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;

    const day = format(date, 'yyyy-MM-dd');
    const entryLabel = label || ACTIVITY_LABELS[type] || type;
    const key = `${day}::${type}::${entryLabel}`;
    const entries = safeRead();

    if (entries.some((entry) => entry.key === key)) {
        return entries.find((entry) => entry.key === key) || null;
    }

    const entry = {
        key,
        type,
        label: entryLabel,
        date: day,
        timestamp: new Date(date).toISOString(),
        meta,
    };

    entries.push(entry);
    safeWrite(entries);

    window.dispatchEvent(new CustomEvent('academic-streak:updated', { detail: entry }));
    return entry;
};

export const getAcademicActivityLog = () => safeRead();

export const getDayActivityMap = (entries = safeRead()) => {
    return entries.reduce((accumulator, entry) => {
        if (!COUNTED_ACTIVITY_TYPES.has(entry.type)) {
            return accumulator;
        }

        if (!accumulator[entry.date]) {
            accumulator[entry.date] = [];
        }

        if (!accumulator[entry.date].some((item) => item.key === entry.key)) {
            accumulator[entry.date].push(entry);
        }

        return accumulator;
    }, {});
};

export const getMonthDays = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
};

const getBestStreak = (activeDays) => {
    if (!activeDays.size) return 0;

    const sortedDays = Array.from(activeDays)
        .map((date) => parseISO(date))
        .sort((a, b) => a - b);

    let best = 1;
    let current = 1;

    for (let index = 1; index < sortedDays.length; index += 1) {
        const gap = differenceInCalendarDays(sortedDays[index], sortedDays[index - 1]);
        if (gap === 1) {
            current += 1;
            best = Math.max(best, current);
        } else {
            current = 1;
        }
    }

    return best;
};

export const calculateStreaks = (entries = safeRead(), today = new Date()) => {
    const activeDays = new Set(entries.filter((entry) => COUNTED_ACTIVITY_TYPES.has(entry.type)).map((entry) => entry.date));
    const todayKey = format(today, 'yyyy-MM-dd');

    if (!activeDays.has(todayKey)) {
        return {
            currentStreak: 0,
            bestStreak: getBestStreak(activeDays),
        };
    }

    let currentStreak = 0;
    let cursor = new Date(today);

    while (activeDays.has(format(cursor, 'yyyy-MM-dd'))) {
        currentStreak += 1;
        cursor = addDays(cursor, -1);
    }

    return {
        currentStreak,
        bestStreak: getBestStreak(activeDays),
    };
};

export const formatActivityDate = (dateString) => {
    try {
        return format(parseISO(dateString), 'EEE, d MMM');
    } catch {
        return dateString;
    }
};

export const ACTIVITY_META = ACTIVITY_LABELS;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, Calendar, Lock, CheckCircle2, RefreshCw, 
    Edit3, Plus, Trash2, ShieldCheck, Sparkles, Building, Layers, X, Save 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import toast from 'react-hot-toast';

const DAYS = [
    { key: 1, name: 'Monday', short: 'Mon' },
    { key: 2, name: 'Tuesday', short: 'Tue' },
    { key: 3, name: 'Wednesday', short: 'Wed' },
    { key: 4, name: 'Thursday', short: 'Thu' },
    { key: 5, name: 'Friday', short: 'Fri' },
    { key: 6, name: 'Saturday', short: 'Sat' },
];

const PERIOD_TIMES = [
    { slot: 1, start: '08:00', end: '08:50', startMin: 480, endMin: 530 },
    { slot: 2, start: '08:50', end: '09:40', startMin: 530, endMin: 580 },
    { slot: 3, start: '09:40', end: '10:30', startMin: 580, endMin: 630 },
    { slot: 4, start: '10:45', end: '11:35', startMin: 645, endMin: 695 },
    { slot: 5, start: '11:35', end: '12:25', startMin: 695, endMin: 745 },
    { slot: 6, start: '01:15', end: '02:05', startMin: 795, endMin: 845 },
    { slot: 7, start: '02:05', end: '02:55', startMin: 845, endMin: 895 },
    { slot: 8, start: '02:55', end: '03:45', startMin: 895, endMin: 945 },
];

const TimetableSection = () => {
    const { 
        selectedSemester, 
        isFinalized, 
        timetableSlots, 
        registeredSubjects, 
        saveSlots, 
        useOfficialTimetable, 
        isCustomizedTimetable, 
        saving 
    } = useStudentAcademics();

    const [selectedSlotForEdit, setSelectedSlotForEdit] = useState(null);
    const [editSubjectId, setEditSubjectId] = useState('');
    const [editRoom, setEditRoom] = useState('');
    const [editFaculty, setEditFaculty] = useState('');
    const [editType, setEditType] = useState('Lecture');

    // Build lookup matrix [dayOfWeek][startMinute] -> slot
    const slotMatrix = useMemo(() => {
        const matrix = {};
        DAYS.forEach(d => { matrix[d.key] = {}; });

        timetableSlots.forEach(s => {
            const day = s.dayOfWeek;
            if (matrix[day]) {
                matrix[day][s.startMinute] = s;
            }
        });
        return matrix;
    }, [timetableSlots]);

    const handleOpenEdit = (dayKey, period) => {
        if (isFinalized) return;
        const existing = slotMatrix[dayKey]?.[period.startMin] || null;
        setSelectedSlotForEdit({
            dayOfWeek: dayKey,
            startMinute: period.startMin,
            endMinute: period.endMin,
            period,
            existing
        });

        if (existing) {
            setEditSubjectId(existing.subject?._id || existing.subject || '');
            setEditRoom(existing.room || '');
            setEditFaculty(existing.faculty || '');
            setEditType(existing.lectureType || 'Lecture');
        } else {
            setEditSubjectId(registeredSubjects[0]?.subject?._id || registeredSubjects[0]?._id || '');
            setEditRoom('LH-101');
            setEditFaculty('');
            setEditType('Lecture');
        }
    };

    const handleSaveSlot = async (e) => {
        e.preventDefault();
        if (!selectedSlotForEdit) return;

        const { dayOfWeek, startMinute, endMinute } = selectedSlotForEdit;

        const filtered = timetableSlots.filter(s => !(s.dayOfWeek === dayOfWeek && s.startMinute === startMinute));

        let newSlots = [...filtered];
        if (editSubjectId && editSubjectId !== 'FREE_PERIOD') {
            const subjectMatch = registeredSubjects.find(r => (r.subject?._id === editSubjectId || r._id === editSubjectId || r.subject === editSubjectId));
            const newSlot = {
                dayOfWeek,
                startMinute,
                endMinute,
                subject: subjectMatch?.subject?._id || subjectMatch?.subject || editSubjectId,
                room: editRoom,
                faculty: editFaculty,
                lectureType: editType,
                semester: selectedSemester,
                version: 1,
                isActive: true
            };
            newSlots.push(newSlot);
        }

        const success = await saveSlots(newSlots);
        if (success) {
            setSelectedSlotForEdit(null);
        }
    };

    const handleClearSlot = async () => {
        if (!selectedSlotForEdit) return;
        const { dayOfWeek, startMinute } = selectedSlotForEdit;
        const filtered = timetableSlots.filter(s => !(s.dayOfWeek === dayOfWeek && s.startMinute === startMinute));
        const success = await saveSlots(filtered);
        if (success) {
            setSelectedSlotForEdit(null);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 rounded-xl bg-[#090518]/80 border border-purple-500/20 shadow-lg backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 border border-purple-500/30 text-purple-300">
                            Effective Schedule
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                            <Lock size={9} /> Provided by college
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-outfit">
                        Semester {selectedSemester} Timetable
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Official institution schedule combined with student customizations.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {!isFinalized && isCustomizedTimetable && (
                        <button
                            onClick={useOfficialTimetable}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <RefreshCw size={12} />
                            Reset
                        </button>
                    )}
                    <span className="px-3 py-1 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        {timetableSlots.length} Classes / Wk
                    </span>
                </div>
            </div>

            {/* Timetable Weekly Matrix */}
            <div className="p-4 md:p-5 rounded-xl bg-[#090518]/80 border border-purple-500/15 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/10 mb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock className="text-purple-400" size={16} />
                        Weekly Schedule (Monday – Saturday)
                    </h2>
                    <span className="text-[11px] text-slate-400">
                        {isFinalized ? '🔒 Read-only snapshot' : 'Click any cell to assign / edit subject'}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        {/* Period header */}
                        <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center text-xs font-semibold text-slate-400">
                            <div className="py-1.5 bg-white/[0.02] rounded-lg text-slate-400 font-mono text-[11px]">Day / Time</div>
                            {PERIOD_TIMES.slice(0, 6).map((p, idx) => (
                                <div key={p.slot} className="py-1.5 px-1 bg-white/[0.02] rounded-lg">
                                    <span className="block font-bold text-purple-300 text-[11px]">P{idx + 1}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">{p.start}–{p.end}</span>
                                </div>
                            ))}
                        </div>

                        {/* Day Rows */}
                        <div className="space-y-1.5">
                            {DAYS.map(day => (
                                <div key={day.key} className="grid grid-cols-7 gap-1.5">
                                    {/* Day Name Column */}
                                    <div className="p-1.5 rounded-lg bg-purple-950/20 border border-purple-500/20 flex flex-col justify-center items-center text-center">
                                        <span className="text-xs font-bold text-white">{day.short}</span>
                                        <span className="text-[9px] text-slate-400">{day.name}</span>
                                    </div>

                                    {/* Period Cells */}
                                    {PERIOD_TIMES.slice(0, 6).map(p => {
                                        const slot = slotMatrix[day.key]?.[p.startMin];
                                        const subjectName = slot?.subject?.name || slot?.customName || (typeof slot?.subject === 'string' ? slot.subject : '');
                                        const subjectCode = slot?.subject?.code || slot?.customCode || (slot ? 'CLASS' : '');

                                        return (
                                            <div
                                                key={p.slot}
                                                onClick={() => handleOpenEdit(day.key, p)}
                                                className={`p-1.5 rounded-lg border transition-all text-center flex flex-col justify-center items-center min-h-[56px] ${
                                                    isFinalized ? 'cursor-default' : 'cursor-pointer hover:border-purple-500/50 hover:shadow-md'
                                                } ${
                                                    slot
                                                        ? 'bg-purple-900/20 border-purple-500/30 text-white'
                                                        : 'bg-white/[0.01] border-white/5 text-slate-600 hover:bg-white/[0.03]'
                                                }`}
                                            >
                                                {slot ? (
                                                    <>
                                                        <span className="font-mono text-[10px] font-bold text-purple-300 block truncate max-w-full">
                                                            {subjectCode}
                                                        </span>
                                                        <span className="text-[9px] text-slate-300 line-clamp-1">
                                                            {subjectName || 'Assigned'}
                                                        </span>
                                                        <span className="text-[8px] text-slate-400 block">
                                                            {slot.room || 'LH-1'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        + Free
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Slot Editor Modal */}
            <AnimatePresence>
                {selectedSlotForEdit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md p-5 rounded-xl bg-[#0e0826] border border-purple-500/30 shadow-2xl space-y-3.5"
                        >
                            <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/15">
                                <div>
                                    <h3 className="text-sm font-bold text-white">
                                        Edit Class Slot · {DAYS.find(d => d.key === selectedSlotForEdit.dayOfWeek)?.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Time: {selectedSlotForEdit.period.start} → {selectedSlotForEdit.period.end}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedSlotForEdit(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveSlot} className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300">Select Subject</label>
                                    <select
                                        value={editSubjectId}
                                        onChange={(e) => setEditSubjectId(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 rounded-lg bg-[#130d30] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-500"
                                        required
                                    >
                                        <option value="">-- Choose Subject --</option>
                                        {registeredSubjects.map((r, idx) => {
                                            const subId = r.subject?._id || r.subject || r._id;
                                            const code = r.customCode || r.subject?.code || `SUB${idx+1}`;
                                            const name = r.customName || r.subject?.name || 'Subject';
                                            return (
                                                <option key={subId || idx} value={subId}>
                                                    {code} - {name}
                                                </option>
                                            );
                                        })}
                                        <option value="FREE_PERIOD">-- Set as Free Period (Empty) --</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-300">Room / Hall</label>
                                        <input
                                            type="text"
                                            value={editRoom}
                                            onChange={(e) => setEditRoom(e.target.value)}
                                            placeholder="e.g. LH-201"
                                            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-purple-500/25 text-white text-xs focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-300">Session Type</label>
                                        <select
                                            value={editType}
                                            onChange={(e) => setEditType(e.target.value)}
                                            className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[#130d30] border border-purple-500/25 text-white text-xs focus:outline-none"
                                        >
                                            <option value="Lecture">Lecture</option>
                                            <option value="Lab">Lab</option>
                                            <option value="Tutorial">Tutorial</option>
                                            <option value="Seminar">Seminar</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300">Faculty Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={editFaculty}
                                        onChange={(e) => setEditFaculty(e.target.value)}
                                        placeholder="e.g. Dr. Ramesh K"
                                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-purple-500/25 text-white text-xs focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-purple-500/15">
                                    {selectedSlotForEdit.existing ? (
                                        <button
                                            type="button"
                                            onClick={handleClearSlot}
                                            className="text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                                        >
                                            Remove Slot
                                        </button>
                                    ) : <div />}

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSlotForEdit(null)}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Apply Slot'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TimetableSection;

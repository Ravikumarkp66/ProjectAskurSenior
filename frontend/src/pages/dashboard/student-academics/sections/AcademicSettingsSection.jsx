import React, { useState, useEffect } from 'react';
import { 
    Clock, Calendar, ShieldCheck, Lock, CheckCircle2, 
    Save, AlertTriangle, Coffee, Sliders, Building, Check 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import toast from 'react-hot-toast';

const AcademicSettingsSection = () => {
    const { 
        academicOverview,
        academicSettings,
        availableSections,
        updateSection,
        updatePersonalTarget,
        saving 
    } = useStudentAcademics();

    // Student personal form state
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [personalTarget, setPersonalTarget] = useState(90);
    const [isChanged, setIsChanged] = useState(false);

    // Sync from settings on load
    useEffect(() => {
        if (academicSettings) {
            if (academicSettings.personalSettings?.personalAttendanceTarget) {
                setPersonalTarget(academicSettings.personalSettings.personalAttendanceTarget);
            }
            if (academicSettings.personalSettings?.currentSection?.id) {
                setSelectedSectionId(academicSettings.personalSettings.currentSection.id);
            } else if (academicOverview?.section?.id) {
                setSelectedSectionId(academicOverview.section.id);
            }
        } else if (academicOverview) {
            if (academicOverview.attendancePolicy?.personalTarget) {
                setPersonalTarget(academicOverview.attendancePolicy.personalTarget);
            }
            if (academicOverview.section?.id) {
                setSelectedSectionId(academicOverview.section.id);
            }
        }
    }, [academicSettings, academicOverview]);

    // Handle section change
    const handleSectionChange = (e) => {
        setSelectedSectionId(e.target.value);
        setIsChanged(true);
    };

    // Handle target attendance change
    const handleTargetChange = (e) => {
        const val = Number(e.target.value);
        setPersonalTarget(val);
        setIsChanged(true);
    };

    // Save personal settings
    const handleSave = async () => {
        let success = true;

        // If target changed, save target
        const currentTargetInDb = academicSettings?.personalSettings?.personalAttendanceTarget || 
                                  academicOverview?.attendancePolicy?.personalTarget || 90;
        if (personalTarget !== currentTargetInDb) {
            const targetSuccess = await updatePersonalTarget(personalTarget);
            if (!targetSuccess) success = false;
        }

        // If section changed, update section
        const currentSectionIdInDb = academicSettings?.personalSettings?.currentSection?.id || 
                                     academicOverview?.section?.id;
        if (selectedSectionId && selectedSectionId !== currentSectionIdInDb) {
            const secSuccess = await updateSection(selectedSectionId);
            if (!secSuccess) success = false;
        }

        if (success) {
            setIsChanged(false);
            toast.success('Settings updated successfully.');
        }
    };

    const adminBaseline = academicSettings?.adminBaseline;

    const formatMinuteToTime = (min) => {
        if (min === undefined || min === null) return '—';
        const hours = Math.floor(min / 60);
        const minutes = min % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try {
            const dt = new Date(d);
            if (isNaN(dt.getTime())) return '—';
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return '—';
        }
    };

    return (
        <div className="flex flex-col gap-5 w-full max-w-5xl mx-auto pb-10">
            {/* Header info banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                        <Building size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            Academic & Attendance Configuration
                        </h2>
                        <p className="text-xs text-slate-400">
                            View institutional admin rules and customize your personal target attendance and section.
                        </p>
                    </div>
                </div>

                <button
                    disabled={!isChanged || saving}
                    onClick={handleSave}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                        isChanged && !saving
                            ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/50'
                            : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Personal Settings'}
                </button>
            </div>

            {/* Grid layout: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* COLUMN 1: Student Personal Settings (Editable) */}
                <div className="p-5 rounded-xl bg-[#0b061c]/90 border border-purple-500/25 shadow-lg flex flex-col gap-5">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-purple-500/20">
                        <Sliders size={18} className="text-purple-400" />
                        <div>
                            <h3 className="text-sm font-bold text-white">Student Personal Settings</h3>
                            <p className="text-[11px] text-slate-400">Customize your goals and section enrolment.</p>
                        </div>
                    </div>

                    {/* Section Selector */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                            <span>Assigned Academic Section</span>
                            <span className="text-[10px] text-purple-400 font-medium">Batch: {academicOverview?.batch?.name || '2022-2026'}</span>
                        </label>
                        <select
                            value={selectedSectionId}
                            onChange={handleSectionChange}
                            className="w-full px-3 py-2.5 bg-black/40 border border-purple-500/30 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                            {availableSections && availableSections.length > 0 ? (
                                availableSections.map(sec => (
                                    <option key={sec.id} value={sec.id}>
                                        Section {sec.name} {sec.capacity ? `(Capacity: ${sec.capacity})` : ''}
                                    </option>
                                ))
                            ) : (
                                <option value="">Section A (Default)</option>
                            )}
                        </select>
                        <span className="text-[10px] text-slate-500">
                            Available sections are strictly filtered to your verified program and branch.
                        </span>
                    </div>

                    {/* Personal Attendance Target */}
                    <div className="flex flex-col gap-2.5 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-300">
                                My Target Attendance Goal
                            </label>
                            <span className="text-base font-extrabold text-purple-300">
                                {personalTarget}%
                            </span>
                        </div>

                        <input
                            type="range"
                            min="85"
                            max="100"
                            step="1"
                            value={personalTarget}
                            onChange={handleTargetChange}
                            className="w-full accent-purple-500 cursor-pointer"
                        />

                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>College Min (85%)</span>
                            <span>Target: {personalTarget}%</span>
                            <span>Ideal (100%)</span>
                        </div>

                        <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-300 flex items-start gap-2">
                            <CheckCircle2 size={15} className="text-purple-400 shrink-0 mt-0.5" />
                            <span>
                                Your personal target is used to calculate attendance alerts and class buffers. It does not alter the institutional 85% eligibility requirement.
                            </span>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: Admin Baseline (Read-Only) */}
                <div className="p-5 rounded-xl bg-black/30 border border-white/10 shadow-lg flex flex-col gap-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck size={18} className="text-emerald-400" />
                            <div>
                                <h3 className="text-sm font-bold text-white">Institutional Admin Baseline</h3>
                                <p className="text-[11px] text-slate-400">Authoritative college policy (Read-Only).</p>
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1">
                            <Lock size={10} /> Locked
                        </span>
                    </div>

                    {/* College & Program Info */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase block">College</span>
                            <span className="font-semibold text-slate-200">{academicOverview?.college?.name || 'SIT'}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase block">Program & Branch</span>
                            <span className="font-semibold text-slate-200">
                                {academicOverview?.program?.code || 'B.E'} - {academicOverview?.branch?.code || 'CSE'}
                            </span>
                        </div>
                    </div>

                    {/* Attendance Minimum Eligibility */}
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-emerald-300 block">
                                College Minimum Attendance
                            </span>
                            <span className="text-[10px] text-slate-400">
                                Mandatory requirement for exam eligibility
                            </span>
                        </div>
                        <span className="text-lg font-extrabold text-emerald-400">
                            {adminBaseline?.collegeAttendanceThreshold || 85}%
                        </span>
                    </div>

                    {/* Timetable Structure Settings */}
                    <div className="flex flex-col gap-2 text-xs">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            Official Timetable Rules
                        </span>

                        <div className="grid grid-cols-2 gap-2 text-slate-300">
                            <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                <span className="text-slate-400">Hours:</span>
                                <span className="font-medium">
                                    {formatMinuteToTime(adminBaseline?.collegeStartMinute || 480)} - {formatMinuteToTime(adminBaseline?.collegeEndMinute || 1020)}
                                </span>
                            </div>

                            <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                <span className="text-slate-400">Class Duration:</span>
                                <span className="font-medium">{adminBaseline?.classDuration || 50} mins</span>
                            </div>

                            <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                <span className="text-slate-400">Lab Duration:</span>
                                <span className="font-medium">{adminBaseline?.labDuration || 100} mins</span>
                            </div>

                            <div className="p-2 rounded bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                <span className="text-slate-400">Working Days:</span>
                                <span className="font-medium">Mon - Sat (6 Days)</span>
                            </div>
                        </div>
                    </div>

                    {/* Official Semester Academic Window */}
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-purple-400" />
                            <span className="text-slate-400">Official Semester Window:</span>
                        </div>
                        <span className="font-medium text-slate-200">
                            {formatDate(adminBaseline?.semesterStartDate)} — {formatDate(adminBaseline?.lastWorkingDate)}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AcademicSettingsSection;

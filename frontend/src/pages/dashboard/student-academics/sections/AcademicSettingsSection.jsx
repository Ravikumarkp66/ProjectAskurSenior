import React, { useState, useEffect } from 'react';
import { 
    Clock, Calendar, ShieldCheck, Lock, CheckCircle2, 
    Save, AlertTriangle, Coffee, Sliders, Building, Check 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import { useTheme } from '../../../../context/ThemeContext';
import toast from 'react-hot-toast';

const AcademicSettingsSection = () => {
    const { isDark = true } = useTheme?.() || { isDark: true };
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
            <div className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border ${
                isDark 
                    ? 'bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border-purple-500/20'
                    : 'bg-gradient-to-r from-purple-50 via-purple-50/50 to-white border-purple-200'
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        isDark ? 'bg-purple-600/20 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-200 text-purple-700'
                    }`}>
                        <Building size={20} />
                    </div>
                    <div>
                        <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Academic & Attendance Configuration
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            View institutional admin rules and customize your personal target attendance and section.
                        </p>
                    </div>
                </div>

                <button
                    disabled={!isChanged || saving}
                    onClick={handleSave}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                        isChanged && !saving
                            ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/50 cursor-pointer'
                            : (isDark ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200')
                    }`}
                >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Personal Settings'}
                </button>
            </div>

            {/* Grid layout: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* COLUMN 1: Student Personal Settings (Editable) */}
                <div className={`p-5 rounded-xl border shadow-sm flex flex-col gap-5 ${
                    isDark ? 'bg-[#0b061c]/90 border-purple-500/25' : 'bg-white border-slate-200'
                }`}>
                    <div className={`flex items-center gap-2.5 pb-3 border-b ${
                        isDark ? 'border-purple-500/20' : 'border-slate-100'
                    }`}>
                        <Sliders size={18} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                        <div>
                            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Student Personal Settings</h3>
                            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Customize your goals and section enrolment.</p>
                        </div>
                    </div>

                    {/* Section Selector */}
                    <div className="flex flex-col gap-2">
                        <label className={`text-xs font-semibold flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Assigned Academic Section</span>
                            <span className={`text-[10px] font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Batch: {academicOverview?.batch?.name || '2022-2026'}</span>
                        </label>
                        <select
                            value={selectedSectionId}
                            onChange={handleSectionChange}
                            className={`w-full px-3 py-2.5 rounded-lg text-xs focus:outline-none transition-colors border ${
                                isDark 
                                    ? 'bg-black/40 border-purple-500/30 text-white focus:border-purple-500' 
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500'
                            }`}
                        >
                            {availableSections && availableSections.length > 0 ? (
                                availableSections.map(sec => (
                                    <option key={sec.id} value={sec.id} className={isDark ? 'bg-[#0e121d] text-white' : 'bg-white text-slate-800'}>
                                        Section {sec.name} {sec.capacity ? `(Capacity: ${sec.capacity})` : ''}
                                    </option>
                                ))
                            ) : (
                                <option value="" className={isDark ? 'bg-[#0e121d] text-white' : 'bg-white text-slate-800'}>Section A (Default)</option>
                            )}
                        </select>
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            Available sections are strictly filtered to your verified program and branch.
                        </span>
                    </div>

                    {/* Personal Attendance Target */}
                    <div className="flex flex-col gap-2.5 pt-2">
                        <div className="flex items-center justify-between">
                            <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                My Target Attendance Goal
                            </label>
                            <span className={`text-base font-extrabold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
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
                            className="w-full accent-purple-600 cursor-pointer"
                        />

                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>College Min (85%)</span>
                            <span>Target: {personalTarget}%</span>
                            <span>Ideal (100%)</span>
                        </div>

                        <div className={`p-3 rounded-lg border text-[11px] flex items-start gap-2 ${
                            isDark ? 'bg-purple-950/30 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'
                        }`}>
                            <CheckCircle2 size={15} className={`${isDark ? 'text-purple-400' : 'text-purple-600'} shrink-0 mt-0.5`} />
                            <span>
                                Your personal target is used to calculate attendance alerts and class buffers. It does not alter the institutional 85% eligibility requirement.
                            </span>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: Admin Baseline (Read-Only) */}
                <div className={`p-5 rounded-xl border shadow-sm flex flex-col gap-5 ${
                    isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200'
                }`}>
                    <div className={`flex items-center justify-between pb-3 border-b ${
                        isDark ? 'border-white/10' : 'border-slate-100'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            <ShieldCheck size={18} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                            <div>
                                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Institutional Admin Baseline</h3>
                                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Authoritative college policy (Read-Only).</p>
                            </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                            isDark ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                            <Lock size={10} /> Locked
                        </span>
                    </div>

                    {/* College & Program Info */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className={`p-2.5 rounded-lg border ${
                            isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <span className="text-[10px] text-slate-500 uppercase block">College</span>
                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{academicOverview?.college?.name || 'SIT'}</span>
                        </div>
                        <div className={`p-2.5 rounded-lg border ${
                            isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <span className="text-[10px] text-slate-500 uppercase block">Program & Branch</span>
                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {academicOverview?.program?.code || 'B.E'} - {academicOverview?.branch?.code || 'CSE'}
                            </span>
                        </div>
                    </div>

                    {/* Attendance Minimum Eligibility */}
                    <div className={`p-3 rounded-lg border flex items-center justify-between ${
                        isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-200'
                    }`}>
                        <div>
                            <span className={`text-xs font-bold block ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                                College Minimum Attendance
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Mandatory requirement for exam eligibility
                            </span>
                        </div>
                        <span className={`text-lg font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {adminBaseline?.collegeAttendanceThreshold || 85}%
                        </span>
                    </div>

                    {/* Timetable Structure Settings */}
                    <div className="flex flex-col gap-2 text-xs">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                            Official Timetable Rules
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                            <div className={`p-2 rounded border flex items-center justify-between ${
                                isDark ? 'bg-white/[0.02] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Hours:</span>
                                <span className="font-medium">
                                    {formatMinuteToTime(adminBaseline?.collegeStartMinute || 480)} - {formatMinuteToTime(adminBaseline?.collegeEndMinute || 1020)}
                                </span>
                            </div>

                            <div className={`p-2 rounded border flex items-center justify-between ${
                                isDark ? 'bg-white/[0.02] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Class Duration:</span>
                                <span className="font-medium">{adminBaseline?.classDuration || 50} mins</span>
                            </div>

                            <div className={`p-2 rounded border flex items-center justify-between ${
                                isDark ? 'bg-white/[0.02] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Lab Duration:</span>
                                <span className="font-medium">{adminBaseline?.labDuration || 100} mins</span>
                            </div>

                            <div className={`p-2 rounded border flex items-center justify-between ${
                                isDark ? 'bg-white/[0.02] border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Working Days:</span>
                                <span className="font-medium">Mon - Sat (6 Days)</span>
                            </div>
                        </div>
                    </div>

                    {/* Official Semester Academic Window */}
                    <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                        isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Official Semester Window:</span>
                        </div>
                        <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {formatDate(adminBaseline?.semesterStartDate)} — {formatDate(adminBaseline?.lastWorkingDate)}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AcademicSettingsSection;

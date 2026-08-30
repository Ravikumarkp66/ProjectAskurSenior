import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    User, Lock, ShieldCheck, CheckCircle, Save, 
    AlertCircle, Sparkles, Building, GraduationCap, Edit3 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import toast from 'react-hot-toast';

const AcademicProfileSection = () => {
    const { profile, updateAcademicProfile, saving } = useStudentAcademics();

    const [formData, setFormData] = useState({
        name: '',
        usn: '',
        studentId: '',
        collegeName: '',
        branchName: '',
        schemeName: '',
        degree: '',
        admissionYear: '',
        graduationYear: '',
        semester: '',
        phone: '',
        bio: ''
    });

    const [isModified, setIsModified] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                usn: profile.usn || '',
                studentId: profile.studentId || '',
                collegeName: profile.collegeName || profile.college?.name || 'Siddaganga Institute of Technology',
                branchName: profile.branch?.name || profile.branchName || 'Information Science and Engineering',
                schemeName: profile.scheme?.name || (profile.scheme ? `Scheme ${profile.scheme}` : 'Scheme 2022'),
                degree: profile.degree || 'Bachelor of Engineering (B.E.)',
                admissionYear: profile.admissionYear || 2024,
                graduationYear: profile.graduationYear || 2028,
                semester: profile.semester || 3,
                phone: profile.phone || '',
                bio: profile.bio || ''
            });
            setIsModified(false);
        }
    }, [profile]);

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setIsModified(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const success = await updateAcademicProfile({
            name: formData.name,
            phone: formData.phone,
            bio: formData.bio
        });
        if (success) setIsModified(false);
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 rounded-xl bg-[#090518]/80 border border-purple-500/20 shadow-lg backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 border border-purple-500/30 text-purple-300">
                            Academic Identity
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                            <Lock size={10} /> Institutional records verified
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-outfit">
                        Academic Profile
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Permanent student academic identity and university registration credentials.
                    </p>
                </div>

                {isModified && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                    >
                        <Save size={13} />
                        {saving ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                )}
            </div>

            {/* Institutional Controlled Academic Credentials */}
            <div className="p-4 md:p-5 rounded-xl bg-[#090518]/80 border border-purple-500/15 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/10 mb-4">
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="text-purple-400" size={16} />
                            Institutional Credentials
                        </h2>
                        <p className="text-[11px] text-slate-400">
                            Authoritative academic records maintained and verified by your institution
                        </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center gap-1">
                        <Lock size={10} />
                        College controlled
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* USN */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span>University Seat Number (USN)</span>
                            <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={formData.usn}
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-purple-200 font-mono text-xs font-semibold cursor-not-allowed select-none opacity-85"
                        />
                    </div>

                    {/* Student ID */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span>Student Identifier</span>
                            <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Lock size={9} /> System ID</span>
                        </div>
                        <input
                            type="text"
                            value={formData.studentId}
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-slate-300 font-mono text-xs cursor-not-allowed select-none opacity-85"
                        />
                    </div>

                    {/* College */}
                    <div className="space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span>College / University</span>
                            <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Lock size={9} /> Institutional</span>
                        </div>
                        <input
                            type="text"
                            value={formData.collegeName}
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 text-xs cursor-not-allowed select-none opacity-85"
                        />
                    </div>

                    {/* Degree */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span>Degree / Program</span>
                            <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={formData.degree}
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 text-xs cursor-not-allowed select-none opacity-85"
                        />
                    </div>

                    {/* Branch */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span>Department / Branch</span>
                            <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={formData.branchName}
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 text-xs cursor-not-allowed select-none opacity-85"
                        />
                    </div>

                    {/* Scheme */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span>Curriculum Scheme</span>
                            <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={formData.schemeName}
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-slate-200 text-xs cursor-not-allowed select-none opacity-85"
                        />
                    </div>

                    {/* Current Semester */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                            <span>Authoritative Semester</span>
                            <span className="text-[10px] text-purple-400 flex items-center gap-0.5"><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={`Semester ${formData.semester}`}
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-purple-300 font-semibold text-xs cursor-not-allowed select-none opacity-85"
                        />
                    </div>
                </div>

                <div className="mt-3.5 p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/15 flex items-center gap-2.5 text-[11px] text-slate-400">
                    <AlertCircle className="text-purple-400 shrink-0" size={14} />
                    <p>
                        Institutional credentials are locked to maintain downstream integrity with VTU curriculum structures.
                    </p>
                </div>
            </div>

            {/* Editable Student Contact & Identity */}
            <div className="p-4 md:p-5 rounded-xl bg-[#090518]/80 border border-purple-500/15 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-purple-500/10 mb-4">
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Edit3 className="text-purple-400" size={16} />
                            Personal Details
                        </h2>
                        <p className="text-[11px] text-slate-400">
                            Editable contact details and profile preferences
                        </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        Editable ✏️
                    </span>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Student Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleTextChange}
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">WhatsApp / Phone Number</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleTextChange}
                            placeholder="+91 98765 43210"
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-300">Academic Goals & Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleTextChange}
                            rows={2}
                            placeholder="Engineering student passionate about software systems, distributed computing..."
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-purple-500/30 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                        />
                    </div>

                    {/* Action Bar */}
                    {isModified && (
                        <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-purple-500/10">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        name: profile?.name || '',
                                        phone: profile?.phone || '',
                                        bio: profile?.bio || ''
                                    }));
                                    setIsModified(false);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium cursor-pointer"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                            >
                                <Save size={13} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AcademicProfileSection;

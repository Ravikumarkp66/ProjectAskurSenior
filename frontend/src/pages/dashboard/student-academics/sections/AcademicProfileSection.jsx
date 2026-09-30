import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    User, Lock, ShieldCheck, CheckCircle, Save, 
    AlertCircle, Sparkles, Building, GraduationCap, Edit3 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import { useTheme } from '../../../../context/ThemeContext';
import toast from 'react-hot-toast';

const AcademicProfileSection = () => {
    const { isDark = true } = useTheme?.() || { isDark: true };
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
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 rounded-xl shadow-sm border backdrop-blur-xl ${
                isDark 
                    ? 'bg-[#090518]/80 border-purple-500/20' 
                    : 'bg-gradient-to-r from-purple-50 via-purple-50/50 to-white border-purple-200'
            }`}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-200 text-purple-700'
                        }`}>
                            Academic Identity
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            <Lock size={10} /> Institutional records verified
                        </span>
                    </div>
                    <h1 className={`text-xl sm:text-2xl font-bold tracking-tight font-outfit ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Academic Profile
                    </h1>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
            <div className={`p-4 md:p-5 rounded-xl shadow-sm border ${
                isDark ? 'bg-[#090518]/80 border-purple-500/15' : 'bg-white border-slate-200'
            }`}>
                <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
                    isDark ? 'border-purple-500/10' : 'border-slate-100'
                }`}>
                    <div>
                        <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <ShieldCheck className={isDark ? 'text-purple-400' : 'text-purple-600'} size={16} />
                            Institutional Credentials
                        </h2>
                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Authoritative academic records maintained and verified by your institution
                        </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${
                        isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'
                    }`}>
                        <Lock size={10} />
                        College controlled
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* USN */}
                    <div className="space-y-1">
                        <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>University Seat Number (USN)</span>
                            <span className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={formData.usn}
                            disabled
                            className={`w-full px-3 py-2 rounded-lg font-mono text-xs font-semibold cursor-not-allowed select-none border ${
                                isDark 
                                    ? 'bg-white/[0.03] border-white/10 text-purple-200 opacity-85' 
                                    : 'bg-purple-50/50 border-purple-200 text-purple-800'
                            }`}
                        />
                    </div>

                    {/* Student ID */}
                    <div className="space-y-1">
                        <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Student Identifier</span>
                            <span className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}><Lock size={9} /> System ID</span>
                        </div>
                        <input
                            type="text"
                            value={formData.studentId}
                            disabled
                            className={`w-full px-3 py-2 rounded-lg font-mono text-xs cursor-not-allowed select-none border ${
                                isDark 
                                    ? 'bg-white/[0.03] border-white/10 text-slate-300 opacity-85' 
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                        />
                    </div>

                    {/* College */}
                    <div className="space-y-1 sm:col-span-2">
                        <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>College / University</span>
                            <span className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}><Lock size={9} /> Institutional</span>
                        </div>
                        <input
                            type="text"
                            value={formData.collegeName}
                            disabled
                            className={`w-full px-3 py-2 rounded-lg text-xs cursor-not-allowed select-none border ${
                                isDark 
                                    ? 'bg-white/[0.03] border-white/10 text-slate-200 opacity-85' 
                                    : 'bg-slate-50 border-slate-200 text-slate-800 font-medium'
                            }`}
                        />
                    </div>

                    {/* Degree */}
                    <div className="space-y-1">
                        <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Degree / Program</span>
                            <span className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={formData.degree}
                            disabled
                            className={`w-full px-3 py-2 rounded-lg text-xs cursor-not-allowed select-none border ${
                                isDark 
                                    ? 'bg-white/[0.03] border-white/10 text-slate-200 opacity-85' 
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                        />
                    </div>

                    {/* Branch */}
                    <div className="space-y-1">
                        <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Department / Branch</span>
                            <span className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={formData.branchName}
                            disabled
                            className={`w-full px-3 py-2 rounded-lg text-xs cursor-not-allowed select-none border ${
                                isDark 
                                    ? 'bg-white/[0.03] border-white/10 text-slate-200 opacity-85' 
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                        />
                    </div>

                    {/* Scheme */}
                    <div className="space-y-1">
                        <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Curriculum Scheme</span>
                            <span className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={formData.schemeName}
                            disabled
                            className={`w-full px-3 py-2 rounded-lg text-xs cursor-not-allowed select-none border ${
                                isDark 
                                    ? 'bg-white/[0.03] border-white/10 text-slate-200 opacity-85' 
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                        />
                    </div>

                    {/* Current Semester */}
                    <div className="space-y-1">
                        <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Authoritative Semester</span>
                            <span className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}><Lock size={9} /> Locked</span>
                        </div>
                        <input
                            type="text"
                            value={`Semester ${formData.semester}`}
                            disabled
                            className={`w-full px-3 py-2 rounded-lg font-semibold text-xs cursor-not-allowed select-none border ${
                                isDark 
                                    ? 'bg-white/[0.03] border-white/10 text-purple-300 opacity-85' 
                                    : 'bg-purple-50/50 border-purple-200 text-purple-800'
                            }`}
                        />
                    </div>
                </div>

                <div className={`mt-3.5 p-2.5 rounded-lg border flex items-center gap-2.5 text-[11px] ${
                    isDark ? 'bg-purple-500/5 border-purple-500/15 text-slate-400' : 'bg-purple-50/60 border-purple-200 text-purple-800'
                }`}>
                    <AlertCircle className={`${isDark ? 'text-purple-400' : 'text-purple-600'} shrink-0`} size={14} />
                    <p>
                        Institutional credentials are locked to maintain downstream integrity with VTU curriculum structures.
                    </p>
                </div>
            </div>

            {/* Editable Student Contact & Identity */}
            <div className={`p-4 md:p-5 rounded-xl shadow-sm border ${
                isDark ? 'bg-[#090518]/80 border-purple-500/15' : 'bg-white border-slate-200'
            }`}>
                <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
                    isDark ? 'border-purple-500/10' : 'border-slate-100'
                }`}>
                    <div>
                        <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <Edit3 className={isDark ? 'text-purple-400' : 'text-purple-600'} size={16} />
                            Personal Details
                        </h2>
                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Editable contact details and profile preferences
                        </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                        Editable ✏️
                    </span>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Student Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleTextChange}
                            className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none transition-colors border ${
                                isDark 
                                    ? 'bg-white/[0.05] border-purple-500/30 text-white focus:border-purple-500' 
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500'
                            }`}
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>WhatsApp / Phone Number</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleTextChange}
                            placeholder="+91 98765 43210"
                            className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none transition-colors border ${
                                isDark 
                                    ? 'bg-white/[0.05] border-purple-500/30 text-white focus:border-purple-500' 
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500'
                            }`}
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-1 sm:col-span-2">
                        <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Academic Goals & Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleTextChange}
                            rows={2}
                            placeholder="Engineering student passionate about software systems, distributed computing..."
                            className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none transition-colors border resize-none ${
                                isDark 
                                    ? 'bg-white/[0.05] border-purple-500/30 text-white focus:border-purple-500' 
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500'
                            }`}
                        />
                    </div>

                    {/* Action Bar */}
                    {isModified && (
                        <div className={`sm:col-span-2 flex justify-end gap-2 pt-2 border-t ${
                            isDark ? 'border-purple-500/10' : 'border-slate-100'
                        }`}>
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
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${
                                    isDark 
                                        ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                }`}
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

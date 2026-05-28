import React, { useState } from 'react';
import { X, ArrowRight, Plus } from 'lucide-react';
import academicAPI from '../services/academicService';

const ExtraClassModal = ({ isOpen, onClose, selectedDate, userSubjects, originalClasses, onOverrideAdded, isLightMode }) => {
    const [mode, setMode] = useState('swap'); // 'swap' or 'add'
    const [originalTimeSlot, setOriginalTimeSlot] = useState('');
    const [newSubjectName, setNewSubjectName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                date: selectedDate,
                type: mode,
                originalTimeSlot: mode === 'swap' ? originalTimeSlot : undefined,
                newSubjectName,
                startTime: mode === 'add' ? startTime : undefined,
                endTime: mode === 'add' ? endTime : undefined
            };
            
            const res = await academicAPI.addTimetableOverride(payload);
            onOverrideAdded(res.data.override);
            onClose();
            // Reset state
            setOriginalTimeSlot('');
            setNewSubjectName('');
            setStartTime('');
            setEndTime('');
        } catch (err) {
            console.error('Failed to add override', err);
            alert('Failed to add override. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl animate-scaleIn ${isLightMode ? 'bg-white' : 'bg-[#141416] border border-white/10'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-black ${isLightMode ? 'text-gray-900' : 'text-white'}`}>Update Timetable</h2>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLightMode ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex gap-2 p-1 mb-6 rounded-xl bg-gray-100/50 dark:bg-white/5">
                    <button 
                        onClick={() => setMode('swap')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'swap' ? (isLightMode ? 'bg-white text-indigo-600 shadow-sm' : 'bg-indigo-600 text-white shadow-lg') : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        Swap Class
                    </button>
                    <button 
                        onClick={() => setMode('add')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'add' ? (isLightMode ? 'bg-white text-indigo-600 shadow-sm' : 'bg-indigo-600 text-white shadow-lg') : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        New Class
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'swap' ? (
                        <>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Select Existing Class to Replace</label>
                                <select 
                                    required
                                    value={originalTimeSlot}
                                    onChange={(e) => setOriginalTimeSlot(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none font-medium ${isLightMode ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0a0a0a] border-white/10 text-white'}`}
                                >
                                    <option value="" disabled>Select timeslot...</option>
                                    {originalClasses
                                        .filter(c => typeof c === 'object' && c.subject && c.subject !== 'Unnamed Subject')
                                        .map((c, i) => (
                                        <option key={i} value={`${c.start} - ${c.end}`}>
                                            {c.subject} ({c.start} - {c.end})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-center text-gray-400 dark:text-gray-600 my-2">
                                <ArrowRight size={20} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">New Subject to Swap In</label>
                                <select 
                                    required
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none font-medium ${isLightMode ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-indigo-900/20 border-indigo-500/30 text-indigo-100'}`}
                                >
                                    <option value="" disabled>Select new subject...</option>
                                    {userSubjects.map((s, i) => (
                                        <option key={i} value={s.subjectName}>
                                            {s.subjectName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Subject</label>
                                <select 
                                    required
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none font-medium ${isLightMode ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0a0a0a] border-white/10 text-white'}`}
                                >
                                    <option value="" disabled>Select subject...</option>
                                    {userSubjects.map((s, i) => (
                                        <option key={i} value={s.subjectName}>
                                            {s.subjectName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Start Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border outline-none font-medium ${isLightMode ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0a0a0a] border-white/10 text-white'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">End Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl border outline-none font-medium ${isLightMode ? 'bg-gray-50 border-gray-200 text-gray-900' : 'bg-[#0a0a0a] border-white/10 text-white'}`}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${isLightMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'} ${loading ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                        {loading ? 'Updating...' : (mode === 'swap' ? 'Confirm Swap' : 'Add Extra Class')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExtraClassModal;

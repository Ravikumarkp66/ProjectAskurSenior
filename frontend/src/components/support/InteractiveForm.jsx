import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../services/api';
import toast from 'react-hot-toast';

const InteractiveForm = ({ type, originalQuestion, onSuccess }) => {
    const [status, setStatus] = useState('idle'); // idle, submitting, success
    const [result, setResult] = useState(null);

    // Form states
    const [subject, setSubject] = useState(originalQuestion || '');
    const [branch, setBranch] = useState('CSE');
    const [semester, setSemester] = useState(1);
    const [materialType, setMaterialType] = useState('Notes');
    const [additionalNotes, setAdditionalNotes] = useState('');

    const [topic, setTopic] = useState('Placements');
    const [description, setDescription] = useState('');
    const [preferredCommunication, setPreferredCommunication] = useState('Chat');

    const [issueType, setIssueType] = useState('Wrong Answer');
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        
        let endpoint = '';
        let payload = {};

        if (type === 'material') {
            endpoint = '/requests/material';
            payload = { subject, branch, semester, materialType, additionalNotes };
        } else if (type === 'mentorship') {
            endpoint = '/requests/mentorship';
            payload = { topic, description, preferredCommunication };
        } else if (type === 'issue') {
            endpoint = '/requests/issue';
            payload = { issueType, description, originalQuestion };
        }

        try {
            const res = await apiClient.post(endpoint, payload);
            setResult(res.data?.request || res.data);
            setStatus('success');
            if (onSuccess) onSuccess(res.data?.request || res.data);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || err.message || 'Submission failed');
            setStatus('idle');
        }
    };

    if (status === 'success') {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111116] border border-green-500/30 rounded-xl p-4 mt-2 max-w-[85%]">
                <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-green-500 font-semibold text-sm">
                        {type === 'material' && 'Material Request Submitted'}
                        {type === 'mentorship' && 'Mentorship Request Submitted'}
                        {type === 'issue' && 'Issue Report Submitted'}
                    </span>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-300">
                    <p><span className="text-slate-500">Request ID:</span> <span className="font-mono text-purple-300">{result._id.substring(0,8).toUpperCase()}</span></p>
                    
                    {type === 'material' && (
                        <>
                            <p><span className="text-slate-500">Subject:</span> {result.subject}</p>
                            <p><span className="text-slate-500">Branch:</span> {result.branch} (Sem {result.semester})</p>
                            <p><span className="text-slate-500">Type:</span> {result.materialType}</p>
                            <p className="mt-2 text-slate-400">You will receive a notification if this material becomes available.</p>
                        </>
                    )}

                    {type === 'mentorship' && (
                        <>
                            <p><span className="text-slate-500">Topic:</span> {result.topic}</p>
                            <p><span className="text-slate-500">Status:</span> <span className="text-yellow-400">Pending Assignment</span></p>
                            <p className="mt-2 text-slate-400">A senior mentor will contact you soon.</p>
                        </>
                    )}

                    {type === 'issue' && (
                        <>
                            <p><span className="text-slate-500">Issue:</span> {result.issueType}</p>
                            <p className="mt-2 text-slate-400">Thank you for helping improve ASK+.</p>
                        </>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111116] border border-purple-500/20 rounded-xl p-4 mt-2 max-w-[95%]">
            <div className="flex items-center gap-2 mb-4">
                {type === 'material' && <BookOpen className="w-4 h-4 text-purple-400" />}
                {type === 'mentorship' && <GraduationCap className="w-4 h-4 text-purple-400" />}
                {type === 'issue' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                <h4 className="text-white text-sm font-semibold">
                    {type === 'material' && 'Material Request Form'}
                    {type === 'mentorship' && 'Mentorship Request Form'}
                    {type === 'issue' && 'Report Issue'}
                </h4>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                {type === 'material' && (
                    <>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Subject</label>
                            <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none" />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Branch</label>
                                <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none">
                                    <option>CSE</option><option>ISE</option><option>ECE</option><option>EEE</option><option>MECH</option><option>CIVIL</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Sem</label>
                                <select value={semester} onChange={e => setSemester(Number(e.target.value))} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none">
                                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Material Type</label>
                            <select value={materialType} onChange={e => setMaterialType(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none">
                                <option>Notes</option><option>PYQ</option><option>Lab Manual</option><option>Question Bank</option><option>Mini Project</option><option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Additional Notes</label>
                            <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none h-16 resize-none" placeholder="E.g., Module 3 specifically..."></textarea>
                        </div>
                    </>
                )}

                {type === 'mentorship' && (
                    <>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Topic</label>
                            <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none">
                                <option>Placements</option><option>Internships</option><option>Resume</option><option>Projects</option><option>Higher Studies</option><option>Academics</option><option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Describe Your Need</label>
                            <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none h-20 resize-none" placeholder="I need help preparing for..."></textarea>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Preferred Communication</label>
                            <select value={preferredCommunication} onChange={e => setPreferredCommunication(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none">
                                <option>Chat</option><option>Call</option>
                            </select>
                        </div>
                    </>
                )}

                {type === 'issue' && (
                    <>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Issue Type</label>
                            <select value={issueType} onChange={e => setIssueType(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none">
                                <option>Missing Company</option><option>Wrong Answer</option><option>Wrong Material</option><option>Broken PDF</option><option>Missing Notes</option><option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
                            <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-purple-500/50 outline-none h-20 resize-none" placeholder="Please describe what went wrong..."></textarea>
                        </div>
                    </>
                )}

                <button 
                    disabled={status === 'submitting'}
                    type="submit" 
                    className="w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold py-2 rounded-lg transition-all active:scale-95 shadow-md disabled:opacity-50"
                >
                    {status === 'submitting' ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        </motion.div>
    );
};

export default InteractiveForm;

import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRequests = () => {
    const [materials, setMaterials] = useState([]);
    const [mentorships, setMentorships] = useState([]);
    const [issues, setIssues] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState('material');
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/requests/admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMaterials(data.materials);
                setMentorships(data.mentorships);
                setIssues(data.issues);
                setAnalytics(data.analytics);
            } else {
                toast.error('Failed to fetch requests');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const updateStatus = async (type, id, status) => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/requests/admin/${type}/${id}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            
            if (res.ok) {
                toast.success(`Marked as ${status}`);
                fetchRequests();
            } else {
                toast.error('Update failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error updating status');
        }
    };

    if (loading) {
        return <div className="text-white text-center py-10">Loading requests...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Analytics Dashboard */}
            {analytics?.mostRequested?.length > 0 && (
                <div className="bg-[#1a1a24] rounded-xl p-5 border border-white/5">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span>🔥</span> Most Requested Materials
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {analytics.mostRequested.map((item, i) => (
                            <div key={i} className="bg-[#0a0a0f] border border-white/10 rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <p className="text-white font-medium text-sm">{item._id.subject}</p>
                                    <p className="text-slate-400 text-xs">{item._id.materialType}</p>
                                </div>
                                <span className="bg-purple-500/20 text-purple-400 font-bold px-3 py-1 rounded-full text-xs">
                                    {item.count} Req
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
                <button 
                    onClick={() => setActiveTab('material')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'material' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <BookOpen className="w-4 h-4" /> Material Requests ({materials.length})
                </button>
                <button 
                    onClick={() => setActiveTab('mentorship')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'mentorship' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <GraduationCap className="w-4 h-4" /> Mentorship ({mentorships.length})
                </button>
                <button 
                    onClick={() => setActiveTab('issue')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'issue' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <AlertTriangle className="w-4 h-4" /> Issues ({issues.length})
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {activeTab === 'material' && materials.map(req => (
                    <div key={req._id} className="bg-[#1a1a24] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-white font-bold">{req.subject}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${req.status === 'Available' ? 'bg-green-500/20 text-green-400' : req.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {req.status}
                                </span>
                            </div>
                            <div className="text-sm text-slate-400 space-y-1">
                                <p>Student: <span className="text-white">{req.userName}</span></p>
                                <p>Branch: {req.branch} (Sem {req.semester}) • Type: {req.materialType}</p>
                                {req.additionalNotes && <p className="italic text-slate-500 text-xs mt-2">"{req.additionalNotes}"</p>}
                                <p className="text-xs text-slate-500 mt-2">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            {req.status === 'Pending' && (
                                <>
                                    <button onClick={() => updateStatus('material', req._id, 'Available')} className="bg-green-600 hover:bg-green-500 text-white text-xs py-2 rounded-lg font-semibold transition-colors">Mark Available</button>
                                    <button onClick={() => updateStatus('material', req._id, 'Rejected')} className="bg-white/10 hover:bg-red-500/20 text-red-400 text-xs py-2 rounded-lg font-semibold transition-colors">Reject</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {activeTab === 'mentorship' && mentorships.map(req => (
                    <div key={req._id} className="bg-[#1a1a24] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-white font-bold">{req.topic} Mentorship</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${req.status === 'Accepted' ? 'bg-blue-500/20 text-blue-400' : req.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {req.status}
                                </span>
                            </div>
                            <div className="text-sm text-slate-400 space-y-1">
                                <p>Student: <span className="text-white">{req.userName}</span></p>
                                <p>Prefers: <span className="text-purple-300 font-medium">{req.preferredCommunication}</span></p>
                                <p className="text-slate-300 mt-2 bg-[#0a0a0f] p-3 rounded-lg border border-white/5">"{req.description}"</p>
                                <p className="text-xs text-slate-500 mt-2">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            {req.status === 'Pending' && (
                                <button onClick={() => updateStatus('mentorship', req._id, 'Accepted')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded-lg font-semibold transition-colors">Accept Request</button>
                            )}
                            {req.status === 'Accepted' && (
                                <button onClick={() => updateStatus('mentorship', req._id, 'Completed')} className="bg-green-600 hover:bg-green-500 text-white text-xs py-2 rounded-lg font-semibold transition-colors">Mark Completed</button>
                            )}
                        </div>
                    </div>
                ))}

                {activeTab === 'issue' && issues.map(req => (
                    <div key={req._id} className="bg-[#1a1a24] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-white font-bold">{req.issueType}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${req.status === 'Resolved' ? 'bg-green-500/20 text-green-400' : req.status === 'Dismissed' ? 'bg-slate-500/20 text-slate-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {req.status}
                                </span>
                            </div>
                            <div className="text-sm text-slate-400 space-y-1">
                                <p>Reported By: <span className="text-white">{req.userName}</span></p>
                                {req.originalQuestion && <p>Trigger: <span className="text-blue-300">"{req.originalQuestion}"</span></p>}
                                <p className="text-slate-300 mt-2 bg-[#0a0a0f] p-3 rounded-lg border border-white/5">"{req.description}"</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[140px]">
                            {req.status === 'Open' && (
                                <>
                                    <button onClick={() => updateStatus('issue', req._id, 'Resolved')} className="bg-green-600 hover:bg-green-500 text-white text-xs py-2 rounded-lg font-semibold transition-colors">Resolve</button>
                                    <button onClick={() => updateStatus('issue', req._id, 'Dismissed')} className="bg-white/10 hover:bg-white/20 text-slate-300 text-xs py-2 rounded-lg font-semibold transition-colors">Dismiss</button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Empty states */}
                {activeTab === 'material' && materials.length === 0 && <p className="text-slate-500 text-center py-10">No material requests yet.</p>}
                {activeTab === 'mentorship' && mentorships.length === 0 && <p className="text-slate-500 text-center py-10">No mentorship requests yet.</p>}
                {activeTab === 'issue' && issues.length === 0 && <p className="text-slate-500 text-center py-10">No issue reports yet.</p>}
            </div>
        </div>
    );
};

export default AdminRequests;

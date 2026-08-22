import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle, XCircle, Clock, Search, MessageCircle } from 'lucide-react';
import { apiClient } from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminMentorship = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await apiClient.get('/mentorship');
            setRequests(res.data || []);
        } catch (error) {
            toast.error(error.response?.data?.error || error.message || 'Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await apiClient.put(`/mentorship/${id}/status`, { status });
            toast.success(`Request marked as ${status}`);
            setRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
        } catch (error) {
            toast.error(error.response?.data?.error || error.message || 'Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'Accepted': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'Completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'Cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    const getUrgencyColor = (urgency) => {
        switch(urgency) {
            case 'High': return 'text-red-400';
            case 'Medium': return 'text-yellow-400';
            case 'Low': return 'text-green-400';
            default: return 'text-slate-400';
        }
    };

    const filteredRequests = requests.filter(r => {
        const matchesFilter = filter === 'All' || r.status === filter;
        const matchesSearch = r.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              r.topic.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#050508] p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0a0f] p-6 rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-600/20 flex items-center justify-center border border-purple-500/30">
                            <GraduationCap className="w-7 h-7 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Mentorship Dashboard</h1>
                            <p className="text-slate-400 text-sm mt-1">Manage 1:1 mentorship requests from students</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search student or topic..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-purple-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['All', 'Pending', 'Accepted', 'Completed', 'Cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 border ${
                                filter === f 
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-[#0a0a0f] rounded-2xl border border-white/5 text-center px-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <GraduationCap className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No Requests Found</h3>
                        <p className="text-slate-400 text-sm">There are no mentorship requests matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredRequests.map(req => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={req._id} 
                                className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 transition-all shadow-lg flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-white font-bold">{req.userName}</h3>
                                        <p className="text-slate-400 text-xs mt-0.5">{new Date(req.createdAt).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getStatusColor(req.status)}`}>
                                        {req.status}
                                    </span>
                                </div>

                                <div className="mb-4 flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold px-2 py-1 bg-white/5 rounded text-purple-300 border border-white/10">
                                            {req.topic}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${getUrgencyColor(req.urgency)} flex items-center gap-1`}>
                                            <Clock className="w-3 h-3" /> {req.urgency}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                                        {req.description}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex gap-2">
                                    {req.status === 'Pending' && (
                                        <button 
                                            onClick={() => handleUpdateStatus(req._id, 'Accepted')}
                                            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Accept
                                        </button>
                                    )}
                                    {req.status === 'Accepted' && (
                                        <button 
                                            onClick={() => handleUpdateStatus(req._id, 'Completed')}
                                            className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Complete
                                        </button>
                                    )}
                                    {(req.status === 'Pending' || req.status === 'Accepted') && (
                                        <button 
                                            onClick={() => handleUpdateStatus(req._id, 'Cancelled')}
                                            className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-xl transition-all"
                                            title="Cancel Request"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMentorship;

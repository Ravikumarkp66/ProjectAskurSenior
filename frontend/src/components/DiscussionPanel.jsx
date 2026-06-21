import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/api';
import DiscussionCard from './DiscussionCard';
import CreateDiscussionModal from './CreateDiscussionModal';
import DiscussionDetailModal from './DiscussionDetailModal';


const DiscussionPanel = ({ subjectId, subjectName, currentUser }) => {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter] = useState('All');
    
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);

    const fetchDiscussions = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/discussions?subjectId=${subjectId}&category=${activeFilter}`);
            setDiscussions(res.data);
        } catch (err) {
            console.error('Failed to fetch discussions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subjectId) {
            fetchDiscussions();
        }
    }, [subjectId, activeFilter]);

    const handleCreateDiscussion = async (data) => {
        try {
            const res = await apiClient.post('/discussions', {
                ...data,
                subjectId,
                subjectName
            });
            // Immediately add to list if category matches or all
            if (activeFilter === 'All' || activeFilter === res.data.category) {
                setDiscussions(prev => [res.data, ...prev]);
            }
        } catch (err) {
            console.error('Failed to create discussion', err);
        }
    };

    const handleReply = async (discussionId, content) => {
        try {
            const res = await apiClient.post(`/discussions/${discussionId}/replies`, { content });
            // Update selected discussion in modal
            setSelectedDiscussion(res.data);
            // Update in list to reflect new reply count
            setDiscussions(prev => prev.map(d => d._id === discussionId ? res.data : d));
        } catch (err) {
            console.error('Failed to reply', err);
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        💬 {subjectName} Discussions
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        Help classmates, ask doubts and share resources related to {subjectName}.
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="shrink-0 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Ask Question
                </button>
            </div>


            {/* Content Feed */}
            <div className="flex-1 min-h-[400px] relative">
                {loading ? (
                    <div className="flex flex-col gap-4 mt-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-28 bg-slate-800/30 animate-pulse rounded-xl border border-slate-800" />
                        ))}
                    </div>
                ) : discussions.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-white/[0.01] border border-dashed border-slate-800 rounded-2xl"
                    >
                        <span className="text-4xl mb-3">💬</span>
                        <h3 className="text-lg font-bold text-slate-200 mb-1">No Discussions Yet</h3>
                        <p className="text-sm text-slate-400 max-w-xs mb-5">
                            Be the first student to start a discussion or ask a question in {subjectName}.
                        </p>
                        <button 
                            onClick={() => setIsCreateOpen(true)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Ask First Question
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 content-start">
                        <AnimatePresence mode="popLayout">
                            {discussions.map((disc, i) => (
                                <DiscussionCard 
                                    key={disc._id} 
                                    discussion={disc} 
                                    onClick={() => setSelectedDiscussion(disc)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <CreateDiscussionModal 
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreateDiscussion}
                subjectName={subjectName}
            />

            <DiscussionDetailModal
                isOpen={!!selectedDiscussion}
                onClose={() => setSelectedDiscussion(null)}
                discussion={selectedDiscussion}
                onReply={handleReply}
                currentUser={currentUser}
            />
        </div>
    );
};

export default DiscussionPanel;

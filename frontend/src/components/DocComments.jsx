import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, ThumbsUp, ThumbsDown, X, Edit, Trash2, CornerDownRight, Check } from 'lucide-react';
import { apiClient } from '../services/api';

const DocComments = ({ documentId, user, isLightMode }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [replyTo, setReplyTo] = useState(null); // { id: string, name: string }
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const fetchComments = async () => {
        try {
            const response = await apiClient.get(`/comments?documentId=${documentId}&all=true`);
            setComments(response.data);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [documentId]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            await apiClient.post('/comments', {
                documentId,
                content: newComment,
                parentId: replyTo?.id || null
            });
            setNewComment('');
            setReplyTo(null);
            fetchComments();
        } catch (error) {
            console.error('Failed to post comment:', error);
            alert('Failed to post comment');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateComment = async (commentId) => {
        if (!editValue.trim()) return;
        try {
            await apiClient.patch(`/comments/${commentId}`, { content: editValue });
            setEditingCommentId(null);
            fetchComments();
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Erase this comment?')) return;
        try {
            await apiClient.delete(`/comments/${commentId}`);
            fetchComments();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleToggleReaction = async (commentId, type) => {
        if (!user) return;

        // Optimistically update local state
        setComments(prev => prev.map(comment => {
            if (comment._id !== commentId) return comment;

            const userId = (user?._id || user?.id)?.toString();
            if (!userId) return comment;

            const likes = Array.isArray(comment.likes) ? comment.likes.map(id => id.toString()) : [];
            const unlikes = Array.isArray(comment.unlikes) ? comment.unlikes.map(id => id.toString()) : [];

            if (type === 'like') {
                const likedIdx = likes.indexOf(userId);
                if (likedIdx > -1) {
                    likes.splice(likedIdx, 1);
                } else {
                    likes.push(userId);
                    // Remove from unlikes if present
                    const unlikedIdx = unlikes.indexOf(userId);
                    if (unlikedIdx > -1) unlikes.splice(unlikedIdx, 1);
                }
            } else if (type === 'unlike') {
                const unlikedIdx = unlikes.indexOf(userId);
                if (unlikedIdx > -1) {
                    unlikes.splice(unlikedIdx, 1);
                } else {
                    unlikes.push(userId);
                    // Remove from likes if present
                    const likedIdx = likes.indexOf(userId);
                    if (likedIdx > -1) likes.splice(likedIdx, 1);
                }
            }

            return { ...comment, likes, unlikes };
        }));

        try {
            await apiClient.post(`/comments/${commentId}/react`, { type });
            // Re-fetch to ensure sync with server state (e.g. if others reacted too)
            fetchComments(); 
        } catch (error) {
            console.error('Reaction failed:', error);
            // Rollback on error
            fetchComments();
        }
    };

    const renderComment = (comment, isReply = false) => {
        const isAuthor = user?._id === comment.userId?._id;
        const isAdmin = user?.isAdmin;
        const reactionsCount = Array.isArray(comment.likes) ? comment.likes.length : 0;
        const unlikedCount = Array.isArray(comment.unlikes) ? comment.unlikes.length : 0;
        
        const userId = (user?._id || user?.id)?.toString();
        const hasLiked = userId && Array.isArray(comment.likes) && comment.likes.some(id => id.toString() === userId);
        const hasUnliked = userId && Array.isArray(comment.unlikes) && comment.unlikes.some(id => id.toString() === userId);

        return (
            <div key={comment._id} className={`group ${isReply ? 'ml-6 border-l-2 pl-4 mt-3' : 'mt-4 border-b pb-4'} ${isLightMode ? 'border-slate-100' : 'border-white/5'}`}>
                <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] uppercase tracking-tighter shadow-sm
                        ${comment.userId?.isAdmin 
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white ring-2 ring-purple-500/20' 
                            : (isLightMode ? 'bg-slate-100 text-slate-500' : 'bg-white/5 text-slate-400')}`}>
                        {comment.userId?.isAdmin ? 'AD' : (comment.userId?.name?.charAt(0) || '?')}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-black uppercase tracking-wider ${comment.userId?.isAdmin ? 'text-purple-400' : (isLightMode ? 'text-slate-800' : 'text-slate-200')}`}>
                                    {comment.userId?.isAdmin ? 'Admin' : (comment.userId?.name || 'Anonymous')}
                                </span>
                                {comment.userId?.isAdmin && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[8px] font-black text-purple-400 uppercase tracking-widest">
                                        AskUrSenior
                                    </span>
                                )}
                                {comment.parentId && (
                                    <span className="opacity-40 text-[9px] font-medium flex items-center gap-1">
                                        <CornerDownRight size={10} /> replied
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] opacity-40 font-mono">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        
                        {editingCommentId === comment._id ? (
                            <div className="flex items-center gap-2 mt-1">
                                <input 
                                    className={`flex-1 text-sm bg-transparent border-b outline-none focus:border-purple-500 py-1 ${isLightMode ? 'text-slate-700' : 'text-slate-200'}`}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={() => handleUpdateComment(comment._id)} className="text-emerald-500"><Check size={14}/></button>
                                <button onClick={() => setEditingCommentId(null)} className="text-red-500"><X size={14}/></button>
                            </div>
                        ) : (
                            <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                {comment.content}
                            </p>
                        )}

                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => handleToggleReaction(comment._id, 'like')}
                                    className={`p-1 rounded transition-all duration-300 ${hasLiked ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] scale-125' : 'opacity-40 hover:opacity-100'}`}
                                >
                                    <ThumbsUp size={12} className={hasLiked ? 'fill-current' : ''} />
                                </button>
                                <span className={`text-[10px] font-bold transition-all ${hasLiked ? 'text-emerald-500 opacity-100 scale-110' : 'opacity-60'}`}>{reactionsCount}</span>
                                
                                <button 
                                    onClick={() => handleToggleReaction(comment._id, 'unlike')}
                                    className={`p-1 rounded transition-all duration-300 ${hasUnliked ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)] scale-125' : 'opacity-40 hover:opacity-100'}`}
                                >
                                    <ThumbsDown size={12} className={hasUnliked ? 'fill-current' : ''} />
                                </button>
                                <span className={`text-[10px] font-bold transition-all ${hasUnliked ? 'text-red-500 opacity-100 scale-110' : 'opacity-60'}`}>{unlikedCount}</span>
                            </div>

                            <button 
                                onClick={() => { setReplyTo({ id: comment._id, name: comment.userId?.name }); setNewComment(''); }}
                                className="text-[10px] font-bold opacity-40 hover:opacity-100 hover:text-purple-500 transition-colors"
                            >
                                Reply
                            </button>

                            {(isAuthor || isAdmin) && !editingCommentId && (
                                <div className="flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => { setEditingCommentId(comment._id); setEditValue(comment.content); }}
                                        className="p-1 hover:text-purple-500"
                                    >
                                        <Edit size={10} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteComment(comment._id)}
                                        className="p-1 hover:text-red-500"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Find and render direct replies */}
                <div className="replies-container space-y-1">
                    {comments
                        .filter(c => {
                            const pId = c.parentId?._id || c.parentId;
                            return pId === comment._id;
                        })
                        .map(reply => renderComment(reply, true))
                    }
                </div>
            </div>
        );
    };

    return (
        <div className={`mt-4 p-4 rounded-xl animate-in slide-in-from-top-2 duration-300 ${isLightMode ? 'bg-slate-50' : 'bg-white/5 border border-white/5'}`}>
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={16} className="text-purple-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-purple-500">Discussion</h4>
            </div>

            {/* Input area */}
            {user ? (
                <div className={`relative mb-6 p-3 rounded-lg border focus-within:ring-2 focus-within:ring-purple-500/30 transition-all ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#0a0a0b] border-white/10'}`}>
                    {replyTo && (
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                            <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                                <CornerDownRight size={10} /> Replying to {replyTo.name}
                            </span>
                            <button onClick={() => setReplyTo(null)} className="text-red-400 hover:text-red-500">
                                <X size={10} />
                            </button>
                        </div>
                    )}
                    <textarea 
                        className="w-full bg-transparent border-none outline-none text-xs resize-none h-12 py-1"
                        placeholder={replyTo ? "Write your reply..." : "Add a helpful comment..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                        <button 
                            onClick={handlePostComment}
                            disabled={loading || !newComment.trim()}
                            className={`p-2 rounded-lg transition-all ${loading || !newComment.trim() ? 'opacity-30' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20'}`}
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`mb-8 p-6 text-center rounded-2xl border border-dashed ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                    <p className={`text-xs font-bold mb-3 uppercase tracking-widest ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Join the Conversation</p>
                    <p className={`text-sm mb-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Please login to post comments and participate in the community.</p>
                    <button 
                        onClick={() => window.location.href='/login'}
                        className="px-6 py-2 bg-purple-600 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
                    >
                        Login to Reply
                    </button>
                </div>
            )}

            {/* Comments list (Top-level only, replies rendered recursively) */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                    <p className="text-[10px] text-center opacity-40 py-4 uppercase font-bold tracking-widest">No comments yet. Be the first!</p>
                ) : (
                    comments.filter(c => !c.parentId).map(comment => renderComment(comment))
                )}
            </div>
        </div>
    );
};

export default DocComments;

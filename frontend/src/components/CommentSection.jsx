import React, { useState, useEffect } from 'react';
import { articleAPI } from '../services/articleAPI';
import { useAuth } from '../utils/hooks';
import { Send, User as UserIcon, MessageSquare, MoreVertical, Edit2, Trash2, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const CommentSection = ({ articleId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        fetchComments();
    }, [articleId]);

    const fetchComments = async () => {
        try {
            const data = await articleAPI.getComments(articleId);
            setComments(data);
        } catch (err) {
            console.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return;
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const addedComment = await articleAPI.postComment(articleId, newComment);
            setComments([addedComment, ...comments]);
            setNewComment('');
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateComment = async (commentId) => {
        if (!editContent.trim()) return;
        try {
            const updated = await articleAPI.updateComment(commentId, editContent);
            setComments(comments.map(c => c._id === commentId ? updated : c));
            setEditingCommentId(null);
        } catch (err) {
            console.error('Failed to update comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await articleAPI.deleteComment(commentId);
            setComments(comments.filter(c => c._id !== commentId));
        } catch (err) {
            console.error('Failed to delete comment');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-purple-500" />
                    Discussion ({comments.length})
                </h3>
            </div>

            {/* Comment Input */}
            <div className="mb-10">
                {isAuthenticated ? (
                    <form onSubmit={handlePostComment} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden border border-white/5">
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-purple-900/50 text-purple-200 text-sm font-bold">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your thoughts or ask a question..."
                                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-purple-500 transition-all min-h-[100px] resize-none text-sm lg:text-base"
                                    disabled={submitting}
                                />
                                {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
                                <div className="flex justify-end mt-3">
                                    <button
                                        type="submit"
                                        disabled={submitting || !newComment.trim()}
                                        className="flex items-center gap-2 bg-white text-[#0a0a0b] py-2.5 px-6 rounded-xl font-bold disabled:opacity-50 transition-all hover:scale-105 active:scale-95 text-sm"
                                    >
                                        {submitting ? 'Posting...' : 'Post Comment'} <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="bg-[#0a0a0b] border border-white/5 rounded-2xl p-6 text-center">
                        <p className="text-slate-400 text-sm mb-4">You must be logged in to join the conversation.</p>
                        <Link to="/login" className="inline-block bg-purple-600 text-white font-bold py-2 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 text-sm">
                            Sign In to Comment
                        </Link>
                    </div>
                )}
            </div>

            {/* Comments List */}
            {loading ? (
                <div className="flex flex-col gap-4">
                    <div className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>
                    <div className="h-20 bg-white/5 rounded-2xl animate-pulse"></div>
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment._id} className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden border border-white/5">
                                {(comment.userId?.profilePicture) ? (
                                    <img src={comment.userId.profilePicture} alt={comment.userId?.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                        <UserIcon size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 bg-white/5 rounded-2xl p-4 lg:p-5 border border-white/5 hover:border-white/10 transition-colors relative">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-slate-200 text-sm lg:text-base">{comment.userId?.name || 'Anonymous Student'}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] lg:text-xs text-slate-500 font-medium">{formatDate(comment.createdAt)}</span>
                                        {user && (user._id === comment.userId?._id || user.id === comment.userId?._id) && (
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingCommentId(comment._id);
                                                        setEditContent(comment.content);
                                                    }}
                                                    className="p-1 hover:text-purple-400 text-slate-500 transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteComment(comment._id)}
                                                    className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {editingCommentId === comment._id ? (
                                    <div className="space-y-3 mt-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full bg-[#0a0a0b] border border-purple-500/30 rounded-xl p-3 text-slate-200 text-sm focus:outline-none min-h-[80px] resize-none"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setEditingCommentId(null)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold transition-all"
                                            >
                                                <X size={12} /> Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdateComment(comment._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
                                            >
                                                <Check size={12} /> Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm lg:text-base leading-relaxed">{comment.content}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border border-white/5 border-dashed rounded-3xl">
                    <MessageSquare size={32} className="text-slate-700 mx-auto mb-3 opacity-20" />
                    <p className="text-slate-500 text-sm font-medium">No comments yet. Be the first to share your experience!</p>
                </div>
            )}
        </div>
    );
};

export default CommentSection;

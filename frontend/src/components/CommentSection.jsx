import React, { useState, useEffect } from 'react';
import { articleAPI } from '../services/articleAPI';
import { useAuth } from '../utils/hooks';
import { Send, User as UserIcon } from 'lucide-react';

const CommentSection = ({ articleId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
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
            setError('Failed to load comments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setError('You must be logged in to comment');
            return;
        }
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

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="mt-12 pt-8 border-t border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-6">Comments ({comments.length})</h3>

            {/* Comment Input */}
            <div className="mb-8">
                {isAuthenticated ? (
                    <form onSubmit={handlePostComment} className="flex flex-col gap-3">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 overflow-hidden border border-slate-600">
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-purple-900 text-purple-200 font-bold">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[80px] resize-y transition-colors"
                                disabled={submitting}
                            />
                        </div>
                        <div className="flex justify-end relative">
                            {error && <span className="text-red-400 text-sm absolute left-14 top-2">{error}</span>}
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? 'Posting...' : 'Post Comment'} <Send size={16} />
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
                        <p className="text-slate-400 mb-3">You must be logged in to leave a comment.</p>
                        <a href="/login" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                            Log In to Comment
                        </a>
                    </div>
                )}
            </div>

            {/* Comments List */}
            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment._id} className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 overflow-hidden">
                                {comment.userId?.profilePicture ? (
                                    <img src={comment.userId.profilePicture} alt={comment.userId.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-300">
                                        <UserIcon size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 bg-slate-800 rounded-lg p-4 border border-slate-700/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-slate-200">{comment.userId?.name || 'Unknown User'}</span>
                                    <span className="text-xs text-slate-500">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 border border-slate-800 rounded-lg border-dashed">
                    <p className="text-slate-500">No comments yet. Be the first to share your thoughts!</p>
                </div>
            )}
        </div>
    );
};

export default CommentSection;

const Comment = require('../models/Comment');
const User = require('../models/User');

const commentController = {
    // Post a comment (Article or Document)
    postComment: async (req, res) => {
        try {
            const { articleId, documentId, content, parentId } = req.body;

            if (!content) {
                return res.status(400).json({ error: 'Comment content is required' });
            }

            const comment = new Comment({
                articleId: articleId || null,
                documentId: documentId || null,
                userId: req.userId,
                content,
                parentId: parentId || null
            });

            await comment.save();

            const populatedComment = await Comment.findById(comment._id)
                .populate('userId', 'name profilePicture isAdmin');

            res.status(201).json(populatedComment);
        } catch (error) {
            console.error('Error posting comment:', error);
            res.status(500).json({ error: 'Failed to post comment' });
        }
    },

    // Get comments for a specific item
    getComments: async (req, res) => {
        try {
            const { articleId, documentId } = req.query;
            const query = {};
            if (articleId) query.articleId = articleId;
            if (documentId) query.documentId = documentId;
            
            // Only get top-level comments first, we can fetch replies or nest them
            if (!req.query.all) {
                query.parentId = null;
            }

            const comments = await Comment.find(query)
                .populate('userId', 'name profilePicture isAdmin')
                .populate({
                    path: 'parentId',
                    select: 'userId',
                    populate: { path: 'userId', select: 'name' }
                })
                .sort({ createdAt: -1 });

            res.json(comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({ error: 'Failed to fetch comments' });
        }
    },

    // Get replies for a comment
    getReplies: async (req, res) => {
        try {
            const { commentId } = req.params;
            const replies = await Comment.find({ parentId: commentId })
                .populate('userId', 'name profilePicture isAdmin')
                .sort({ createdAt: 1 });

            res.json(replies);
        } catch (error) {
            console.error('Error fetching replies:', error);
            res.status(500).json({ error: 'Failed to fetch replies' });
        }
    },

    // Update a comment
    updateComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { content } = req.body;

            const comment = await Comment.findById(commentId);
            if (!comment) return res.status(404).json({ error: 'Comment not found' });

            if (comment.userId.toString() !== req.userId && !req.isAdmin) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            comment.content = content;
            await comment.save();

            const updated = await Comment.findById(commentId).populate('userId', 'name profilePicture isAdmin');
            res.json(updated);
        } catch (error) {
            console.error('Error updating comment:', error);
            res.status(500).json({ error: 'Failed to update comment' });
        }
    },

    // Delete a comment
    deleteComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const comment = await Comment.findById(commentId);
            if (!comment) return res.status(404).json({ error: 'Comment not found' });

            if (comment.userId.toString() !== req.userId && !req.isAdmin) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            // Also delete replies? For now let's just delete the comment. 
            // Or we could "soft delete" by clearing content.
            await Comment.deleteMany({ $or: [{ _id: commentId }, { parentId: commentId }] });
            
            res.json({ message: 'Comment and its replies deleted' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({ error: 'Failed to delete comment' });
        }
    },

    // Like/Unlike a comment
    toggleReaction: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { type } = req.body; // 'like' or 'unlike'
            const userId = req.userId;

            const comment = await Comment.findById(commentId);
            if (!comment) return res.status(404).json({ error: 'Comment not found' });

            if (type === 'like') {
                const index = comment.likes.indexOf(userId);
                if (index === -1) {
                    comment.likes.push(userId);
                    // Remove from unlikes if present
                    const unlikeIndex = comment.unlikes.indexOf(userId);
                    if (unlikeIndex !== -1) comment.unlikes.splice(unlikeIndex, 1);
                } else {
                    comment.likes.splice(index, 1); // Toggle off
                }
            } else if (type === 'unlike') {
                const index = comment.unlikes.indexOf(userId);
                if (index === -1) {
                    comment.unlikes.push(userId);
                    // Remove from likes if present
                    const likeIndex = comment.likes.indexOf(userId);
                    if (likeIndex !== -1) comment.likes.splice(likeIndex, 1);
                } else {
                    comment.unlikes.splice(index, 1); // Toggle off
                }
            }

            await comment.save();
            res.json({ 
                likes: comment.likes.length, 
                unlikes: comment.unlikes.length,
                userReaction: comment.likes.includes(userId) ? 'like' : (comment.unlikes.includes(userId) ? 'unlike' : null)
            });
        } catch (error) {
            console.error('Error reacting to comment:', error);
            res.status(500).json({ error: 'Failed to react to comment' });
        }
    }
};

module.exports = commentController;

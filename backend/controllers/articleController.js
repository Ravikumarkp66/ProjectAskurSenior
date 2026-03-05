const Article = require('../models/Article');
const ArticleReaction = require('../models/ArticleReaction');
const Comment = require('../models/Comment');
const User = require('../models/User');

// Helper to create slug
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')   // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
};

const articleController = {
    // Admin: Create article
    createArticle: async (req, res) => {
        try {
            const { title, content, author, coverImage } = req.body;

            if (!title || !content || !author) {
                return res.status(400).json({ error: 'Title, content, and author are required' });
            }

            const slug = `${slugify(title)}-${Date.now().toString().slice(-4)}`;

            const article = new Article({
                title,
                slug,
                content,
                author,
                authorId: req.userId,
                coverImage
            });

            await article.save();
            res.status(201).json({ message: 'Article published successfully', article });
        } catch (error) {
            console.error('Error creating article:', error);
            res.status(500).json({ error: 'Failed to create article' });
        }
    },

    // Get all articles (for /guides page)
    getArticles: async (req, res) => {
        try {
            const { search } = req.query;
            let query = {};

            if (search) {
                query = { $text: { $search: search } };
            }

            const articles = await Article.find(query)
                .sort({ createdAt: -1 })
                .select('-content'); // Don't send full content for listing

            res.json(articles);
        } catch (error) {
            console.error('Error fetching articles:', error);
            res.status(500).json({ error: 'Failed to fetch articles' });
        }
    },

    // Get single article by slug
    getArticleBySlug: async (req, res) => {
        try {
            const { slug } = req.params;
            const article = await Article.findOneAndUpdate(
                { slug },
                { $inc: { views: 1 } },
                { new: true }
            );

            if (!article) {
                return res.status(404).json({ error: 'Article not found' });
            }

            res.json(article);
        } catch (error) {
            console.error('Error fetching article:', error);
            res.status(500).json({ error: 'Failed to fetch article' });
        }
    },

    // Like or Dislike article
    reactToArticle: async (req, res) => {
        try {
            const { articleId } = req.params;
            const { type } = req.body; // 'like' or 'dislike'

            if (!['like', 'dislike'].includes(type)) {
                return res.status(400).json({ error: 'Invalid reaction type' });
            }

            // Find existing reaction
            const existingReaction = await ArticleReaction.findOne({
                articleId,
                userId: req.userId
            });

            if (existingReaction) {
                if (existingReaction.type === type) {
                    // Remove reaction if same type (toggle off)
                    await ArticleReaction.deleteOne({ _id: existingReaction._id });

                    if (type === 'like') {
                        await Article.findByIdAndUpdate(articleId, { $inc: { likesCount: -1 } });
                    } else {
                        await Article.findByIdAndUpdate(articleId, { $inc: { dislikesCount: -1 } });
                    }

                    const updated = await Article.findById(articleId).select('likesCount dislikesCount');
                    return res.json({
                        message: 'Reaction removed',
                        type: null,
                        likesCount: updated.likesCount,
                        dislikesCount: updated.dislikesCount
                    });
                } else {
                    // Update reaction and counts
                    existingReaction.type = type;
                    await existingReaction.save();

                    if (type === 'like') {
                        await Article.findByIdAndUpdate(articleId, {
                            $inc: { likesCount: 1, dislikesCount: -1 }
                        });
                    } else {
                        await Article.findByIdAndUpdate(articleId, {
                            $inc: { likesCount: -1, dislikesCount: 1 }
                        });
                    }

                    const updated = await Article.findById(articleId).select('likesCount dislikesCount');
                    return res.json({
                        message: `Changed to ${type}`,
                        type,
                        likesCount: updated.likesCount,
                        dislikesCount: updated.dislikesCount
                    });
                }
            }

            // New reaction
            const reaction = new ArticleReaction({
                articleId,
                userId: req.userId,
                type
            });
            await reaction.save();

            if (type === 'like') {
                await Article.findByIdAndUpdate(articleId, { $inc: { likesCount: 1 } });
            } else {
                await Article.findByIdAndUpdate(articleId, { $inc: { dislikesCount: 1 } });
            }

            const updated = await Article.findById(articleId).select('likesCount dislikesCount');
            res.json({
                message: `Added ${type}`,
                type,
                likesCount: updated.likesCount,
                dislikesCount: updated.dislikesCount
            });
        } catch (error) {
            console.error('Error reacting to article:', error);
            res.status(500).json({ error: 'Failed to react to article' });
        }
    },

    // Post a comment
    postComment: async (req, res) => {
        try {
            const { articleId } = req.params;
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({ error: 'Comment content is required' });
            }

            const comment = new Comment({
                articleId,
                userId: req.userId,
                content
            });

            await comment.save();

            // Populate user info for display
            const populatedComment = await Comment.findById(comment._id)
                .populate('userId', 'name profilePicture');

            res.status(201).json(populatedComment);
        } catch (error) {
            console.error('Error posting comment:', error);
            res.status(500).json({ error: 'Failed to post comment' });
        }
    },

    // Get comments for an article
    getComments: async (req, res) => {
        try {
            const { articleId } = req.params;
            const comments = await Comment.find({ articleId })
                .populate('userId', 'name profilePicture')
                .sort({ createdAt: -1 });

            res.json(comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({ error: 'Failed to fetch comments' });
        }
    },

    // Update a comment
    updateComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { content } = req.body;

            const comment = await Comment.findById(commentId);
            if (!comment) return res.status(404).json({ error: 'Comment not found' });

            // Check ownership
            if (comment.userId.toString() !== req.userId) {
                return res.status(403).json({ error: 'Unauthorized to edit this comment' });
            }

            comment.content = content;
            await comment.save();

            const updated = await Comment.findById(commentId).populate('userId', 'name profilePicture');
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

            // Check ownership OR admin status
            if (comment.userId.toString() !== req.userId && !req.isAdmin) {
                return res.status(403).json({ error: 'Unauthorized to delete this comment' });
            }

            await Comment.deleteOne({ _id: commentId });
            res.json({ message: 'Comment deleted successfully' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({ error: 'Failed to delete comment' });
        }
    },

    // Get user's reaction to an article
    getReactionStatus: async (req, res) => {
        try {
            const { articleId } = req.params;
            const reaction = await ArticleReaction.findOne({ articleId, userId: req.userId });
            res.json({ type: reaction ? reaction.type : null });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch reaction status' });
        }
    }
};

module.exports = articleController;

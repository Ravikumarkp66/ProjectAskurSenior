const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Public routes
router.get('/', articleController.getArticles);
router.get('/:slug', articleController.getArticleBySlug);
router.get('/:articleId/comments', articleController.getComments);

// Protected routes (any authenticated user)
router.post('/:articleId/react', authMiddleware, articleController.reactToArticle);
router.get('/:articleId/reaction-status', authMiddleware, articleController.getReactionStatus);
router.post('/:articleId/comments', authMiddleware, articleController.postComment);
router.put('/comments/:commentId', authMiddleware, articleController.updateComment);
router.delete('/comments/:commentId', authMiddleware, articleController.deleteComment);

// Admin routes
router.post('/create', authMiddleware, adminMiddleware, articleController.createArticle);

module.exports = router;

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');

// Public
router.get('/', commentController.getComments);
router.get('/:commentId/replies', commentController.getReplies);

// Protected
router.post('/', authMiddleware, commentController.postComment);
router.patch('/:commentId', authMiddleware, commentController.updateComment);
router.delete('/:commentId', authMiddleware, commentController.deleteComment);
router.post('/:commentId/react', authMiddleware, commentController.toggleReaction);

module.exports = router;

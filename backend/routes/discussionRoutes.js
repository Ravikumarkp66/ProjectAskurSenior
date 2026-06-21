const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, discussionController.getDiscussions);
router.post('/', authMiddleware, discussionController.createDiscussion);
router.post('/:id/replies', authMiddleware, discussionController.addReply);
router.patch('/:id/answered', authMiddleware, discussionController.toggleAnswered);

module.exports = router;

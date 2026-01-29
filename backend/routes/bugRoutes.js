const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { createBug, listBugs, updateBugStatus } = require('../controllers/bugController');

router.post('/', authMiddleware, createBug);
router.get('/', authMiddleware, adminMiddleware, listBugs);
router.patch('/:id/status', authMiddleware, adminMiddleware, updateBugStatus);

module.exports = router;

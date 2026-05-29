const express = require('express');
const router = express.Router();
const { createRequest, getRequests, updateRequestStatus } = require('../controllers/mentorshipController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.post('/', authMiddleware, createRequest);
router.get('/', authMiddleware, adminMiddleware, getRequests);
router.put('/:id/status', authMiddleware, adminMiddleware, updateRequestStatus);

module.exports = router;

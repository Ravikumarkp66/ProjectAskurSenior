const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Public route to fetch FAQs grouped by category
router.get('/', faqController.getFaqs);

// Admin routes
router.get('/admin/all', authMiddleware, adminMiddleware, faqController.getAllFaqsAdmin);
router.post('/admin', authMiddleware, adminMiddleware, faqController.createFaq);
router.put('/admin/:id', authMiddleware, adminMiddleware, faqController.updateFaq);
router.delete('/admin/:id', authMiddleware, adminMiddleware, faqController.deleteFaq);

module.exports = router;

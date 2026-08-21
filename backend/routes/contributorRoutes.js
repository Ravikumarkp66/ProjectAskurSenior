const express = require('express');
const router = express.Router();
const contributorController = require('../controllers/contributorController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Public API
router.get('/', contributorController.getPublicContributors);

// Admin APIs
router.get('/admin/all', authMiddleware, adminMiddleware, contributorController.getAllContributorsAdmin);
router.post('/admin', authMiddleware, adminMiddleware, contributorController.createContributor);
router.put('/admin/:id', authMiddleware, adminMiddleware, contributorController.updateContributor);
router.delete('/admin/:id', authMiddleware, adminMiddleware, contributorController.deleteContributor);

module.exports = router;

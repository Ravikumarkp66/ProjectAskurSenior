const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
// const authMiddleware = require('../middleware/auth');
// const adminMiddleware = require('../middleware/admin');

// Anyone can search materials
router.get('/', materialController.getMaterials);

// Only admins can upload materials
// Using simple routes for now, can add auth/admin middlewares later if needed
router.post('/', /* authMiddleware, adminMiddleware, */ materialController.createMaterial);

// Ask+ Chatbot material search
router.post('/search', materialController.searchMaterials);

module.exports = router;

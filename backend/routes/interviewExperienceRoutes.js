const express = require('express');
const router = express.Router();
const { 
  getCompanies, 
  getCompanyRoles, 
  getExperiences, 
  createExperience, 
  upvoteExperience,
  updateExperience,
  createCompany
} = require('../controllers/interviewExperienceController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Health check for this router
router.get('/ping', (req, res) => res.json({ message: 'pong', router: 'interview-experience' }));

router.get('/companies', getCompanies);
router.get('/companies/:id/roles', getCompanyRoles);
router.get('/list', getExperiences); // Changed from / to /list to avoid root conflicts

// Protected routes
router.post('/create', authMiddleware, createExperience);
router.post('/upvote/:id', authMiddleware, upvoteExperience);
router.put('/:id', authMiddleware, adminMiddleware, updateExperience);

// Admin only
router.post('/admin/companies', authMiddleware, adminMiddleware, createCompany);

module.exports = router;

const express = require('express');
const router = express.Router();
const { 
  getCompanies, 
  getCompanyRoles, 
  getExperiences, 
  createExperience, 
  upvoteExperience,
  updateExperience,
  updateExperienceStatus,
  deleteExperience,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/interviewExperienceController');
const authMiddleware = require('../middleware/auth');
const { requireAdmin, requirePermission } = require('../middleware/adminAuth');

// Health check for this router
router.get('/ping', (req, res) => res.json({ message: 'pong', router: 'interview-experience' }));

router.get('/companies', getCompanies);
router.get('/companies/:id/roles', getCompanyRoles);
router.get('/list', getExperiences);

// Student & Admin creation routes
router.post('/create', authMiddleware, createExperience);
router.post('/', authMiddleware, createExperience);
router.post('/upvote/:id', authMiddleware, upvoteExperience);

// Admin moderation & experience management routes
router.put('/:id', authMiddleware, requireAdmin, requirePermission('interviews.publish'), updateExperience);
router.patch('/:id/status', authMiddleware, requireAdmin, requirePermission('interviews.publish'), updateExperienceStatus);
router.delete('/:id', authMiddleware, requireAdmin, requirePermission('interviews.archive'), deleteExperience);

// Admin company management routes
router.post('/admin/companies', authMiddleware, requireAdmin, requirePermission('companies.create'), createCompany);
router.put('/admin/companies/:id', authMiddleware, requireAdmin, requirePermission('companies.update'), updateCompany);
router.delete('/admin/companies/:id', authMiddleware, requireAdmin, requirePermission('companies.delete'), deleteCompany);

module.exports = router;

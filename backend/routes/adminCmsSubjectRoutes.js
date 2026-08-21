const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
    getStats,
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    duplicateSubject
} = require('../controllers/adminCmsSubjectController');

// All routes require authentication + admin access
router.use(authMiddleware, adminMiddleware);

router.get('/stats', getStats);
router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);
router.post('/:id/duplicate', duplicateSubject);

module.exports = router;

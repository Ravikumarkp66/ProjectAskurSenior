const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin, requirePermission, enforceDepartmentScope } = require('../middleware/adminAuth');
const {
    getStats,
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    duplicateSubject
} = require('../controllers/adminCmsSubjectController');

// All subject routes require authentication + active admin verification
router.use(authMiddleware, requireAdmin);

router.get('/stats', requirePermission('subjects.view'), enforceDepartmentScope, getStats);
router.get('/', requirePermission('subjects.view'), enforceDepartmentScope, getSubjects);
router.get('/:id', requirePermission('subjects.view'), enforceDepartmentScope, getSubjectById);
router.post('/', requirePermission('subjects.create'), enforceDepartmentScope, createSubject);
router.put('/:id', requirePermission('subjects.update'), enforceDepartmentScope, updateSubject);
router.delete('/:id', requirePermission('subjects.delete'), enforceDepartmentScope, deleteSubject);
router.post('/:id/duplicate', requirePermission('subjects.create'), enforceDepartmentScope, duplicateSubject);

module.exports = router;

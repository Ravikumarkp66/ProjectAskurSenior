const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin, requirePermission, enforceDepartmentScope } = require('../middleware/adminAuth');
const { upload } = require('../utils/multer');
const {
    getStats,
    getHealthStats,
    getDuplicatesList,
    getMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    bulkDeleteMaterials,
    bulkReassignMaterials,
    bulkUpdateStatus,
    restoreMaterial,
    ignoreDuplicate,
    getMaterialFileUrl,
    previewMatch
} = require('../controllers/adminCmsMaterialController');

// All material routes require authentication + active admin verification
router.use(authMiddleware, requireAdmin);

router.get('/stats', requirePermission('materials.view'), enforceDepartmentScope, getStats);
router.get('/health-stats', requirePermission('materials.view'), enforceDepartmentScope, getHealthStats);
router.get('/duplicates', requirePermission('materials.view'), enforceDepartmentScope, getDuplicatesList);
router.get('/', requirePermission('materials.view'), enforceDepartmentScope, getMaterials);
router.get('/:id/file', requirePermission('materials.view'), enforceDepartmentScope, getMaterialFileUrl);
router.get('/:id', requirePermission('materials.view'), enforceDepartmentScope, getMaterialById);

router.post('/preview-match', requirePermission('materials.create'), enforceDepartmentScope, previewMatch);
router.post('/bulk-reassign', requirePermission('materials.update'), enforceDepartmentScope, bulkReassignMaterials);
router.post('/bulk-status', requirePermission('materials.update'), enforceDepartmentScope, bulkUpdateStatus);
router.post('/bulk-delete', requirePermission('materials.delete'), enforceDepartmentScope, bulkDeleteMaterials);
router.post('/:id/restore', requirePermission('materials.update'), enforceDepartmentScope, restoreMaterial);
router.post('/:id/ignore-duplicate', requirePermission('materials.update'), enforceDepartmentScope, ignoreDuplicate);

router.post('/', requirePermission('materials.create'), enforceDepartmentScope, upload.array('files', 100), createMaterial);
router.put('/:id', requirePermission('materials.update'), enforceDepartmentScope, updateMaterial);
router.delete('/:id', requirePermission('materials.delete'), enforceDepartmentScope, deleteMaterial);

module.exports = router;

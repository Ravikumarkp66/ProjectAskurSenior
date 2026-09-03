const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
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

// All routes require authentication + admin access
router.use(authMiddleware, adminMiddleware);

router.get('/stats', getStats);
router.get('/health-stats', getHealthStats);
router.get('/duplicates', getDuplicatesList);
router.get('/', getMaterials);
router.get('/:id/file', getMaterialFileUrl);
router.get('/:id', getMaterialById);
router.post('/preview-match', previewMatch);
router.post('/bulk-reassign', bulkReassignMaterials);
router.post('/bulk-status', bulkUpdateStatus);
router.post('/bulk-delete', bulkDeleteMaterials);
router.post('/:id/restore', restoreMaterial);
router.post('/:id/ignore-duplicate', ignoreDuplicate);
router.post('/', upload.array('files', 100), createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

module.exports = router;

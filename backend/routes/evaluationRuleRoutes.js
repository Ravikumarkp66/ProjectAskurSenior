const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const controller = require('../controllers/evaluationRuleController');

// All evaluation rule routes require authentication & admin privileges
router.use(authMiddleware, requireAdmin);

// Rule CRUD
router.get('/', controller.listEvaluationRules);
router.get('/:id', controller.getEvaluationRuleById);
router.post('/', controller.createEvaluationRule);
router.put('/:id', controller.updateEvaluationRule);
router.delete('/:id', controller.deleteEvaluationRule);

// Lifecycle & Versioning
router.post('/:id/activate', controller.activateEvaluationRule);
router.post('/:id/archive', controller.archiveEvaluationRule);
router.post('/:id/new-version', controller.createNewVersion);

module.exports = router;

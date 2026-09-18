const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const controller = require('../controllers/evaluationGroupController');

// All evaluation group routes require authentication & admin privileges
router.use(authMiddleware, requireAdmin);

// Available subjects for assignment
router.get('/subjects/available', controller.getAvailableSubjects);

// Group CRUD
router.get('/', controller.listEvaluationGroups);
router.get('/:id', controller.getEvaluationGroupById);
router.post('/', controller.createEvaluationGroup);
router.put('/:id', controller.updateEvaluationGroup);
router.delete('/:id', controller.deleteEvaluationGroup);

module.exports = router;

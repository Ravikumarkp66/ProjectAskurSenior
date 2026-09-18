const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const controller = require('../controllers/studentEvaluationResultController');

// All evaluation result endpoints require authentication
router.use(authMiddleware);

// 1. Result Query Endpoints (Deterministic Calculation, Read-Only, No persistent mutation)
router.get('/subject', controller.getSubjectResult);
router.get('/student/:studentId/subject/:subjectId', controller.getSubjectResult);

router.get('/semester', controller.getSemesterResults);
router.get('/student/:studentId/semester/:semester', controller.getSemesterResults);

// 2. Evaluation Component State & Dynamic Marks Entry (SDC, CAED, etc.)
router.get('/components', controller.getEvaluationComponentState);
router.post('/components', controller.recordComponentMark);
router.put('/components', controller.recordComponentMark);

// 3. Explicit Publish / Save Operation
router.post('/publish', controller.publishSubjectResult);

module.exports = router;

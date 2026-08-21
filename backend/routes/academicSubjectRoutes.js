const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
} = require('../controllers/academicSubjectController');

// GET endpoints are public
router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);

// Write endpoints require authentication and admin privileges
router.post('/', authMiddleware, adminMiddleware, createSubject);
router.put('/:id', authMiddleware, adminMiddleware, updateSubject);
router.delete('/:id', authMiddleware, adminMiddleware, deleteSubject);

module.exports = router;

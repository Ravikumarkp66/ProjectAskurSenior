const express = require('express');
const router = express.Router();
const { getSubjectMaterials } = require('../controllers/subjectMaterialController');

// Public route to fetch materials grouped for student view
router.get('/:subjectId/materials', getSubjectMaterials);

module.exports = router;

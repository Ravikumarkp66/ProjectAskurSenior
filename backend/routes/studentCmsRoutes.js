const express = require('express');
const router = express.Router();
const { getPublicSubjects, getSubjectMaterials, trackDownload } = require('../controllers/studentCmsController');

// Public student-facing CMS routes - no auth required
router.get('/', getPublicSubjects);
router.get('/:slug/materials', getSubjectMaterials);

module.exports = router;


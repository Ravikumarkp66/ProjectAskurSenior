const express = require('express');
const router = express.Router();
const { getPrograms, getBranches, getSemesters, getMaterialTypes, getSchemes } = require('../controllers/lookupController');

// Public lookup endpoints - no auth required
router.get('/programs', getPrograms);
router.get('/branches', getBranches);
router.get('/semesters', getSemesters);
router.get('/material-types', getMaterialTypes);
router.get('/schemes', getSchemes);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getExperiences, addBulkExperiences } = require('../controllers/interviewExperienceController');

router.get('/', getExperiences);
router.post('/bulk', addBulkExperiences);

module.exports = router;

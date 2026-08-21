const express = require('express');
const router = express.Router();
const landingPageController = require('../controllers/landingPageController');

// Public route to fetch published landing page configuration
router.get('/', landingPageController.getLandingPage);

module.exports = router;

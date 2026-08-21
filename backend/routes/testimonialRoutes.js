const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');

// Public route to fetch random published testimonials for landing page marquee
router.get('/random', testimonialController.getRandomTestimonials);

// Public route to fetch featured testimonials
router.get('/featured', testimonialController.getFeaturedTestimonials);

// Public route to fetch paginated & filtered testimonials
router.get('/', testimonialController.getTestimonials);

module.exports = router;

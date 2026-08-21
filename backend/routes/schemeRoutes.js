const express = require('express');
const router = express.Router();
const { getSchemes, createScheme } = require('../controllers/schemeController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.route('/')
    .get(auth, admin, getSchemes)
    .post(auth, admin, createScheme);

module.exports = router;

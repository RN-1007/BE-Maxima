const express = require('express');
const router = express.Router();
const authController = require('./controller/auth.controller');

// POST /api/auth/login - Admin & Petani
router.post('/login', authController.login);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('./controller/auth.controller');

const { authenticateToken } = require('../../middlewares/auth.middleware');

// POST /api/auth/login - Admin & Petani
router.post('/login', authController.login);

// GET /api/auth/me - Cek session & profil user saat ini
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

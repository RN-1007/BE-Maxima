const express = require('express');
const router = express.Router();
const fertilizationsController = require('./controller/fertilizations.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// Admin only
router.use(authenticateToken, requireRole(ROLES.ADMIN));

// GET /api/admin/fertilizations - Global plantation fertilization schedule
router.get('/', fertilizationsController.getAllSchedules);

module.exports = router;

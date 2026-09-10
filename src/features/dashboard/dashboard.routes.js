const express = require('express');
const router = express.Router();
const dashboardController = require('./controller/dashboard.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// All dashboard endpoints require Admin role
router.use(authenticateToken, requireRole(ROLES.ADMIN));

// GET /api/admin/dashboard/stats
router.get('/stats', dashboardController.getStats);

// GET /api/admin/dashboard/trend
router.get('/trend', dashboardController.getTrend);

// GET /api/admin/dashboard/overview
router.get('/overview', dashboardController.getOverview);

module.exports = router;

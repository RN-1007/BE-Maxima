const express = require('express');
const router = express.Router();
const aiController = require('./controller/ai.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// Admin: GET /api/admin/ai-logs - Global AI leaf photo detection history & trend monitoring
router.get('/', authenticateToken, requireRole(ROLES.ADMIN), aiController.getAdminAiLogs);

module.exports = router;

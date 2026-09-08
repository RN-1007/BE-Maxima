const express = require('express');
const router = express.Router();
const treesController = require('./controller/trees.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// Admin: GET /api/admin/trees - Global tree recap with filters ?farmer_id=&health_status=&age=
router.get('/', authenticateToken, requireRole(ROLES.ADMIN), treesController.getAdminTrees);

module.exports = router;

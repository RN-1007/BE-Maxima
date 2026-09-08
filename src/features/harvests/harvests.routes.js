const express = require('express');
const router = express.Router();
const harvestsController = require('./controller/harvests.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// Petani: POST /api/harvests/report
router.post('/report', authenticateToken, requireRole(ROLES.FARMER), harvestsController.reportHarvest);

module.exports = router;

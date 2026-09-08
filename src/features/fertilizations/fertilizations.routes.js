const express = require('express');
const router = express.Router();
const fertilizationsController = require('./controller/fertilizations.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// All endpoints in this router are for farmers
router.use(authenticateToken, requireRole(ROLES.FARMER));

// GET /api/fertilizations/schedule - Get to-do list / calendar of fertilizations
router.get('/schedule', fertilizationsController.getSchedule);

// PUT /api/fertilizations/:id/complete - Mark fertilization as complete
router.put('/:id/complete', fertilizationsController.completeSchedule);

module.exports = router;

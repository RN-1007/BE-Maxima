const express = require('express');
const router = express.Router();
const fertilizationsController = require('../features/fertilizations/controller/fertilizations.controller');
const { aiController } = require('../features/ai/ai.routes');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { ROLES } = require('../config/constants');

// Petani only for offline synchronization
router.use(authenticateToken, requireRole(ROLES.FARMER));

// POST /api/sync/fertilizations - Batch synchronization for fertilization records (FR-3)
router.post('/fertilizations', fertilizationsController.syncFertilizations);

// POST /api/sync/ai-detect - Batch synchronization for offline leaf photo detections (FR-3)
router.post('/ai-detect', aiController.syncAiDetect);

module.exports = router;

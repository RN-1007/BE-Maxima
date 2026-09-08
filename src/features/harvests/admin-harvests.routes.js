const express = require('express');
const router = express.Router();
const harvestsController = require('./controller/harvests.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

router.use(authenticateToken, requireRole(ROLES.ADMIN));

// GET /api/admin/harvests - List harvest reports (Pending/Verified)
router.get('/', harvestsController.getAllHarvests);

// POST /api/admin/harvests/:id/verify-and-qr - Verify & Generate Batch QR Code PDF (FR-4)
router.post('/:id/verify-and-qr', harvestsController.verifyAndGenerateQR);

module.exports = router;

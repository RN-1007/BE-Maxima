const express = require('express');
const router = express.Router();
const farmersController = require('./controller/farmers.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// All farmer management endpoints are restricted to Admin
router.use(authenticateToken, requireRole(ROLES.ADMIN));

router.get('/', farmersController.getAllFarmers);
router.get('/:id', farmersController.getFarmerById);
router.post('/', farmersController.createFarmer);
router.put('/:id', farmersController.updateFarmer);
router.delete('/:id', farmersController.deleteFarmer);

module.exports = router;

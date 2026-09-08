const express = require('express');
const router = express.Router();
const treesController = require('./controller/trees.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

// Petani: POST /api/trees - Add new tree & auto generate fertilization schedule (FR-1)
router.post('/', authenticateToken, requireRole(ROLES.FARMER), treesController.addTree);

// Petani: GET /api/trees/my-trees - Get own trees (FR-2)
router.get('/my-trees', authenticateToken, requireRole(ROLES.FARMER), treesController.getMyTrees);

// Detail of tree
router.get('/:id', authenticateToken, treesController.getTreeById);

module.exports = router;

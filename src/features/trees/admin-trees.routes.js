const express = require('express');
const router = express.Router();
const treesController = require('./controller/trees.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

router.use(authenticateToken, requireRole(ROLES.ADMIN));

// Admin: GET /api/admin/trees - Global tree recap with filters ?farmer_id=&health_status=&age=
router.get('/', treesController.getAdminTrees);

// Admin: POST /api/admin/trees - Add new tree / batch from admin dashboard
router.post('/', treesController.adminAddTree);

// Admin: GET /api/admin/trees/:id - Detail tree
router.get('/:id', treesController.getTreeById);

// Admin: PUT /api/admin/trees/:id - Update tree details
router.put('/:id', treesController.adminUpdateTree);

// Admin: DELETE /api/admin/trees/:id - Delete tree
router.delete('/:id', treesController.adminDeleteTree);

module.exports = router;

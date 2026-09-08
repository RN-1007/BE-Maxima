const express = require('express');
const router = express.Router();
const aiController = require('./controller/ai.controller');
const { authenticateToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { uploadLeafPhoto } = require('../../middlewares/upload.middleware');
const { ROLES } = require('../../config/constants');

// Upload field handler accepting 'photo', 'file', or 'image'
const flexibleUpload = (req, res, next) => {
  uploadLeafPhoto.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) req.file = req.files.photo[0];
      else if (req.files.file && req.files.file[0]) req.file = req.files.file[0];
      else if (req.files.image && req.files.image[0]) req.file = req.files.image[0];
    }
    next();
  });
};

// POST /api/ai/detect - Petani uploads leaf photo for AI detection (FR-5)
router.post(
  '/detect',
  authenticateToken,
  requireRole(ROLES.FARMER),
  flexibleUpload,
  aiController.detect
);

module.exports = {
  aiRouter: router,
  aiController,
};

const aiService = require('../service/ai.service');
const { successResponse } = require('../../../utils/response');

/**
 * Handle AI detection on uploaded leaf photo (Petani)
 */
const detect = async (req, res, next) => {
  try {
    const user = req.user;
    const treeId = req.body.treeId || req.body.tree_id;
    const result = await aiService.detectLeaf(user, treeId, req.file);
    return successResponse(res, 'Deteksi AI berhasil diproses.', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle batch sync of offline AI detections (Petani - FR-3)
 */
const syncAiDetect = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const payload = Array.isArray(req.body) ? req.body : req.body.logs;
    const result = await aiService.syncAiDetectBatch(farmerId, payload);
    return successResponse(res, 'Sinkronisasi batch log AI offline berhasil.', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all AI detection logs for Admin
 */
const getAdminAiLogs = async (req, res, next) => {
  try {
    const logs = await aiService.getAdminAiLogs(req.query);
    return successResponse(res, 'Berhasil mengambil riwayat deteksi AI global.', logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  detect,
  syncAiDetect,
  getAdminAiLogs,
};

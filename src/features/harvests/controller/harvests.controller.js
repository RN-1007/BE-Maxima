const harvestsService = require('../service/harvests.service');
const { successResponse } = require('../../../utils/response');

/**
 * Petani reports harvest
 */
const reportHarvest = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const report = await harvestsService.reportHarvest(farmerId, req.body);
    return successResponse(res, 'Laporan panen berhasil dikirim dan masuk antrean verifikasi Admin.', report, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin gets all harvest reports
 */
const getAllHarvests = async (req, res, next) => {
  try {
    const harvests = await harvestsService.getAllHarvests(req.query);
    return successResponse(res, 'Berhasil mengambil daftar laporan panen.', harvests);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin verifies harvest and generates QR code sticker PDF (FR-4)
 */
const verifyAndGenerateQR = async (req, res, next) => {
  try {
    const result = await harvestsService.verifyAndGenerateQR(req.params.id, req.body);
    return successResponse(res, 'Laporan panen berhasil diverifikasi dan file PDF stiker QR Code telah di-generate.', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  reportHarvest,
  getAllHarvests,
  verifyAndGenerateQR,
};

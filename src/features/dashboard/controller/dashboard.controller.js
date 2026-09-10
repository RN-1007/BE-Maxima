const dashboardService = require('../service/dashboard.service');
const { successResponse } = require('../../../utils/response');

/**
 * GET /api/admin/dashboard/stats
 */
const getStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getStats();
    return successResponse(res, 'Berhasil mengambil statistik dashboard.', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/dashboard/trend
 */
const getTrend = async (req, res, next) => {
  try {
    const data = await dashboardService.getTrend();
    return successResponse(res, 'Berhasil mengambil data tren kesehatan kebun.', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/dashboard/overview
 */
const getOverview = async (req, res, next) => {
  try {
    const data = await dashboardService.getOverview();
    return successResponse(res, 'Berhasil mengambil ringkasan lengkap dashboard.', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getTrend,
  getOverview,
};

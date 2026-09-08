const fertilizationsService = require('../service/fertilizations.service');
const { successResponse } = require('../../../utils/response');

/**
 * Get farmer's fertilization schedules
 */
const getSchedule = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const schedule = await fertilizationsService.getFarmerSchedule(farmerId, req.query);
    return successResponse(res, 'Berhasil mengambil to-do list jadwal pemupukan.', schedule);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark schedule as completed
 */
const completeSchedule = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const completed = await fertilizationsService.completeSchedule(req.params.id, farmerId, req.body);
    return successResponse(res, 'Jadwal pemupukan berhasil diperbarui menjadi Selesai Dipupuk.', completed);
  } catch (error) {
    next(error);
  }
};

/**
 * Sync batch fertilizations from offline storage (FR-3)
 */
const syncFertilizations = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const payload = Array.isArray(req.body) ? req.body : req.body.fertilizations;
    const syncResult = await fertilizationsService.syncFertilizations(farmerId, payload);
    return successResponse(res, 'Sinkronisasi batch data pemupukan berhasil diproses.', syncResult);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedule,
  completeSchedule,
  syncFertilizations,
};

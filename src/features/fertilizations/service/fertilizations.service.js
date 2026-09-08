const fertilizationsModel = require('../model/fertilizations.model');
const { FERTILIZATION_STATUS } = require('../../../config/constants');

/**
 * Get farmer's fertilization schedules (to-do list / upcoming)
 * @param {string} farmerId
 * @param {Object} query
 */
const getFarmerSchedule = async (farmerId, query = {}) => {
  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.startDate) {
    filter.startDate = query.startDate;
  }
  if (query.endDate) {
    filter.endDate = query.endDate;
  }

  const schedules = await fertilizationsModel.findSchedulesByFarmerId(farmerId, filter);

  // Group by status / urgency
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const categorized = schedules.map((item) => {
    const schedDate = new Date(item.scheduledDate);
    let timingStatus = 'Mendatang';
    if (item.status === FERTILIZATION_STATUS.COMPLETED) {
      timingStatus = 'Selesai';
    } else if (schedDate < startOfToday) {
      timingStatus = 'Terlambat (Overdue)';
    } else if (schedDate.toDateString() === startOfToday.toDateString()) {
      timingStatus = 'Hari Ini';
    }

    return {
      ...item,
      timingStatus,
    };
  });

  return categorized;
};

/**
 * Mark a fertilization schedule as complete
 * @param {string} id
 * @param {string} farmerId
 * @param {Object} payload
 */
const completeSchedule = async (id, farmerId, { actualDate, notes } = {}) => {
  const record = await fertilizationsModel.findFertilizationById(id);
  if (!record) {
    const error = new Error('Jadwal pemupukan tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  // Data isolation check: ensure tree belongs to logged in farmer
  if (record.tree.farmerId !== farmerId) {
    const error = new Error('Akses ditolak. Anda tidak memiliki wewenang atas jadwal pohon ini.');
    error.statusCode = 403;
    throw error;
  }

  const parsedActualDate = actualDate ? new Date(actualDate) : new Date();
  if (isNaN(parsedActualDate.getTime())) {
    const error = new Error('Format actualDate tidak valid. Gunakan format YYYY-MM-DD.');
    error.statusCode = 400;
    throw error;
  }

  return await fertilizationsModel.markCompleted(id, parsedActualDate, notes);
};

/**
 * Batch synchronize fertilizations from offline IndexedDB (FR-3)
 * @param {string} farmerId
 * @param {Array<Object>} items
 */
const syncFertilizations = async (farmerId, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Data sinkronisasi harus berupa array yang tidak kosong.');
    error.statusCode = 400;
    throw error;
  }

  const result = await fertilizationsModel.syncBatchFertilizations(items);
  return result;
};

module.exports = {
  getFarmerSchedule,
  completeSchedule,
  syncFertilizations,
};

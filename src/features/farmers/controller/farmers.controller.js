const farmersService = require('../service/farmers.service');
const { successResponse } = require('../../../utils/response');

/**
 * Get all farmers (Admin)
 */
const getAllFarmers = async (req, res, next) => {
  try {
    const farmers = await farmersService.getAllFarmers();
    return successResponse(res, 'Berhasil mengambil daftar akun petani.', farmers);
  } catch (error) {
    next(error);
  }
};

/**
 * Get farmer by ID (Admin)
 */
const getFarmerById = async (req, res, next) => {
  try {
    const farmer = await farmersService.getFarmerById(req.params.id);
    return successResponse(res, 'Berhasil mengambil detail akun petani.', farmer);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new farmer (Admin)
 */
const createFarmer = async (req, res, next) => {
  try {
    const newFarmer = await farmersService.createFarmer(req.body);
    return successResponse(res, 'Akun petani baru berhasil dibuat.', newFarmer, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update farmer by ID (Admin)
 */
const updateFarmer = async (req, res, next) => {
  try {
    const updated = await farmersService.updateFarmer(req.params.id, req.body);
    return successResponse(res, 'Data akun petani berhasil diperbarui.', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete farmer by ID (Admin)
 */
const deleteFarmer = async (req, res, next) => {
  try {
    await farmersService.deleteFarmer(req.params.id);
    return successResponse(res, 'Akun petani berhasil dihapus.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
};

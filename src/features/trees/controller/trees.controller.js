const treesService = require('../service/trees.service');
const { successResponse } = require('../../../utils/response');

/**
 * Add a new tree (Petani)
 */
const addTree = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const tree = await treesService.addTree(farmerId, req.body);
    return successResponse(res, 'Pohon berhasil ditambahkan dan jadwal pemupukan berhasil di-generate.', tree, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get trees owned by logged in farmer (Petani - FR-2)
 */
const getMyTrees = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const trees = await treesService.getMyTrees(farmerId);
    return successResponse(res, 'Berhasil mengambil ringkasan data pohon milik sendiri.', trees);
  } catch (error) {
    next(error);
  }
};

/**
 * Global trees recapitulation with query filters (Admin)
 */
const getAdminTrees = async (req, res, next) => {
  try {
    const trees = await treesService.getAdminTrees(req.query);
    return successResponse(res, 'Berhasil mengambil rekapitulasi pohon global.', trees);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single tree detail
 */
const getTreeById = async (req, res, next) => {
  try {
    const tree = await treesService.getTreeById(req.params.id);
    return successResponse(res, 'Berhasil mengambil detail pohon.', tree);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addTree,
  getMyTrees,
  getAdminTrees,
  getTreeById,
};

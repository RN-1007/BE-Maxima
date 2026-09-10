const treesModel = require('../model/trees.model');
const { DEFAULT_FERTILIZATION_PLAN, TREE_HEALTH } = require('../../../config/constants');

/**
 * Add a new tree and auto-generate fertilization schedule (FR-1)
 * @param {string} farmerId
 * @param {Object} payload
 */
const addTree = async (farmerId, { treeCode, plantingDate, locationBlock, variety, coordinates }) => {
  if (!treeCode || !plantingDate) {
    const error = new Error('ID Pohon (treeCode) dan Tanggal Ditanam (plantingDate) wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  const existingTree = await treesModel.findTreeByCode(treeCode);
  if (existingTree) {
    const error = new Error(`Pohon dengan ID/Kode '${treeCode}' sudah terdaftar.`);
    error.statusCode = 409;
    throw error;
  }

  const parsedPlantingDate = new Date(plantingDate);
  if (isNaN(parsedPlantingDate.getTime())) {
    const error = new Error('Format tanggal tanam tidak valid. Gunakan format YYYY-MM-DD.');
    error.statusCode = 400;
    throw error;
  }

  // FR-1: Otomatisasi Jadwal Rencana Pemupukan
  const fertilizationSchedules = DEFAULT_FERTILIZATION_PLAN.map((plan) => {
    const scheduled = new Date(parsedPlantingDate);
    scheduled.setDate(scheduled.getDate() + plan.dayOffset);
    return {
      scheduledDate: scheduled,
      fertilizerType: plan.type,
      notes: plan.notes,
    };
  });

  const newTree = await treesModel.createTreeWithFertilizations(
    {
      treeCode,
      farmerId,
      plantingDate: parsedPlantingDate,
      locationBlock: locationBlock || null,
      variety: variety || 'Jeruk Bali Merah',
      coordinates: coordinates || '7°37\'42"S 111°26\'18"E',
      healthStatus: TREE_HEALTH.HEALTHY,
    },
    fertilizationSchedules
  );

  return newTree;
};

/**
 * Admin add tree
 * @param {Object} payload
 */
const adminAddTree = async (payload) => {
  let targetFarmerId = payload.farmerId;
  if (!targetFarmerId) {
    const prisma = require('../../../config/database');
    const defaultFarmer = await prisma.user.findFirst({ where: { role: 'farmer' } });
    targetFarmerId = defaultFarmer ? defaultFarmer.id : payload.adminId;
  }
  return await addTree(targetFarmerId, payload);
};

/**
 * Admin update tree
 * @param {string} id
 * @param {Object} data
 */
const adminUpdateTree = async (id, { treeCode, locationBlock, variety, coordinates, healthStatus }) => {
  const tree = await treesModel.findTreeById(id);
  if (!tree) {
    const error = new Error('Pohon tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};
  if (treeCode) updateData.treeCode = treeCode;
  if (locationBlock !== undefined) updateData.locationBlock = locationBlock;
  if (variety !== undefined) updateData.variety = variety;
  if (coordinates !== undefined) updateData.coordinates = coordinates;
  if (healthStatus) updateData.healthStatus = healthStatus;

  return await treesModel.updateTree(id, updateData);
};

/**
 * Admin delete tree
 * @param {string} id
 */
const adminDeleteTree = async (id) => {
  const tree = await treesModel.findTreeById(id);
  if (!tree) {
    const error = new Error('Pohon tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }
  await treesModel.deleteTree(id);
  return { message: `Pohon '${tree.treeCode}' berhasil dihapus.` };
};

/**
 * Get trees owned by logged in farmer (FR-2 Data Isolation)
 * @param {string} farmerId
 */
const getMyTrees = async (farmerId) => {
  const trees = await treesModel.findTreesByFarmerId(farmerId);
  const now = new Date();

  // Calculate age for each tree in days and months
  return trees.map((tree) => {
    const ageInDays = Math.max(0, Math.floor((now - new Date(tree.plantingDate)) / (1000 * 60 * 60 * 24)));
    const ageInMonths = +(ageInDays / 30.4375).toFixed(1);
    return {
      ...tree,
      ageInDays,
      ageInMonths,
    };
  });
};

/**
 * Global recap of all trees for Admin with query filters
 * @param {Object} query
 */
const getAdminTrees = async ({ farmer_id, health_status, age }) => {
  const whereClause = {};

  if (farmer_id) {
    whereClause.farmerId = farmer_id;
  }

  if (health_status) {
    whereClause.healthStatus = health_status;
  }

  if (age) {
    const ageDays = parseInt(age, 10);
    if (!isNaN(ageDays)) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - ageDays);
      whereClause.plantingDate = {
        lte: targetDate,
      };
    }
  }

  const trees = await treesModel.findAllTrees(whereClause);
  const now = new Date();

  return trees.map((tree) => {
    const ageInDays = Math.max(0, Math.floor((now - new Date(tree.plantingDate)) / (1000 * 60 * 60 * 24)));
    const ageInMonths = +(ageInDays / 30.4375).toFixed(1);
    return {
      ...tree,
      ageInDays,
      ageInMonths,
    };
  });
};

/**
 * Get tree detail by ID
 * @param {string} id
 */
const getTreeById = async (id) => {
  const tree = await treesModel.findTreeById(id);
  if (!tree) {
    const error = new Error('Pohon tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }
  const now = new Date();
  const ageInDays = Math.max(0, Math.floor((now - new Date(tree.plantingDate)) / (1000 * 60 * 60 * 24)));
  const ageInMonths = +(ageInDays / 30.4375).toFixed(1);
  return {
    ...tree,
    ageInDays,
    ageInMonths,
  };
};

module.exports = {
  addTree,
  adminAddTree,
  adminUpdateTree,
  adminDeleteTree,
  getMyTrees,
  getAdminTrees,
  getTreeById,
};

const prisma = require('../../../config/database');

/**
 * Create tree and automatically generate fertilization schedule (FR-1)
 * within a database transaction
 * @param {Object} treeData
 * @param {Array<Object>} fertilizationSchedules
 */
const createTreeWithFertilizations = async (treeData, fertilizationSchedules) => {
  return await prisma.$transaction(async (tx) => {
    const createdTree = await tx.tree.create({
      data: treeData,
    });

    if (fertilizationSchedules && fertilizationSchedules.length > 0) {
      const scheduleRecords = fertilizationSchedules.map((schedule) => ({
        treeId: createdTree.id,
        scheduledDate: schedule.scheduledDate,
        fertilizerType: schedule.fertilizerType,
        notes: schedule.notes || null,
        status: 'Pending',
        isSynced: true,
      }));

      await tx.fertilization.createMany({
        data: scheduleRecords,
      });
    }

    return await tx.tree.findUnique({
      where: { id: createdTree.id },
      include: {
        fertilizations: {
          orderBy: { scheduledDate: 'asc' },
        },
      },
    });
  });
};

/**
 * Find tree by tree code
 * @param {string} treeCode
 */
const findTreeByCode = async (treeCode) => {
  return await prisma.tree.findUnique({
    where: { treeCode },
  });
};

/**
 * Find tree by ID
 * @param {string} id
 */
const findTreeById = async (id) => {
  return await prisma.tree.findUnique({
    where: { id },
    include: {
      farmer: {
        select: {
          id: true,
          name: true,
          location: true,
          email: true,
        },
      },
      fertilizations: {
        orderBy: { scheduledDate: 'asc' },
      },
      aiLogs: {
        orderBy: { detectedAt: 'desc' },
      },
    },
  });
};

/**
 * Find trees owned by a specific farmer (FR-2 Data Isolation)
 * @param {string} farmerId
 */
const findTreesByFarmerId = async (farmerId) => {
  return await prisma.tree.findMany({
    where: { farmerId },
    include: {
      _count: {
        select: {
          fertilizations: true,
          aiLogs: true,
          harvests: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Find all trees with filter criteria for Admin
 * @param {Object} filters
 * @param {string} [filters.farmerId]
 * @param {string} [filters.healthStatus]
 */
const findAllTrees = async (whereClause) => {
  return await prisma.tree.findMany({
    where: whereClause,
    include: {
      farmer: {
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
        },
      },
      _count: {
        select: {
          fertilizations: true,
          aiLogs: true,
          harvests: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Update tree health status
 * @param {string} id
 * @param {string} healthStatus "Sehat" | "Sakit"
 */
const updateTreeHealth = async (id, healthStatus) => {
  return await prisma.tree.update({
    where: { id },
    data: { healthStatus },
  });
};

module.exports = {
  createTreeWithFertilizations,
  findTreeByCode,
  findTreeById,
  findTreesByFarmerId,
  findAllTrees,
  updateTreeHealth,
};

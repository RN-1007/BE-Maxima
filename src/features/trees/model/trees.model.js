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
 * Find trees owned by a specific farmer (FR-2 Data Isolation) (supports pagination & filter)
 * @param {string} farmerId
 * @param {Object} [options]
 * @param {number} [options.skip]
 * @param {number} [options.take]
 * @param {string} [options.healthStatus]
 * @param {string} [options.search]
 */
const findTreesByFarmerId = async (farmerId, options = {}) => {
  const { skip, take, healthStatus, search } = options;
  const whereClause = { farmerId };

  if (healthStatus) {
    whereClause.healthStatus = healthStatus;
  }

  if (search) {
    whereClause.OR = [
      { treeCode: { contains: search, mode: 'insensitive' } },
      { locationBlock: { contains: search, mode: 'insensitive' } },
      { variety: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await prisma.$transaction([
    prisma.tree.count({ where: whereClause }),
    prisma.tree.findMany({
      where: whereClause,
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
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    }),
  ]);

  return { total, items };
};

/**
 * Find all trees with filter criteria for Admin (supports pagination)
 * @param {Object} whereClause
 * @param {Object} [pagination]
 * @param {number} [pagination.skip]
 * @param {number} [pagination.take]
 */
const findAllTrees = async (whereClause = {}, pagination = {}) => {
  const { skip, take } = pagination;

  const [total, items] = await prisma.$transaction([
    prisma.tree.count({ where: whereClause }),
    prisma.tree.findMany({
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
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    }),
  ]);

  return { total, items };
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

/**
 * Update tree details
 * @param {string} id
 * @param {Object} data
 */
const updateTree = async (id, data) => {
  return await prisma.tree.update({
    where: { id },
    data,
    include: {
      farmer: {
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
        },
      },
    },
  });
};

/**
 * Delete tree by id
 * @param {string} id
 */
const deleteTree = async (id) => {
  return await prisma.tree.delete({
    where: { id },
  });
};

module.exports = {
  createTreeWithFertilizations,
  findTreeByCode,
  findTreeById,
  findTreesByFarmerId,
  findAllTrees,
  updateTreeHealth,
  updateTree,
  deleteTree,
};

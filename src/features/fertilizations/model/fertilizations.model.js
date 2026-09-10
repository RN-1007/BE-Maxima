const prisma = require('../../../config/database');
const { FERTILIZATION_STATUS } = require('../../../config/constants');

/**
 * Get fertilization schedules for a farmer
 * @param {string} farmerId
 * @param {Object} [filter]
 */
const findSchedulesByFarmerId = async (farmerId, filter = {}) => {
  const whereClause = {
    tree: {
      farmerId,
    },
  };

  if (filter.status) {
    whereClause.status = filter.status;
  }

  if (filter.startDate || filter.endDate) {
    whereClause.scheduledDate = {};
    if (filter.startDate) {
      whereClause.scheduledDate.gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      whereClause.scheduledDate.lte = new Date(filter.endDate);
    }
  }

  return await prisma.fertilization.findMany({
    where: whereClause,
    include: {
      tree: {
        select: {
          id: true,
          treeCode: true,
          locationBlock: true,
          healthStatus: true,
          plantingDate: true,
        },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  });
};

/**
 * Find fertilization by ID
 * @param {string} id
 */
const findFertilizationById = async (id) => {
  return await prisma.fertilization.findUnique({
    where: { id },
    include: {
      tree: true,
    },
  });
};

/**
 * Mark fertilization as completed
 * @param {string} id
 * @param {Date} actualDate
 * @param {string} [notes]
 */
const markCompleted = async (id, actualDate = new Date(), notes) => {
  return await prisma.fertilization.update({
    where: { id },
    data: {
      status: FERTILIZATION_STATUS.COMPLETED,
      actualDate,
      ...(notes !== undefined ? { notes } : {}),
    },
    include: {
      tree: true,
    },
  });
};

/**
 * Batch synchronize fertilizations from offline storage (FR-3)
 * @param {Array<Object>} items
 */
const syncBatchFertilizations = async (items) => {
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  for (const item of items) {
    try {
      if (item.id) {
        // Check if record already exists on server
        const existing = await prisma.fertilization.findUnique({
          where: { id: item.id },
        });

        if (existing) {
          await prisma.fertilization.update({
            where: { id: item.id },
            data: {
              status: item.status || FERTILIZATION_STATUS.COMPLETED,
              actualDate: item.actualDate ? new Date(item.actualDate) : new Date(),
              notes: item.notes || existing.notes,
              isSynced: true,
            },
          });
          results.updated++;
          continue;
        }
      }

      // If no ID or ID not found, check treeId
      if (!item.treeId || !item.fertilizerType) {
        results.failed++;
        results.errors.push(`Item tanpa treeId atau fertilizerType valid: ${JSON.stringify(item)}`);
        continue;
      }

      await prisma.fertilization.create({
        data: {
          id: item.id || undefined,
          treeId: item.treeId,
          scheduledDate: item.scheduledDate ? new Date(item.scheduledDate) : new Date(),
          actualDate: item.actualDate ? new Date(item.actualDate) : new Date(),
          fertilizerType: item.fertilizerType,
          status: item.status || FERTILIZATION_STATUS.COMPLETED,
          notes: item.notes || null,
          isSynced: true,
        },
      });
      results.created++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Gagal memproses item: ${err.message}`);
    }
  }

  return results;
};

/**
 * Get all fertilization schedules (Admin)
 * @param {Object} [filter]
 */
const findAllSchedules = async (filter = {}) => {
  const whereClause = {};

  if (filter.status) {
    whereClause.status = filter.status;
  }

  if (filter.farmerId) {
    whereClause.tree = {
      farmerId: filter.farmerId,
    };
  }

  if (filter.treeId) {
    whereClause.treeId = filter.treeId;
  }

  return await prisma.fertilization.findMany({
    where: whereClause,
    include: {
      tree: {
        select: {
          id: true,
          treeCode: true,
          locationBlock: true,
          healthStatus: true,
          variety: true,
          farmer: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  });
};

module.exports = {
  findSchedulesByFarmerId,
  findAllSchedules,
  findFertilizationById,
  markCompleted,
  syncBatchFertilizations,
};

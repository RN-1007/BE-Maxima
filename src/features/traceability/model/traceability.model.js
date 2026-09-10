const prisma = require('../../../config/database');

/**
 * Find full trace details for a given batch ID
 * @param {string} batchId
 */
const findTraceByBatchId = async (batchId) => {
  return await prisma.harvest.findUnique({
    where: { batchId },
    include: {
      farmer: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
      tree: {
        include: {
          aiLogs: {
            orderBy: { detectedAt: 'asc' },
          },
          fertilizations: {
            orderBy: { scheduledDate: 'asc' },
          },
        },
      },
    },
  });
};

/**
 * Find full trace details for a given tree code
 * @param {string} treeCode
 */
const findTraceByTreeCode = async (treeCode) => {
  return await prisma.tree.findUnique({
    where: { treeCode },
    include: {
      farmer: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
      aiLogs: {
        orderBy: { detectedAt: 'asc' },
      },
      fertilizations: {
        orderBy: { scheduledDate: 'asc' },
      },
      harvests: {
        where: { status: 'Verified' },
        orderBy: { harvestDate: 'desc' },
        take: 1,
      },
    },
  });
};

module.exports = {
  findTraceByBatchId,
  findTraceByTreeCode,
};

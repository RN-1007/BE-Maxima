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

module.exports = {
  findTraceByBatchId,
};

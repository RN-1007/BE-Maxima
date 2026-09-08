const prisma = require('../../../config/database');

/**
 * Save AI detection log and update tree health status in transaction (FR-5)
 * @param {Object} logData
 * @param {string} newTreeStatus "Sehat" | "Sakit"
 */
const createAiLogAndUpdateTree = async (logData, newTreeStatus) => {
  return await prisma.$transaction(async (tx) => {
    const aiLog = await tx.aiLog.create({
      data: logData,
    });

    if (newTreeStatus) {
      await tx.tree.update({
        where: { id: logData.treeId },
        data: { healthStatus: newTreeStatus },
      });
    }

    return aiLog;
  });
};

/**
 * Batch insert AI logs from offline sync (FR-3)
 * @param {Array<Object>} logs
 */
const batchInsertAiLogs = async (logs) => {
  return await prisma.$transaction(async (tx) => {
    const inserted = [];
    for (const item of logs) {
      const created = await tx.aiLog.create({
        data: {
          treeId: item.treeId,
          farmerId: item.farmerId,
          photoUrl: item.photoUrl || '/uploads/leaves/placeholder.jpg',
          result: item.result || 'Hasil Deteksi Offline',
          confidence: parseFloat(item.confidence) || 90.0,
          isSick: Boolean(item.isSick),
          detectedAt: item.detectedAt ? new Date(item.detectedAt) : new Date(),
        },
      });

      // Update tree health status accordingly
      const newStatus = item.isSick ? 'Sakit' : 'Sehat';
      await tx.tree.update({
        where: { id: item.treeId },
        data: { healthStatus: newStatus },
      });

      inserted.push(created);
    }
    return inserted;
  });
};

/**
 * Get all AI detection logs for Admin
 * @param {Object} [filter]
 */
const findAllAiLogs = async (filter = {}) => {
  const whereClause = {};
  if (filter.isSick !== undefined) {
    whereClause.isSick = filter.isSick === 'true' || filter.isSick === true;
  }
  if (filter.treeId) {
    whereClause.treeId = filter.treeId;
  }
  if (filter.farmerId) {
    whereClause.farmerId = filter.farmerId;
  }

  return await prisma.aiLog.findMany({
    where: whereClause,
    include: {
      tree: {
        select: {
          id: true,
          treeCode: true,
          locationBlock: true,
          healthStatus: true,
        },
      },
      farmer: {
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
        },
      },
    },
    orderBy: { detectedAt: 'desc' },
  });
};

/**
 * Get AI logs for a specific tree
 * @param {string} treeId
 */
const findAiLogsByTreeId = async (treeId) => {
  return await prisma.aiLog.findMany({
    where: { treeId },
    orderBy: { detectedAt: 'desc' },
  });
};

module.exports = {
  createAiLogAndUpdateTree,
  batchInsertAiLogs,
  findAllAiLogs,
  findAiLogsByTreeId,
};

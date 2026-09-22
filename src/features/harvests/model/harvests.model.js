const prisma = require('../../../config/database');
const { HARVEST_STATUS } = require('../../../config/constants');

/**
 * Create a new harvest report (Petani)
 * @param {Object} data
 */
const createHarvestReport = async (data) => {
  return await prisma.harvest.create({
    data: {
      ...data,
      status: HARVEST_STATUS.PENDING,
    },
    include: {
      tree: {
        select: {
          id: true,
          treeCode: true,
          locationBlock: true,
          healthStatus: true,
        },
      },
    },
  });
};

/**
 * Find harvest report by ID
 * @param {string} id
 */
const findHarvestById = async (id) => {
  return await prisma.harvest.findUnique({
    where: { id },
    include: {
      tree: {
        include: {
          farmer: true,
          aiLogs: {
            orderBy: { detectedAt: 'desc' },
          },
          fertilizations: {
            orderBy: { scheduledDate: 'asc' },
          },
        },
      },
      farmer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          location: true,
        },
      },
    },
  });
};

/**
 * Find all harvest reports for Admin with optional status filter (supports pagination)
 * @param {Object} [filter]
 * @param {Object} [pagination]
 * @param {number} [pagination.skip]
 * @param {number} [pagination.take]
 */
const findAllHarvests = async (filter = {}, pagination = {}) => {
  const { skip, take } = pagination;
  const whereClause = {};
  if (filter.status) {
    whereClause.status = filter.status;
  }
  if (filter.farmerId || filter.farmer_id) {
    whereClause.farmerId = filter.farmerId || filter.farmer_id;
  }
  if (filter.treeId || filter.tree_id) {
    whereClause.treeId = filter.treeId || filter.tree_id;
  }

  const [total, items] = await prisma.$transaction([
    prisma.harvest.count({ where: whereClause }),
    prisma.harvest.findMany({
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
            location: true,
            email: true,
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
 * Find harvest by batch ID (Used by traceability)
 * @param {string} batchId
 */
const findHarvestByBatchId = async (batchId) => {
  return await prisma.harvest.findUnique({
    where: { batchId },
    include: {
      tree: {
        include: {
          farmer: true,
          aiLogs: {
            orderBy: { detectedAt: 'desc' },
          },
          fertilizations: {
            where: { status: 'Selesai Dipupuk' },
            orderBy: { actualDate: 'asc' },
          },
        },
      },
      farmer: true,
    },
  });
};

/**
 * Update harvest to verified status with batch ID and QR PDF path (FR-4)
 * @param {string} id
 * @param {Object} updatePayload
 */
const verifyHarvestAndSetBatch = async (id, { batchId, qrPdfPath, verifiedAt = new Date() }) => {
  return await prisma.harvest.update({
    where: { id },
    data: {
      status: HARVEST_STATUS.VERIFIED,
      batchId,
      qrPdfPath,
      verifiedAt,
    },
    include: {
      tree: true,
      farmer: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
  });
};

module.exports = {
  createHarvestReport,
  findHarvestById,
  findAllHarvests,
  findHarvestByBatchId,
  verifyHarvestAndSetBatch,
};

const prisma = require('../../../config/database');
const { ROLES } = require('../../../config/constants');

/**
 * Get all farmers with their profile and tree summary (supports pagination & search)
 * @param {Object} [options]
 * @param {number} [options.skip]
 * @param {number} [options.take]
 * @param {string} [options.search]
 */
const findAllFarmers = async (options = {}) => {
  const { skip, take, search } = options;
  const whereClause = {
    role: ROLES.FARMER,
  };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await prisma.$transaction([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            trees: true,
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
 * Find farmer by ID
 * @param {string} id
 */
const findFarmerById = async (id) => {
  return await prisma.user.findFirst({
    where: {
      id,
      role: ROLES.FARMER,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      location: true,
      createdAt: true,
      updatedAt: true,
      trees: {
        select: {
          id: true,
          treeCode: true,
          healthStatus: true,
          plantingDate: true,
        },
      },
    },
  });
};

/**
 * Create a new farmer account
 * @param {Object} data
 */
const createFarmer = async (data) => {
  return await prisma.user.create({
    data: {
      ...data,
      role: ROLES.FARMER,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      location: true,
      createdAt: true,
    },
  });
};

/**
 * Update farmer account by ID
 * @param {string} id
 * @param {Object} data
 */
const updateFarmer = async (id, data) => {
  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      location: true,
      updatedAt: true,
    },
  });
};

/**
 * Delete farmer account by ID
 * @param {string} id
 */
const deleteFarmer = async (id) => {
  return await prisma.user.delete({
    where: { id },
  });
};

module.exports = {
  findAllFarmers,
  findFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
};

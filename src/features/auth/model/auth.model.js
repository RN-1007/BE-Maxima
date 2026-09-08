const prisma = require('../../../config/database');

/**
 * Find user by email
 * @param {string} email
 */
const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Find user by ID
 * @param {string} id
 */
const findUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      location: true,
      createdAt: true,
    },
  });
};

module.exports = {
  findUserByEmail,
  findUserById,
};

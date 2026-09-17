const prisma = require('../../../config/database');

/**
 * Find user by username or email
 * @param {string} identifier
 */
const findUserByUsernameOrEmail = async (identifier) => {
  return await prisma.user.findFirst({
    where: {
      OR: [
        { username: identifier },
        { email: identifier }
      ]
    },
  });
};

/**
 * Find user by email
 * @param {string} email
 */
const findUserByEmail = async (email) => {
  return await prisma.user.findFirst({
    where: { email },
  });
};

/**
 * Find user by username
 * @param {string} username
 */
const findUserByUsername = async (username) => {
  return await prisma.user.findFirst({
    where: { username },
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

module.exports = {
  findUserByUsernameOrEmail,
  findUserByEmail,
  findUserByUsername,
  findUserById,
};

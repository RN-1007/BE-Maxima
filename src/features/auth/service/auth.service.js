const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('../model/auth.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../../config/env');

/**
 * Authenticate user and generate JWT token
 * @param {string} identifier - Email or Username
 * @param {string} password
 */
const login = async (identifier, password) => {
  if (!identifier || !password) {
    const error = new Error('Username / Email dan kata sandi wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  const user = await authModel.findUserByUsernameOrEmail(identifier);
  if (!user) {
    const error = new Error('Kombinasi username/email atau kata sandi tidak valid.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Kombinasi username/email atau kata sandi tidak valid.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      location: user.location,
    },
  };
};

const getMe = async (userId) => {
  const user = await authModel.findUserById(userId);
  if (!user) {
    const error = new Error('Pengguna tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

module.exports = {
  login,
  getMe,
};

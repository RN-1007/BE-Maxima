const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('../model/auth.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../../config/env');

/**
 * Authenticate user and generate JWT token
 * @param {string} email
 * @param {string} password
 */
const login = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Email dan kata sandi wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  const user = await authModel.findUserByEmail(email);
  if (!user) {
    const error = new Error('Kombinasi email atau kata sandi tidak valid.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Kombinasi email atau kata sandi tidak valid.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      id: user.id,
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

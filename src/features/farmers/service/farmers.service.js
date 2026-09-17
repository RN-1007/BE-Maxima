const bcrypt = require('bcryptjs');
const farmersModel = require('../model/farmers.model');
const authModel = require('../../auth/model/auth.model');

/**
 * Get list of all farmers
 */
const getAllFarmers = async () => {
  return await farmersModel.findAllFarmers();
};

/**
 * Get farmer detail by ID
 * @param {string} id
 */
const getFarmerById = async (id) => {
  const farmer = await farmersModel.findFarmerById(id);
  if (!farmer) {
    const error = new Error('Akun petani tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }
  return farmer;
};

/**
 * Create new farmer account
 * @param {Object} data
 */
const createFarmer = async ({ username, email, password, name, phone, location }) => {
  const userIdentifier = username || email;
  if (!userIdentifier || !password || !name) {
    const error = new Error('Username, kata sandi, dan nama petani wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  // Check username if provided
  if (username) {
    const existingUser = await authModel.findUserByUsername(username);
    if (existingUser) {
      const error = new Error('Username sudah terdaftar. Gunakan username lain.');
      error.statusCode = 409;
      throw error;
    }
  }

  // Check email if provided
  if (email) {
    const existingEmail = await authModel.findUserByEmail(email);
    if (existingEmail) {
      const error = new Error('Email sudah terdaftar. Gunakan email lain.');
      error.statusCode = 409;
      throw error;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return await farmersModel.createFarmer({
    username: username || null,
    email: email || null,
    password: hashedPassword,
    name,
    phone,
    location,
  });
};

/**
 * Update farmer account
 * @param {string} id
 * @param {Object} updateData
 */
const updateFarmer = async (id, { username, email, password, name, phone, location }) => {
  const existingFarmer = await farmersModel.findFarmerById(id);
  if (!existingFarmer) {
    const error = new Error('Akun petani tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  const dataToUpdate = {};
  if (name !== undefined) dataToUpdate.name = name;
  if (phone !== undefined) dataToUpdate.phone = phone;
  if (location !== undefined) dataToUpdate.location = location;

  if (username && username !== existingFarmer.username) {
    const userTaken = await authModel.findUserByUsername(username);
    if (userTaken) {
      const error = new Error('Username sudah digunakan oleh akun lain.');
      error.statusCode = 409;
      throw error;
    }
    dataToUpdate.username = username;
  }

  if (email && email !== existingFarmer.email) {
    const emailTaken = await authModel.findUserByEmail(email);
    if (emailTaken) {
      const error = new Error('Email sudah digunakan oleh akun lain.');
      error.statusCode = 409;
      throw error;
    }
    dataToUpdate.email = email;
  }

  if (password) {
    dataToUpdate.password = await bcrypt.hash(password, 10);
  }

  return await farmersModel.updateFarmer(id, dataToUpdate);
};

/**
 * Delete farmer account
 * @param {string} id
 */
const deleteFarmer = async (id) => {
  const existingFarmer = await farmersModel.findFarmerById(id);
  if (!existingFarmer) {
    const error = new Error('Akun petani tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }
  await farmersModel.deleteFarmer(id);
  return true;
};

module.exports = {
  getAllFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
};

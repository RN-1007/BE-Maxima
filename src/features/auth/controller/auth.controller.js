const authService = require('../service/auth.service');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Handle user login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return successResponse(res, 'Login berhasil.', result);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user.id);
    return successResponse(res, 'Berhasil mengambil profil pengguna.', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
};

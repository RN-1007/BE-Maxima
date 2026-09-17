const authService = require('../service/auth.service');
const { successResponse, errorResponse } = require('../../../utils/response');

/**
 * Handle user login
 */
const login = async (req, res, next) => {
  try {
    const { username, email, identifier, password } = req.body;
    const loginIdentifier = username || email || identifier;
    const result = await authService.login(loginIdentifier, password);
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

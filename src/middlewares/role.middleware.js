const { errorResponse } = require('../utils/response');

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles Roles that have access (e.g. 'admin', 'farmer')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Pengguna belum terautentikasi.', 401);
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const formattedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (!formattedAllowed.includes(userRole)) {
      return errorResponse(
        res,
        `Akses terlarang. Diperlukan peran: ${allowedRoles.join(' atau ')}.`,
        403
      );
    }

    next();
  };
};

module.exports = {
  requireRole,
};

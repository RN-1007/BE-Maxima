const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const prisma = require('../config/database');
const { errorResponse } = require('../utils/response');

/**
 * Authentication Middleware
 * Validates JWT token from Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Akses ditolak. Token tidak disediakan atau format salah.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        location: true,
        phone: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'Pengguna tidak ditemukan atau sesi sudah tidak berlaku.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token sudah kadaluarsa. Silakan login kembali.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Token tidak valid.', 401);
    }
    return errorResponse(res, 'Kesalahan pada otentikasi token.', 500, error.message);
  }
};

module.exports = {
  authenticateToken,
};

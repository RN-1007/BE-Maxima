/**
 * Standard API Response Formatter
 */
const successResponse = (res, message, data = null, statusCode = 200, meta = undefined) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta !== undefined) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
};

const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};

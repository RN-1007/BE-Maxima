/**
 * Parse pagination query parameters
 * Supports ?page=1&limit=10, ?page=1&pageSize=10, ?page=1&per_page=10, etc.
 * 
 * @param {Object} query - Express req.query
 * @param {Object} [defaults] - Default pagination values
 * @param {number} [defaults.page=1]
 * @param {number} [defaults.limit=10]
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPaginationParams = (query = {}, defaults = { page: 1, limit: 10 }) => {
  let page = parseInt(query.page || query.pageNumber, 10);
  let limit = parseInt(query.limit || query.pageSize || query.perPage || query.per_page, 10);

  if (isNaN(page) || page < 1) {
    page = defaults.page || 1;
  } else if (page > 100000) {
    page = 100000; // Prevent integer overflow and excessive DB offset
  }

  if (isNaN(limit) || limit < 1) {
    limit = defaults.limit || 10;
  } else if (limit > 100) {
    limit = 100; // Prevent resource exhaustion
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Format standard pagination response metadata
 * 
 * @param {number} totalItems - Total matching items count
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {{ page: number, limit: number, totalItems: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean }}
 */
const formatPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = {
  getPaginationParams,
  formatPaginationMeta,
};

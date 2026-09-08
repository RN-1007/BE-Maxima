const traceabilityService = require('../service/traceability.service');
const { successResponse } = require('../../../utils/response');

/**
 * Public consumer endpoint to scan & trace batch journey
 */
const traceBatch = async (req, res, next) => {
  try {
    const { batch_id } = req.params;
    const result = await traceabilityService.traceBatchJourney(batch_id);

    if (!result.passed) {
      // Return 200 with clear warning status, or can return specific message
      return res.status(200).json({
        success: false,
        warning: result.warning,
        message: result.message,
        data: {
          batchId: result.batchId,
          status: result.status,
        },
      });
    }

    return successResponse(res, 'Data penelusuran produk (Traceability Journey) berhasil ditemukan.', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  traceBatch,
};

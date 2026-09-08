const harvestsModel = require('../model/harvests.model');
const treesModel = require('../../trees/model/trees.model');
const { generateBatchQRPDF } = require('../../../utils/pdf.generator');
const { BASE_URL } = require('../../../config/env');

/**
 * Report harvest (Petani)
 * @param {string} farmerId
 * @param {Object} payload
 */
const reportHarvest = async (farmerId, { treeId, harvestDate, estimatedFruits, notes }) => {
  if (!treeId || !harvestDate) {
    const error = new Error('treeId dan harvestDate wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  const tree = await treesModel.findTreeById(treeId);
  if (!tree) {
    const error = new Error('Pohon tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  if (tree.farmerId !== farmerId) {
    const error = new Error('Akses ditolak. Pohon ini bukan milik Anda.');
    error.statusCode = 403;
    throw error;
  }

  const parsedHarvestDate = new Date(harvestDate);
  if (isNaN(parsedHarvestDate.getTime())) {
    const error = new Error('Format harvestDate tidak valid. Gunakan format YYYY-MM-DD.');
    error.statusCode = 400;
    throw error;
  }

  return await harvestsModel.createHarvestReport({
    treeId,
    farmerId,
    harvestDate: parsedHarvestDate,
    estimatedFruits: estimatedFruits ? parseInt(estimatedFruits, 10) : 0,
    notes: notes || null,
  });
};

/**
 * Get all harvest reports (Admin)
 * @param {Object} query
 */
const getAllHarvests = async (query = {}) => {
  return await harvestsModel.findAllHarvests(query);
};

/**
 * Verify harvest and generate QR code sticker PDF (Admin - FR-4)
 * @param {string} harvestId
 * @param {Object} options
 */
const verifyAndGenerateQR = async (harvestId, options = {}) => {
  const harvest = await harvestsModel.findHarvestById(harvestId);
  if (!harvest) {
    const error = new Error('Laporan panen tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  // Format date for batch ID string
  const harvestDateObj = new Date(harvest.harvestDate);
  const formattedDate = harvestDateObj.toISOString().split('T')[0].replace(/-/g, '');
  const cleanTreeCode = (harvest.tree.treeCode || 'TREE').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  // FR-4: Kombinasi ID Pohon + Tanggal Panen (Batch ID)
  const batchId = `BATCH-${cleanTreeCode}-${formattedDate}-${randomSuffix}`;

  // URL di dalam QR bersifat statis merujuk ke endpoint trace produk
  const traceUrl = `${BASE_URL}/api/public/trace/${batchId}`;

  // Generate PDF file berisi kumpulan stiker QR Code (FR-4)
  const qrPdfPath = await generateBatchQRPDF({
    batchId,
    treeCode: harvest.tree.treeCode,
    harvestDate: harvestDateObj.toISOString().split('T')[0],
    farmerName: harvest.farmer.name,
    location: harvest.farmer.location || 'Kebun Maxima',
    traceUrl,
    stickerCount: options.stickerCount || 6,
  });

  const updatedHarvest = await harvestsModel.verifyHarvestAndSetBatch(harvestId, {
    batchId,
    qrPdfPath,
    verifiedAt: new Date(),
  });

  return {
    ...updatedHarvest,
    traceUrl,
    pdfDownloadUrl: `${BASE_URL}/${qrPdfPath.replace(/\\/g, '/')}`,
  };
};

module.exports = {
  reportHarvest,
  getAllHarvests,
  verifyAndGenerateQR,
};

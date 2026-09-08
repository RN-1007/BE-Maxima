const traceabilityModel = require('../model/traceability.model');
const { FERTILIZATION_STATUS } = require('../../../config/constants');

/**
 * Trace product journey by Batch ID with AI Logic Gate
 * @param {string} batchId
 */
const traceBatchJourney = async (batchId) => {
  if (!batchId) {
    const error = new Error('Batch ID wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  const harvest = await traceabilityModel.findTraceByBatchId(batchId);
  if (!harvest) {
    const error = new Error(`Batch ID '${batchId}' tidak ditemukan atau belum terverifikasi.`);
    error.statusCode = 404;
    throw error;
  }

  const tree = harvest.tree;
  const plantingDate = new Date(tree.plantingDate);
  const harvestDate = new Date(harvest.harvestDate);

  // 1. Cek riwayat log AI pohon pada rentang tanggal tanam hingga panen
  const relevantAiLogs = (tree.aiLogs || []).filter((log) => {
    const logDate = new Date(log.detectedAt);
    return logDate >= plantingDate && logDate <= harvestDate;
  });

  // Urutkan dari terlama ke terbaru
  relevantAiLogs.sort((a, b) => new Date(a.detectedAt) - new Date(b.detectedAt));

  // Evaluasi status kesehatan pohon:
  // Cek apakah ada kejadian "Sakit"
  const sickLogs = relevantAiLogs.filter((log) => log.isSick);
  let isAiQualityStandardPassed = true;

  if (sickLogs.length > 0) {
    // Cari log sakit terakhir
    const latestSickLog = sickLogs[sickLogs.length - 1];
    const latestSickDate = new Date(latestSickLog.detectedAt);

    // Cek apakah ada log sesudahnya yang menyatakan sehat/pulih
    const recoveredLogs = relevantAiLogs.filter(
      (log) => new Date(log.detectedAt) > latestSickDate && !log.isSick
    );

    if (recoveredLogs.length === 0) {
      // Masih sakit atau belum terbukti pulih
      isAiQualityStandardPassed = false;
    }
  }

  // 2. Jika tidak memenuhi standar mutu AI: return peringatan dan sembunyikan detail lainnya
  if (!isAiQualityStandardPassed) {
    return {
      passed: false,
      batchId: harvest.batchId,
      warning: '⚠️ Peringatan: Produk Tidak Memenuhi Standar Mutu AI',
      message:
        'Produk dari batch ini teridentifikasi memiliki riwayat penyakit pohon yang belum terbukti pulih sebelum masa panen.',
      status: 'DITOLAK_MUTU_AI',
    };
  }

  // 3. Jika "Sehat", return data lengkap:
  // - Nama Petani
  // - Lokasi (Desa Bibis, dsb.)
  // - Tanggal Tanam
  // - Rekap jumlah pemupukan
  // - Tanggal verifikasi AI terakhir
  // - Tanggal Panen
  const lastAiVerification =
    relevantAiLogs.length > 0 ? relevantAiLogs[relevantAiLogs.length - 1] : null;

  const fertilizations = tree.fertilizations || [];
  const completedFertilizations = fertilizations.filter(
    (f) => f.status === FERTILIZATION_STATUS.COMPLETED
  );

  return {
    passed: true,
    batchId: harvest.batchId,
    treeCode: tree.treeCode,
    farmerName: harvest.farmer ? harvest.farmer.name : '-',
    location: harvest.farmer ? harvest.farmer.location : '-',
    plantingDate: tree.plantingDate,
    harvestDate: harvest.harvestDate,
    fertilizationSummary: {
      totalScheduled: fertilizations.length,
      totalCompleted: completedFertilizations.length,
      history: completedFertilizations.map((f) => ({
        fertilizerType: f.fertilizerType,
        actualDate: f.actualDate,
        notes: f.notes,
      })),
    },
    lastAiVerification: lastAiVerification
      ? {
          detectedAt: lastAiVerification.detectedAt,
          result: lastAiVerification.result,
          confidence: `${lastAiVerification.confidence}%`,
          status: 'Sehat / Layak Konsumsi',
        }
      : {
          status: 'Sehat (Pemeriksaan Awal)',
          note: 'Tidak ditemukan riwayat penyakit selama siklus tanam.',
        },
    estimatedFruits: harvest.estimatedFruits,
    verifiedAt: harvest.verifiedAt,
    qrPdfUrl: harvest.qrPdfPath ? `/${harvest.qrPdfPath.replace(/\\/g, '/')}` : null,
  };
};

module.exports = {
  traceBatchJourney,
};

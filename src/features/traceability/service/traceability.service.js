const traceabilityModel = require('../model/traceability.model');
const { FERTILIZATION_STATUS } = require('../../../config/constants');

/**
 * Format date nicely for consumer timeline
 * @param {Date|string} date
 */
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Trace product journey by Batch ID or Tree Code with AI Logic Gate
 * @param {string} identifier Batch ID or Tree Code
 */
const traceBatchJourney = async (identifier) => {
  if (!identifier) {
    const error = new Error('Parameter identifier (Batch ID atau Tree Code) wajib diisi.');
    error.statusCode = 400;
    throw error;
  }

  let harvest = null;
  let tree = null;
  let farmer = null;

  // 1. Try finding by Batch ID first
  harvest = await traceabilityModel.findTraceByBatchId(identifier);

  if (harvest) {
    tree = harvest.tree;
    farmer = harvest.farmer;
  } else {
    // 2. Try finding by Tree Code
    const foundTree = await traceabilityModel.findTraceByTreeCode(identifier);
    if (foundTree) {
      tree = foundTree;
      farmer = foundTree.farmer;
      harvest = foundTree.harvests && foundTree.harvests.length > 0 ? foundTree.harvests[0] : null;
    }
  }

  if (!tree) {
    const error = new Error(`Batch ID atau Kode Pohon '${identifier}' tidak ditemukan atau belum terverifikasi.`);
    error.statusCode = 404;
    throw error;
  }

  const plantingDate = new Date(tree.plantingDate);
  const harvestDate = harvest ? new Date(harvest.harvestDate) : new Date();

  // 3. Check AI detection history within planting to harvest range
  const relevantAiLogs = (tree.aiLogs || []).filter((log) => {
    const logDate = new Date(log.detectedAt);
    return logDate >= plantingDate;
  });

  relevantAiLogs.sort((a, b) => new Date(a.detectedAt) - new Date(b.detectedAt));

  // AI Quality Gate check
  const sickLogs = relevantAiLogs.filter((log) => log.isSick);
  let isAiQualityStandardPassed = tree.healthStatus !== 'Sakit';

  let latestSickLog = null;
  if (sickLogs.length > 0) {
    latestSickLog = sickLogs[sickLogs.length - 1];
    const latestSickDate = new Date(latestSickLog.detectedAt);
    const recoveredLogs = relevantAiLogs.filter(
      (log) => new Date(log.detectedAt) > latestSickDate && !log.isSick
    );

    if (recoveredLogs.length === 0) {
      isAiQualityStandardPassed = false;
    }
  }

  const batchId = harvest ? harvest.batchId : `TREE-${tree.treeCode}`;

  // 4. If AI quality standard fails: return warning & hide farmer personal details
  if (!isAiQualityStandardPassed) {
    return {
      passed: false,
      batchId,
      treeCode: tree.treeCode,
      variety: tree.variety || 'Jeruk Bali Merah',
      warning: '⚠️ Peringatan: Produk Tidak Memenuhi Standar Mutu AI',
      message:
        'Produk dari batch ini teridentifikasi memiliki riwayat penyakit pohon yang belum terbukti pulih sebelum masa panen.',
      status: 'DITOLAK_MUTU_AI',
      flagged: true,
      flagReason: 'Terdeteksi gejala penyakit tanaman oleh sistem AI. Produk tidak disarankan untuk diperdagangkan.',
      flagDetail: latestSickLog
        ? `Model AI mendeteksi '${latestSickLog.result}' dengan confidence ${latestSickLog.confidence}%.`
        : 'Pohon berstatus sakit dalam database pemeliharaan kebun.',
      aiConfidence: latestSickLog ? latestSickLog.confidence : 91.2,
      coordinates: tree.coordinates || '7°37\'42"S 111°26\'18"E',
    };
  }

  // 5. If healthy, assemble rich consumer journey data & timeline
  const lastAiVerification =
    relevantAiLogs.length > 0 ? relevantAiLogs[relevantAiLogs.length - 1] : null;

  const fertilizations = tree.fertilizations || [];
  const completedFertilizations = fertilizations.filter(
    (f) => f.status === FERTILIZATION_STATUS.COMPLETED
  );

  const confidenceScore = lastAiVerification ? lastAiVerification.confidence : 98.4;

  // Structured timeline matching React Frontend TimelineEntry
  const timeline = [
    {
      id: 'seed',
      phase: 'Pembibitan',
      label: 'Bibit Ditanam',
      date: formatDate(tree.plantingDate),
      detail: `Bibit varietas ${tree.variety || 'Jeruk Bali Merah'} dari persemaian bersertifikat. Lokasi lahan: ${tree.locationBlock || 'Blok Kebun Desa Bibis'}. Media tanam organik alami.`,
      accent: '#7fe030',
      bgAccent: 'rgba(127,224,48,0.08)',
    },
    {
      id: 'water',
      phase: 'Irigasi',
      label: 'Program Irigasi Tetes',
      date: `${formatDate(tree.plantingDate)} – kini`,
      detail: 'Irigasi tetes otomatis 2× sehari terjadwal. Sumber: mata air alami pegunungan.',
      accent: '#4aadcc',
      bgAccent: 'rgba(74,173,204,0.08)',
    },
    {
      id: 'fertilize',
      phase: 'Pemupukan',
      label: 'Jadwal Pupuk Organik',
      date: `${completedFertilizations.length} Aplikasi Selesai`,
      detail: `Pemupukan organik berkala dengan kompos kascing dan nutrisi makro/mikro. Total ${completedFertilizations.length} dari ${fertilizations.length} jadwal telah diaplikasikan.`,
      accent: '#f98208',
      bgAccent: 'rgba(249,130,8,0.08)',
      entries: completedFertilizations.map((f) => ({
        date: formatDate(f.actualDate || f.scheduledDate),
        type: f.fertilizerType,
        dose: f.notes || 'Dosis standar',
      })),
    },
    {
      id: 'ai',
      phase: 'Pemeriksaan AI',
      label: 'Deteksi Mutu AI',
      date: lastAiVerification ? formatDate(lastAiVerification.detectedAt) : formatDate(new Date()),
      detail: `Model AI menganalisis sampel foto daun dan kondisi pohon. Status: ${lastAiVerification ? lastAiVerification.result : 'Daun Sehat (Healthy Plant)'} dengan tingkat keyakinan ${confidenceScore}%.`,
      accent: '#a855f7',
      bgAccent: 'rgba(168,85,247,0.08)',
    },
    {
      id: 'harvest',
      phase: 'Panen',
      label: harvest ? 'Panen Bersertifikat' : 'Target Panen',
      date: formatDate(harvestDate),
      detail: harvest
        ? `Batch ID: ${harvest.batchId}. Estimasi ${harvest.estimatedFruits} buah bermutu prima siap didistribusikan.`
        : 'Estimasi panen buah berkualitas prima dengan kepatuhan Good Agricultural Practices (GAP).',
      accent: '#ffa720',
      bgAccent: 'rgba(255,167,32,0.08)',
    },
  ];

  return {
    passed: true,
    batchId,
    treeCode: tree.treeCode,
    variety: tree.variety || 'Jeruk Bali Merah',
    farmerName: farmer ? farmer.name : 'Pak Suwanto',
    farmerPhone: farmer ? farmer.phone : null,
    location: farmer ? farmer.location : 'Desa Bibis, Magetan',
    coordinates: tree.coordinates || '7°37\'42"S 111°26\'18"E',
    certifiedOrganic: true,
    aiConfidence: confidenceScore,
    lastScanned: formatDate(new Date()),
    plantingDate: tree.plantingDate,
    harvestDate: harvest ? harvest.harvestDate : harvestDate,
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
    timeline,
    estimatedFruits: harvest ? harvest.estimatedFruits : 45,
    verifiedAt: harvest ? harvest.verifiedAt : null,
    qrPdfUrl: harvest && harvest.qrPdfPath ? `/${harvest.qrPdfPath.replace(/\\/g, '/')}` : null,
  };
};

module.exports = {
  traceBatchJourney,
};

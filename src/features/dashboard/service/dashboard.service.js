const dashboardModel = require('../model/dashboard.model');

/**
 * Determine severity for AI detection logs
 * @param {boolean} isSick
 * @param {number} confidence
 * @param {string} result
 */
const determineSeverity = (isSick, confidence, result = '') => {
  if (!isSick) return 'low';
  const lower = result.toLowerCase();
  if (confidence >= 85 || lower.includes('kanker') || lower.includes('greening') || lower.includes('hlb')) {
    return 'high';
  }
  return 'medium';
};

/**
 * Get dashboard stat cards
 */
const getStats = async () => {
  const counts = await dashboardModel.getCounts();
  const healthyPercentage = counts.totalTrees > 0
    ? ((counts.healthyTrees / counts.totalTrees) * 100).toFixed(1)
    : '100.0';

  return {
    totalTrees: counts.totalTrees,
    healthyTrees: counts.healthyTrees,
    flaggedTrees: counts.flaggedTrees,
    healthyPercentage: `${healthyPercentage}%`,
    totalAiScans: counts.totalAiScans,
    totalFarmers: counts.totalFarmers,
    totalHarvests: counts.totalHarvests,
    statCards: [
      {
        label: 'Total Pohon',
        value: counts.totalTrees.toString(),
        sub: 'Pohon terdaftar',
        trend: 'up',
      },
      {
        label: 'Pohon Sehat',
        value: counts.healthyTrees.toString(),
        sub: `${healthyPercentage}% sehat`,
        trend: 'up',
      },
      {
        label: 'Terdeteksi Sakit',
        value: counts.flaggedTrees.toString(),
        sub: counts.flaggedTrees > 0 ? 'Perlu penanganan' : 'Kondisi prima',
        trend: counts.flaggedTrees > 0 ? 'down' : 'up',
      },
      {
        label: 'Total AI Scans',
        value: counts.totalAiScans.toString(),
        sub: 'Diagnosis foto daun',
        trend: 'up',
      },
    ],
  };
};

/**
 * Get monthly trend
 */
const getTrend = async () => {
  return await dashboardModel.getMonthlyTrend();
};

/**
 * Get full overview for dashboard
 */
const getOverview = async () => {
  const [stats, trend, rawAiLogs, rawFertilizations] = await Promise.all([
    getStats(),
    getTrend(),
    dashboardModel.getRecentAiLogs(5),
    dashboardModel.getUpcomingFertilizations(5),
  ]);

  const recentAiAlerts = rawAiLogs.map((log) => ({
    id: log.tree?.treeCode || `AI-${log.id.substring(0, 8)}`,
    treeId: log.treeId,
    batch: log.tree?.locationBlock || 'Blok Kebun',
    variety: log.tree?.variety || 'Jeruk Bali Merah',
    disease: log.result,
    confidence: log.confidence,
    isSick: log.isSick,
    severity: determineSeverity(log.isSick, log.confidence, log.result),
    time: log.detectedAt,
    photoUrl: log.photoUrl,
    farmerName: log.farmer?.name || 'Petani',
  }));

  const fertilizerSchedule = rawFertilizations.map((f) => ({
    id: f.id,
    treeCode: f.tree?.treeCode || 'PHN',
    batch: f.tree?.locationBlock || 'Blok Kebun',
    variety: f.tree?.variety || 'Jeruk Bali Merah',
    type: f.fertilizerType,
    date: f.scheduledDate,
    actualDate: f.actualDate,
    status: f.status === 'Selesai Dipupuk' ? 'done' : 'scheduled',
    notes: f.notes,
    farmerName: f.tree?.farmer?.name || 'Petani',
  }));

  return {
    stats,
    trend,
    recentAiAlerts,
    fertilizerSchedule,
  };
};

module.exports = {
  getStats,
  getTrend,
  getOverview,
};

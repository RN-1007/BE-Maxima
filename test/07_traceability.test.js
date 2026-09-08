const assert = require('assert');
const { startServer, stopServer } = require('./helpers');

async function testTraceability() {
  const { baseUrl } = await startServer();
  console.log('🧪 Running [07_TRACEABILITY] Tests...');

  try {
    // 1. Scan Batch Sehat (BATCH-BBS001-20260315 dari seeder)
    const healthyRes = await fetch(`${baseUrl}/api/public/trace/BATCH-BBS001-20260315`);
    const healthyData = await healthyRes.json();
    assert.strictEqual(healthyRes.status, 200);
    assert.strictEqual(healthyData.success, true);
    assert.strictEqual(healthyData.data.passed, true);
    assert.ok(healthyData.data.farmerName);
    assert.ok(healthyData.data.location);
    assert.ok(healthyData.data.fertilizationSummary);
    assert.ok(healthyData.data.lastAiVerification);
    console.log('  ✅ GET /api/public/trace/:batch_id (Batch Sehat - Riwayat Lengkap) passed');

    // 2. Scan Batch Pohon Sakit (BATCH-SICK-20260320 dari seeder) -> Gerbang Logika AI
    const sickRes = await fetch(`${baseUrl}/api/public/trace/BATCH-SICK-20260320`);
    const sickData = await sickRes.json();
    assert.strictEqual(sickRes.status, 200);
    assert.strictEqual(sickData.success, false);
    assert.strictEqual(sickData.warning, '⚠️ Peringatan: Produk Tidak Memenuhi Standar Mutu AI');
    assert.strictEqual(sickData.data.farmerName, undefined, 'Data detail harus disembunyikan!');
    console.log('  ✅ GET /api/public/trace/:batch_id (Gerbang Logika AI: Tolak Pohon Sakit) passed');

    // 3. Scan Batch Tidak Ditemukan
    const notFoundRes = await fetch(`${baseUrl}/api/public/trace/BATCH-TIDAK-ADA-9999`);
    assert.strictEqual(notFoundRes.status, 404);
    console.log('  ✅ GET /api/public/trace/:batch_id (Batch Tidak Ada 404) passed');

    console.log('🎉 [07_TRACEABILITY] Seluruh tes modul keterlacakan berhasil!\n');
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  testTraceability().catch((err) => {
    console.error('❌ Traceability test failed:', err);
    process.exit(1);
  });
}

module.exports = testTraceability;

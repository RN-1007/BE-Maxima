const testAuth = require('./01_auth.test');
const testFarmers = require('./02_farmers.test');
const testTrees = require('./03_trees.test');
const testFertilizations = require('./04_fertilizations.test');
const testAI = require('./05_ai.test');
const testHarvests = require('./06_harvests.test');
const testTraceability = require('./07_traceability.test');

const suites = [
  { name: '1. Authentication & Profil', fn: testAuth },
  { name: '2. Manajemen Petani (Admin)', fn: testFarmers },
  { name: '3. Pohon & Lahan (FR-1 & FR-2)', fn: testTrees },
  { name: '4. Jadwal Pemupukan & Offline Sync (FR-3)', fn: testFertilizations },
  { name: '5. Deteksi AI Gateway & Log (FR-5)', fn: testAI },
  { name: '6. Lapor Panen & Cetak QR PDF (FR-4)', fn: testHarvests },
  { name: '7. Scan Traceability & Gerbang Logika AI', fn: testTraceability },
];

async function runAllSuites() {
  console.log('\n======================================================');
  console.log('🏁 MEMULAI RUNNER SKEMA TEST LENGKAP BE-MAXIMA PER-API');
  console.log('======================================================\n');

  const startTime = Date.now();
  const results = [];

  for (const suite of suites) {
    const sStart = Date.now();
    try {
      await suite.fn();
      results.push({ name: suite.name, status: 'PASSED', duration: `${Date.now() - sStart}ms` });
    } catch (error) {
      console.error(`\n❌ GAGAL PADA SUITE: ${suite.name}\n`, error);
      results.push({ name: suite.name, status: 'FAILED', duration: `${Date.now() - sStart}ms`, error: error.message });
      process.exit(1);
    }
  }

  const totalDuration = `${Date.now() - startTime}ms`;
  console.log('\n======================================================');
  console.log('📊 REKAP HASIL PENGUJIAN OTOMASI PER-API');
  console.log('======================================================');
  console.table(results);
  console.log(`⏱️ Total Waktu Eksekusi: ${totalDuration}`);
  console.log('🎉 SEMUA 7 MODUL SUITE PENGUJIAN LULUS DENGAN SUKSES 100%!\n');
}

runAllSuites().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

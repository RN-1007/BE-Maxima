const assert = require('assert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const FormData = require('form-data');
const app = require('../src/app');

let server;
let baseUrl;

const startTestServer = () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`🧪 Test server running on ${baseUrl}`);
      resolve();
    });
  });
};

const stopTestServer = () => {
  return new Promise((resolve) => {
    server.close(() => {
      console.log('🧪 Test server stopped.');
      resolve();
    });
  });
};

async function runTests() {
  await startTestServer();

  console.log('\n=============================================');
  console.log('🚀 MEMULAI INTEGRATION TESTING SELURUH ENDPOINT TODO.md');
  console.log('=============================================\n');

  let adminToken = '';
  let farmerToken = '';
  let createdFarmerId = '';
  let createdTreeId = '';
  let createdScheduleId = '';
  let reportedHarvestId = '';
  let generatedBatchId = '';

  // -------------------------------------------------------------
  // 1. Authentication & Manajemen Pengguna (Admin)
  // -------------------------------------------------------------
  console.log('📌 1. Test Auth: Login Admin & Petani');
  {
    // Login Admin
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@maxima.com', password: 'Admin123!' }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Login admin status harus 200');
    assert.ok(data.data.token, 'Admin harus menerima JWT token');
    adminToken = data.data.token;
    console.log('  ✅ POST /api/auth/login (Admin) PASSED');

    // Login Petani
    const resFarmer = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'petani1@maxima.com', password: 'Petani123!' }),
    });
    const dataFarmer = await resFarmer.json();
    assert.strictEqual(resFarmer.status, 200, 'Login petani status harus 200');
    assert.ok(dataFarmer.data.token, 'Petani harus menerima JWT token');
    farmerToken = dataFarmer.data.token;
    console.log('  ✅ POST /api/auth/login (Petani) PASSED');
  }

  console.log('\n📌 1. Test Admin: CRUD Akun Petani');
  {
    // POST /api/admin/farmers
    const createRes = await fetch(`${baseUrl}/api/admin/farmers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Petani Baru Test',
        email: `petani.test.${Date.now()}@maxima.com`,
        password: 'Password123!',
        phone: '081233445566',
        location: 'Desa Bibis, Blok C',
      }),
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201, 'Create farmer status harus 201');
    assert.ok(createData.data.id, 'Petani baru harus punya ID');
    createdFarmerId = createData.data.id;
    console.log('  ✅ POST /api/admin/farmers PASSED');

    // GET /api/admin/farmers
    const listRes = await fetch(`${baseUrl}/api/admin/farmers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listData.data), 'Daftar petani harus berupa array');
    console.log(`  ✅ GET /api/admin/farmers PASSED (Total: ${listData.data.length} petani)`);

    // PUT /api/admin/farmers/:id
    const updateRes = await fetch(`${baseUrl}/api/admin/farmers/${createdFarmerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Petani Terupdate',
        location: 'Desa Bibis, Blok C-Updated',
      }),
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateData.data.name, 'Petani Terupdate');
    console.log('  ✅ PUT /api/admin/farmers/:id PASSED');

    // DELETE /api/admin/farmers/:id
    const deleteRes = await fetch(`${baseUrl}/api/admin/farmers/${createdFarmerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log('  ✅ DELETE /api/admin/farmers/:id PASSED');
  }

  // -------------------------------------------------------------
  // 2. Manajemen Pohon & Lahan (Siklus Awal)
  // -------------------------------------------------------------
  console.log('\n📌 2. Test Manajemen Pohon & Lahan');
  {
    const treeCode = `PHN-TEST-${Date.now()}`;
    // POST /api/trees (Petani) -> FR-1
    const createTreeRes = await fetch(`${baseUrl}/api/trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        treeCode,
        plantingDate: '2026-02-01',
        locationBlock: 'Blok Barat 01',
      }),
    });
    const treeData = await createTreeRes.json();
    assert.strictEqual(createTreeRes.status, 201, 'Create tree status harus 201');
    assert.ok(treeData.data.id, 'Pohon harus memiliki ID');
    createdTreeId = treeData.data.id;

    // FR-1 Validation: Auto-generated fertilizations
    assert.ok(
      Array.isArray(treeData.data.fertilizations) && treeData.data.fertilizations.length > 0,
      'FR-1: Jadwal pemupukan harus otomatis di-generate!'
    );
    createdScheduleId = treeData.data.fertilizations[0].id;
    console.log(
      `  ✅ POST /api/trees PASSED (FR-1 Otomatisasi Jadwal: ${treeData.data.fertilizations.length} jadwal terbuat)`
    );

    // GET /api/trees/my-trees (Petani) -> FR-2
    const myTreesRes = await fetch(`${baseUrl}/api/trees/my-trees`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const myTreesData = await myTreesRes.json();
    assert.strictEqual(myTreesRes.status, 200);
    assert.ok(Array.isArray(myTreesData.data));
    const foundMyTree = myTreesData.data.find((t) => t.id === createdTreeId);
    assert.ok(foundMyTree, 'FR-2: Petani harus menemukan pohon miliknya');
    assert.ok(foundMyTree.ageInDays !== undefined, 'Pohon harus memiliki kalkulasi umur hari');
    console.log('  ✅ GET /api/trees/my-trees PASSED (FR-2 Isolasi Data)');

    // GET /api/admin/trees (Admin)
    const adminTreesRes = await fetch(
      `${baseUrl}/api/admin/trees?health_status=Sehat`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    const adminTreesData = await adminTreesRes.json();
    assert.strictEqual(adminTreesRes.status, 200);
    assert.ok(Array.isArray(adminTreesData.data));
    console.log(`  ✅ GET /api/admin/trees?health_status=Sehat PASSED (${adminTreesData.data.length} pohon terfilter)`);
  }

  // -------------------------------------------------------------
  // 3. Jadwal & Log Pemupukan
  // -------------------------------------------------------------
  console.log('\n📌 3. Test Jadwal & Log Pemupukan');
  {
    // GET /api/fertilizations/schedule
    const scheduleRes = await fetch(`${baseUrl}/api/fertilizations/schedule`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const scheduleData = await scheduleRes.json();
    assert.strictEqual(scheduleRes.status, 200);
    assert.ok(Array.isArray(scheduleData.data));
    console.log(`  ✅ GET /api/fertilizations/schedule PASSED (${scheduleData.data.length} to-do item)`);

    // PUT /api/fertilizations/:id/complete
    const completeRes = await fetch(`${baseUrl}/api/fertilizations/${createdScheduleId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        actualDate: '2026-02-08',
        notes: 'Selesai diaplikasikan dengan dosis standar',
      }),
    });
    const completeData = await completeRes.json();
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeData.data.status, 'Selesai Dipupuk');
    console.log('  ✅ PUT /api/fertilizations/:id/complete PASSED');

    // POST /api/sync/fertilizations (FR-3)
    const syncRes = await fetch(`${baseUrl}/api/sync/fertilizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify([
        {
          treeId: createdTreeId,
          scheduledDate: '2026-03-01',
          actualDate: '2026-03-01',
          fertilizerType: 'Pupuk Offline Sync 1',
          notes: 'Tersinkronisasi dari IndexedDB',
        },
        {
          treeId: createdTreeId,
          scheduledDate: '2026-03-10',
          actualDate: '2026-03-10',
          fertilizerType: 'Pupuk Offline Sync 2',
          notes: 'Tersinkronisasi dari IndexedDB',
        },
      ]),
    });
    const syncData = await syncRes.json();
    assert.strictEqual(syncRes.status, 200);
    assert.strictEqual(syncData.data.created, 2);
    console.log('  ✅ POST /api/sync/fertilizations PASSED (FR-3 Batch Offline Sync)');
  }

  // -------------------------------------------------------------
  // 4. Deteksi AI & Monitoring Penyakit (Siklus Tengah)
  // -------------------------------------------------------------
  console.log('\n📌 4. Test Deteksi AI & Monitoring Penyakit');
  {
    // POST /api/ai/detect (FR-5)
    const form = new FormData();
    form.append('treeId', createdTreeId);
    const fixturePath = path.resolve(__dirname, 'fixtures/leaf-sample.jpg');
    form.append('photo', fs.readFileSync(fixturePath), {
      filename: 'leaf-test-healthy.jpg',
      contentType: 'image/jpeg',
    });

    const aiRes = await fetch(`${baseUrl}/api/ai/detect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        ...form.getHeaders(),
      },
      body: form.getBuffer(),
    });
    const aiData = await aiRes.json();
    assert.strictEqual(aiRes.status, 201);
    assert.ok(aiData.data.result, 'AI log harus memiliki hasil klasifikasi');
    assert.ok(aiData.data.confidence, 'AI log harus memiliki confidence percentage');
    console.log(`  ✅ POST /api/ai/detect PASSED (FR-5 AI Gateway: ${aiData.data.result}, ${aiData.data.confidence}%)`);

    // POST /api/sync/ai-detect (FR-3)
    const syncAiRes = await fetch(`${baseUrl}/api/sync/ai-detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify([
        {
          treeId: createdTreeId,
          photoUrl: '/uploads/leaves/offline-sample.jpg',
          result: 'Daun Sehat (Offline Sync)',
          confidence: 96.0,
          isSick: false,
          detectedAt: '2026-03-05',
        },
      ]),
    });
    const syncAiData = await syncAiRes.json();
    assert.strictEqual(syncAiRes.status, 200);
    assert.strictEqual(syncAiData.data.synchronizedCount, 1);
    console.log('  ✅ POST /api/sync/ai-detect PASSED (FR-3 Batch AI Sync)');

    // GET /api/admin/ai-logs (Admin)
    const adminAiRes = await fetch(`${baseUrl}/api/admin/ai-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAiData = await adminAiRes.json();
    assert.strictEqual(adminAiRes.status, 200);
    assert.ok(Array.isArray(adminAiData.data));
    console.log(`  ✅ GET /api/admin/ai-logs PASSED (Total: ${adminAiData.data.length} logs)`);
  }

  // -------------------------------------------------------------
  // 5. Lapor Panen & Cetak QR Code (Siklus Akhir)
  // -------------------------------------------------------------
  console.log('\n📌 5. Test Lapor Panen & Cetak QR Code');
  {
    // POST /api/harvests/report (Petani)
    const reportRes = await fetch(`${baseUrl}/api/harvests/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        treeId: createdTreeId,
        harvestDate: '2026-03-25',
        estimatedFruits: 50,
        notes: 'Hasil panen perdana musim ini',
      }),
    });
    const reportData = await reportRes.json();
    assert.strictEqual(reportRes.status, 201);
    assert.strictEqual(reportData.data.status, 'Pending');
    reportedHarvestId = reportData.data.id;
    console.log('  ✅ POST /api/harvests/report PASSED (Status: Pending)');

    // GET /api/admin/harvests (Admin)
    const adminHarvestsRes = await fetch(`${baseUrl}/api/admin/harvests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminHarvestsData = await adminHarvestsRes.json();
    assert.strictEqual(adminHarvestsRes.status, 200);
    assert.ok(Array.isArray(adminHarvestsData.data));
    console.log(`  ✅ GET /api/admin/harvests PASSED (Total: ${adminHarvestsData.data.length} laporan panen)`);

    // POST /api/admin/harvests/:id/verify-and-qr (Admin - FR-4)
    const verifyRes = await fetch(`${baseUrl}/api/admin/harvests/${reportedHarvestId}/verify-and-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ stickerCount: 6 }),
    });
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyData.data.status, 'Verified');
    assert.ok(verifyData.data.batchId, 'Harus ter-generate Batch ID');
    assert.ok(verifyData.data.qrPdfPath, 'Harus tersimpan file PDF');
    assert.ok(verifyData.data.pdfDownloadUrl, 'Harus ada URL download PDF');
    generatedBatchId = verifyData.data.batchId;

    // Verifikasi fisik file PDF yang dihasilkan
    const pdfPhysicalPath = path.resolve(process.cwd(), verifyData.data.qrPdfPath);
    assert.ok(fs.existsSync(pdfPhysicalPath), 'File PDF stiker QR code harus benar-benar ada di disk!');
    const pdfStats = fs.statSync(pdfPhysicalPath);
    assert.ok(pdfStats.size > 1000, 'File PDF tidak boleh kosong');
    console.log(`  ✅ POST /api/admin/harvests/:id/verify-and-qr PASSED (FR-4 File PDF QR: ${pdfStats.size} bytes)`);
  }

  // -------------------------------------------------------------
  // 6. Endpoint Konsumen (Scan & Traceability)
  // -------------------------------------------------------------
  console.log('\n📌 6. Test Endpoint Konsumen (Scan & Traceability)');
  {
    // A. Batch Sehat yang baru saja diverifikasi
    const traceRes = await fetch(`${baseUrl}/api/public/trace/${generatedBatchId}`);
    const traceData = await traceRes.json();
    assert.strictEqual(traceRes.status, 200);
    assert.strictEqual(traceData.success, true);
    assert.strictEqual(traceData.data.passed, true);
    assert.ok(traceData.data.farmerName, 'Data petani harus ditampilkan');
    assert.ok(traceData.data.fertilizationSummary, 'Rekap pemupukan harus ditampilkan');
    console.log('  ✅ GET /api/public/trace/:batch_id (Batch Sehat) PASSED (Semua data mutu lengkap)');

    // B. Batch Sakit (Seed data: BATCH-SICK-20260320) -> Gerbang Logika AI
    const sickTraceRes = await fetch(`${baseUrl}/api/public/trace/BATCH-SICK-20260320`);
    const sickTraceData = await sickTraceRes.json();
    assert.strictEqual(sickTraceRes.status, 200);
    assert.strictEqual(sickTraceData.success, false, 'Batch sakit tidak boleh lolos mutu');
    assert.strictEqual(
      sickTraceData.warning,
      '⚠️ Peringatan: Produk Tidak Memenuhi Standar Mutu AI',
      'Pesan peringatan AI harus persis sesuai spesifikasi SRS!'
    );
    assert.strictEqual(sickTraceData.data.farmerName, undefined, 'Detail petani harus disembunyikan!');
    console.log('  ✅ GET /api/public/trace/:batch_id (Gerbang Logika AI Pohon Sakit) PASSED (Peringatan aktif & data disembunyikan)');
  }

  console.log('\n=============================================');
  console.log('🎉 SELURUH 100% ENDPOINT DAN FUNCTIONAL REQUIREMENTS (FR-1 s/d FR-5) LULUS VERIFIKASI!');
  console.log('=============================================\n');

  await stopTestServer();
}

runTests().catch(async (err) => {
  console.error('\n❌ TEST FAILED:', err);
  if (server) await stopTestServer();
  process.exit(1);
});

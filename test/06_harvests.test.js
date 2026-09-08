const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { startServer, stopServer, getTokens } = require('./helpers');

async function testHarvests() {
  const { baseUrl } = await startServer();
  const { adminToken, farmerToken } = await getTokens(baseUrl);
  console.log('🧪 Running [06_HARVESTS] Tests...');

  let createdHarvestId = '';

  try {
    // Cari pohon petani untuk dilaporkan
    const myTreesRes = await fetch(`${baseUrl}/api/trees/my-trees`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const myTreesData = await myTreesRes.json();
    const tree = myTreesData.data[0];
    assert.ok(tree);

    // 1. Petani Report Harvest
    const reportRes = await fetch(`${baseUrl}/api/harvests/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        treeId: tree.id,
        harvestDate: '2026-03-30',
        estimatedFruits: 65,
        notes: 'Laporan panen pengujian modul harvests',
      }),
    });
    const reportData = await reportRes.json();
    assert.strictEqual(reportRes.status, 201);
    assert.strictEqual(reportData.data.status, 'Pending');
    createdHarvestId = reportData.data.id;
    console.log('  ✅ POST /api/harvests/report (Status: Pending) passed');

    // 2. Admin Get Harvests List
    const listRes = await fetch(`${baseUrl}/api/admin/harvests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listData.data));
    console.log(`  ✅ GET /api/admin/harvests (Total: ${listData.data.length} laporan) passed`);

    // 3. Admin Verify & Generate QR PDF (FR-4)
    const verifyRes = await fetch(`${baseUrl}/api/admin/harvests/${createdHarvestId}/verify-and-qr`, {
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
    assert.ok(verifyData.data.batchId);
    assert.ok(verifyData.data.qrPdfPath);

    // Pastikan file PDF benar-benar ada di disk
    const diskPath = path.resolve(process.cwd(), verifyData.data.qrPdfPath);
    assert.ok(fs.existsSync(diskPath), 'File fisik PDF QR harus ada di disk!');
    const stats = fs.statSync(diskPath);
    assert.ok(stats.size > 1000);
    console.log(`  ✅ POST /api/admin/harvests/:id/verify-and-qr (FR-4: Batch ${verifyData.data.batchId}, PDF: ${stats.size} bytes) passed`);

    console.log('🎉 [06_HARVESTS] Seluruh tes modul panen berhasil!\n');
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  testHarvests().catch((err) => {
    console.error('❌ Harvests test failed:', err);
    process.exit(1);
  });
}

module.exports = testHarvests;

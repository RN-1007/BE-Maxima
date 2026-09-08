const assert = require('assert');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const { startServer, stopServer, getTokens } = require('./helpers');

async function testAI() {
  const { baseUrl } = await startServer();
  const { adminToken, farmerToken } = await getTokens(baseUrl);
  console.log('🧪 Running [05_AI] Tests...');

  try {
    // Ambil pohon milik petani untuk dites
    const myTreesRes = await fetch(`${baseUrl}/api/trees/my-trees`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const myTreesData = await myTreesRes.json();
    const targetTree = myTreesData.data[0];
    assert.ok(targetTree, 'Harus ada pohon untuk pengujian AI');

    // 1. POST /api/ai/detect (FR-5 AI Gateway upload <5MB)
    const fixturePath = path.resolve(__dirname, 'fixtures/leaf-sample.jpg');
    const form = new FormData();
    form.append('treeId', targetTree.id);
    form.append('photo', fs.readFileSync(fixturePath), {
      filename: 'leaf-test-healthy.jpg',
      contentType: 'image/jpeg',
    });

    const detectRes = await fetch(`${baseUrl}/api/ai/detect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        ...form.getHeaders(),
      },
      body: form.getBuffer(),
    });
    const detectData = await detectRes.json();
    assert.strictEqual(detectRes.status, 201);
    assert.ok(detectData.data.result);
    assert.ok(detectData.data.confidence !== undefined);
    console.log(`  ✅ POST /api/ai/detect passed (FR-5: ${detectData.data.result}, ${detectData.data.confidence}%)`);

    // 2. POST /api/sync/ai-detect (FR-3 Offline Batch Sync)
    const syncRes = await fetch(`${baseUrl}/api/sync/ai-detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify([
        {
          treeId: targetTree.id,
          photoUrl: '/uploads/leaves/offline-modul-leaf.jpg',
          result: 'Daun Sehat (Offline Test)',
          confidence: 95.5,
          isSick: false,
          detectedAt: '2026-03-05',
        },
      ]),
    });
    const syncData = await syncRes.json();
    assert.strictEqual(syncRes.status, 200);
    assert.strictEqual(syncData.data.synchronizedCount, 1);
    console.log('  ✅ POST /api/sync/ai-detect (FR-3 Batch AI Sync) passed');

    // 3. GET /api/admin/ai-logs (Admin)
    const adminLogsRes = await fetch(`${baseUrl}/api/admin/ai-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminLogsData = await adminLogsRes.json();
    assert.strictEqual(adminLogsRes.status, 200);
    assert.ok(Array.isArray(adminLogsData.data));
    console.log(`  ✅ GET /api/admin/ai-logs (Total: ${adminLogsData.data.length} log) passed`);

    console.log('🎉 [05_AI] Seluruh tes modul AI berhasil!\n');
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  testAI().catch((err) => {
    console.error('❌ AI test failed:', err);
    process.exit(1);
  });
}

module.exports = testAI;

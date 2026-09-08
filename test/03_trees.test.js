const assert = require('assert');
const { startServer, stopServer, getTokens } = require('./helpers');

async function testTrees() {
  const { baseUrl } = await startServer();
  const { adminToken, farmerToken, farmer2Token } = await getTokens(baseUrl);
  console.log('🧪 Running [03_TREES] Tests...');

  let createdTreeId = '';
  const treeCode = `TREE-UNIT-${Date.now()}`;

  try {
    // 1. Petani Add Tree (FR-1: Auto Generate Schedule)
    const addRes = await fetch(`${baseUrl}/api/trees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        treeCode,
        plantingDate: '2026-02-15',
        locationBlock: 'Blok Barat 02',
      }),
    });
    const addData = await addRes.json();
    assert.strictEqual(addRes.status, 201);
    assert.ok(addData.data.id);
    createdTreeId = addData.data.id;

    // Validate FR-1
    assert.ok(Array.isArray(addData.data.fertilizations));
    assert.ok(addData.data.fertilizations.length >= 5, 'FR-1: Minimal 5 jadwal rencana pemupukan terbuat otomatis');
    console.log(`  ✅ POST /api/trees passed (FR-1: ${addData.data.fertilizations.length} jadwal otomatis terbuat)`);

    // 2. Petani Get My Trees (FR-2: Data Isolation)
    const myTreesRes = await fetch(`${baseUrl}/api/trees/my-trees`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const myTreesData = await myTreesRes.json();
    assert.strictEqual(myTreesRes.status, 200);
    const foundTree = myTreesData.data.find((t) => t.id === createdTreeId);
    assert.ok(foundTree, 'Petani 1 harus menemukan pohon miliknya');

    // Petani 2 must NOT see Petani 1's tree
    const farmer2TreesRes = await fetch(`${baseUrl}/api/trees/my-trees`, {
      headers: { Authorization: `Bearer ${farmer2Token}` },
    });
    const farmer2TreesData = await farmer2TreesRes.json();
    const leakedTree = farmer2TreesData.data.find((t) => t.id === createdTreeId);
    assert.strictEqual(leakedTree, undefined, 'FR-2: Petani 2 tidak boleh melihat pohon Petani 1');
    console.log('  ✅ GET /api/trees/my-trees passed (FR-2 Isolasi Data Sukses)');

    // 3. Admin Get Global Trees with query filter
    const adminTreesRes = await fetch(`${baseUrl}/api/admin/trees?health_status=Sehat`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminTreesData = await adminTreesRes.json();
    assert.strictEqual(adminTreesRes.status, 200);
    assert.ok(Array.isArray(adminTreesData.data));
    console.log(`  ✅ GET /api/admin/trees (Filter ?health_status=Sehat: ${adminTreesData.data.length} pohon) passed`);

    console.log('🎉 [03_TREES] Seluruh tes modul pohon berhasil!\n');
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  testTrees().catch((err) => {
    console.error('❌ Trees test failed:', err);
    process.exit(1);
  });
}

module.exports = testTrees;

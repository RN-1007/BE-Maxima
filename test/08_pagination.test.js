const assert = require('assert');
const { startServer, stopServer, getTokens } = require('./helpers');

async function testPagination() {
  const { baseUrl } = await startServer();
  const { adminToken, farmerToken } = await getTokens(baseUrl);
  console.log('🧪 Running [08_PAGINATION] Tests...');

  try {
    // 1. Test Admin Farmers Pagination (?page=1&limit=2)
    const farmersRes = await fetch(`${baseUrl}/api/admin/farmers?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const farmersData = await farmersRes.json();
    assert.strictEqual(farmersRes.status, 200);
    assert.ok(Array.isArray(farmersData.data));
    assert.ok(farmersData.meta, 'Respons harus menyertakan meta pagination');
    assert.strictEqual(farmersData.meta.page, 1);
    assert.strictEqual(farmersData.meta.limit, 2);
    assert.ok(farmersData.meta.totalItems >= 0);
    assert.ok(farmersData.meta.totalPages >= 1);
    assert.strictEqual(typeof farmersData.meta.hasNextPage, 'boolean');
    assert.strictEqual(typeof farmersData.meta.hasPrevPage, 'boolean');
    console.log(`  ✅ GET /api/admin/farmers (Pagination page: 1, limit: 2, total: ${farmersData.meta.totalItems}) passed`);

    // 2. Test Petani My Trees Pagination (?page=1&limit=2)
    const myTreesRes = await fetch(`${baseUrl}/api/trees/my-trees?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const myTreesData = await myTreesRes.json();
    assert.strictEqual(myTreesRes.status, 200);
    assert.ok(Array.isArray(myTreesData.data));
    assert.ok(myTreesData.meta);
    assert.strictEqual(myTreesData.meta.page, 1);
    assert.strictEqual(myTreesData.meta.limit, 2);
    console.log(`  ✅ GET /api/trees/my-trees (Pagination page: 1, limit: 2, total: ${myTreesData.meta.totalItems}) passed`);

    // 3. Test Admin Global Trees Pagination (?page=1&limit=3&health_status=Sehat)
    const adminTreesRes = await fetch(`${baseUrl}/api/admin/trees?page=1&limit=3&health_status=Sehat`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminTreesData = await adminTreesRes.json();
    assert.strictEqual(adminTreesRes.status, 200);
    assert.ok(Array.isArray(adminTreesData.data));
    assert.ok(adminTreesData.meta);
    assert.strictEqual(adminTreesData.meta.page, 1);
    assert.strictEqual(adminTreesData.meta.limit, 3);
    console.log(`  ✅ GET /api/admin/trees (Pagination & Filter page: 1, limit: 3, total: ${adminTreesData.meta.totalItems}) passed`);

    // 4. Test Petani Fertilization Schedule Pagination (?page=1&limit=5)
    const schedRes = await fetch(`${baseUrl}/api/fertilizations/schedule?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const schedData = await schedRes.json();
    assert.strictEqual(schedRes.status, 200);
    assert.ok(Array.isArray(schedData.data));
    assert.ok(schedData.meta);
    assert.strictEqual(schedData.meta.page, 1);
    assert.strictEqual(schedData.meta.limit, 5);
    console.log(`  ✅ GET /api/fertilizations/schedule (Pagination page: 1, limit: 5, total: ${schedData.meta.totalItems}) passed`);

    // 5. Test Admin Fertilization Schedules Pagination (?page=1&limit=5)
    const adminSchedRes = await fetch(`${baseUrl}/api/admin/fertilizations?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminSchedData = await adminSchedRes.json();
    assert.strictEqual(adminSchedRes.status, 200);
    assert.ok(Array.isArray(adminSchedData.data));
    assert.ok(adminSchedData.meta);
    assert.strictEqual(adminSchedData.meta.page, 1);
    assert.strictEqual(adminSchedData.meta.limit, 5);
    console.log(`  ✅ GET /api/admin/fertilizations (Pagination page: 1, limit: 5, total: ${adminSchedData.meta.totalItems}) passed`);

    // 6. Test Admin AI Logs Pagination (?page=1&limit=5)
    const aiLogsRes = await fetch(`${baseUrl}/api/admin/ai-logs?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const aiLogsData = await aiLogsRes.json();
    assert.strictEqual(aiLogsRes.status, 200);
    assert.ok(Array.isArray(aiLogsData.data));
    assert.ok(aiLogsData.meta);
    assert.strictEqual(aiLogsData.meta.page, 1);
    assert.strictEqual(aiLogsData.meta.limit, 5);
    console.log(`  ✅ GET /api/admin/ai-logs (Pagination page: 1, limit: 5, total: ${aiLogsData.meta.totalItems}) passed`);

    // 7. Test Admin Harvests Pagination (?page=1&limit=5)
    const harvestsRes = await fetch(`${baseUrl}/api/admin/harvests?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const harvestsData = await harvestsRes.json();
    assert.strictEqual(harvestsRes.status, 200);
    assert.ok(Array.isArray(harvestsData.data));
    assert.ok(harvestsData.meta);
    assert.strictEqual(harvestsData.meta.page, 1);
    assert.strictEqual(harvestsData.meta.limit, 5);
    console.log(`  ✅ GET /api/admin/harvests (Pagination page: 1, limit: 5, total: ${harvestsData.meta.totalItems}) passed`);

    console.log('🎉 [08_PAGINATION] Seluruh pengujian fitur pagination sukses 100%!\n');
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  testPagination().catch((err) => {
    console.error('❌ Pagination test failed:', err);
    process.exit(1);
  });
}

module.exports = testPagination;

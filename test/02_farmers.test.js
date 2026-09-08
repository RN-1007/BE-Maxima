const assert = require('assert');
const { startServer, stopServer, getTokens } = require('./helpers');

async function testFarmers() {
  const { baseUrl } = await startServer();
  const { adminToken, farmerToken } = await getTokens(baseUrl);
  console.log('🧪 Running [02_FARMERS] Tests...');

  let testFarmerId = '';

  try {
    // 1. Forbidden for Farmer role (RBAC)
    const forbiddenRes = await fetch(`${baseUrl}/api/admin/farmers`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert.strictEqual(forbiddenRes.status, 403);
    console.log('  ✅ RBAC: Petani dilarang mengakses admin/farmers (403) passed');

    // 2. Admin Create Farmer
    const newFarmerEmail = `petani.test.${Date.now()}@maxima.com`;
    const createRes = await fetch(`${baseUrl}/api/admin/farmers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Petani Uji Modul',
        email: newFarmerEmail,
        password: 'Password123!',
        phone: '081234567800',
        location: 'Desa Bibis, Blok D',
      }),
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    assert.ok(createData.data.id);
    testFarmerId = createData.data.id;
    console.log('  ✅ POST /api/admin/farmers (Tambah Petani) passed');

    // 3. Admin Get All Farmers
    const listRes = await fetch(`${baseUrl}/api/admin/farmers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listData.data));
    console.log(`  ✅ GET /api/admin/farmers (Total: ${listData.data.length}) passed`);

    // 4. Admin Get Farmer By ID
    const getRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getData = await getRes.json();
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getData.data.email, newFarmerEmail);
    console.log('  ✅ GET /api/admin/farmers/:id passed');

    // 5. Admin Update Farmer
    const updateRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Petani Uji Terupdate',
        location: 'Desa Bibis, Blok E',
      }),
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateData.data.name, 'Petani Uji Terupdate');
    console.log('  ✅ PUT /api/admin/farmers/:id (Update) passed');

    // 6. Admin Delete Farmer
    const deleteRes = await fetch(`${baseUrl}/api/admin/farmers/${testFarmerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log('  ✅ DELETE /api/admin/farmers/:id (Hapus) passed');

    console.log('🎉 [02_FARMERS] Seluruh tes modul petani berhasil!\n');
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  testFarmers().catch((err) => {
    console.error('❌ Farmers test failed:', err);
    process.exit(1);
  });
}

module.exports = testFarmers;

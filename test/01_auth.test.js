const assert = require('assert');
const { startServer, stopServer } = require('./helpers');

async function testAuth() {
  const { baseUrl } = await startServer();
  console.log('🧪 Running [01_AUTH] Tests...');

  try {
    // 1. Login Admin Success
    const res1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@maxima.com', password: 'Admin123!' }),
    });
    const d1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(d1.success, true);
    assert.ok(d1.data.token);
    assert.strictEqual(d1.data.user.role, 'admin');
    console.log('  ✅ POST /api/auth/login (Admin Berhasil) passed');

    // 2. Login Farmer Success
    const res2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'petani1@maxima.com', password: 'Petani123!' }),
    });
    const d2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(d2.success, true);
    assert.ok(d2.data.token);
    assert.strictEqual(d2.data.user.role, 'farmer');
    console.log('  ✅ POST /api/auth/login (Petani Berhasil) passed');

    // 3. Login Wrong Password
    const res3 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@maxima.com', password: 'WrongPassword' }),
    });
    assert.strictEqual(res3.status, 401);
    console.log('  ✅ POST /api/auth/login (Password Salah ditolak 401) passed');

    // 4. Login Missing Body
    const res4 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res4.status, 400);
    console.log('  ✅ POST /api/auth/login (Body Kosong ditolak 400) passed');

    console.log('🎉 [01_AUTH] Seluruh tes modul autentikasi berhasil!\n');
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  testAuth().catch((err) => {
    console.error('❌ Auth test failed:', err);
    process.exit(1);
  });
}

module.exports = testAuth;

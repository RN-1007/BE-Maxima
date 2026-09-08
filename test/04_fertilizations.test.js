const assert = require('assert');
const { startServer, stopServer, getTokens } = require('./helpers');

async function testFertilizations() {
  const { baseUrl } = await startServer();
  const { farmerToken } = await getTokens(baseUrl);
  console.log('🧪 Running [04_FERTILIZATIONS] Tests...');

  try {
    // 1. Get schedule to-do list
    const schedRes = await fetch(`${baseUrl}/api/fertilizations/schedule`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const schedData = await schedRes.json();
    assert.strictEqual(schedRes.status, 200);
    assert.ok(Array.isArray(schedData.data));
    assert.ok(schedData.data.length > 0);
    const firstSchedule = schedData.data[0];
    console.log(`  ✅ GET /api/fertilizations/schedule (${schedData.data.length} jadwal) passed`);

    // 2. Mark schedule as completed
    const completeRes = await fetch(`${baseUrl}/api/fertilizations/${firstSchedule.id}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        actualDate: '2026-03-01',
        notes: 'Pupuk selesai diaplikasikan dalam pengujian modul',
      }),
    });
    const completeData = await completeRes.json();
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeData.data.status, 'Selesai Dipupuk');
    console.log('  ✅ PUT /api/fertilizations/:id/complete (Selesai Dipupuk) passed');

    // 3. Batch offline sync from IndexedDB (FR-3)
    const syncRes = await fetch(`${baseUrl}/api/sync/fertilizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify([
        {
          treeId: firstSchedule.treeId,
          scheduledDate: '2026-03-10',
          actualDate: '2026-03-10',
          fertilizerType: 'Pupuk Sync Modul A',
          notes: 'Sync dari IndexedDB offline',
        },
        {
          treeId: firstSchedule.treeId,
          scheduledDate: '2026-03-20',
          actualDate: '2026-03-20',
          fertilizerType: 'Pupuk Sync Modul B',
          notes: 'Sync dari IndexedDB offline',
        },
      ]),
    });
    const syncData = await syncRes.json();
    assert.strictEqual(syncRes.status, 200);
    assert.strictEqual(syncData.data.created, 2);
    console.log('  ✅ POST /api/sync/fertilizations (FR-3 Offline Batch Sync) passed');

    console.log('🎉 [04_FERTILIZATIONS] Seluruh tes modul pemupukan berhasil!\n');
  } finally {
    await stopServer();
  }
}

if (require.main === module) {
  testFertilizations().catch((err) => {
    console.error('❌ Fertilizations test failed:', err);
    process.exit(1);
  });
}

module.exports = testFertilizations;

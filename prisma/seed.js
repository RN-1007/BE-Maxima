const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database Maxima...');

  // 1. Bersihkan data lama jika ada
  await prisma.harvest.deleteMany();
  await prisma.aiLog.deleteMany();
  await prisma.fertilization.deleteMany();
  await prisma.tree.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash Password
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const farmerPassword = await bcrypt.hash('Petani123!', 10);

  // 3. Buat Akun Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Super Administrator',
      email: 'admin@maxima.com',
      password: adminPassword,
      role: 'admin',
      phone: '081234567890',
      location: 'Kantor Pusat Maxima',
    },
  });
  console.log(`✅ Admin dibuat: ${admin.email}`);

  // 4. Buat Akun Petani 1
  const farmer1 = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'petani1@maxima.com',
      password: farmerPassword,
      role: 'farmer',
      phone: '081298765432',
      location: 'Desa Bibis, Blok Utara',
    },
  });
  console.log(`✅ Petani 1 dibuat: ${farmer1.email}`);

  // 5. Buat Akun Petani 2
  const farmer2 = await prisma.user.create({
    data: {
      name: 'Siti Rahma',
      email: 'petani2@maxima.com',
      password: farmerPassword,
      role: 'farmer',
      phone: '081345678912',
      location: 'Desa Bibis, Blok Selatan',
    },
  });
  console.log(`✅ Petani 2 dibuat: ${farmer2.email}`);

  // 6. Buat Pohon Contoh untuk Petani 1 (Pohon Sehat)
  const plantingDate1 = new Date('2026-01-10');
  const tree1 = await prisma.tree.create({
    data: {
      treeCode: 'PHN-BBS-001',
      farmerId: farmer1.id,
      plantingDate: plantingDate1,
      healthStatus: 'Sehat',
      locationBlock: 'Blok A-01',
    },
  });

  // Buat Jadwal Pemupukan untuk Pohon 1
  const sched1 = new Date(plantingDate1);
  sched1.setDate(sched1.getDate() + 7);
  const sched2 = new Date(plantingDate1);
  sched2.setDate(sched2.getDate() + 30);
  const sched3 = new Date(plantingDate1);
  sched3.setDate(sched3.getDate() + 60);

  await prisma.fertilization.createMany({
    data: [
      {
        treeId: tree1.id,
        scheduledDate: sched1,
        actualDate: sched1,
        fertilizerType: 'Pupuk Dasar Kompos Organik',
        status: 'Selesai Dipupuk',
        notes: 'Pemupukan dasar berhasil diaplikasikan',
      },
      {
        treeId: tree1.id,
        scheduledDate: sched2,
        actualDate: sched2,
        fertilizerType: 'NPK 16-16-16 Vegetatif',
        status: 'Selesai Dipupuk',
        notes: 'Dosis 250 gram per lubang tanam',
      },
      {
        treeId: tree1.id,
        scheduledDate: sched3,
        fertilizerType: 'NPK + Pupuk Hayati',
        status: 'Pending',
        notes: 'Jadwal mendatang',
      },
    ],
  });

  // AI Log Sehat untuk Pohon 1
  await prisma.aiLog.create({
    data: {
      treeId: tree1.id,
      farmerId: farmer1.id,
      photoUrl: '/uploads/leaves/sample-healthy.jpg',
      result: 'Daun Sehat (Healthy Leaf)',
      confidence: 97.8,
      isSick: false,
      detectedAt: new Date('2026-03-01'),
    },
  });

  // Panen Terverifikasi untuk Pohon 1 (Traceability Lolos Mutu)
  const harvest1 = await prisma.harvest.create({
    data: {
      treeId: tree1.id,
      farmerId: farmer1.id,
      harvestDate: new Date('2026-03-15'),
      estimatedFruits: 45,
      notes: 'Kualitas buah grade A, kematangan optimal',
      status: 'Verified',
      batchId: 'BATCH-BBS001-20260315',
      verifiedAt: new Date('2026-03-16'),
    },
  });

  // 7. Buat Pohon Sakit (Untuk menguji Gerbang Logika AI pada Traceability)
  const plantingDate2 = new Date('2026-01-15');
  const treeSick = await prisma.tree.create({
    data: {
      treeCode: 'PHN-BBS-002-SICK',
      farmerId: farmer1.id,
      plantingDate: plantingDate2,
      healthStatus: 'Sakit',
      locationBlock: 'Blok B-03',
    },
  });

  // AI Log Sakit (belum ada log sembuh sesudahnya)
  await prisma.aiLog.create({
    data: {
      treeId: treeSick.id,
      farmerId: farmer1.id,
      photoUrl: '/uploads/leaves/sample-sick.jpg',
      result: 'Hawar Daun Phomopsis (Severe)',
      confidence: 94.2,
      isSick: true,
      detectedAt: new Date('2026-02-20'),
    },
  });

  // Panen Pohon Sakit
  await prisma.harvest.create({
    data: {
      treeId: treeSick.id,
      farmerId: farmer1.id,
      harvestDate: new Date('2026-03-20'),
      estimatedFruits: 20,
      notes: 'Dipanen saat pohon bergejala hawar',
      status: 'Verified',
      batchId: 'BATCH-SICK-20260320',
      verifiedAt: new Date('2026-03-21'),
    },
  });

  console.log('🎉 Seeding selesai dengan sukses!');
  console.log('   - Admin: admin@maxima.com / Admin123!');
  console.log('   - Petani: petani1@maxima.com / Petani123!');
  console.log('   - Batch Sehat: BATCH-BBS001-20260315');
  console.log('   - Batch Sakit (Uji Mutu AI): BATCH-SICK-20260320');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

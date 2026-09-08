const app = require('./app');
const { PORT } = require('./config/env');
const prisma = require('./config/database');

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Berhasil terhubung ke database.');

    app.listen(PORT, () => {
      console.log(`🚀 BE-Maxima API Server berjalan di http://localhost:${PORT}`);
      console.log(`📡 Mode: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Gagal menjalankan server:', error);
    process.exit(1);
  }
};

startServer();

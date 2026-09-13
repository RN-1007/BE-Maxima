const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Middlewares
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

// Routes
const authRoutes = require('./features/auth/auth.routes');
const farmersRoutes = require('./features/farmers/farmers.routes');
const treesRoutes = require('./features/trees/trees.routes');
const adminTreesRoutes = require('./features/trees/admin-trees.routes');
const fertilizationsRoutes = require('./features/fertilizations/fertilizations.routes');
const adminFertilizationsRoutes = require('./features/fertilizations/admin-fertilizations.routes');
const dashboardRoutes = require('./features/dashboard/dashboard.routes');
const { aiRouter } = require('./features/ai/ai.routes');
const adminAiRoutes = require('./features/ai/admin-ai.routes');
const harvestsRoutes = require('./features/harvests/harvests.routes');
const adminHarvestsRoutes = require('./features/harvests/admin-harvests.routes');
const syncRoutes = require('./routes/sync.routes');
const traceabilityRoutes = require('./features/traceability/traceability.routes');
const chatRoutes = require('./features/ai/chat.routes');

const app = express();

// Global Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (leaves images & PDF QR stickers)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'BE-Maxima RESTful API',
    version: '1.0.0',
    documentation: 'See Readme.md for endpoints specification and requirement',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes Mounting
// 1. Authentication & Manajemen Pengguna (Admin)
app.use('/api/auth', authRoutes);
app.use('/api/admin/farmers', farmersRoutes);

// Admin Dashboard & Global Analytics
app.use('/api/admin/dashboard', dashboardRoutes);

// 2. Manajemen Pohon & Lahan (Siklus Awal)
app.use('/api/trees', treesRoutes);
app.use('/api/admin/trees', adminTreesRoutes);

// 3. Jadwal & Log Pemupukan
app.use('/api/fertilizations', fertilizationsRoutes);
app.use('/api/admin/fertilizations', adminFertilizationsRoutes);

// 4. Deteksi AI & Monitoring Penyakit (Siklus Tengah)
app.use('/api/ai', aiRouter);
app.use('/api/ai', chatRoutes);
app.use('/api/admin/ai-logs', adminAiRoutes);

// Chatbot Asisten Maxist (Multimodal & DB Context)
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1', chatRoutes);
app.use('/api/chat', chatRoutes);

// 5. Lapor Panen & Cetak QR Code (Siklus Akhir)
app.use('/api/harvests', harvestsRoutes);
app.use('/api/admin/harvests', adminHarvestsRoutes);

// Offline Synchronization (FR-3)
app.use('/api/sync', syncRoutes);

// 6. Endpoint Konsumen (Scan & Traceability)
app.use('/api/public', traceabilityRoutes);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

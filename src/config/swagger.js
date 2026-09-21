const swaggerUi = require('swagger-ui-express');

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'BE-Maxima RESTful API & Documentation',
    version: '1.0.0',
    description: `Dokumentasi API Interaktif Maxima — Sistem Manajemen Kebun Jeruk Terintegrasi AI, Pemupukan Otomatis, Lapor Panen, Batch QR Code, dan Traceability Perjalanan Mutu Produk.

### Autentikasi:
Sebagian besar endpoint memerlukan Bearer Token (JWT). Gunakan endpoint **POST /api/auth/login** untuk memperoleh token, lalu klik tombol **Authorize** di kanan atas dan masukkan token Anda (\`Bearer <token>\` atau \`<token>\`).`,
    contact: {
      name: 'Tim Maxima Developer',
      url: 'https://github.com/RN-1007/BE-Maxima',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan JWT token yang diperoleh dari endpoint /api/auth/login',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operasi berhasil diproses.' },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              totalItems: { type: 'integer', example: 25 },
              totalPages: { type: 'integer', example: 3 },
              hasNextPage: { type: 'boolean', example: true },
              hasPrevPage: { type: 'boolean', example: false },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Pesan error yang terjadi' },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  tags: [
    { name: '1. Authentication', description: 'Autentikasi akun Admin dan Petani' },
    { name: '2. Manajemen Petani (Admin)', description: 'Kelola akun petani kebun jeruk oleh Admin' },
    { name: '3. Dashboard & Analytics (Admin)', description: 'Statistik agregat dan grafik kondisi kebun global' },
    { name: '4. Pohon & Lahan', description: 'Manajemen pohon, penanaman (FR-1), dan isolasi data petani (FR-2)' },
    { name: '5. Jadwal & Log Pemupukan', description: 'To-do list pemupukan, penyelesaian jadwal, dan batch offline sync (FR-3)' },
    { name: '6. Deteksi AI & Chatbot', description: 'Gateway deteksi penyakit daun jeruk (FR-5) & chatbot Maxist' },
    { name: '7. Lapor Panen & Cetak QR PDF', description: 'Pengajuan panen oleh petani dan verifikasi + generate stiker QR (FR-4)' },
    { name: '8. Offline Synchronization', description: 'Batch synchronization saat online kembali (FR-3)' },
    { name: '9. Traceability (Public & Konsumen)', description: 'Scan batch QR code dan gerbang logika verifikasi mutu AI' },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['1. Authentication'],
        summary: 'Login Admin atau Petani',
        description: 'Menerima username/email dan password, mengembalikan token JWT untuk autentikasi.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  email: { type: 'string', example: 'admin@maxima.com' },
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'Admin123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login berhasil, token diberikan.' },
          400: { description: 'Parameter email/username atau password tidak lengkap.' },
          401: { description: 'Kredensial salah.' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['1. Authentication'],
        summary: 'Get profil pengguna login',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Profil pengguna berhasil diambil.' },
          401: { description: 'Token tidak valid atau belum login.' },
        },
      },
    },
    '/api/admin/farmers': {
      get: {
        tags: ['2. Manajemen Petani (Admin)'],
        summary: 'Ambil daftar seluruh akun petani (dengan pagination)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Nomor halaman' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Jumlah data per halaman' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari nama, email, username, lokasi' },
        ],
        responses: {
          200: { description: 'Daftar petani berhasil diambil.' },
          403: { description: 'Akses ditolak (Bukan Admin).' },
        },
      },
      post: {
        tags: ['2. Manajemen Petani (Admin)'],
        summary: 'Tambah akun petani baru',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'password'],
                properties: {
                  name: { type: 'string', example: 'Budi Santoso' },
                  email: { type: 'string', example: 'budi@maxima.com' },
                  username: { type: 'string', example: 'petani_budi' },
                  password: { type: 'string', example: 'Petani123!' },
                  phone: { type: 'string', example: '081234567890' },
                  location: { type: 'string', example: 'Desa Bibis, Blok A' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Akun petani berhasil dibuat.' },
          409: { description: 'Email atau username sudah terdaftar.' },
        },
      },
    },
    '/api/admin/farmers/{id}': {
      get: {
        tags: ['2. Manajemen Petani (Admin)'],
        summary: 'Detail akun petani',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Detail petani ditemukan.' },
          404: { description: 'Petani tidak ditemukan.' },
        },
      },
      put: {
        tags: ['2. Manajemen Petani (Admin)'],
        summary: 'Update akun petani',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Budi Santoso (Updated)' },
                  phone: { type: 'string', example: '081299998888' },
                  location: { type: 'string', example: 'Desa Bibis, Blok B' },
                  password: { type: 'string', example: 'NewPassword123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Data petani berhasil diperbarui.' },
          404: { description: 'Petani tidak ditemukan.' },
        },
      },
      delete: {
        tags: ['2. Manajemen Petani (Admin)'],
        summary: 'Hapus akun petani',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Akun petani berhasil dihapus.' },
          404: { description: 'Petani tidak ditemukan.' },
        },
      },
    },
    '/api/admin/dashboard/stats': {
      get: {
        tags: ['3. Dashboard & Analytics (Admin)'],
        summary: 'Statistik KPI Utama Kebun',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Statistik berhasil diambil.' } },
      },
    },
    '/api/admin/dashboard/trend': {
      get: {
        tags: ['3. Dashboard & Analytics (Admin)'],
        summary: 'Tren & Distribusi Kesehatan Kebun',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Data tren berhasil diambil.' } },
      },
    },
    '/api/admin/dashboard/overview': {
      get: {
        tags: ['3. Dashboard & Analytics (Admin)'],
        summary: 'Ringkasan Dashboard Lengkap',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Ringkasan overview berhasil diambil.' } },
      },
    },
    '/api/trees': {
      post: {
        tags: ['4. Pohon & Lahan'],
        summary: 'Tambah Pohon Baru & Auto Generate Jadwal Pemupukan (FR-1)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['treeCode', 'plantingDate'],
                properties: {
                  treeCode: { type: 'string', example: 'PHN-BBS-001' },
                  plantingDate: { type: 'string', format: 'date', example: '2026-01-10' },
                  locationBlock: { type: 'string', example: 'Blok Barat 01' },
                  variety: { type: 'string', example: 'Jeruk Bali Merah' },
                  coordinates: { type: 'string', example: '7°37\'42"S 111°26\'18"E' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Pohon berhasil ditambahkan dan jadwal otomatis terbuat.' },
          409: { description: 'Kode pohon sudah terdaftar.' },
        },
      },
    },
    '/api/trees/my-trees': {
      get: {
        tags: ['4. Pohon & Lahan'],
        summary: 'Daftar Pohon Petani Login (FR-2 Data Isolation, Pagination)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'health_status', in: 'query', schema: { type: 'string', enum: ['Sehat', 'Sakit'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Daftar pohon milik petani login.' },
        },
      },
    },
    '/api/trees/{id}': {
      get: {
        tags: ['4. Pohon & Lahan'],
        summary: 'Detail Pohon beserta riwayat pemupukan & AI',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Detail pohon berhasil diambil.' },
          404: { description: 'Pohon tidak ditemukan.' },
        },
      },
    },
    '/api/admin/trees': {
      get: {
        tags: ['4. Pohon & Lahan'],
        summary: 'Rekapitulasi Global Seluruh Pohon Admin (Pagination & Filter)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'farmer_id', in: 'query', schema: { type: 'string' } },
          { name: 'health_status', in: 'query', schema: { type: 'string', enum: ['Sehat', 'Sakit'] } },
          { name: 'age', in: 'query', schema: { type: 'integer' }, description: 'Umur minimal dalam hari' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Rekapitulasi pohon global.' } },
      },
      post: {
        tags: ['4. Pohon & Lahan'],
        summary: 'Admin Tambah Pohon',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['treeCode', 'plantingDate'],
                properties: {
                  farmerId: { type: 'string', description: 'ID Petani pemilik' },
                  treeCode: { type: 'string', example: 'PHN-ADM-001' },
                  plantingDate: { type: 'string', format: 'date', example: '2026-01-15' },
                  locationBlock: { type: 'string', example: 'Blok Timur 03' },
                  variety: { type: 'string', example: 'Pamelo Magetan' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Pohon berhasil ditambahkan oleh admin.' } },
      },
    },
    '/api/fertilizations/schedule': {
      get: {
        tags: ['5. Jadwal & Log Pemupukan'],
        summary: 'To-do List Jadwal Pemupukan Petani (Pagination & Filter)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Selesai Dipupuk'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Daftar jadwal pemupukan berhasil diambil.' } },
      },
    },
    '/api/fertilizations/{id}/complete': {
      put: {
        tags: ['5. Jadwal & Log Pemupukan'],
        summary: 'Tandai Jadwal Pemupukan Menjadi Selesai Dipupuk',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  actualDate: { type: 'string', format: 'date', example: '2026-03-01' },
                  notes: { type: 'string', example: 'Aplikasi pupuk NPK 16-16-16 dosis standar selesai.' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Status berhasil diubah ke Selesai Dipupuk.' } },
      },
    },
    '/api/admin/fertilizations': {
      get: {
        tags: ['5. Jadwal & Log Pemupukan'],
        summary: 'Seluruh Jadwal Pemupukan Kebun (Admin - Pagination & Filter)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'farmer_id', in: 'query', schema: { type: 'string' } },
          { name: 'tree_id', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Seluruh jadwal kebun.' } },
      },
    },
    '/api/ai/detect': {
      post: {
        tags: ['6. Deteksi AI & Chatbot'],
        summary: 'Unggah Foto Daun untuk Deteksi AI (FR-5)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['treeId', 'photo'],
                properties: {
                  treeId: { type: 'string', description: 'ID Pohon terkait' },
                  photo: { type: 'string', format: 'binary', description: 'File gambar daun (< 5MB)' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Deteksi AI berhasil diproses dan status pohon terupdate.' },
        },
      },
    },
    '/api/admin/ai-logs': {
      get: {
        tags: ['6. Deteksi AI & Chatbot'],
        summary: 'Riwayat Seluruh Deteksi AI Global (Admin - Pagination & Filter)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'isSick', in: 'query', schema: { type: 'boolean' } },
          { name: 'farmer_id', in: 'query', schema: { type: 'string' } },
          { name: 'tree_id', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Riwayat deteksi AI.' } },
      },
    },
    '/api/v1/chat': {
      post: {
        tags: ['6. Deteksi AI & Chatbot'],
        summary: 'Chatbot Asisten Pertanian Maxist (Multimodal & Context-Aware)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Bagaimana cara mengatasi bercak ganggang pada daun jeruk?' },
                  treeId: { type: 'string', description: 'Opsional: ID pohon untuk konteks histori' },
                  image_url: { type: 'string', description: 'Opsional: URL foto daun' },
                  db_context: { type: 'string', description: 'Opsional: Konteks tambahan' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Respons asisten chatbot.' } },
      },
    },
    '/api/harvests/report': {
      post: {
        tags: ['7. Lapor Panen & Cetak QR PDF'],
        summary: 'Petani Mengirim Laporan Panen',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['treeId', 'harvestDate'],
                properties: {
                  treeId: { type: 'string' },
                  harvestDate: { type: 'string', format: 'date', example: '2026-03-30' },
                  estimatedFruits: { type: 'integer', example: 75 },
                  notes: { type: 'string', example: 'Panen tahap pertama blok utara' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Laporan panen terkirim, status Pending.' } },
      },
    },
    '/api/admin/harvests': {
      get: {
        tags: ['7. Lapor Panen & Cetak QR PDF'],
        summary: 'Daftar Laporan Panen Admin (Pagination & Filter)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Verified'] } },
          { name: 'farmer_id', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Daftar panen berhasil diambil.' } },
      },
    },
    '/api/admin/harvests/{id}/verify-and-qr': {
      post: {
        tags: ['7. Lapor Panen & Cetak QR PDF'],
        summary: 'Verifikasi Panen & Generate PDF Lembar Stiker QR Code (FR-4)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  stickerCount: { type: 'integer', default: 6, example: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Panen terverifikasi dan file PDF stiker QR terbit.' },
        },
      },
    },
    '/api/sync/fertilizations': {
      post: {
        tags: ['8. Offline Synchronization'],
        summary: 'Batch Sinkronisasi Pemupukan Offline (FR-3)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    treeId: { type: 'string' },
                    scheduledDate: { type: 'string', format: 'date' },
                    actualDate: { type: 'string', format: 'date' },
                    fertilizerType: { type: 'string', example: 'NPK 16-16-16' },
                    status: { type: 'string', example: 'Selesai Dipupuk' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Sinkronisasi pemupukan berhasil.' } },
      },
    },
    '/api/sync/ai-detect': {
      post: {
        tags: ['8. Offline Synchronization'],
        summary: 'Batch Sinkronisasi Log Deteksi AI Offline (FR-3)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    treeId: { type: 'string' },
                    photoUrl: { type: 'string' },
                    result: { type: 'string', example: 'Daun Sehat' },
                    confidence: { type: 'number', example: 95.5 },
                    isSick: { type: 'boolean', example: false },
                    detectedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Sinkronisasi deteksi AI berhasil.' } },
      },
    },
    '/api/public/trace/{batch_id}': {
      get: {
        tags: ['9. Traceability (Public & Konsumen)'],
        summary: 'Scan QR / Cek Mutu Keterlacakan Produk (Public - No Login Required)',
        parameters: [{ name: 'batch_id', in: 'path', required: true, schema: { type: 'string', example: 'BATCH-BBS001-20260315' } }],
        responses: {
          200: {
            description: 'Data perjalanan mutu produk lengkap jika pohon sehat; atau pesan peringatan error jika pohon sakit saat siklus tanam (Gerbang Logika AI).',
          },
          404: { description: 'Batch ID tidak ditemukan.' },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  const customOptions = {
    customSiteTitle: 'BE-Maxima API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, customOptions));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, customOptions));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = {
  setupSwagger,
  swaggerSpec,
};

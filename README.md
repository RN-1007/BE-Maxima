# BE-Maxima (Smart Agriculture & AI Traceability Backend)

Backend RESTful API untuk sistem perkebunan durian/buah Maxima berbasis Express.js dengan arsitektur **Clean Code Modular Per-Fitur** (`model`, `service`, `controller`), terintegrasi dengan ORM Prisma, AI Gateway ke microservice FastAPI, PDF Generator stiker QR Code panen, dan telah dibungkus dengan Docker.

---

## 🏛️ Arsitektur Proyek (Clean Code Per-Fitur)

Setiap modul fitur bisnis dipisahkan ke dalam foldernya masing-masing di `src/features/<nama-fitur>/`, dan dipecah menjadi tiga lapisan utama:
1. **`model/`**: Bertanggung jawab atas query data, manipulasi database melalui Prisma, dan transaksi database (misal FR-1 otomatisasi jadwal).
2. **`service/`**: Menangani seluruh aturan bisnis (Business Logic), validasi kepemilikan data (FR-2 data isolation), pemanggilan AI Gateway FastAPI (FR-5), perakitan Batch QR Code PDF (FR-4), dan gerbang seleksi mutu AI konsumen.
3. **`controller/`**: Mengatur penanganan request/response HTTP, validasi input, status code, dan standardisasi output JSON.

```
BE-Maxima/
├── prisma/
│   ├── schema.prisma          # Skema Prisma (User, Tree, Fertilization, AiLog, Harvest)
│   └── seed.js                # Data seeder awal (Admin & Petani & Pohon Contoh)
├── src/
│   ├── config/                # Konfigurasi database, env, dan konstanta
│   ├── middlewares/           # JWT Auth, Role RBAC, Multer File Upload, Global Error Handler
│   ├── utils/                 # Standardized Response, QR Code generator, PDF Kit sticker generator
│   ├── features/
│   │   ├── auth/              # POST /api/auth/login (JWT)
│   │   ├── farmers/           # CRUD Petani oleh Admin
│   │   ├── trees/             # Tambah Pohon (FR-1 Auto Jadwal) & Isolasi Data (FR-2)
│   │   ├── fertilizations/    # To-do Pemupukan & Offline Sync (FR-3)
│   │   ├── ai/                # AI Gateway (<5MB, FastAPI forward, status update FR-5)
│   │   ├── harvests/          # Lapor Panen & Generate PDF Stiker Batch QR Code (FR-4)
│   │   └── traceability/      # Scan Publik Konsumen dengan Gerbang Logika AI
│   ├── routes/                # Route aggregators (sync routes, dsb.)
│   ├── app.js                 # Setup Express Application
│   └── server.js              # Server entrypoint
├── uploads/                   # Folder upload foto daun & PDF stiker QR
├── test/
│   ├── fixtures/              # Dummy file untuk testing upload
│   └── integration.test.js    # Suite test otomatis 100% endpoint TODO.md
├── Dockerfile                 # Multi-stage image build
├── docker-compose.yml         # Container App + PostgreSQL
├── TODO.md                    # Checklist seluruh spesifikasi SRS
└── package.json
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Inisialisasi Database & Seeding
```bash
# Push skema ke database
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# Jalankan seeder akun default
npm run prisma:seed
```

### 3. Menjalankan Server
```bash
# Mode development (dengan nodemon)
npm run dev

# Mode production
npm start
```
Server akan aktif di `http://localhost:3000`.

### 4. Menjalankan Automated Integration Test
Untuk memvalidasi seluruh endpoint dan functional requirements (FR-1 s/d FR-5):
```bash
npm test
```

---

## 🐳 Panduan Menjalankan dengan Docker & Docker Compose

Proyek ini telah dibungkus lengkap dengan Docker dan Docker Compose.

### Menjalankan Stack (App + Database PostgreSQL)
Pastikan Docker Desktop aktif, lalu jalankan:
```bash
docker compose up --build
```
Docker Compose akan otomatis:
1. Memulai container database PostgreSQL `maxima_postgres` dengan volume persistence.
2. Membangun image `maxima_api` dari `Dockerfile`.
3. Menjalankan migrasi `prisma db push` dan menjalankan seeder `prisma/seed.js` secara otomatis.
4. Mengekspos API di port `3000`.

Untuk menghentikan:
```bash
docker compose down
```

---

## 🔑 Kredensial Akun Bawaan (Hasil Seeder)

| Peran | Email | Kata Sandi | Deskripsi |
|---|---|---|---|
| **Admin** | `admin@maxima.com` | `Admin123!` | Akses admin untuk kelola petani, rekap pohon, verifikasi panen & cetak QR PDF. |
| **Petani 1** | `petani1@maxima.com` | `Petani123!` | Petani Budi Santoso (Desa Bibis, Blok Utara). Memiliki pohon sehat & jadwal pemupukan. |
| **Petani 2** | `petani2@maxima.com` | `Petani123!` | Petani Siti Rahma (Desa Bibis, Blok Selatan). |

---

## 📑 Daftar Endpoint API Sesuai TODO.md

### 1. Autentikasi & Pengguna (Admin)
- `POST /api/auth/login` - Login admin/petani, menerima token JWT.
- `GET /api/admin/farmers` - Daftar petani + profil & lokasi (Admin only).
- `POST /api/admin/farmers` - Tambah akun petani baru (Admin only).
- `PUT /api/admin/farmers/:id` - Update data akun petani (Admin only).
- `DELETE /api/admin/farmers/:id` - Hapus akun petani (Admin only).

### 2. Pohon & Lahan (Petani & Admin)
- `POST /api/trees` - Tambah pohon baru. **FR-1**: Otomatis generate rencana jadwal pemupukan (Day 7, 30, 60, 90, 180).
- `GET /api/trees/my-trees` - **FR-2**: Hanya melihat ringkasan pohon milik petani yang login.
- `GET /api/admin/trees` - Rekapitulasi global pohon dengan filter `?farmer_id=&health_status=&age=`.

### 3. Pemupukan & Offline Sync
- `GET /api/fertilizations/schedule` - Daftar to-do list pemupukan petani (hari ini & mendatang).
- `PUT /api/fertilizations/:id/complete` - Tandai pemupukan selesai & catat tanggal aktual.
- `POST /api/sync/fertilizations` - **FR-3**: Sinkronisasi batch array dari offline IndexedDB.

### 4. AI Gateway & Monitoring Penyakit
- `POST /api/ai/detect` - **FR-5**: Upload foto daun (<5MB), diteruskan ke microservice FastAPI (atau fallback cerdas), catat riwayat log AI, dan otomatis ubah status pohon menjadi "Sakit" atau "Sehat".
- `POST /api/sync/ai-detect` - **FR-3**: Sinkronisasi batch data foto AI offline.
- `GET /api/admin/ai-logs` - Rekap global riwayat deteksi AI untuk analisis tren penyakit.

### 5. Lapor Panen & Cetak QR Code
- `POST /api/harvests/report` - Petani lapor panen (status: `Pending`).
- `GET /api/admin/harvests` - Admin melihat antrean laporan panen.
- `POST /api/admin/harvests/:id/verify-and-qr` - **FR-4**: Admin memverifikasi panen, men-generate Batch ID unik, dan meng-generate file **PDF lembar stiker QR Code**.

### 6. Endpoint Konsumen (Scan & Traceability)
- `GET /api/public/trace/:batch_id` - Akses publik konsumen tanpa login.
  - **Gerbang Logika AI**: Jika riwayat AI pohon terdeteksi "Sakit" tanpa log sembuh sebelum tanggal panen, mengembalikan peringatan: `⚠️ Peringatan: Produk Tidak Memenuhi Standar Mutu AI` dan menyembunyikan detail kebun.
  - Jika "Sehat": Menampilkan seluruh riwayat mutu (Nama Petani, Desa Bibis, Tanggal Tanam, Rekap Pemupukan, Tanggal AI terakhir, Tanggal Panen).

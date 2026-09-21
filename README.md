# 🌿 BE-Maxima (Smart Agriculture & AI Traceability Backend)

> Backend RESTful API untuk ekosistem perkebunan Jeruk Bali / Pamelo Magetan Maxima berbasis **Express.js**, **Prisma ORM**, dan **PostgreSQL**. Menerapkan arsitektur **Clean Code Modular Per-Fitur** (`model/`, `service/`, `controller/`), dokumentasi interaktif **Swagger / OpenAPI 3.0**, standardisasi **Pagination & Search** pada seluruh endpoint GET, AI Gateway ke Microservice Python AI Engineer, Chatbot Asisten Maxist Multimodal (*DB Context*), PDF Generator stiker QR Code panen, dan kontainerisasi Docker.

---

## 📑 Daftar Isi
1. [Dokumentasi Interaktif Swagger UI (Testing API)](#-dokumentasi-interaktif-swagger-ui-testing-api)
2. [Panduan Integrasi Tim Frontend (API Contract)](#-panduan-integrasi-tim-frontend-api-contract)
   - [Konvensi Standar Request & Response](#konvensi-standar-request--response)
   - [Standar Metadata Pagination & Filtering](#standar-metadata-pagination--filtering)
   - [1. Authentication & Profil](#1-authentication--profil)
   - [2. Manajemen Petani (Admin)](#2-manajemen-petani-admin)
   - [3. Manajemen Pohon & Lahan (Siklus Awal)](#3-manajemen-pohon--lahan-siklus-awal)
   - [4. Jadwal Pemupukan & Offline Sync](#4-jadwal-pemupukan--offline-sync)
   - [5. Deteksi AI & Monitoring Penyakit (Siklus Tengah)](#5-deteksi-ai--monitoring-penyakit-siklus-tengah)
   - [6. Chatbot Asisten Maxist (Multimodal & DB Context)](#6-chatbot-asisten-maxist-multimodal--db-context)
   - [7. Lapor Panen & Cetak QR Code (Siklus Akhir)](#7-lapor-panen--cetak-qr-code-siklus-akhir)
   - [8. Scan Konsumen & Traceability Journey (Publik)](#8-scan-konsumen--traceability-journey-publik)
   - [9. Dashboard & Analitik Admin](#9-dashboard--analitik-admin)
3. [Arsitektur Clean Code Modular](#-arsitektur-clean-code-modular)
4. [Panduan Skema Pengujian Otomasi (Test Suite)](#-panduan-skema-pengujian-otomasi-test-suite)
5. [Menjalankan dengan Docker & Database](#-menjalankan-dengan-docker--database)

---

## 📖 Dokumentasi Interaktif Swagger UI (Testing API)

BE-Maxima dilengkapi dengan **Swagger UI** berbasis spesifikasi OpenAPI 3.0 untuk mempermudah pengujian endpoint langsung dari browser tanpa perlu konfigurasi Postman manual:

- **Swagger UI Lokal:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs) *(alias: `/docs`)*
- **Swagger UI Produksi:** `https://api.maximaa.tech/api-docs`
- **OpenAPI JSON Spec:** [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

### Cara Menggunakan Swagger UI untuk Testing:
1. Buka [http://localhost:3000/api-docs](http://localhost:3000/api-docs) di browser.
2. Buka tag **1. Authentication** lalu eksekusi endpoint `POST /api/auth/login` dengan kredensial Admin atau Petani.
3. Salin nilai `token` dari respons JSON.
4. Klik tombol hijau **Authorize 🔓** di bagian kanan atas halaman Swagger.
5. Masukkan token Anda (contoh: `Bearer eyJhbGci...` atau cukup `eyJhbGci...`) lalu klik **Authorize**.
6. Sekarang Anda dapat menguji seluruh endpoint terproteksi secara interaktif menggunakan tombol **Try it out** dan **Execute**!

---

## 🚀 Panduan Integrasi Tim Frontend (API Contract)

### Konvensi Standar Request & Response

- **Base URL Lokal:** `http://localhost:3000`
- **Base URL Produksi:** `https://api.maximaa.tech`
- **Default Header (JSON):**
  ```http
  Content-Type: application/json
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Default Header (Upload File Foto):**
  ```http
  Content-Type: multipart/form-data
  Authorization: Bearer <JWT_TOKEN>
  ```

#### Format Response Sukses (Standard Envelope):
```json
{
  "success": true,
  "message": "Deskripsi aksi berhasil.",
  "data": { ... }
}
```

#### Format Response Gagal / Error:
```json
{
  "success": false,
  "message": "Penyebab error atau validasi gagal.",
  "errors": null
}
```

---

### Standar Metadata Pagination & Filtering

Seluruh endpoint `GET` yang mengembalikan daftar koleksi data mendukung pagination dengan query parameter `?page=...&limit=...` (dan filter opsional).

#### Query Parameter Standar:
- `page`: Nomor halaman (integer, default: `1`).
- `limit` (alias: `pageSize`, `per_page`): Jumlah data per halaman (integer, default: `10`, max: `100`).
- `search`: Kata kunci pencarian nama, kode pohon, varietas, atau lokasi kebun.

#### Struktur Response dengan Metadata Pagination:
```json
{
  "success": true,
  "message": "Berhasil mengambil daftar data.",
  "data": [
    { ... }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 1. Authentication & Profil

#### `POST /api/auth/login`
- **Aktor:** Admin & Petani (Publik)
- **Fungsi:** Login akun untuk memperoleh JWT Token.
- **Request Body:**
  ```json
  {
    "email": "admin@maxima.com",
    "password": "Admin123!"
  }
  ```
  *(Dapat juga menggunakan identifier `"username"`)*

#### `GET /api/auth/me`
- **Aktor:** Authenticated (Admin / Petani)
- **Fungsi:** Memeriksa sesi dan profil pengguna aktif.

---

### 2. Manajemen Petani (Admin)

#### `GET /api/admin/farmers`
- **Aktor:** Admin Only
- **Fungsi:** Mengambil daftar seluruh akun petani (Mendukung Pagination & Search).
- **Query Params:** `?page=1&limit=10&search=Bibis`

#### `POST /api/admin/farmers`
- **Aktor:** Admin Only
- **Fungsi:** Menambah akun petani baru.
- **Request Body:**
  ```json
  {
    "name": "Pak Joko Santoso",
    "email": "joko@maxima.com",
    "username": "petani_joko",
    "password": "Password123!",
    "phone": "081234567890",
    "location": "Desa Bibis, Blok D"
  }
  ```

#### `GET /api/admin/farmers/:id`
- **Aktor:** Admin Only
- **Fungsi:** Mengambil detail petani beserta daftar pohon miliknya.

#### `PUT /api/admin/farmers/:id`
- **Aktor:** Admin Only
- **Fungsi:** Update profil/data petani.

#### `DELETE /api/admin/farmers/:id`
- **Aktor:** Admin Only
- **Fungsi:** Menghapus akun petani.

---

### 3. Manajemen Pohon & Lahan (Siklus Awal)

#### `POST /api/trees` (Petani) & `POST /api/admin/trees` (Admin)
- **Fungsi:** Menambah pohon/blok baru.
- **FR-1 (Otomatisasi Jadwal):** Backend **otomatis** membuat 5 rencana pemupukan (Day 7, 30, 60, 90, 180) di tabel jadwal saat endpoint ini dieksekusi!
- **Request Body:**
  ```json
  {
    "treeCode": "PHN-BBS-010",
    "plantingDate": "2026-03-01",
    "locationBlock": "Blok A-02",
    "variety": "Jeruk Bali Merah",
    "coordinates": "7°37'42\"S 111°26'18\"E"
  }
  ```

#### `GET /api/trees/my-trees`
- **Aktor:** Petani (**FR-2 Isolasi Data**)
- **Fungsi:** Mengambil ringkasan data pohon milik sendiri dengan kalkulasi umur hari & bulan serta pagination.
- **Query Params:** `?page=1&limit=10&health_status=Sehat&search=Blok`

#### `GET /api/admin/trees`
- **Aktor:** Admin Only
- **Fungsi:** Rekapitulasi global seluruh pohon dari semua petani.
- **Query Filter:** `?page=1&limit=10&farmer_id=...&health_status=Sehat&age=30&search=PHN`

#### `GET /api/trees/:id`
- **Fungsi:** Detail pohon beserta riwayat jadwal pemupukan dan log deteksi AI.

#### `PUT /api/admin/trees/:id` & `DELETE /api/admin/trees/:id`
- **Aktor:** Admin Only

---

### 4. Jadwal Pemupukan & Offline Sync

#### `GET /api/fertilizations/schedule`
- **Aktor:** Petani
- **Fungsi:** To-do list jadwal pemupukan milik petani dengan pagination dan kalkulasi status urgensi (`"Hari Ini"`, `"Mendatang"`, `"Terlambat (Overdue)"`, `"Selesai"`).
- **Query Params:** `?page=1&limit=10&status=Pending&startDate=2026-03-01&endDate=2026-03-31`

#### `PUT /api/fertilizations/:id/complete`
- **Aktor:** Petani
- **Fungsi:** Tandai pemupukan selesai dan catat tanggal aktual pemupukan.
- **Request Body:**
  ```json
  {
    "actualDate": "2026-03-10",
    "notes": "Pemupukan pupuk kandang organik 2kg selesai diaplikasikan."
  }
  ```

#### `GET /api/admin/fertilizations`
- **Aktor:** Admin Only
- **Fungsi:** Rekap seluruh jadwal pemupukan kebun dengan pagination & filter `?status=...&farmer_id=...&tree_id=...`.

#### `POST /api/sync/fertilizations`
- **Aktor:** Petani (**FR-3 Offline Sync**)
- **Fungsi:** Batch sync data pemupukan yang disimpan di IndexedDB saat offline.

---

### 5. Deteksi AI & Monitoring Penyakit (Siklus Tengah)

#### `POST /api/ai/detect`
- **Aktor:** Petani & Admin
- **Content-Type:** `multipart/form-data`
- **FR-5 (AI Gateway & Two-Step Gatekeeper):**
  1. Validasi ukuran file foto (< 5MB).
  2. Forward foto ke Microservice AI FastAPI/Flask dengan verifikasi Satpam Daun Jeruk Bali.
  3. Simpan log deteksi ke database (`ai_logs`).
  4. Otomatis perbarui status pohon menjadi **"Sakit"** jika terdeteksi penyakit, atau **"Sehat"** jika pulih.
- **Form-Data Fields:**
  - `treeId`: string (ID pohon)
  - `photo`: File gambar daun (JPG/PNG/WebP, max 5MB)

#### `POST /api/sync/ai-detect`
- **Aktor:** Petani (**FR-3 Batch AI Sync**)
- **Fungsi:** Kirim batch log deteksi offline ke server saat online kembali.

#### `GET /api/admin/ai-logs`
- **Aktor:** Admin Only
- **Fungsi:** Rekapitulasi log deteksi AI global dengan pagination & kalkulasi tingkat keparahan (`severity`: `low`, `medium`, `high`).
- **Query Params:** `?page=1&limit=10&isSick=true&farmer_id=...&tree_id=...`

---

### 6. Chatbot Asisten Maxist (Multimodal & DB Context)

#### `POST /api/v1/chat` *(Alias: `/api/ai/chat`, `/api/chat`)*
- **Aktor:** Petani / Frontend App
- **Fungsi:** Menghubungkan aplikasi dengan AI Chatbot (Maxist). Backend secara otomatis mengambil konteks kebun & pohon dari PostgreSQL untuk menghasilkan saran budidaya yang presisi.
- **Request Body:**
  ```json
  {
    "message": "Bagaimana cara menangani penyakit bercak ganggang pada pohon saya?",
    "treeId": "c1f76d90-a54b-4c4b-8fd1-253380e224e7",
    "image_url": "https://api.maximaa.tech/uploads/leaves/scan_daun.jpg"
  }
  ```

---

### 7. Lapor Panen & Cetak QR Code (Siklus Akhir)

#### `POST /api/harvests/report`
- **Aktor:** Petani
- **Fungsi:** Kirim laporan panen (status: `"Pending"`).
- **Request Body:**
  ```json
  {
    "treeId": "c1f76d90-a54b-4c4b-8fd1-253380e224e7",
    "harvestDate": "2026-03-25",
    "estimatedFruits": 75,
    "notes": "Panen raya blok barat"
  }
  ```

#### `GET /api/admin/harvests`
- **Aktor:** Admin Only
- **Fungsi:** Mengambil daftar antrean laporan panen dengan pagination & filter `?page=1&limit=10&status=Pending`.

#### `POST /api/admin/harvests/:id/verify-and-qr`
- **Aktor:** Admin Only (**FR-4 Verifikasi & Cetak QR PDF**)
- **Fungsi:** Verifikasi panen, generate Batch ID (`BATCH-KODEPOHON-TANGGAL-RANDOM`), dan menghasilkan file **PDF lembar stiker QR Code** siap cetak.
- **Request Body (Opsional):** `{ "stickerCount": 6 }`

---

### 8. Scan Konsumen & Traceability Journey (Publik)

#### `GET /api/public/trace/:batch_id`
- **Aktor:** Konsumen Publik (Tanpa Login)
- **Fungsi:** Mengembalikan data timeline perjalanan mutu produk dari sebuah Batch ID (yang ada di dalam QR Code stiker buah).
- **Gerbang Logika AI:**
  - Jika pohon berstatus **"Sakit"** saat panen, sistem merespons penolakan mutu (`warning: "⚠️ Peringatan: Produk Tidak Memenuhi Standar Mutu AI"`) dan menyembunyikan identitas kebun/petani.
  - Jika **"Sehat"**, menyajikan timeline lengkap: Nama Petani, Lokasi Kebun, Tanggal Tanam, Rekap Pemupukan, Tanggal Verifikasi AI, dan Tanggal Panen.

---

### 9. Dashboard & Analitik Admin

#### `GET /api/admin/dashboard/stats`
- **Fungsi:** KPI utama (Total Petani, Total Pohon, Pohon Sehat/Sakit, Total Panen, Total Pemupukan).

#### `GET /api/admin/dashboard/trend`
- **Fungsi:** Grafik tren kesehatan kebun dan persentase pohon sehat vs sakit.

#### `GET /api/admin/dashboard/overview`
- **Fungsi:** Ringkasan lengkap dashboard dalam satu pemanggilan endpoint.

---

## 🏛️ Arsitektur Clean Code Modular

```
src/
├── config/           # Database, constants, env, swagger config
│   ├── database.js
│   ├── constants.js
│   ├── env.js
│   └── swagger.js    # OpenAPI 3.0 & Swagger UI Router
├── features/         # Modular domain features
│   ├── auth/           (model, service, controller, routes)
│   ├── farmers/        (model, service, controller, routes)
│   ├── trees/          (model, service, controller, routes)
│   ├── fertilizations/ (model, service, controller, routes)
│   ├── ai/             (model, service, controller, routes, chat)
│   ├── harvests/       (model, service, controller, routes)
│   ├── dashboard/      (model, service, controller, routes)
│   └── traceability/   (model, service, controller, routes)
├── middlewares/      # Auth JWT, Role RBAC, Upload Multer, Error Handlers
├── utils/            # Pagination helper, PDF generator, QR generator, Response envelope
├── app.js            # Express app assembly & Swagger mount
└── server.js         # Server bootstrap listener
```

---

## 🧪 Panduan Skema Pengujian Otomasi (Test Suite)

Proyek dilengkapi dengan 8 modul test suite otomatis end-to-end:

| Perintah Terminal | Modul yang Diuji |
|---|---|
| `npm test` atau `npm run test:all` | **Menjalankan seluruh 8 modul suite secara berurutan** |
| `npm run test:auth` | Login Admin, Petani, Password salah, Validasi token JWT |
| `npm run test:farmers` | RBAC larangan akses petani, CRUD Akun Petani oleh Admin |
| `npm run test:trees` | **FR-1** Auto Jadwal Pemupukan, **FR-2** Isolasi Data Petani |
| `npm run test:fertilizations` | To-do Pemupukan, Penyelesaian Jadwal, **FR-3** Batch Offline Sync |
| `npm run test:ai` | **FR-5** Upload Foto Daun (<5MB), Gateway AI Satpam, Chatbot Maxist |
| `npm run test:harvests` | Lapor Panen & **FR-4** Verifikasi Admin serta cetak PDF Stiker QR |
| `npm run test:traceability` | Scan QR Konsumen (Lolos Mutu Sehat vs Ditolak Standar Mutu AI) |
| `npm run test:pagination` | **Pagination & filter pada seluruh endpoint koleksi GET** |

---

## 🐳 Menjalankan dengan Docker & Database

### 1. Konfigurasi `.env`:
```env
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres:pomelomaxima@localhost:5432/be_maxima?schema=public"

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Microservice AI Python Service URL
AI_SERVICE_URL=https://ai.maximaa.tech/api/v1/predict
AI_CHAT_URL=https://ai.maximaa.tech/api/v1/chat
```

> ⚠️ **Catatan Keamanan Produksi:**
> - Jangan pernah meng-commit file `.env` asli yang berisi password database atau kunci rahasia ke repository publik.
> - Pastikan mengganti nilai `JWT_SECRET` dan password database PostgreSQL dengan string acak berkekuatan tinggi di lingkungan production.

### 2. Migrasi & Seed Database:
```bash
# Push skema Prisma ke database
npm run prisma:push

# Generate client Prisma
npm run prisma:generate

# Jalankan seeder akun & data awal
npm run prisma:seed
```

### 3. Menjalankan Aplikasi:
```bash
# Mode Development (Hot Reload)
npm run dev

# Mode Production
npm start

# Atau jalankan via Docker Compose
docker compose up -d --build
```

### 4. Kredensial Default untuk Pengujian:
- **Admin:** `admin@maxima.com` / `Admin123!`
- **Petani 1:** `petani1@maxima.com` / `Petani123!`
- **Petani 2:** `petani2@maxima.com` / `Petani123!`
- **Batch Sehat (Siap Scan):** `BATCH-BBS001-20260315`
- **Batch Sakit (Uji Standar AI):** `BATCH-SICK-20260320`
- **Dokumentasi Swagger:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

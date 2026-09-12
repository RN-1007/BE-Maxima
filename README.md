# 🌿 BE-Maxima (Smart Agriculture & AI Traceability Backend)

> Backend RESTful API untuk ekosistem perkebunan Jeruk Bali / Pamelo Magetan Maxima berbasis **Express.js**, **Prisma ORM**, dan **PostgreSQL**. Menerapkan prinsip **Clean Code Modular Per-Fitur** (`model/`, `service/`, `controller/`), AI Gateway ke Microservice Python AI Engineer, Chatbot Asisten Maxist Multimodal dengan integrasi *DB Context*, PDF Generator stiker QR Code panen, dan kontainerisasi Docker.

---

## 📑 Daftar Isi
1. [Panduan Integrasi Tim Frontend (API Contract)](#-panduan-integrasi-tim-frontend-api-contract)
   - [Konvensi Standar Request & Response](#konvensi-standar-request--response)
   - [1. Authentication & Manajemen Pengguna](#1-authentication--manajemen-pengguna)
   - [2. Manajemen Pohon & Lahan (Siklus Awal)](#2-manajemen-pohon--lahan-siklus-awal)
   - [3. Jadwal Pemupukan & Offline Sync](#3-jadwal-pemupukan--offline-sync)
   - [4. Deteksi AI & Monitoring Penyakit (Siklus Tengah)](#4-deteksi-ai--monitoring-penyakit-siklus-tengah)
   - [5. Chatbot Asisten Maxist (Multimodal & DB Context)](#5-chatbot-asisten-maxist-multimodal--db-context)
   - [6. Lapor Panen & Cetak QR Code (Siklus Akhir)](#6-lapor-panen--cetak-qr-code-siklus-akhir)
   - [7. Scan Konsumen & Traceability Journey (Publik)](#7-scan-konsumen--traceability-journey-publik)
   - [8. Dashboard & Analitik Admin](#8-dashboard--analitik-admin)
2. [Arsitektur Clean Code Modular](#-arsitektur-clean-code-modular)
3. [Panduan Skema Pengujian Otomasi (Test Suite)](#-panduan-skema-pengujian-otomasi-test-suite)
4. [Menjalankan dengan Docker & Database](#-menjalankan-dengan-docker--database)

---

## 🚀 Panduan Integrasi Tim Frontend (API Contract)

### Konvensi Standar Request & Response

- **Base URL Lokal:** `http://localhost:3000`
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

### 1. Authentication & Manajemen Pengguna

#### `POST /api/auth/login`
- **Aktor:** Admin & Petani (Publik)
- **Fungsi:** Login akun untuk memperoleh JWT Token.
- **Request Body:**
  ```json
  {
    "email": "petani1@maxima.com",
    "password": "Petani123!"
  }
  ```
- **Response 200 (OK):**
  ```json
  {
    "success": true,
    "message": "Login berhasil.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "c1f76d90-a54b-4c4b-8fd1-253380e224e7",
        "email": "petani1@maxima.com",
        "name": "Budi Santoso",
        "role": "farmer",
        "phone": "081298765432",
        "location": "Desa Bibis, Magetan"
      }
    }
  }
  ```

#### `GET /api/auth/me`
- **Aktor:** Authenticated (Admin/Petani)
- **Fungsi:** Memeriksa sesi dan profil pengguna aktif dari token JWT.

#### `GET /api/admin/farmers`
- **Aktor:** Admin Only
- **Fungsi:** Mengambil daftar semua petani beserta profil, lokasi, dan jumlah pohon miliknya.

#### `POST /api/admin/farmers`
- **Aktor:** Admin Only
- **Fungsi:** Menambah akun petani baru.
- **Request Body:**
  ```json
  {
    "name": "Pak Joko",
    "email": "joko@maxima.com",
    "password": "Password123!",
    "phone": "08123456789",
    "location": "Desa Bibis, Magetan"
  }
  ```

#### `PUT /api/admin/farmers/:id` & `DELETE /api/admin/farmers/:id`
- **Aktor:** Admin Only (Update profil & hapus akun petani).

---

### 2. Manajemen Pohon & Lahan (Siklus Awal)

#### `POST /api/trees` (Petani) & `POST /api/admin/trees` (Admin)
- **Fungsi:** Menambah pohon/blok baru.
- **FR-1 (Otomatisasi Jadwal):** Backend **otomatis** membuat 5 rencana pemupukan (Day 7, 30, 60, 90, 180) di tabel jadwal saat endpoint ini dipanggil!
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
- **Aktor:** Petani
- **Fungsi:** Mengambil data pohon milik petani yang login (**FR-2 Isolasi Data**).

#### `GET /api/admin/trees`
- **Aktor:** Admin Only
- **Query Filter Opsional:** `?farmer_id=...&health_status=Sehat&age=30`

---

### 3. Jadwal Pemupukan & Offline Sync

#### `GET /api/fertilizations/schedule`
- **Aktor:** Petani
- **Fungsi:** Menampilkan to-do list pemupukan (kalender/daftar) milik petani dengan kalkulasi status waktu (`"Hari Ini"`, `"Mendatang"`, `"Terlambat (Overdue)"`, `"Selesai"`).

#### `PUT /api/fertilizations/:id/complete`
- **Aktor:** Petani
- **Fungsi:** Tandai pemupukan selesai dan catat tanggal aktual.

#### `POST /api/sync/fertilizations`
- **Aktor:** Petani (**FR-3 Offline Sync**)
- **Fungsi:** Batch sync data pemupukan yang disimpan di IndexedDB saat offline.

---

### 4. Deteksi AI & Monitoring Penyakit (Siklus Tengah)

#### `POST /api/ai/detect`
- **Aktor:** Petani & Admin
- **Content-Type:** `multipart/form-data`
- **FR-5 (AI Gateway & Two-Step Gatekeeper):**
  1. Validasi ukuran file foto (< 5MB).
  2. Forward ke Microservice AI Engineer (dengan verifikasi Satpam Daun Jeruk Bali).
  3. Simpan log deteksi ke database (`ai_logs`).
  4. Otomatis perbarui status pohon menjadi **"Sakit"** jika terdeteksi penyakit, atau **"Sehat"** jika pulih.
- **Form-Data Fields:**
  - `treeId`: string (ID pohon)
  - `photo`: File gambar (JPG/PNG/WebP, max 5MB)

#### `POST /api/sync/ai-detect`
- **Aktor:** Petani (**FR-3 Batch AI Sync**)
- **Fungsi:** Kirim batch riwayat deteksi offline ke server saat kembali tersambung internet.

#### `GET /api/admin/ai-logs`
- **Aktor:** Admin Only
- **Fungsi:** Rekapitulasi log deteksi AI global dengan perhitungan tingkat keparahan penyakit (`severity`: `low`, `medium`, `high`).

---

### 5. Chatbot Asisten Maxist (Multimodal & DB Context)

#### `POST /api/v1/chat`
*(Alias Path: `POST /api/ai/chat` atau `POST /api/chat`)*

- **Aktor:** Publik / Petani / Frontend App
- **Content-Type:** `application/json`
- **Fungsi:** Menghubungkan Frontend dengan AI Chatbot (Maxist). Backend secara otomatis mengambil data historis kebun dari PostgreSQL (jika `treeId` dikirim) untuk dijadikan `db_context` lalu mem-forward request ke Microservice AI Engineer (`AI_CHAT_URL`).
- **Request Body:**
  ```json
  {
    "message": "Bagaimana cara penanganan bercak ganggang pada daun jeruk bali saya?",
    "db_context": "Hasil scan terakhir: Terindikasi Bercak Ganggang (Cephaleuros virescens) dengan keyakinan 98.45%.",
    "treeId": "c1f76d90-a54b-4c4b-8fd1-253380e224e7",
    "image_url": "http://localhost:3000/uploads/leaves/scan_daun_pomelo.jpg",
    "history": [
      {
        "role": "user",
        "parts": ["Halo Maxist, saya petani jeruk bali."]
      },
      {
        "role": "model",
        "parts": ["Halo Bapak/Ibu Petani! Senang bertemu Anda. Ada yang bisa Maxist bantu seputar tanaman jeruk bali Anda?"]
      }
    ]
  }
  ```
- **Response 200 (OK):**
  ```json
  {
    "status": "success",
    "data": {
      "reply": "Halo Bapak/Ibu Petani! Berdasarkan kondisi pohon dan hasil diagnosis Bercak Ganggang, langkah penanganan yang disarankan adalah pangkas daun terinfeksi dan semprotkan fungisida berbahan aktif tembaga..."
    }
  }
  ```
- **Response 400 (Bad Request):**
  ```json
  {
    "status": "fail",
    "message": "Parameter 'message' wajib diisi dan tidak boleh kosong."
  }
  ```
- **Response 500 (Internal Server Error / AI Microservice Offline):**
  ```json
  {
    "status": "error",
    "message": "Layanan AI Chatbot (http://localhost:5000/api/v1/chat) tidak dapat dihubungi. Pastikan server AI Engineer sedang berjalan."
  }
  ```

---

### 6. Lapor Panen & Cetak QR Code (Siklus Akhir)

#### `POST /api/harvests/report`
- **Aktor:** Petani
- **Fungsi:** Kirim laporan siap panen ke antrean verifikasi Admin (status: `"Pending"`).

#### `GET /api/admin/harvests`
- **Aktor:** Admin Only
- **Fungsi:** Mengambil daftar laporan panen (`Pending` atau `Verified`).

#### `POST /api/admin/harvests/:id/verify-and-qr`
- **Aktor:** Admin Only (**FR-4 Verifikasi Panen & Cetak QR PDF**)
- **Fungsi:** Verifikasi panen, generate Batch ID unik (`BATCH-KODEPOHON-TANGGALPANEN-RANDOM`), dan menghasilkan file **PDF stiker QR Code** siap cetak.
- **Request Body (Opsional):** `{ "stickerCount": 6 }`
- **Response 200 (OK):**
  ```json
  {
    "success": true,
    "message": "Laporan panen berhasil diverifikasi dan file PDF stiker QR Code telah di-generate.",
    "data": {
      "status": "Verified",
      "batchId": "BATCH-PHNBBS010-20260325-1420",
      "traceUrl": "http://localhost:3000/api/public/trace/BATCH-PHNBBS010-20260325-1420",
      "pdfDownloadUrl": "http://localhost:3000/uploads/pdf/batch-BATCH-PHNBBS010-20260325-1420.pdf"
    }
  }
  ```

---

### 7. Scan Konsumen & Traceability Journey (Publik)

#### `GET /api/public/trace/:identifier`
- **Aktor:** Konsumen Publik (Tanpa Login)
- **Fungsi:** Endpoint pencarian ganda (*Dual-Lookup*) berdasarkan **Batch ID** atau **Kode Pohon**.
- **Gerbang Logika AI:**
  - Jika pohon terdeteksi "Sakit" dan belum ada bukti log pemulihan sebelum panen, produk ditolak (`status: "DITOLAK_MUTU_AI"`) dan data identitas petani disembunyikan.
  - Jika "Sehat", menyajikan *Rich Digital Timeline Journey* (pembibitan, irigasi, pemupukan, verifikasi AI, hingga panen) beserta koordinat GPS kebun.

---

### 8. Dashboard & Analitik Admin

#### `GET /api/admin/dashboard/stats`
- **Fungsi:** Statistik ringkasan (Total Petani, Total Pohon, Persentase Kesehatan Pohon, Total Log AI).

#### `GET /api/admin/dashboard/trend`
- **Fungsi:** Tren grafik pemupukan dan deteksi penyakit bulanan.

#### `GET /api/admin/dashboard/overview`
- **Fungsi:** Ringkasan alert AI terkini dan agenda pemupukan mendatang.

---

## 🏛️ Arsitektur Clean Code Modular

Proyek disusun dengan memisahkan domain per-fitur ke dalam folder `src/features/<nama-fitur>/`:
- **`model/`**: Logika Prisma ORM dan transaksi database.
- **`service/`**: Logika bisnis (isolasi data, gateway AI Engineer, kalkulasi umur pohon, gerbang mutu AI, integrasi chatbot).
- **`controller/`**: Parsing request HTTP dan penanganan format respon JSON.

```
src/features/
├── auth/           (model, service, controller, routes)
├── farmers/        (model, service, controller, routes)
├── trees/          (model, service, controller, routes)
├── fertilizations/ (model, service, controller, routes)
├── ai/             (model, service, controller, routes, chat.service, chat.controller)
├── harvests/       (model, service, controller, routes)
├── dashboard/      (model, service, controller, routes)
└── traceability/   (model, service, controller, routes)
```

---

## 🧪 Panduan Skema Pengujian Otomasi (Test Suite)

Proyek dilengkapi dengan skema pengujian otomatis end-to-end (100% Passed):

| Perintah Terminal | Modul yang Diuji |
|---|---|
| `npm test` atau `npm run test:all` | **Menjalankan seluruh 7 modul suite secara berurutan** |
| `npm run test:auth` | Uji Login Admin, Petani, Password salah, Validasi sesi |
| `npm run test:farmers` | Uji RBAC larangan petani, CRUD Akun Petani oleh Admin |
| `npm run test:trees` | Uji **FR-1** Auto Jadwal Pemupukan, **FR-2** Isolasi Data Petani |
| `npm run test:fertilizations` | Uji To-do Pemupukan, Selesai Dipupuk, dan **FR-3** Batch Offline Sync |
| `npm run test:ai` | Uji **FR-5** Upload Foto Daun (<5MB), Gateway Satpam AI, Chatbot `POST /api/v1/chat` |
| `npm run test:harvests` | Uji Lapor Panen & **FR-4** Verifikasi Admin serta cetak PDF Stiker QR |
| `npm run test:traceability` | Uji Scan Konsumen (Lolos Mutu Sehat vs Ditolak Mutu AI Sakit) |

Atau jalankan skrip PowerShell otomatis:
```powershell
./test-endpoints.ps1
```

---

## 🐳 Menjalankan dengan Docker & Database

### Konfigurasi `.env` (Microservice AI Engineer):
```env
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/be_maxima?schema=public

# JWT Authentication
JWT_SECRET=maxima_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

# Microservice Flask AI Service URL (Managed by AI Engineer)
AI_SERVICE_URL=http://localhost:5000/api/v1/predict
AI_CHAT_URL=http://localhost:5000/api/v1/chat
```

### Menjalankan Seluruh Stack dengan Docker:
```bash
docker compose up -d --build
```

### Kredensial Default:
- **Admin:** `admin@maxima.com` / `Admin123!`
- **Petani 1:** `petani1@maxima.com` / `Petani123!`
- **Petani 2:** `petani2@maxima.com` / `Petani123!`
- **Batch Sehat (Siap Scan):** `BATCH-BBS001-20260315`
- **Batch Sakit (Uji Standar AI):** `BATCH-SICK-20260320`

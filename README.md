# 🌿 BE-Maxima (Smart Agriculture & AI Traceability Backend)

> Backend RESTful API untuk ekosistem perkebunan durian/buah Maxima berbasis **Express.js**, **Prisma ORM**, dan **PostgreSQL**. Menerapkan prinsip **Clean Code Modular Per-Fitur** (`model/`, `service/`, `controller/`), AI Gateway ke microservice FastAPI, PDF Generator stiker QR Code panen, dan kontainerisasi Docker.

---

## 📑 Daftar Isi
1. [Panduan Integrasi Tim Frontend (API Contract)](#-panduan-integrasi-tim-frontend-api-contract)
   - [Konvensi Standar Request & Response](#konvensi-standar-request--response)
   - [1. Authentication & Manajemen Pengguna](#1-authentication--manajemen-pengguna)
   - [2. Manajemen Pohon & Lahan (Siklus Awal)](#2-manajemen-pohon--lahan-siklus-awal)
   - [3. Jadwal Pemupukan & Offline Sync](#3-jadwal-pemupukan--offline-sync)
   - [4. Deteksi AI & Monitoring Penyakit (Siklus Tengah)](#4-deteksi-ai--monitoring-penyakit-siklus-tengah)
   - [5. Lapor Panen & Cetak QR Code (Siklus Akhir)](#5-lapor-panen--cetak-qr-code-siklus-akhir)
   - [6. Scan Konsumen & Traceability Journey (Publik)](#6-scan-konsumen--traceability-journey-publik)
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
        "location": "Desa Bibis, Blok Utara"
      }
    }
  }
  ```
- **Catatan FE:** Simpan `token` di `localStorage` atau secure cookie untuk dikirimkan pada header `Authorization: Bearer <token>` di setiap request selanjutnya.

---

#### `GET /api/admin/farmers`
- **Aktor:** Admin Only
- **Fungsi:** Mengambil daftar semua petani beserta profil, lokasi, dan jumlah pohon miliknya.
- **Response 200 (OK):**
  ```json
  {
    "success": true,
    "message": "Berhasil mengambil daftar akun petani.",
    "data": [
      {
        "id": "c1f76d90-a54b-4c4b-8fd1-253380e224e7",
        "name": "Budi Santoso",
        "email": "petani1@maxima.com",
        "role": "farmer",
        "phone": "081298765432",
        "location": "Desa Bibis, Blok Utara",
        "_count": { "trees": 3, "harvests": 1 }
      }
    ]
  }
  ```

---

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
    "location": "Desa Bibis, Blok Timur"
  }
  ```
- **Response 201 (Created):** Mengembalikan data petani yang baru terdaftar.

---

#### `PUT /api/admin/farmers/:id`
- **Aktor:** Admin Only
- **Fungsi:** Mengubah profil/lokasi/password akun petani.

---

#### `DELETE /api/admin/farmers/:id`
- **Aktor:** Admin Only
- **Fungsi:** Menghapus akun petani.

---

### 2. Manajemen Pohon & Lahan (Siklus Awal)

#### `POST /api/trees`
- **Aktor:** Petani
- **Fungsi:** Menambah pohon/blok baru.
- **FR-1 (Otomatisasi Jadwal):** Backend **otomatis** membuat rencana pemupukan (Day 7, 30, 60, 90, 180) di tabel jadwal saat endpoint ini dipanggil!
- **Request Body:**
  ```json
  {
    "treeCode": "PHN-BBS-010",
    "plantingDate": "2026-03-01",
    "locationBlock": "Blok A-02"
  }
  ```
- **Response 201 (Created):**
  ```json
  {
    "success": true,
    "message": "Pohon berhasil ditambahkan dan jadwal pemupukan berhasil di-generate.",
    "data": {
      "id": "3d5ba4c2-9cf5-4e08-ba90-27f9919f187a",
      "treeCode": "PHN-BBS-010",
      "healthStatus": "Sehat",
      "plantingDate": "2026-03-01T00:00:00.000Z",
      "locationBlock": "Blok A-02",
      "fertilizations": [
        { "id": "uuid-1", "scheduledDate": "2026-03-08", "fertilizerType": "Pupuk Dasar Organik / Kompos Matang", "status": "Pending" },
        { "id": "uuid-2", "scheduledDate": "2026-03-31", "fertilizerType": "NPK 16-16-16 (Masa Vegetatif Awal)", "status": "Pending" }
      ]
    }
  }
  ```

---

#### `GET /api/trees/my-trees`
- **Aktor:** Petani
- **Fungsi:** Mengambil data pohon milik petani yang login (**FR-2 Isolasi Data**).
- **Response 200 (OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "3d5ba4c2-9cf5-4e08-ba90-27f9919f187a",
        "treeCode": "PHN-BBS-010",
        "healthStatus": "Sehat",
        "plantingDate": "2026-03-01T00:00:00.000Z",
        "locationBlock": "Blok A-02",
        "ageInDays": 7,
        "ageInMonths": 0.2
      }
    ]
  }
  ```

---

#### `GET /api/admin/trees`
- **Aktor:** Admin Only
- **Fungsi:** Rekapitulasi global seluruh pohon dari semua petani.
- **Query Filter Opsional:** `?farmer_id=...&health_status=Sehat&age=30`

---

### 3. Jadwal Pemupukan & Offline Sync

#### `GET /api/fertilizations/schedule`
- **Aktor:** Petani
- **Fungsi:** Menampilkan to-do list pemupukan (kalender/daftar) milik petani.
- **Response 200 (OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "8b51d8b7-66a9-4673-9a3d-6b0451cfbfbe",
        "treeId": "3d5ba4c2-...",
        "scheduledDate": "2026-03-08T00:00:00.000Z",
        "fertilizerType": "Pupuk Dasar Organik",
        "status": "Pending",
        "timingStatus": "Hari Ini", // "Hari Ini" | "Mendatang" | "Terlambat (Overdue)" | "Selesai"
        "tree": { "treeCode": "PHN-BBS-010", "locationBlock": "Blok A-02" }
      }
    ]
  }
  ```

---

#### `PUT /api/fertilizations/:id/complete`
- **Aktor:** Petani
- **Fungsi:** Tandai pemupukan selesai dan catat tanggal aktual.
- **Request Body:**
  ```json
  {
    "actualDate": "2026-03-08",
    "notes": "Diaplikasikan 500 gram per lubang tanam"
  }
  ```
- **Response 200 (OK):** `status` berubah menjadi `"Selesai Dipupuk"`.

---

#### `POST /api/sync/fertilizations`
- **Aktor:** Petani (**FR-3 Offline Sync**)
- **Fungsi:** Endpoint batch menerima array data yang disimpan di IndexedDB saat offline.
- **Request Body (Array):**
  ```json
  [
    {
      "treeId": "3d5ba4c2-...",
      "scheduledDate": "2026-03-08",
      "actualDate": "2026-03-08",
      "fertilizerType": "Pupuk Kandang",
      "notes": "Dicatat offline di kebun"
    }
  ]
  ```

---

### 4. Deteksi AI & Monitoring Penyakit (Siklus Tengah)

#### `POST /api/ai/detect`
- **Aktor:** Petani
- **Content-Type:** `multipart/form-data`
- **FR-5 (AI Gateway):**
  1. Validasi ukuran file (< 5MB).
  2. Forward ke FastAPI Microservice (dengan fallback).
  3. Simpan log deteksi ke database.
  4. Otomatis ubah status pohon menjadi **"Sakit"** jika terdeteksi penyakit, atau **"Sehat"** jika sehat/pulih.
- **Form-Data Fields:**
  - `treeId`: string (ID pohon yang difoto)
  - `photo`: File gambar (JPG/PNG/WebP, max 5MB)
- **Response 201 (Created):**
  ```json
  {
    "success": true,
    "message": "Deteksi AI berhasil diproses.",
    "data": {
      "id": "log-uuid-1",
      "photoUrl": "/uploads/leaves/leaf-1788882023549.jpg",
      "result": "Daun Sehat (Healthy Plant)",
      "confidence": 97.4,
      "isSick": false,
      "treeStatusUpdatedTo": "Sehat"
    }
  }
  ```

---

#### `POST /api/sync/ai-detect`
- **Aktor:** Petani (**FR-3 Batch AI Sync**)
- **Fungsi:** Kirim batch riwayat deteksi offline ke server saat kembali dapat sinyal internet.

---

#### `GET /api/admin/ai-logs`
- **Aktor:** Admin Only
- **Fungsi:** Monitoring tren penyakit daun global seluruh kebun beserta persentase keyakinan AI.

---

### 5. Lapor Panen & Cetak QR Code (Siklus Akhir)

#### `POST /api/harvests/report`
- **Aktor:** Petani
- **Fungsi:** Kirim laporan siap panen ke antrean verifikasi Admin.
- **Request Body:**
  ```json
  {
    "treeId": "3d5ba4c2-...",
    "harvestDate": "2026-03-25",
    "estimatedFruits": 45,
    "notes": "Durian montong kualitas super"
  }
  ```
- **Response 201 (Created):** Status panen otomatis menjadi `"Pending"`.

---

#### `GET /api/admin/harvests`
- **Aktor:** Admin Only
- **Fungsi:** Mengambil antrean laporan panen (`Pending` atau `Verified`).
- **Query Opsional:** `?status=Pending`

---

#### `POST /api/admin/harvests/:id/verify-and-qr`
- **Aktor:** Admin Only (**FR-4 Pembuatan Batch QR Code PDF**)
- **Fungsi:** Verifikasi panen, generate Batch ID unik (`BATCH-IDPOHON-TANGGALPANEN`), dan meng-generate file **PDF berisi lembar stiker QR Code** siap cetak.
- **Request Body (Opsional):**
  ```json
  { "stickerCount": 6 }
  ```
- **Response 200 (OK):**
  ```json
  {
    "success": true,
    "message": "Laporan panen berhasil diverifikasi dan file PDF stiker QR Code telah di-generate.",
    "data": {
      "status": "Verified",
      "batchId": "BATCH-PHNBBS010-20260325-1420",
      "traceUrl": "http://localhost:3000/api/public/trace/BATCH-PHNBBS010-20260325-1420",
      "pdfDownloadUrl": "http://localhost:3000/uploads/pdf/batch-BATCH-PHNBBS010-20260325-1420-1788882023550.pdf"
    }
  }
  ```
- **Catatan FE:** Tombol *Download PDF* di dashboard admin cukup mengarahkan `window.open(data.pdfDownloadUrl)`.

---

### 6. Scan Konsumen & Traceability Journey (Publik)

#### `GET /api/public/trace/:batch_id`
- **Aktor:** Konsumen Publik (Tanpa Login)
- **Fungsi:** Endpoint yang dituju saat konsumen memindai stiker QR Code pada buah durian.
- **Gerbang Logika AI:**
  1. Cek seluruh riwayat pohon dari tanggal tanam hingga panen.
  2. Jika pohon terdeteksi "Sakit" dan **tidak ada** verifikasi pulih sesudahnya:
     ```json
     {
       "success": false,
       "warning": "⚠️ Peringatan: Produk Tidak Memenuhi Standar Mutu AI",
       "message": "Produk dari batch ini teridentifikasi memiliki riwayat penyakit pohon yang belum terbukti pulih sebelum masa panen.",
       "data": {
         "batchId": "BATCH-SICK-20260320",
         "status": "DITOLAK_MUTU_AI"
       }
     }
     ```
  3. Jika "Sehat": Menampilkan seluruh riwayat mutu produk:
     ```json
     {
       "success": true,
       "data": {
         "passed": true,
         "batchId": "BATCH-PHNBBS010-20260325-1420",
         "treeCode": "PHN-BBS-010",
         "farmerName": "Budi Santoso",
         "location": "Desa Bibis, Blok Utara",
         "plantingDate": "2026-01-10T00:00:00.000Z",
         "harvestDate": "2026-03-25T00:00:00.000Z",
         "fertilizationSummary": {
           "totalScheduled": 5,
           "totalCompleted": 3,
           "history": [
             { "fertilizerType": "Pupuk Dasar Organik", "actualDate": "2026-01-17" }
           ]
         },
         "lastAiVerification": {
           "status": "Sehat / Layak Konsumsi",
           "confidence": "97.4%",
           "detectedAt": "2026-03-15T00:00:00.000Z"
         }
       }
     }
     ```

---

## 🏛️ Arsitektur Clean Code Modular

Proyek disusun dengan memisahkan domain per-fitur ke dalam folder `src/features/<nama-fitur>/`:
- **`model/`**: Logika manipulasi data Prisma ORM dan database transaction.
- **`service/`**: Logika bisnis murni (isolasi data, gateway FastAPI, kalkulasi usia pohon, gerbang mutu AI).
- **`controller/`**: Penerimaan request HTTP, parsing payload, dan standardisasi response JSON.

```
src/features/
├── auth/           (model, service, controller)
├── farmers/        (model, service, controller)
├── trees/          (model, service, controller)
├── fertilizations/ (model, service, controller)
├── ai/             (model, service, controller)
├── harvests/       (model, service, controller)
└── traceability/   (model, service, controller)
```

---

## 🧪 Panduan Skema Pengujian Otomasi (Test Suite)

Proyek dilengkapi dengan skema pengujian otomatis end-to-end yang dapat dijalankan secara keseluruhan atau per-modul API:

| Perintah Terminal | Modul yang Diuji |
|---|---|
| `npm test` atau `npm run test:all` | **Menjalankan seluruh 7 modul suite secara berurutan** |
| `npm run test:auth` | Uji Login Admin, Petani, Password salah, Validasi |
| `npm run test:farmers` | Uji RBAC larangan petani, CRUD Akun Petani oleh Admin |
| `npm run test:trees` | Uji **FR-1** Auto Jadwal Pemupukan, **FR-2** Isolasi Data Petani |
| `npm run test:fertilizations` | Uji To-do Pemupukan, Selesai Dipupuk, dan **FR-3** Batch Offline Sync |
| `npm run test:ai` | Uji **FR-5** Upload Foto Daun (<5MB), AI Gateway, update status Sakit/Sehat |
| `npm run test:harvests` | Uji Lapor Panen & **FR-4** Verifikasi Admin serta cetak PDF Stiker QR |
| `npm run test:traceability` | Uji Scan Konsumen (Lolos Mutu Sehat vs Ditolak Mutu AI Sakit) |

---

## 🐳 Menjalankan dengan Docker & Database

### Menjalankan Seluruh Stack dengan Docker:
```bash
docker compose up --build
```
*Container PostgreSQL dan backend Express akan otomatis terhubung, mengeksekusi migrasi tabel, dan melakukan seed data awal.*

### Kredensial Default:
- **Admin:** `admin@maxima.com` / `Admin123!`
- **Petani 1:** `petani1@maxima.com` / `Petani123!`
- **Petani 2:** `petani2@maxima.com` / `Petani123!`
- **Batch Sehat (Siap Scan):** `BATCH-BBS001-20260315`
- **Batch Sakit (Uji Standar AI):** `BATCH-SICK-20260320`

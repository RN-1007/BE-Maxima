# Backend Endpoints To-Do List
*Berdasarkan rujukan dokumen "SOFTWARE REQUIREMENTS SPECIFICATION (SRS).docx"*

Berikut adalah urutan pembuatan endpoint backend (API) secara runtut sesuai dengan kebutuhan sistem, dibagi berdasarkan domain dan aktor.

## 1. Authentication & Manajemen Pengguna (Admin)
- [x] `POST /api/auth/login`
  - **Aktor:** Admin & Petani
  - **Fungsi:** Autentikasi dan pemberian JWT token untuk sesi akses.
- [x] `GET /api/admin/farmers`
  - **Aktor:** Admin
  - **Fungsi:** Mengambil daftar semua akun petani beserta detail profil dan lokasinya.
- [x] `POST /api/admin/farmers`
  - **Aktor:** Admin
  - **Fungsi:** Menambah (Create) akun petani baru.
- [x] `PUT /api/admin/farmers/:id`
  - **Aktor:** Admin
  - **Fungsi:** Mengedit (Update) data akun petani.
- [x] `DELETE /api/admin/farmers/:id`
  - **Aktor:** Admin
  - **Fungsi:** Menghapus (Delete) akun petani.

## 2. Manajemen Pohon & Lahan (Siklus Awal)
- [x] `POST /api/trees`
  - **Aktor:** Petani
  - **Fungsi:** Menambah pohon/blok baru dengan input ID Pohon dan Tanggal Ditanam.
  - **FR-1 (Otomatisasi Jadwal):** Backend HARUS otomatis meng-generate log "Rencana Pemupukan" di tabel jadwal saat endpoint ini dieksekusi.
- [x] `GET /api/trees/my-trees`
  - **Aktor:** Petani
  - **Fungsi:** Mengambil ringkasan data pohon milik sendiri (Beranda & Manajemen Pohon).
  - **FR-2 (Isolasi Data):** Petani hanya bisa melihat pohon yang berelasi dengan ID user miliknya.
- [x] `GET /api/admin/trees`
  - **Aktor:** Admin
  - **Fungsi:** Rekapitulasi global seluruh pohon/blok dari semua petani.
  - **Query Filter:** `?farmer_id=...&health_status=...&age=...`

## 3. Jadwal & Log Pemupukan
- [x] `GET /api/fertilizations/schedule`
  - **Aktor:** Petani
  - **Fungsi:** Mengambil to-do list pemupukan (kalender/daftar) milik sendiri hari ini atau yang akan datang.
- [x] `PUT /api/fertilizations/:id/complete`
  - **Aktor:** Petani
  - **Fungsi:** Memperbarui status jadwal pemupukan menjadi "Selesai Dipupuk" dan mencatat tanggal aktual dipupuk.
- [x] `POST /api/sync/fertilizations`
  - **Aktor:** Petani
  - **Fungsi:** Endpoint batch (array of data) untuk sinkronisasi data pemupukan yang disimpan di IndexedDB (offline) agar masuk ke server setelah ada sinyal (**FR-3**).

## 4. Deteksi AI & Monitoring Penyakit (Siklus Tengah)
- [x] `POST /api/ai/detect`
  - **Aktor:** Petani
  - **Fungsi:** Menerima file unggahan foto daun dari petani.
  - **FR-5 (AI Gateway):** 
    1. Validasi file (< 5MB).
    2. Forward foto ke microservice FastAPI.
    3. Terima respons dari FastAPI (persentase & hasil).
    4. Simpan riwayat/log deteksi ke database.
    5. Ubah status pohon di database menjadi "Sakit" jika terdeteksi penyakit (atau "Sehat" jika pulih).
- [x] `POST /api/sync/ai-detect`
  - **Aktor:** Petani
  - **Fungsi:** Sinkronisasi batch untuk foto-foto daun yang diambil saat mode offline (**FR-3**).
- [x] `GET /api/admin/ai-logs`
  - **Aktor:** Admin
  - **Fungsi:** Mengambil riwayat seluruh foto daun, hasil persentase AI, dan tanggal kejadian untuk pemantauan tren penyakit global.

## 5. Lapor Panen & Cetak QR Code (Siklus Akhir)
- [x] `POST /api/harvests/report`
  - **Aktor:** Petani
  - **Fungsi:** Mengirim laporan panen (memilih ID Pohon, Tanggal Dipanen, estimasi buah). Data masuk antrean Admin.
- [x] `GET /api/admin/harvests`
  - **Aktor:** Admin
  - **Fungsi:** Mengambil daftar laporan "Siap Panen" (Pending/Verified) dari semua petani.
- [x] `POST /api/admin/harvests/:id/verify-and-qr`
  - **Aktor:** Admin
  - **Fungsi:** Memverifikasi laporan panen dari petani.
  - **FR-4 (Pembuatan Batch QR):** Meng-generate file PDF berisi kumpulan stiker QR Code untuk kombinasi ID Pohon + Tanggal Panen (Batch ID). URL di dalam QR bersifat statis merujuk ke halaman trace produk.

## 6. Endpoint Konsumen (Scan & Traceability)
- [x] `GET /api/public/trace/:batch_id`
  - **Aktor:** Konsumen (Tidak perlu login / Public)
  - **Fungsi:** Mengembalikan data timeline (Traceability Journey) dari sebuah Batch ID (yang ada di dalam QR Code).
  - **Gerbang Logika AI (Business Logic):**
    1. Cek riwayat log AI pohon pada rentang tanggal tanam hingga panen.
    2. Jika pohon terdeteksi "Sakit" dan belum ada log terbaru yang menyatakannya pulih/sehat, return status error/peringatan: `⚠️ Peringatan: Produk Tidak Memenuhi Standar Mutu AI` dan sembunyikan detail lainnya.
    3. Jika "Sehat", return data lengkap: Nama Petani, Lokasi (Desa Bibis, dsb.), Tanggal Tanam, Rekap jumlah pemupukan, Tanggal verifikasi AI terakhir, dan Tanggal Panen.
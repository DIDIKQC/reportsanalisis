# Laboratory Automated Reporting & Analytics System
**RSUD OKU TIMUR — INSTALASI LABORATORIUM**

Aplikasi web *production-ready* untuk otomasi pelaporan dan analitik laboratorium medis. Mengubah berkas data mentah laboratorium (Excel, CSV, PDF) menjadi data terstruktur dalam basis data relasional, visualisasi dashboard interaktif, analitik Turn Around Time (TAT), integrasi penyimpanan Google Drive resmi, analisis klinis cerdas dengan Google Gemini AI, serta pencetakan laporan otomatis berformat baku resmi.

---

## 🌟 Fitur Utama Sistem

1. **Dashboard Analitik & Filter Terintegrasi**:
   - Metrik KPI utama: Total Pasien, Total Pemeriksaan, Total Sampel, Rata-rata & Median TAT, Tingkat Kepatuhan TAT, Non-Compliance Rate, dan Pemeriksaan Terbanyak.
   - Grafik interaktif: Tren pasien & pemeriksaan bulanan, distribusi kategori uji, komposisi asal ruangan (IGD, Rawat Jalan, Rawat Inap), penjamin (Umum, BPJS, dll.), dan 10 besar pemeriksaan.
   - Filter multivariat saling terhubung: Tahun, Bulan, Tipe Asal Pasien, Kelompok Pemeriksaan, Penjamin, dan Status Kepatuhan TAT.
   - **Fitur Drill-Down**: Klik pada metrik (misal: TAT Non-Compliance) untuk melihat detail rekam medis pasien, waktu, target, hingga berkas sumber asli.

2. **Dedicated Menu Laporan & Template Baku Resmi**:
   - Setiap tipe laporan memiliki **menu dan template konfigurasi tersendiri**:
     - **Laporan Kinerja Tahunan (27 Halaman)**: Format persis dokumen resmi *Laporan Kinerja Instalasi Laboratorium RSUD OKU Timur Tahun 2025* (Cover, Daftar Isi, BAB I Pendahuluan, BAB II Pencapaian Program Tabel 1-27, BAB III Penutup & 3 Blok Tanda Tangan Pengesahan).
     - **Laporan Bulanan Pelayanan Laboratorium**.
     - **Laporan Turn Around Time (TAT) & Kepatuhan Mutu**.
     - **Laporan Demografi & Kunjungan Pasien**.
     - **Riwayat & Arsip Laporan**.
   - **Download PDF Langsung**: Menghasilkan berkas PDF resolusi tinggi format A4 yang identik dengan dokumen fisik RSUD OKU Timur.

3. **Smart Column Mapping & Upload Engine**:
   - Mendukung berkas mentah `.xlsx`, `.xls`, `.csv`, dan `.pdf` (Data Pasien Rawat Jalan & Rawat Inap).
   - Pemetaan nama kolom cerdas dengan pencocokan kamus deterministik dan *fallback* Google Gemini AI.
   - Deteksi berkas duplikat menggunakan *SHA-256 File Hash* dengan opsi: *Skip*, *Replace*, atau *Import Versi Baru*.
   - Validasi data otomatis (tanggal, nama pasien, parameter uji, unit).

4. **Integrasi Google Drive Resmi**:
   - Folder ID: `1MsmBzz5dVW0jzK-ocWsyKh2DQ0Q9OZ1x`
   - Berkas asli tersimpan dalam hierarki folder tahunan dan bulanan (`RAW/`).
   - Tersedia cermin penyimpanan lokal (*Local Storage Mirror*) untuk menjamin ketersediaan data secara *offline* atau saat pembatasan kuota cloud.
   - *Source Traceability*: Setiap record data pasien memiliki tautan ke Google Drive File ID.

5. **AI Analysis & Recommendation Engine (Google Gemini)**:
   - Menggunakan model `gemini-1.5-flash` / `gemini-2.0` melalui abstraction layer aman di *backend*.
   - **Menjaga Privasi Pasien**: Tidak pernah mengirimkan data identitas pasien (PII) ke AI. AI hanya menerima agregasi statistik numerik.
   - Menghasilkan Ringkasan Eksekutif, Temuan Berbasis Indikator Aktual, Komparasi Standar Pelayanan Minimal, dan Rekomendasi Klinis Terukur.

6. **Keamanan, RBAC & Audit Trail**:
   - Otentikasi JWT dengan enkripsi sandi bcrypt.
   - *Role-Based Access Control* (Super Admin, Lab Admin, Manager, Viewer).
   - Pencatatan seluruh mutasi data dalam tabel `audit_logs`.

---

## 🚀 Panduan Menjalankan Aplikasi

### Persyaratan Lingkungan
- **Node.js**: v18+ (direkomendasikan v20 atau v24)
- **npm**: v9+

### Menjalankan Server & Aplikasi Web
Cukup jalankan perintah berikut dari folder root `d:\project\reportsanalisis`:

```bash
# Jalankan aplikasi lengkap (Backend API + Frontend Web)
npm start
```

Aplikasi akan aktif dan dapat diakses melalui browser pada:
👉 **http://localhost:5000**

*(Untuk pengembangan frontend secara terpisah dengan hot-reload: `npm run dev:client` di port 3000)*

---

## 🔑 Akun & Kredensial Default

| Peran (Role) | Username | Password | Deskripsi Hak Akses |
|---|---|---|---|
| **Super Admin** | `superadmin` | `admin123` | Akses penuh seluruh modul, audit trail, user management |
| **Admin Lab** | `adminlab` | `lab123` | Operasional lab, upload berkas, cetak laporan, master data |
| **Manager / Direktur** | `manager` | `manager123` | Dashboard analitik, AI analysis, monitoring mutu |
| **Viewer** | `viewer` | `viewer123` | Akses baca dashboard dan laporan |

---

## 📁 Struktur Berkas

```
d:\project\reportsanalisis/
├── client/                     # Frontend React 19 + TypeScript + Tailwind v4
│   ├── src/
│   │   ├── api/                # Axios API Client
│   │   ├── components/         # Layout, KPICard, FilterBar, DrillDownModal
│   │   ├── pages/              # Dashboard, Upload, Patients, Examinations, TAT, RawFiles, dll.
│   │   ├── pages/reports/      # AnnualReport (27 Hal), ReportsHub, ReportHistory
│   │   └── reports/            # AnnualReportPDF.ts (Generator PDF 27 Halaman)
├── server/                     # Backend Node.js Express + Better-SQLite3
│   ├── data/                   # Basis data relasional laboratory.sqlite
│   ├── storage/                # Mirror penyimpanan berkas Google Drive & PDF terbitan
│   └── src/
│       ├── controllers/        # Handler API Auth, Upload, Dashboard, Report, AI, Master
│       ├── db/                 # Schema DDL 23 tabel & Seeder
│       ├── services/           # Gemini AI Provider, G-Drive Service, Parser, Engine
│       └── index.ts            # Express Server Bootstrap
├── package.json                # Root automation scripts
└── README.md
```

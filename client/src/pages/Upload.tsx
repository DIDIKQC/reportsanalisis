import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { api } from '../api/client';

export const UploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [customMapping, setCustomMapping] = useState<Record<string, string>>({});
  const [duplicateAction, setDuplicateAction] = useState<'SKIP' | 'REPLACE' | 'IMPORT_NEW'>('SKIP');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewData(null);
      setImportResult(null);
      setErrorMsg(null);
    }
  };

  const handleUploadPreview = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.post('/upload/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      setPreviewData(res.data);
      if (res.data.mapping?.mapped) {
        setCustomMapping(res.data.mapping.mapped);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membaca berkas file.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    setImporting(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('tempFileId', previewData.tempFileId || '');
      formData.append('originalFileName', previewData.originalFileName || '');
      formData.append('mimeType', previewData.mimeType || '');
      formData.append('customMapping', JSON.stringify(customMapping));
      formData.append('sheetName', previewData.activeSheet || '');
      formData.append('duplicateAction', duplicateAction);

      const res = await api.post('/upload/confirm', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000
      });
      setImportResult(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengimpor data ke database.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Google Drive Status Bar */}
      <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/80 p-4 text-xs text-sky-900 shadow-sm">
        <div className="flex items-center gap-2.5">
          <FolderOpen className="h-5 w-5 text-sky-600" />
          <div>
            <span className="font-bold">Google Drive Storage Aktif:</span>
            <span className="ml-1 text-slate-600">
              Berkas asli yang diunggah akan otomatis disimpan ke Google Drive Cloud & dipetakan ke SQLite.
            </span>
          </div>
        </div>
        <a
          href="https://drive.google.com/drive/folders/1MsmBzz5dVW0jzK-ocWsyKh2DQ0Q9OZ1x?usp=sharing"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 font-bold text-sky-700 hover:text-sky-900 underline"
        >
          <span>Buka Folder Google Drive</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Main Upload Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center max-w-xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-4">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Unggah Berkas Data Laboratorium</h3>
          <p className="mt-1 text-xs text-slate-500">
            Dukung format Excel (.xlsx, .xls), CSV, atau PDF (Data Pasien Rawat Jalan & Rawat Inap). Sistem akan otomatis melakukan smart column mapping dan validasi data.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-sky-400 transition bg-slate-50/50">
            <input
              type="file"
              id="fileInput"
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.pdf"
              className="hidden"
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <FileSpreadsheet className="h-10 w-10 text-slate-400" />
              <span className="text-xs font-semibold text-sky-600 hover:underline">
                {selectedFile ? selectedFile.name : 'Pilih file dari komputer Anda'}
              </span>
              <span className="text-[11px] text-slate-400">Ukuran maksimal 50 MB</span>
            </label>

            {selectedFile && (
              <button
                onClick={handleUploadPreview}
                disabled={uploading}
                className="mt-5 flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-500 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${uploading ? 'animate-spin' : ''}`} />
                <span>{uploading ? 'Membaca Workbook & Mapping Kolom...' : 'Proses & Preview File'}</span>
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Preview & Smart Column Mapping Step */}
      {previewData && !importResult && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                Langkah 2: Verifikasi Smart Mapping
              </span>
              <h4 className="mt-2 text-base font-bold text-slate-800">
                {previewData.originalFileName} ({previewData.totalRows ? `${previewData.totalRows.toLocaleString()} Baris Terdeteksi` : 'Data Terdeteksi'})
              </h4>
              <p className="text-xs text-slate-500">
                Periksa kesesuaian kolom file mentah dengan field canonical database laboratorium.
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={importing}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{importing ? 'Menyinkronkan Google Drive & Mengimpor ke Database...' : 'Konfirmasi & Simpan ke Database'}</span>
            </button>
          </div>

          {/* Duplicate Handling Options */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs">
            <span className="font-bold text-amber-900 block mb-1">Pengaturan Penanganan File Duplikat:</span>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="dupAction"
                  value="SKIP"
                  checked={duplicateAction === 'SKIP'}
                  onChange={() => setDuplicateAction('SKIP')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span>Lewati jika sudah pernah diimpor (Skip)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="dupAction"
                  value="REPLACE"
                  checked={duplicateAction === 'REPLACE'}
                  onChange={() => setDuplicateAction('REPLACE')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span>Gantikan data lama (Replace)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="dupAction"
                  value="IMPORT_NEW"
                  checked={duplicateAction === 'IMPORT_NEW'}
                  onChange={() => setDuplicateAction('IMPORT_NEW')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span>Impor sebagai versi baru</span>
              </label>
            </div>
          </div>

          {/* Mapping Table */}
          {previewData.headers && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Header Kolom Mentah</th>
                    <th className="px-4 py-2.5">Dipetakan ke Field Sistem</th>
                    <th className="px-4 py-2.5">Keyakinan (Confidence)</th>
                    <th className="px-4 py-2.5">Contoh Data Baris Pertama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.headers.map((hdr: string, i: number) => {
                    const mappedField = customMapping[hdr] || '';
                    const conf = previewData.mapping?.confidence?.[hdr] || 1.0;
                    const sampleVal = previewData.sampleRecords?.[0]?.rawRecord?.[hdr] || '-';
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-bold text-slate-800">{hdr}</td>
                        <td className="px-4 py-2">
                          <select
                            value={mappedField}
                            onChange={(e) => setCustomMapping({ ...customMapping, [hdr]: e.target.value })}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
                          >
                            <option value="">-- Abaikan Kolom Ini --</option>
                            <option value="row_number">No Urut (row_number)</option>
                            <option value="order_date">Tanggal Periksa (order_date)</option>
                            <option value="patient_name">Nama Pasien (patient_name)</option>
                            <option value="gender_male_age">Usia Laki-Laki (L)</option>
                            <option value="gender_female_age">Usia Perempuan (P)</option>
                            <option value="examinations">Pemeriksaan Lab (examinations)</option>
                            <option value="origin_unit">Asal Pasien / Ruangan (origin_unit)</option>
                            <option value="medical_record_number">No. Rekam Medis (No RM)</option>
                            <option value="registration_number">No. Registrasi / No. Lab</option>
                            <option value="tat_minutes">Turn Around Time (TAT Menit)</option>
                            <option value="guarantor">Penjamin / Jaminan (guarantor)</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            conf >= 0.9 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {(conf * 100).toFixed(0)}% {conf >= 0.9 ? 'Terstandar' : 'Pencocokan Otomatis'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-500 max-w-xs truncate">{String(sampleVal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ingestion Result Card */}
      {importResult && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Proses Impor Berhasil Selesai!
              </h4>
              <p className="text-xs text-slate-500">
                {importResult.message}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-[11px] text-slate-400 block">Total Record</span>
              <span className="text-base font-bold text-slate-800">{importResult.totalRecords}</span>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <span className="text-[11px] text-emerald-600 block">Record Valid Masuk DB</span>
              <span className="text-base font-bold text-emerald-700">{importResult.validRecords}</span>
            </div>
            <div className="rounded-xl bg-sky-50 p-3">
              <span className="text-[11px] text-sky-600 block">Google Drive Sync</span>
              <span className="text-xs font-bold text-sky-700 font-mono truncate block">{importResult.googleDriveFileId}</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-[11px] text-slate-400 block">Status Batch</span>
              <span className="text-base font-bold text-slate-700">COMPLETED</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setSelectedFile(null); setPreviewData(null); setImportResult(null); }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Upload File Lain
            </button>
            <a
              href="/#dashboard"
              onClick={(e) => { e.preventDefault(); window.location.reload(); }}
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition"
            >
              Lihat di Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

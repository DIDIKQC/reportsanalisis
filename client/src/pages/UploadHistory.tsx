import React, { useState, useEffect } from 'react';
import { History, FileSpreadsheet, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { UploadBatch } from '../types';

export const UploadHistory: React.FC = () => {
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/upload/history')
      .then(res => setBatches(res.data.history))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Riwayat Upload & Validasi Batch</h3>
            <p className="text-xs text-slate-500">
              Pemeriksaan status integrasi data dari setiap batch pengunggahan berkas mentah.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-2.5">Nama File</th>
                <th className="px-4 py-2.5">Waktu Upload</th>
                <th className="px-4 py-2.5">Pengunggah</th>
                <th className="px-4 py-2.5 text-center">Total Baris</th>
                <th className="px-4 py-2.5 text-center">Valid</th>
                <th className="px-4 py-2.5 text-center">Warning / Error</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">Google Drive ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Memuat riwayat batch upload...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Belum ada riwayat batch upload.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.batch_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{b.file_name}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(b.upload_date).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.uploaded_by || 'Admin Lab'}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">{b.total_records}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">{b.valid_records}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-500">
                      {b.warning_records + b.error_records}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> {b.batch_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-400">
                      {b.google_drive_file_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

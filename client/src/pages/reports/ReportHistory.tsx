import React, { useState, useEffect } from 'react';
import { History, FileText, CheckCircle2, Trash2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { GeneratedReport } from '../../types';

interface ReportHistoryProps {
  onSelectReport: (reportId: string) => void;
}

export const ReportHistory: React.FC<ReportHistoryProps> = ({ onSelectReport }) => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportToDelete, setSelectedReportToDelete] = useState<GeneratedReport | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/history');
      setReports(res.data.reports || []);
    } catch (err: any) {
      console.error('Failed to load report history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReportToDelete) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/reports/history/${selectedReportToDelete.id}`);
      setNotification({
        type: 'success',
        message: res.data.message || `Riwayat laporan "${selectedReportToDelete.title}" berhasil dihapus.`
      });
      setSelectedReportToDelete(null);
      await fetchHistory();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Gagal menghapus riwayat laporan.'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs font-semibold shadow-sm transition-all ${
            notification.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="rounded-lg p-1 hover:bg-black/5">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Riwayat &amp; Arsip Laporan Laboratorium</h3>
            <p className="text-xs text-slate-500">
              Daftar seluruh laporan kinerja dan rekapitulasi yang telah digenerate beserta arsip stempel waktu.
            </p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-2.5">Judul Laporan</th>
                <th className="px-4 py-2.5">Tipe Laporan</th>
                <th className="px-4 py-2.5">Periode</th>
                <th className="px-4 py-2.5">Waktu Dibuat</th>
                <th className="px-4 py-2.5">Dibuat Oleh</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
                      <span>Memuat riwayat laporan...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Belum ada riwayat laporan yang dibuat. Silakan buka menu Laporan Tahunan untuk membuat laporan baru.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                        <span className="font-bold text-slate-900">{rep.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600">{rep.report_type_name}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      Tahun {rep.period_year} {rep.period_month ? `(Bulan ${rep.period_month})` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(rep.generated_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{rep.generated_by_name || 'Admin Lab'}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> {rep.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectReport('report-tahunan')}
                          className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition shadow-sm"
                        >
                          Buka &amp; Cetak Ulang
                        </button>
                        <button
                          onClick={() => setSelectedReportToDelete(rep)}
                          className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition shadow-sm"
                          title="Hapus Riwayat Laporan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {selectedReportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Konfirmasi Hapus Riwayat</h4>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60 text-xs space-y-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Judul Laporan</span>
                <span className="font-bold text-slate-800 text-sm block mt-0.5">{selectedReportToDelete.title}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200/60">
                <span>Periode: <b>Tahun {selectedReportToDelete.period_year}</b></span>
                <span>Waktu: <b>{new Date(selectedReportToDelete.generated_at).toLocaleDateString('id-ID')}</b></span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus data riwayat arsip laporan ini? Berkas arsip laporan akan dihapus secara permanen dari histori sistem.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReportToDelete(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Ya, Hapus Riwayat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

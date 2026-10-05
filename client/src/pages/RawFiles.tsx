import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Download,
  ExternalLink,
  HardDrive,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { api } from '../api/client';
import { RawFile } from '../types';
import { useAuth } from '../context/AuthContext';

export const RawFiles: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<RawFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFileToDelete, setSelectedFileToDelete] = useState<RawFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchRawFiles();
  }, []);

  const fetchRawFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/files');
      setFiles(res.data.files);
    } catch (err: any) {
      console.error('Failed to load raw files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFileToDelete) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/files/${selectedFileToDelete.id}`);
      setNotification({
        type: 'success',
        message: res.data.message || `File ${selectedFileToDelete.file_name} dan seluruh data terkait berhasil dihapus.`
      });
      setSelectedFileToDelete(null);
      await fetchRawFiles();
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menghapus file dan data terkait.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Notification Alert */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs font-semibold shadow-sm ${
            notification.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Repositori File Mentah &amp; Traceability</h3>
            <p className="text-xs text-slate-500">
              Setiap baris data hasil olahan dapat ditelusuri ke berkas sumber asli di Google Drive Cloud dan Local Mirror.
            </p>
          </div>
        </div>

        <a
          href="https://drive.google.com/drive/folders/1MsmBzz5dVW0jzK-ocWsyKh2DQ0Q9OZ1x?usp=sharing"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Buka di Google Drive Resmi</span>
        </a>
      </div>

      {/* Files Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-2.5">Nama File</th>
                <th className="px-4 py-2.5">Tipe &amp; Ukuran</th>
                <th className="px-4 py-2.5">SHA-256 Hash</th>
                <th className="px-4 py-2.5">Waktu Upload</th>
                <th className="px-4 py-2.5">Pengunggah</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Memuat daftar file mentah...
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Belum ada file yang diunggah. Database saat ini bersih/kosong.
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {file.file_name.endsWith('.pdf') ? (
                          <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800">{file.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-500">{formatBytes(file.file_size)}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400 truncate max-w-[140px]" title={file.file_hash}>
                      {file.file_hash.substring(0, 16)}...
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {new Date(file.upload_date).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {file.uploader_name || 'Admin Lab'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> {file.processing_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/files/${file.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download File Asli"
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          <Download className="h-3.5 w-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Download</span>
                        </a>

                        {file.google_drive_web_link && (
                          <a
                            href={file.google_drive_web_link}
                            target="_blank"
                            rel="noreferrer"
                            title="Buka di Google Drive"
                            className="flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">G-Drive</span>
                          </a>
                        )}

                        {/* Superadmin Delete Button */}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setSelectedFileToDelete(file)}
                            title="Hapus File & Kosongkan Data Terkait (Superadmin Only)"
                            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 active:scale-95 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Hapus &amp; Kosongkan</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Superadmin Delete */}
      {selectedFileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-600 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-sm font-bold">Konfirmasi Hapus File &amp; Kosongkan Data</h3>
              </div>
              <button
                onClick={() => setSelectedFileToDelete(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-900 space-y-2">
                <p className="font-bold">
                  Peringatan Tindakan Kritis Superadmin:
                </p>
                <p>
                  Anda akan menghapus berkas sumber: <strong>{selectedFileToDelete.file_name}</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-rose-800">
                  <li>Seluruh rekam data pemeriksaan laboratorium hasil import file ini akan dihapus bersih.</li>
                  <li>Seluruh hasil laboratorium &amp; rekam evaluasi TAT terkait akan dihapus.</li>
                  <li>Data pasien yang tidak memiliki riwayat pemeriksaan lain akan dikosongkan.</li>
                  <li>Berkas fisik pada server lokal mirror dan file penyimpanan di Google Drive akan ikut terhapus permanen.</li>
                </ul>
              </div>

              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin melanjutkan tindakan ini?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setSelectedFileToDelete(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteFile}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {deleting ? (
                    'Menghapus & Mengosongkan...'
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Ya, Hapus &amp; Kosongkan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

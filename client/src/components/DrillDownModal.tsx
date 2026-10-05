import React from 'react';
import { X, ExternalLink, Download, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DrillDownRecord } from '../types';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  records: DrillDownRecord[];
  totalCount: number;
  loading: boolean;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  records,
  totalCount,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">
              Menampilkan {records.length} dari total {totalCount.toLocaleString('id-ID')} rekam data laboratorium
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">
              Memuat data rekam medis...
            </div>
          ) : records.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-sm text-slate-500">
              <FileText className="h-10 w-10 text-slate-300 mb-2" />
              <span>Tidak ada record data yang sesuai dengan filter ini.</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-semibold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Tanggal</th>
                    <th className="px-3.5 py-2.5">No. RM</th>
                    <th className="px-3.5 py-2.5">Nama Pasien</th>
                    <th className="px-3.5 py-2.5">Usia / JK</th>
                    <th className="px-3.5 py-2.5">Asal Unit</th>
                    <th className="px-3.5 py-2.5">Pemeriksaan</th>
                    <th className="px-3.5 py-2.5 text-center">TAT (Menit)</th>
                    <th className="px-3.5 py-2.5 text-center">Target</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                    <th className="px-3.5 py-2.5">File Sumber (Google Drive)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="whitespace-nowrap px-3.5 py-2 font-medium">{r.order_date}</td>
                      <td className="whitespace-nowrap px-3.5 py-2 font-mono text-slate-600">{r.medical_record_number}</td>
                      <td className="px-3.5 py-2 font-semibold text-slate-800">{r.patient_name}</td>
                      <td className="whitespace-nowrap px-3.5 py-2">
                        {r.age} Th ({r.gender})
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {r.unit_name}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-3.5 py-2 text-slate-600" title={r.tests}>
                        {r.tests}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2 text-center font-bold">
                        {r.tat_duration || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2 text-center text-slate-500">
                        {r.tat_target ? `≤ ${r.tat_target}` : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2 text-center">
                        {r.tat_compliant === 1 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Sesuai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            <AlertTriangle className="h-3 w-3" /> Terlambat
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2">
                        <div className="flex items-center gap-2">
                          <span className="max-w-[150px] truncate text-[11px] text-slate-500" title={r.source_file_name}>
                            {r.source_file_name || 'Sumber Data Terverifikasi'}
                          </span>
                          {r.google_drive_web_link && (
                            <a
                              href={r.google_drive_web_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-600 hover:text-sky-800"
                              title="Buka di Google Drive"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <span className="text-xs text-slate-500">
            Sumber Data Terhubung Relasional &middot; Traceable ke Google Drive ID
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

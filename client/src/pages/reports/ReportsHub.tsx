import React from 'react';
import { FileText, Calendar, Clock, Users, ShieldCheck, Download, ChevronRight } from 'lucide-react';
import { ReportType } from '../../types';

interface ReportsHubProps {
  onSelectReport: (reportId: string) => void;
}

export const ReportsHub: React.FC<ReportsHubProps> = ({ onSelectReport }) => {
  const reports: Array<ReportType & { statusText: string; isPrimary?: boolean }> = [
    {
      id: 'report-tahunan',
      code: 'TAHUNAN',
      name: 'Laporan Kinerja Tahunan Laboratorium (27 Halaman)',
      description: 'Laporan resmi terperinci mencakup SDM, Utilisasi Kunjungan Penjamin, Kategori Pemeriksaan, Top 5 Uji, Peralatan Medis, Kalibrasi, Indikator Mutu, Hasil Nilai Kritis, dan Manajemen Risiko.',
      icon: 'FileText',
      route_path: '/reports/tahunan',
      template_name: 'Template Resmi RSUD OKU Timur 2025',
      statusText: 'Format Lengkap Sesuai Template PDF',
      isPrimary: true
    },
    {
      id: 'report-bulanan',
      code: 'BULANAN',
      name: 'Laporan Bulanan Pelayanan Laboratorium',
      description: 'Rekapitulasi operasional jumlah pasien per hari, total pemeriksaan per jenis, dan rincian penjamin bulanan.',
      icon: 'Calendar',
      route_path: '/reports/bulanan',
      template_name: 'Template Bulanan Standar',
      statusText: 'Tersedia'
    },
    {
      id: 'report-tat',
      code: 'TAT',
      name: 'Laporan Evaluasi Turn Around Time (TAT) Cito',
      description: 'Laporan resmi 3 halaman evaluasi kepatuhan waktu tunggu hasil laboratorium CITO (<60 menit), analisis akar masalah, bottlenecks, rekomendasi, dan kesimpulan akreditasi LARS DHP.',
      icon: 'Clock',
      route_path: '/reports/tat',
      template_name: 'Template Resmi Evaluasi TAT Cito',
      statusText: 'Format Lengkap Sesuai Template PDF'
    },
    {
      id: 'report-pasien',
      code: 'PASIEN',
      name: 'Laporan Demografi Kunjungan Pasien',
      description: 'Laporan rincian pasien berdasarkan distribusi asal ruangan (IGD, Rawat Jalan, Rawat Inap), usia, dan gender.',
      icon: 'Users',
      route_path: '/reports/pasien',
      template_name: 'Template Rekapitulasi Demografi',
      statusText: 'Tersedia'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800">Direktori Menu Tipe Laporan</h3>
        <p className="text-xs text-slate-500 mt-1">
          Setiap menu memiliki konfigurasi template output tersendiri yang deterministik dan tidak bercampur satu sama lain.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className={`rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
              rep.isPrimary ? 'border-sky-300 ring-2 ring-sky-500/10' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <FileText className="h-6 w-6" />
              </div>
              {rep.isPrimary && (
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                  UTAMA
                </span>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-base font-bold text-slate-900">{rep.name}</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{rep.description}</p>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <span className="text-[11px] text-slate-400 block">Template Terpasang:</span>
              <span className="font-semibold text-slate-800">{rep.template_name}</span>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                &bull; {rep.statusText}
              </span>
              <button
                onClick={() => onSelectReport(rep.id)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                <span>Buka Menu Laporan</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

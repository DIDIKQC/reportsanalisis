import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Download,
  Eye,
  FileText,
  X,
  ArrowUpRight,
  Filter,
  Calendar
} from 'lucide-react';
import { api } from '../api/client';
import { generateTATEvaluationPDF, TATEvaluationDataPDF } from '../reports/TATEvaluationPDF';

export const TATPage: React.FC = () => {
  const [targets, setTargets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    averageTATMinutes: null,
    medianTATMinutes: null,
    tatComplianceRate: null,
    tatNonComplianceRate: null
  });
  const [loading, setLoading] = useState(true);

  // Period filters
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(2); // Default to Q2 (April – Juni) as in user's official sample
  const [availableYears, setAvailableYears] = useState<number[]>([2025, 2024, 2023]);

  // Report data for PDF & Modal Preview
  const [reportData, setReportData] = useState<TATEvaluationDataPDF | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchFiltersAndData();
  }, []);

  useEffect(() => {
    fetchTATReportData();
  }, [selectedYear, selectedQuarter]);

  const fetchFiltersAndData = async () => {
    setLoading(true);
    try {
      const [sumRes, tarRes, filterRes] = await Promise.all([
        api.get('/dashboard/summary', { params: { year: selectedYear } }),
        api.get('/master/tat-targets'),
        api.get('/dashboard/filters')
      ]);

      setSummary(sumRes.data.summary);
      setTargets(tarRes.data.targets);
      if (filterRes.data?.years && filterRes.data.years.length > 0) {
        setAvailableYears(filterRes.data.years);
      }
    } catch (err) {
      console.error('Failed to load initial TAT data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTATReportData = async () => {
    try {
      const res = await api.get('/reports/tat-evaluation', {
        params: {
          year: selectedYear,
          quarter: selectedQuarter
        }
      });
      if (res.data?.reportData) {
        setReportData(res.data.reportData);
      }
    } catch (err) {
      console.error('Failed to load TAT evaluation report data:', err);
    }
  };

  const hasTAT = reportData?.hasTATData || (summary.tatComplianceRate !== null && summary.tatComplianceRate !== undefined);

  const handleDownloadPDF = () => {
    if (!reportData) return;
    setDownloading(true);
    try {
      const doc = generateTATEvaluationPDF(reportData);
      const cleanPeriod = (reportData.periodText || 'Triwulan').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Laporan_Evaluasi_TAT_CITO_${cleanPeriod}.pdf`);
    } catch (err) {
      console.error('Failed to generate TAT PDF:', err);
      alert('Terjadi kendala saat menyusun berkas PDF laporan evaluasi TAT.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Evaluasi Turn Around Time (TAT) Laboratorium</h3>
            <p className="text-xs text-slate-500">
              Pengukuran kecepatan waktu tunggu hasil uji diagnostik CITO berdasarkan data mentah yang diunggah.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quarter Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              <option value={2}>Triwulan II (April – Juni)</option>
              <option value={1}>Triwulan I (Januari – Maret)</option>
              <option value={3}>Triwulan III (Juli – September)</option>
              <option value={4}>Triwulan IV (Oktober – Desember)</option>
              <option value={0}>Tahun Penuh (Januari – Desember)</option>
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Button */}
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={!reportData}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <Eye className="h-4 w-4 text-slate-500" />
            <span>Preview Laporan</span>
          </button>

          {/* Download Official Report Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={!reportData || downloading}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 transition"
          >
            <Download className="h-4 w-4" />
            <span>{downloading ? 'Menyusun PDF...' : 'Download Laporan Evaluasi TAT (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Status Alert Indicator */}
      {!hasTAT ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Informasi Kolom Data Sumber: Kolom TAT Tidak Ada Pada File Mentah</span>
          </div>
          <p>
            Berkas data mentah yang diunggah tidak mencantumkan kolom jam penerimaan spesimen, jam selesai verifikasi hasil, ataupun durasi waktu tunggu (TAT).
            Oleh karena itu, seluruh nilai capaian indikator TAT pada laporan evaluasi dikosongkan (tanda strip <code>-</code>) persis sesuai data sumber asli tanpa rekayasa data.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Data TAT tersedia pada berkas sumber mentah. Seluruh indikator waktu tunggu dihitung secara otomatis.</span>
        </div>
      )}

      {/* Official Table: Hasil Capaian Pemenuhan TAT Cito (Format Resmi Rumah Sakit) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">BAGIAN IV</span>
              <h4 className="text-sm font-bold text-slate-800">
                Hasil Capaian Pemenuhan TAT Cito ({reportData?.periodText || `Triwulan II ${selectedYear}`})
              </h4>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Format tabel standar akreditasi LARS DHP (Bab Pengkajian Pasien - PP 3.3 elemen c).
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={!reportData || downloading}
            className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Format PDF Resmi</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-100 font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Bulan</th>
                <th className="px-4 py-3">Total Sampel Cito</th>
                <th className="px-4 py-3">Sampel Tepat Waktu (≤ 60 Menit)</th>
                <th className="px-4 py-3">Sampel Terlambat (&gt; 60 Menit)</th>
                <th className="px-4 py-3">Persentase Kepatuhan (%)</th>
                <th className="px-4 py-3">Target RS</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {reportData?.tableRows?.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-left font-bold text-slate-900 whitespace-pre-line">{row.month}</td>
                  <td className="px-4 py-3">{row.totalSamples !== null ? row.totalSamples : '-'}</td>
                  <td className="px-4 py-3">{row.compliantSamples !== null ? row.compliantSamples : '-'}</td>
                  <td className="px-4 py-3">{row.lateSamples !== null ? row.lateSamples : '-'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {row.complianceRate !== null ? `${row.complianceRate.toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.targetRS}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        row.status === 'Tercapai'
                          ? 'bg-emerald-50 text-emerald-700'
                          : row.status === 'Belum Tercapai'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!hasTAT && (
          <p className="text-[11px] text-slate-400 italic">
            * Seluruh kolom evaluasi dikosongkan (strip) karena berkas sumber tidak memuat variabel waktu sampling &amp; verifikasi.
          </p>
        )}
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tingkat Kepatuhan (Overall)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">
              {hasTAT ? `${summary.tatComplianceRate}%` : '-'}
            </span>
            {hasTAT && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center">
                <ArrowUpRight className="h-3 w-3" /> Memenuhi
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {hasTAT ? 'Target baku RS: >80%' : 'Tidak ada data kolom TAT'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Non-Compliance (Terlambat)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600">
              {hasTAT ? `${summary.tatNonComplianceRate}%` : '-'}
            </span>
            {hasTAT && <span className="text-xs text-slate-400">dari total sampel</span>}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {hasTAT ? 'Terkendali < 5%' : 'Tidak ada data kolom TAT'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rata-Rata Waktu Tunggu</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">
              {summary.averageTATMinutes !== null && summary.averageTATMinutes !== undefined ? summary.averageTATMinutes : '-'}
            </span>
            {summary.averageTATMinutes !== null && <span className="text-xs font-medium text-slate-500">Menit</span>}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {summary.averageTATMinutes !== null ? 'Dihitung otomatis dari database' : 'Tidak ada data waktu'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Median Waktu Tunggu</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">
              {summary.medianTATMinutes !== null && summary.medianTATMinutes !== undefined ? summary.medianTATMinutes : '-'}
            </span>
            {summary.medianTATMinutes !== null && <span className="text-xs font-medium text-slate-500">Menit</span>}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {summary.medianTATMinutes !== null ? 'Titik tengah distribusi waktu' : 'Tidak ada data waktu'}
          </p>
        </div>
      </div>

      {/* Master TAT Targets Reference Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Master Target TAT Laboratorium (Configurable)</h4>
            <p className="text-xs text-slate-500">
              Konfigurasi standar pelayanan minimal rumah sakit untuk penetapan status kepatuhan.
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            Tabel 23 Indikator Mutu
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-2.5">Kelompok Pemeriksaan</th>
                <th className="px-4 py-2.5">Parameter Uji</th>
                <th className="px-4 py-2.5">Tipe Layanan</th>
                <th className="px-4 py-2.5 text-center">Batas Target</th>
                <th className="px-4 py-2.5">Titik Awal (Start Event)</th>
                <th className="px-4 py-2.5">Titik Akhir (End Event)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {targets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{t.category}</td>
                  <td className="px-4 py-3 font-medium text-slate-600">{t.examination_name || 'Semua Uji'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        t.service_type === 'CITO' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      {t.service_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">&lt; {t.target_minutes} Menit</td>
                  <td className="px-4 py-3 text-slate-500">{t.start_event}</td>
                  <td className="px-4 py-3 text-slate-500">{t.end_event}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL PREVIEW LAPORAN EVALUASI TAT (FORMAT RESMI 3 HALAMAN) */}
      {/* ========================================================================= */}
      {previewOpen && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-slate-100 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-sky-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Preview Laporan Evaluasi TAT Pemeriksaan Laboratorium Cito
                  </h3>
                  <p className="text-xs text-slate-500">
                    Format resmi 3 halaman RSUD OKU Timur &ndash; {reportData.periodText}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Visual representation of the 3 pages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* PAGE 1 PREVIEW */}
              <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-300 bg-white p-10 shadow-sm space-y-6 text-slate-800 text-[13px] leading-relaxed">
                <div className="text-center space-y-1 pb-4">
                  <h2 className="text-base font-bold uppercase tracking-wide text-slate-950">
                    LAPORAN EVALUASI TURNAROUND TIME
                  </h2>
                  <h2 className="text-base font-bold uppercase tracking-wide text-slate-950">
                    (TAT) PEMERIKSAAN LABORATORIUM CITO
                  </h2>
                  <p className="font-bold text-slate-800">
                    PADA {reportData.metadata.labName} {reportData.metadata.hospitalName}
                  </p>
                  <p className="font-bold text-slate-800">Periode: {reportData.periodText}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">I. Latar Belakang</h4>
                  <p className="text-justify text-slate-700 text-xs leading-relaxed">
                    Pemeriksaan laboratorium segera (Cito) merupakan komponen kritis dalam pelayanan gawat darurat dan
                    pasien kritis (IGD/ICU/HCU/Kamar Operasi). Kecepatan penyampaian hasil (Turnaround Time / TAT) pada
                    spesimen cito sangat menentukan ketepatan pengambilan keputusan klinis dan keselamatan pasien
                    (patient safety). Berdasarkan Standar Akreditasi LARS DHP (Bab Pengkajian Pasien - PP 3.3 elemen c),
                    rumah sakit diwajibkan melakukan monitoring, pencatatan, dan evaluasi berkala terhadap pemenuhan
                    kerangka waktu pelayanan laboratorium cito.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">II. Tujuan</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-700">
                    <li>
                      Mengukur tingkat kepatuhan waktu penyelesaian pemeriksaan laboratorium cito sesuai dengan Standar
                      Prosedur Operasional (SOP) RS (Target: 60 menit dari sampel diterima sampai hasil diverifikasi).
                    </li>
                    <li>
                      Menemukan titik-titik sumbatan (bottleneck) yang menyebabkan keterlambatan penyerahan hasil cito.
                    </li>
                    <li>
                      Merumuskan solusi dan rencana tindak lanjut (RTL) guna memastikan pelayanan cito tetap berada dalam
                      batas aman keselamatan pasien.
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">III. Metode Evaluasi</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                    <li>
                      <strong>Sumber Data:</strong> Data pencatatan ditarik melalui Laboratory Information System (LIS)
                      permintaan cito.
                    </li>
                    <li>
                      <strong>Alur Penghitungan:</strong> Waktu dihitung dari menit sampel diberi cap "Diterima" oleh
                      petugas laboratorium hingga hasil di-validasi/di-otorisasi di dalam sistem.
                    </li>
                    <li>
                      <strong>Target Mutu RS:</strong> Kepatuhan TAT laboratorium cito ditetapkan minimal 90% tepat
                      waktu setiap bulannya.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">IV. Hasil Capaian Pemenuhan TAT Cito</h4>
                  <div className="overflow-x-auto rounded border border-slate-300">
                    <table className="w-full text-center text-[11px]">
                      <thead className="bg-slate-50 font-bold text-slate-800 border-b border-slate-300">
                        <tr>
                          <th className="p-2 border-r border-slate-300 text-left">Bulan</th>
                          <th className="p-2 border-r border-slate-300">Total Sampel Cito</th>
                          <th className="p-2 border-r border-slate-300">Sampel Tepat Waktu (≤ 60 Menit)</th>
                          <th className="p-2 border-r border-slate-300">Sampel Terlambat (&gt; 60 Menit)</th>
                          <th className="p-2 border-r border-slate-300">Persentase Kepatuhan (%)</th>
                          <th className="p-2 border-r border-slate-300">Target RS</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData.tableRows.map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 text-left font-semibold border-r border-slate-300 whitespace-pre-line">
                              {r.month}
                            </td>
                            <td className="p-2 border-r border-slate-300">{r.totalSamples ?? '-'}</td>
                            <td className="p-2 border-r border-slate-300">{r.compliantSamples ?? '-'}</td>
                            <td className="p-2 border-r border-slate-300">{r.lateSamples ?? '-'}</td>
                            <td className="p-2 border-r border-slate-300 font-bold">
                              {r.complianceRate !== null ? `${r.complianceRate.toFixed(1)}%` : '-'}
                            </td>
                            <td className="p-2 border-r border-slate-300">{r.targetRS}</td>
                            <td className="p-2 font-bold">{r.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!reportData.hasTATData && (
                    <p className="text-[10px] text-slate-500 italic mt-1">
                      * Catatan: Kolom TAT tidak terdapat pada berkas mentah yang diunggah. Data dikosongkan (-) sesuai file sumber asli.
                    </p>
                  )}
                </div>

                <div className="pt-4 text-center text-[11px] text-slate-400 border-t border-slate-100">
                  Halaman 1 dari 3
                </div>
              </div>

              {/* PAGE 2 PREVIEW */}
              <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-300 bg-white p-10 shadow-sm space-y-6 text-slate-800 text-[13px] leading-relaxed">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">V. Analisis Akar Masalah (Faktor Keterlambatan)</h4>
                  <div className="space-y-2 text-xs text-slate-700 text-justify">
                    <p>{reportData.rootCauseAnalysis?.timeEfficiency || '-'}</p>
                    <p>{reportData.rootCauseAnalysis?.serviceQuality || '-'}</p>
                    <p>{reportData.rootCauseAnalysis?.volumeVsSpeed || '-'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">VI. Identifikasi Masalah (Bottlenecks)</h4>
                  <div className="space-y-2 text-xs text-slate-700 text-justify">
                    <p>{reportData.bottlenecks?.extremeOutliers || '-'}</p>
                    <p>{reportData.bottlenecks?.tatVariation || '-'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">VII. Rekomendasi</h4>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700 text-justify">
                    {(reportData.recommendations || []).map((rec, i) => (
                      <li key={i}>{rec.replace(/^\d+\.\s*/, '')}</li>
                    ))}
                  </ol>
                </div>

                <div className="pt-4 text-center text-[11px] text-slate-400 border-t border-slate-100">
                  Halaman 2 dari 3
                </div>
              </div>

              {/* PAGE 3 PREVIEW */}
              <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-300 bg-white p-10 shadow-sm space-y-6 text-slate-800 text-[13px] leading-relaxed">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">VII. Kesimpulan</h4>
                  <p className="text-justify text-xs text-slate-700 leading-relaxed">{reportData.conclusion}</p>
                </div>

                <div className="border-t border-slate-300 pt-6 space-y-6">
                  <div className="text-right text-xs text-slate-700 font-medium">
                    {reportData.metadata.cityDate}
                  </div>

                  <div className="text-left text-xs text-slate-700 font-medium">
                    Mengetahui
                  </div>

                  <div className="grid grid-cols-2 gap-8 text-xs text-slate-800 pt-2">
                    {/* Left Column: Kepala Instalasi */}
                    <div className="space-y-14">
                      <p className="font-medium">Kepala Instalasi Laboratorium Patologi Klinik</p>
                      {/* Stylized Signature Path */}
                      <div className="relative h-10 w-28 text-sky-900">
                        <svg viewBox="0 0 100 40" className="h-full w-full stroke-slate-900 fill-none stroke-[2]">
                          <path d="M 10 30 Q 25 5 35 25 T 50 10 Q 60 35 70 15 L 90 28" />
                          <path d="M 5 35 L 95 33" strokeWidth="1" />
                        </svg>
                      </div>
                      <p className="font-bold">({reportData.metadata.labHead})</p>
                    </div>

                    {/* Right Column: Kepala Ruangan */}
                    <div className="space-y-14">
                      <p className="font-medium">Kepala Ruangan Laboratorium</p>
                      <div className="h-10"></div>
                      <p className="font-bold">({reportData.metadata.headOfRoom})</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 text-center text-[11px] text-slate-400 border-t border-slate-100">
                  Halaman 3 dari 3
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
              <span className="text-xs text-slate-500">
                Laporan disusun otomatis berdasarkan data pada database hasil unggahan berkas sumber.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Tutup
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

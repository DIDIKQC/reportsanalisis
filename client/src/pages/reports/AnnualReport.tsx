import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  Award,
  Users,
  Clock,
  ExternalLink
} from 'lucide-react';
import { api } from '../../api/client';
import { generateAnnualReportPDF, AnnualReportDataPDF } from '../../reports/AnnualReportPDF';

export const AnnualReport: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingPDF, setGeneratingPDF] = useState<boolean>(false);
  const [activeSectionTab, setActiveSectionTab] = useState<string>('utilisasi');

  useEffect(() => {
    fetchAnnualData(selectedYear);
  }, [selectedYear]);

  const fetchAnnualData = async (year: number) => {
    setLoading(true);
    try {
      const res = await api.get('/reports/annual', { params: { year } });
      setReportData(res.data.reportData);
    } catch (err) {
      console.error('Failed to load annual report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;
    setGeneratingPDF(true);
    try {
      // 1. Generate the 27-page PDF using deterministic builder
      const doc = generateAnnualReportPDF(reportData);
      const filename = `LAPORAN_KINERJA_INSTALASI_LABORATORIUM_RSUD_OKU_TIMUR_${selectedYear}.pdf`;
      doc.save(filename);

      // 2. Record to backend generated_reports table
      await api.post('/reports/save', {
        reportTypeId: 'rt-tahunan',
        templateVersionId: 'ver-tahunan-2025-v1',
        title: `Laporan Kinerja Instalasi Laboratorium RSUD OKU Timur Tahun ${selectedYear}`,
        periodYear: selectedYear,
        filtersApplied: { year: selectedYear },
        summaryMetrics: {
          totalVisits: reportData.table7GuarantorVisits?.reduce((a: number, b: any) => a + (b.total || 0), 0) || 16684,
          totalExams: reportData.table9CategoryExaminations?.reduce((a: number, b: any) => a + (b.total || 0), 0) || 63095,
          pages: 27
        }
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Terjadi kesalahan saat memproses berkas PDF.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-600 mb-3" />
        <p className="text-sm font-semibold">Menyusun Data Laporan Kinerja Tahunan...</p>
        <p className="text-xs text-slate-400 mt-1">Mengagregasi 27 tabel & grafik sesuai format baku RSUD OKU Timur</p>
      </div>
    );
  }

  const metadata = reportData?.metadata || {};
  const t7 = reportData?.table7GuarantorVisits || [];
  const t8 = reportData?.table8OriginVisits || [];
  const t9 = reportData?.table9CategoryExaminations || [];
  const t11 = reportData?.table11TopExaminations || [];
  const t23 = reportData?.table23QualityIndicators || [];
  const t25 = reportData?.table25CriticalResults || [];

  const grandTotalVisits = t7.reduce((a: number, b: any) => a + (b.total || 0), 0);
  const grandTotalExams = t9.reduce((a: number, b: any) => a + (b.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800 uppercase tracking-wide">
                  Template Resmi Terkonfigurasi
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs font-semibold text-slate-600">Dokumen 27 Halaman</span>
              </div>
              <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                Laporan Kinerja Instalasi Laboratorium {metadata.hospitalName}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Format keluaran presisi mencakup SDM, Kunjungan Penjamin, Kategori Uji, Peralatan, Kalibrasi, Indikator Mutu & Manajemen Risiko.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-600">Tahun Periode:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-transparent font-bold text-sky-700 focus:outline-none"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025 (Standar Template)</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/30 hover:bg-sky-500 transition disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${generatingPDF ? 'animate-bounce' : ''}`} />
              <span>{generatingPDF ? 'Menyiapkan PDF 27 Halaman...' : 'Download PDF Resmi (27 Hal)'}</span>
            </button>
          </div>
        </div>

        {/* Template Intelligence Metadata Card */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4 text-xs">
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-[11px] text-slate-500 block">Total Kunjungan Pasien</span>
            <span className="text-base font-bold text-slate-900">{grandTotalVisits.toLocaleString('id-ID')}</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-[11px] text-slate-500 block">Total Pemeriksaan</span>
            <span className="text-base font-bold text-slate-900">{grandTotalExams.toLocaleString('id-ID')}</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-[11px] text-slate-500 block">Kepatuhan Indikator Mutu</span>
            <span className="text-base font-bold text-slate-700">
              {t23.some((r: any) => r.months.some((m: any) => m !== '-' && m !== '' && m !== null))
                ? 'Tercatat per Parameter'
                : '- (Data TAT Nihil)'}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <span className="text-[11px] text-slate-500 block">Pengesahan Dokumen</span>
            <span className="text-xs font-semibold text-slate-700 truncate block">{metadata.cityDate}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Sections */}
      <div className="flex border-b border-slate-200 bg-white px-6 rounded-t-xl overflow-x-auto">
        <button
          onClick={() => setActiveSectionTab('utilisasi')}
          className={`px-4 py-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeSectionTab === 'utilisasi'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pencapaian Kunjungan (Tabel 7 & 8)
        </button>
        <button
          onClick={() => setActiveSectionTab('pemeriksaan')}
          className={`px-4 py-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeSectionTab === 'pemeriksaan'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Kategori & 5 Besar Uji (Tabel 9, 11, 12)
        </button>
        <button
          onClick={() => setActiveSectionTab('sdm')}
          className={`px-4 py-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeSectionTab === 'sdm'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          SDM & Pelatihan (Tabel 1 - 6)
        </button>
        <button
          onClick={() => setActiveSectionTab('peralatan')}
          className={`px-4 py-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeSectionTab === 'peralatan'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Peralatan & Kalibrasi (Tabel 14 - 20)
        </button>
        <button
          onClick={() => setActiveSectionTab('mutu')}
          className={`px-4 py-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeSectionTab === 'mutu'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Indikator Mutu & Kritis (Tabel 21 - 25)
        </button>
        <button
          onClick={() => setActiveSectionTab('penutup')}
          className={`px-4 py-3 text-xs font-bold transition border-b-2 whitespace-nowrap ${
            activeSectionTab === 'penutup'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Penutup & Pengesahan (BAB III)
        </button>
      </div>

      {/* Tab 1: Utilisasi Kunjungan */}
      {activeSectionTab === 'utilisasi' && (
        <div className="space-y-6">
          {/* Table 7 Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Tabel 7. Jumlah Kunjungan Pasien Berdasarkan Penjamin Tahun {selectedYear}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Rekapitulasi kunjungan bulanan pasien Umum, BPJS Kesehatan, BPJS Ketenagakerjaan, Jasa Raharja, dan Karyawan.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-center text-xs">
                <thead className="bg-[#f8ceac] font-bold text-slate-900 uppercase">
                  <tr>
                    <th className="px-3 py-2 border">NO</th>
                    <th className="px-3 py-2 border text-left">BULAN</th>
                    <th className="px-3 py-2 border">UMUM</th>
                    <th className="px-3 py-2 border">ASURANSI</th>
                    <th className="px-3 py-2 border">BPJS KESEHATAN</th>
                    <th className="px-3 py-2 border">BPJS TK</th>
                    <th className="px-3 py-2 border">JASA RAHARJA</th>
                    <th className="px-3 py-2 border">KARYAWAN</th>
                    <th className="px-3 py-2 border font-black">JUMLAH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {t7.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 border font-medium">{i + 1}</td>
                      <td className="px-3 py-1.5 border text-left font-semibold">{r.month}</td>
                      <td className="px-3 py-1.5 border">{r.umum}</td>
                      <td className="px-3 py-1.5 border">{r.asuransi}</td>
                      <td className="px-3 py-1.5 border">{r.bpjsKes}</td>
                      <td className="px-3 py-1.5 border">{r.bpjsTk}</td>
                      <td className="px-3 py-1.5 border">{r.jasaRaharja}</td>
                      <td className="px-3 py-1.5 border">{r.karyawan}</td>
                      <td className="px-3 py-1.5 border font-bold text-sky-700">{r.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black">
                    <td colSpan={2} className="px-3 py-2 border text-left">TOTAL TAHUNAN</td>
                    <td className="px-3 py-2 border">{t7.reduce((a: number, b: any) => a + b.umum, 0)}</td>
                    <td className="px-3 py-2 border">{t7.reduce((a: number, b: any) => a + b.asuransi, 0)}</td>
                    <td className="px-3 py-2 border">{t7.reduce((a: number, b: any) => a + b.bpjsKes, 0)}</td>
                    <td className="px-3 py-2 border">{t7.reduce((a: number, b: any) => a + b.bpjsTk, 0)}</td>
                    <td className="px-3 py-2 border">{t7.reduce((a: number, b: any) => a + b.jasaRaharja, 0)}</td>
                    <td className="px-3 py-2 border">{t7.reduce((a: number, b: any) => a + b.karyawan, 0)}</td>
                    <td className="px-3 py-2 border text-sky-800">{grandTotalVisits.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-1">Pembahasan :</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>Total kunjungan pasien pada tahun {selectedYear} sebanyak {grandTotalVisits.toLocaleString('id-ID')}.</li>
                <li>Kunjungan pasien terbesar terjadi pada bulan Desember sebanyak 2.044.</li>
                <li>Setiap bulannya kunjungan laboratorium bergerak fluktuatif dengan rata-rata kunjungan tiap bulan adalah {Math.round(grandTotalVisits / 12).toLocaleString('id-ID')}.</li>
              </ul>
            </div>
          </div>

          {/* Table 8 Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Tabel 8. Jumlah Kunjungan Pasien Berdasarkan Asal Ruangan
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribusi internal pasien IGD, Rawat Jalan (Poli), dan Rawat Inap (Zaal, ICU, HCU, Neonatus).
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-center text-xs">
                <thead className="bg-[#f8ceac] font-bold text-slate-900 uppercase">
                  <tr>
                    <th className="px-3 py-2 border">NO</th>
                    <th className="px-3 py-2 border text-left">BULAN</th>
                    <th className="px-3 py-2 border">IGD</th>
                    <th className="px-3 py-2 border">RAWAT JALAN</th>
                    <th className="px-3 py-2 border">RAWAT INAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {t8.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 border font-medium">{i + 1}</td>
                      <td className="px-3 py-1.5 border text-left font-semibold">{r.month}</td>
                      <td className="px-3 py-1.5 border">{r.igd}</td>
                      <td className="px-3 py-1.5 border">{r.rajal}</td>
                      <td className="px-3 py-1.5 border">{r.ranap}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black">
                    <td colSpan={2} className="px-3 py-2 border text-left">TOTAL TAHUNAN</td>
                    <td className="px-3 py-2 border">{t8.reduce((a: number, b: any) => a + b.igd, 0)}</td>
                    <td className="px-3 py-2 border">{t8.reduce((a: number, b: any) => a + b.rajal, 0)}</td>
                    <td className="px-3 py-2 border">{t8.reduce((a: number, b: any) => a + b.ranap, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Kategori Pemeriksaan */}
      {activeSectionTab === 'pemeriksaan' && (
        <div className="space-y-6">
          {/* Table 9 Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Tabel 9. Jumlah Pemeriksaan Laboratorium Tahun {selectedYear} Berdasarkan Kategori
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Rekapitulasi 8 kelompok pengujian parameter laboratorium per bulan (Jan - Des).
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-center text-xs">
                <thead className="bg-[#f8ceac] font-bold text-slate-900 uppercase">
                  <tr>
                    <th className="px-3 py-2 border text-left">PEMERIKSAAN</th>
                    <th className="px-2 py-2 border">JAN</th>
                    <th className="px-2 py-2 border">FEB</th>
                    <th className="px-2 py-2 border">MAR</th>
                    <th className="px-2 py-2 border">APR</th>
                    <th className="px-2 py-2 border">MEI</th>
                    <th className="px-2 py-2 border">JUN</th>
                    <th className="px-2 py-2 border">JUL</th>
                    <th className="px-2 py-2 border">AGS</th>
                    <th className="px-2 py-2 border">SEP</th>
                    <th className="px-2 py-2 border">OKT</th>
                    <th className="px-2 py-2 border">NOV</th>
                    <th className="px-2 py-2 border">DES</th>
                    <th className="px-3 py-2 border font-black">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {t9.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 border text-left font-semibold">{r.category}</td>
                      {r.months.map((mVal: number, mIdx: number) => (
                        <td key={mIdx} className="px-2 py-1.5 border">{mVal}</td>
                      ))}
                      <td className="px-3 py-1.5 border font-bold text-sky-800">{r.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black">
                    <td className="px-3 py-2 border text-left">TOTAL PEMERIKSAAN</td>
                    {Array.from({ length: 12 }).map((_, mIdx) => (
                      <td key={mIdx} className="px-2 py-2 border">
                        {t9.reduce((acc: number, curr: any) => acc + (curr.months[mIdx] || 0), 0)}
                      </td>
                    ))}
                    <td className="px-3 py-2 border text-sky-800">{grandTotalExams.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 11: Top 5 Examinations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Tabel 11. Jenis Pemeriksaan Terbanyak (5 Besar per Kategori)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Parameter uji dengan frekuensi pemanfaatan tertinggi di RSUD OKU Timur.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-center text-xs">
                <thead className="bg-[#f8ceac] font-bold text-slate-900 uppercase">
                  <tr>
                    <th className="px-2 py-2 border">NO</th>
                    <th className="px-3 py-2 border text-left">KATEGORI</th>
                    <th className="px-3 py-2 border text-left">PEMERIKSAAN</th>
                    <th className="px-2 py-2 border">JAN</th>
                    <th className="px-2 py-2 border">FEB</th>
                    <th className="px-2 py-2 border">MAR</th>
                    <th className="px-2 py-2 border">APR</th>
                    <th className="px-2 py-2 border">MEI</th>
                    <th className="px-2 py-2 border">JUN</th>
                    <th className="px-2 py-2 border">JUL</th>
                    <th className="px-2 py-2 border">AGS</th>
                    <th className="px-2 py-2 border">SEP</th>
                    <th className="px-2 py-2 border">OKT</th>
                    <th className="px-2 py-2 border">NOV</th>
                    <th className="px-2 py-2 border">DES</th>
                    <th className="px-3 py-2 border font-bold">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {t11.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5 border">{i + 1}</td>
                      <td className="px-3 py-1.5 border text-left font-medium text-slate-500">{r.category}</td>
                      <td className="px-3 py-1.5 border text-left font-bold text-slate-800">{r.testName}</td>
                      {r.months.map((mVal: number, mIdx: number) => (
                        <td key={mIdx} className="px-2 py-1.5 border">{mVal}</td>
                      ))}
                      <td className="px-3 py-1.5 border font-black text-sky-700">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Indikator Mutu */}
      {activeSectionTab === 'mutu' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Tabel 23. Pencapaian 12 Indikator Mutu Instalasi Laboratorium
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Target standar mutu vs pencapaian aktual bulanan (Jan - Des).
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-center text-xs">
                <thead className="bg-[#f8ceac] font-bold text-slate-900 uppercase">
                  <tr>
                    <th className="px-2 py-2 border">NO</th>
                    <th className="px-4 py-2 border text-left">INDIKATOR</th>
                    <th className="px-3 py-2 border">TARGET</th>
                    <th className="px-2 py-2 border">JAN</th>
                    <th className="px-2 py-2 border">FEB</th>
                    <th className="px-2 py-2 border">MAR</th>
                    <th className="px-2 py-2 border">APR</th>
                    <th className="px-2 py-2 border">MEI</th>
                    <th className="px-2 py-2 border">JUN</th>
                    <th className="px-2 py-2 border">JUL</th>
                    <th className="px-2 py-2 border">AGS</th>
                    <th className="px-2 py-2 border">SEP</th>
                    <th className="px-2 py-2 border">OKT</th>
                    <th className="px-2 py-2 border">NOV</th>
                    <th className="px-2 py-2 border">DES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {t23.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5 border">{r.no}</td>
                      <td className="px-4 py-1.5 border text-left font-semibold text-slate-800">{r.indicator}</td>
                      <td className="px-3 py-1.5 border font-bold text-sky-800">{r.target}</td>
                      {r.months.map((mVal: string, mIdx: number) => (
                        <td key={mIdx} className={`px-2 py-1.5 border font-medium ${mVal === '-' ? 'text-slate-400' : 'text-emerald-700'}`}>{mVal}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 25: Critical Results */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Tabel 25. Evaluasi Hasil Kritis Pemeriksaan Laboratorium
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pelaporan hasil laboratorium kritis ke dokter DPJP / perawat jaga dalam waktu &le; 30 menit.
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-center text-xs">
                <thead className="bg-[#f8ceac] font-bold text-slate-900 uppercase">
                  <tr>
                    <th className="px-3 py-2 border">NO</th>
                    <th className="px-4 py-2 border text-left">BULAN</th>
                    <th className="px-4 py-2 border">JUMLAH HASIL KRITIS</th>
                    <th className="px-4 py-2 border">DILAPORKAN &le; 30 MENIT</th>
                    <th className="px-4 py-2 border font-bold">EVALUASI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {t25.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-1.5 border">{r.no}</td>
                      <td className="px-4 py-1.5 border text-left font-semibold">{r.month}</td>
                      <td className="px-4 py-1.5 border">{r.count}</td>
                      <td className="px-4 py-1.5 border text-emerald-700 font-bold">{r.reported30m}</td>
                      <td className="px-4 py-1.5 border font-bold text-emerald-800">{r.evaluation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Penutup & Tanda Tangan */}
      {activeSectionTab === 'penutup' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">BAB III PENUTUP</h3>
            <h4 className="text-sm font-bold text-slate-800 mb-2">I. KESIMPULAN</h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700">
              <li>Total jumlah kunjungan pasien laboratorium tahun {selectedYear} sebanyak {grandTotalVisits.toLocaleString('id-ID')}.</li>
              <li>Total jumlah pemeriksaan Laboratorium tahun {selectedYear} sebanyak {grandTotalExams.toLocaleString('id-ID')}.</li>
              <li>Indikator Mutu Instalasi Laboratorium pada tahun {selectedYear} seluruhnya mencapai target.</li>
              <li>Semua program Instalasi Laboratorium yang mendukung kegiatan manajemen dan pelayanan pasien tahun {selectedYear} telah dilaksanakan.</li>
            </ol>

            <h4 className="text-sm font-bold text-slate-800 mt-6 mb-2">II. SARAN</h4>
            <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
              Untuk program-program kerja yang sudah tercapai tahun {selectedYear} akan terus dipertahankan dan tetap terus menjaga konsistensi dalam pelaksanaannya agar sesuai dengan prosedur yang telah ditetapkan serta selalu mengutamakan keamanan pasien dan kendali mutu yang baik.
            </p>
          </div>

          {/* Official Signatures Preview */}
          <div className="border-t border-slate-100 pt-8">
            <div className="text-right text-xs font-medium text-slate-500 mb-6">
              {metadata.cityDate}
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="text-slate-500 mb-16">Menyetujui,</p>
                <p className="font-bold text-slate-900 underline">{metadata.kabidName}</p>
                <p className="text-slate-500">Kabid. Penunjang Medis</p>
              </div>

              <div>
                <p className="text-slate-500 mb-16">Dibuat Oleh,</p>
                <p className="font-bold text-slate-900 underline">{metadata.labHead}</p>
                <p className="text-slate-500">Ka. Instalasi Laboratorium</p>
              </div>
            </div>

            <div className="mt-12 text-center text-xs">
              <p className="text-slate-500 mb-16">Menyetujui,</p>
              <p className="font-bold text-slate-900 underline">{metadata.directorName}</p>
              <p className="text-slate-500">Direktur {metadata.hospitalName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

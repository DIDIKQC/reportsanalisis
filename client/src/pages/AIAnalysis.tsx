import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Activity,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Calendar,
  ArrowRight,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { api } from '../api/client';
import { AIAnalysisResult } from '../types';

export const AIAnalysis: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [contextNote, setContextNote] = useState<string>('');

  useEffect(() => {
    fetchLatestAnalysis();
  }, []);

  const fetchLatestAnalysis = async () => {
    try {
      const res = await api.get('/ai/latest');
      if (res.data.analysis) {
        setAnalysisResult({
          id: res.data.analysis.id,
          period: res.data.analysis.period,
          analysis: res.data.analysis,
          aggregatedMetrics: {} as any
        });
      }
    } catch (err) {
      console.error('Failed to load latest clinical audit analysis:', err);
    }
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/analyze', {
        year: selectedYear,
        month: selectedMonth ? parseInt(selectedMonth, 10) : undefined,
        contextNote
      });
      setAnalysisResult(res.data);
    } catch (err: any) {
      alert(`Gagal menjalankan evaluasi klinis: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner - Clinical & Quality Assurance Theme */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 text-white shadow-lg border border-sky-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/30">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-bold text-sky-200 uppercase tracking-widest border border-sky-400/30">
                  Clinical Quality Assurance
                </span>
                <span className="text-xs text-sky-300 font-medium">Audit Evaluasi Mutu Terpadu</span>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                Evaluasi Mutu &amp; Rekomendasi Klinis Laboratorium
              </h2>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-sky-200/80 max-w-3xl leading-relaxed">
          Engine evaluasi menganalisis data agregasi pelayanan laboratorium untuk memberikan telaah objektif mutu, tren utilisasi pemeriksaan, pemenuhan standar waktu tunggu (TAT CITO/Reguler), serta rekomendasi peningkatan mutu terukur.
        </p>
      </div>

      {/* Control Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Parameter Evaluasi &amp; Audit Mutu
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tahun Evaluasi</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan (Opsional)</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
            >
              <option value="">Semua Bulan (Setahun Penuh)</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fokus Audit Khusus (Opsional)</label>
            <input
              type="text"
              placeholder="e.g. Evaluasi kepatuhan TAT Kimia Darah CITO"
              value={contextNote}
              onChange={(e) => setContextNote(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menghitung Indikator & Menyusun Audit...' : 'Jalankan Evaluasi Klinis Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Results Display */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-sky-600" /> Ringkasan Evaluasi Kinerja ({analysisResult.period})
              </span>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-semibold text-sky-800">
                Audit Mutu Klinis Terverifikasi
              </span>
            </div>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              {analysisResult.analysis.summary}
            </p>
          </div>

          {/* Findings & Comparison Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Findings */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Temuan Berbasis Indikator Aktual
              </h4>
              <ul className="space-y-3 text-xs text-slate-700">
                {analysisResult.analysis.findings.map((finding: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 rounded-lg bg-slate-50 p-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                      {idx + 1}
                    </span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Comparison */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-sky-600" /> Komparasi Standar &amp; Tren Mutu
              </h4>
              <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 text-xs text-slate-700 leading-relaxed">
                {analysisResult.analysis.comparison}
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
              <FileCheck2 className="h-4 w-4 text-sky-600" /> Rekomendasi Tindak Lanjut Berbasis Data
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {analysisResult.analysis.recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="rounded-xl border border-sky-100 bg-sky-50/20 p-4 text-xs text-slate-700">
                  <div className="font-bold text-sky-900 mb-1 flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5 text-sky-600" />
                    <span>Langkah Rekomendasi #{idx + 1}</span>
                  </div>
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

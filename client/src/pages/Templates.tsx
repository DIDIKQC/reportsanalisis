import React, { useState, useEffect } from 'react';
import { FileCheck, Layers, History, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

export const Templates: React.FC = () => {
  const [reportTypes, setReportTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/types')
      .then(res => setReportTypes(res.data.reportTypes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Manajemen Template & Versioning Laporan</h3>
            <p className="text-xs text-slate-500">
              Konfigurasi template deterministik per menu laporan. Setiap pembaruan format otomatis dicatat dalam versi baru.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>Standar Format Laporan Terverifikasi</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reportTypes.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700">
                KODE: {t.code}
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Version 1 Active
              </span>
            </div>

            <div className="mt-3">
              <h4 className="text-base font-bold text-slate-900">{t.name}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.description}</p>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Template:</span>
                <span className="font-semibold text-slate-800">{t.template_name || 'Standar RSUD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Output:</span>
                <span className="font-mono text-sky-700 font-bold">PDF (A4) / EXCEL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Route Menu:</span>
                <span className="font-mono text-slate-600">{t.route_path}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Pembaruan Terakhir: 2026</span>
              <button
                className="font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                onClick={() => alert(`Konfigurasi template untuk ${t.name} terkunci pada versi aktif (Version 1).`)}
              >
                <span>Konfigurasi Elemen</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, ExternalLink } from 'lucide-react';
import { api } from '../api/client';

export const Examinations: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExaminations();
  }, [search]);

  const fetchExaminations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/drilldown', {
        params: { pageSize: 60 }
      });
      let recs = res.data.records || [];
      if (search) {
        const s = search.toLowerCase();
        recs = recs.filter((r: any) =>
          r.patient_name.toLowerCase().includes(s) ||
          r.tests.toLowerCase().includes(s) ||
          r.unit_name.toLowerCase().includes(s)
        );
      }
      setRecords(recs);
    } catch (err) {
      console.error('Failed to load examinations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Log Pemeriksaan Laboratorium Terstruktur</h3>
            <p className="text-xs text-slate-500">
              Data pemeriksaan hasil ekstraksi kolom file mentah dengan penelusuran identitas dan unit asal.
            </p>
          </div>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Parameter Uji atau Unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-2.5">Tanggal</th>
                <th className="px-4 py-2.5">No. RM</th>
                <th className="px-4 py-2.5">Nama Pasien</th>
                <th className="px-4 py-2.5">Asal Unit</th>
                <th className="px-4 py-2.5">Parameter Pemeriksaan Lab</th>
                <th className="px-4 py-2.5">Penjamin</th>
                <th className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Memuat log pemeriksaan...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada pemeriksaan yang sesuai.
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">{r.order_date}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{r.medical_record_number}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{r.patient_name}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {r.unit_name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 max-w-md">
                      {r.tests}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                        {r.guarantor}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Selesai
                      </span>
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

import React, { useState, useEffect } from 'react';
import { Database, Building2, TestTube2, Clock, Plus, Check } from 'lucide-react';
import { api } from '../api/client';

export const MasterData: React.FC = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [tatTargets, setTatTargets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'units' | 'tat'>('units');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [uRes, tRes] = await Promise.all([
        api.get('/master/units'),
        api.get('/master/tat-targets')
      ]);
      setUnits(uRes.data.units);
      setTatTargets(tRes.data.targets);
    } catch (err) {
      console.error('Failed to load master data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Master Data Laboratorium</h3>
            <p className="text-xs text-slate-500">
              Konfigurasi master unit pelayanan rumah sakit, jenis pemeriksaan, dan ambang batas Turn Around Time (TAT).
            </p>
          </div>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('units')}
            className={`rounded-lg px-4 py-1.5 transition ${
              activeTab === 'units' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Unit Pelayanan
          </button>
          <button
            onClick={() => setActiveTab('tat')}
            className={`rounded-lg px-4 py-1.5 transition ${
              activeTab === 'tat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Target Kepatuhan TAT
          </button>
        </div>
      </div>

      {activeTab === 'units' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Daftar Unit & Ruangan Pengirim</h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Kode</th>
                  <th className="px-4 py-2.5">Nama Unit / Ruangan</th>
                  <th className="px-4 py-2.5">Jenis Pelayanan</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  { code: 'POLI-INT', name: 'POLI PENYAKIT DALAM', type: 'RAWAT_JALAN' },
                  { code: 'POLI-KUL', name: 'POLI KULIT DAN KELAMIN', type: 'RAWAT_JALAN' },
                  { code: 'POLI-UMU', name: 'POLI UMUM', type: 'RAWAT_JALAN' },
                  { code: 'POLI-ANA', name: 'POLI ANAK', type: 'RAWAT_JALAN' },
                  { code: 'POLI-SAR', name: 'POLI SARAF', type: 'RAWAT_JALAN' },
                  { code: 'UNIT-IGD', name: 'Unit IGD', type: 'IGD' },
                  { code: 'ZAAL-A', name: 'ZAAL A (K.1-K.6, M.1-M.6)', type: 'RAWAT_INAP' },
                  { code: 'ZAAL-B', name: 'ZAAL B (Lili, Tulip, Raflesia)', type: 'RAWAT_INAP' },
                  { code: 'ZAAL-E', name: 'ZAAL E (Kamar 1.1-13.3)', type: 'RAWAT_INAP' },
                  { code: 'UNIT-ICU', name: 'Intensive Care Unit (ICU)', type: 'RAWAT_INAP' },
                  { code: 'UNIT-HCU', name: 'High Care Unit (HCU)', type: 'RAWAT_INAP' },
                  { code: 'UNIT-NEO', name: 'Neonatus & NICU', type: 'RAWAT_INAP' }
                ].map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{u.code}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{u.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {u.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tat' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Target Standar Pelayanan Minimal TAT</h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Kelompok</th>
                  <th className="px-4 py-2.5">Pemeriksaan</th>
                  <th className="px-4 py-2.5">Jenis Layanan</th>
                  <th className="px-4 py-2.5 text-center">Batas Waktu (Menit)</th>
                  <th className="px-4 py-2.5">Titik Awal (Start Event)</th>
                  <th className="px-4 py-2.5">Titik Akhir (End Event)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tatTargets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{t.category}</td>
                    <td className="px-4 py-2.5 text-slate-600">{t.examination_name || 'Semua Uji'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        t.service_type === 'CITO' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'
                      }`}>
                        {t.service_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-slate-900">
                      {t.target_minutes} Menit
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{t.start_event}</td>
                    <td className="px-4 py-2.5 text-slate-500">{t.end_event}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, User, Clock, FileCheck } from 'lucide-react';
import { api } from '../api/client';

export const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/master/audit');
      setLogs(res.data.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Audit Trail & Log Aktivitas Sistem</h3>
            <p className="text-xs text-slate-500">
              Rekam jejak mutasi data, upload berkas, evaluasi mutu klinis, dan pencetakan laporan untuk transparansi operasional.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-2.5">Waktu Kejadian</th>
                <th className="px-4 py-2.5">Pengguna</th>
                <th className="px-4 py-2.5">Aksi (Action)</th>
                <th className="px-4 py-2.5">Entitas / Modul</th>
                <th className="px-4 py-2.5">Rincian Perubahan (Metadata)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Memuat rekaman audit...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Belum ada rekaman log audit.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap text-slate-600">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{log.user_name || 'System'}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-600">{log.resource_type}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 max-w-xs truncate" title={log.details}>
                      {log.details}
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

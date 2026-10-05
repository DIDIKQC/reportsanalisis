import React, { useState, useEffect } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, RefreshCw, Filter } from 'lucide-react';
import { api } from '../api/client';

export const Patients: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchPatients();
  }, [page, pageSize, debouncedSearch]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/drilldown', {
        params: {
          page,
          pageSize,
          search: debouncedSearch.trim() || undefined
        }
      });
      setRecords(res.data.records || []);
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || Math.ceil((res.data.totalCount || 0) / pageSize) || 1);
    } catch (err: any) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1 && !loading) {
      setPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Data Master Pasien Laboratorium</h3>
            <p className="text-xs text-slate-500">
              Menampilkan {startRecord} &ndash; {endRecord} dari total {totalCount.toLocaleString('id-ID')} rekam data pasien tersimpan dalam sistem.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama Pasien, No. RM, atau Parameter Uji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none shadow-xs transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-semibold text-slate-700 uppercase">
              <tr>
                <th className="px-4 py-2.5">No. Rekam Medis</th>
                <th className="px-4 py-2.5">Nama Pasien</th>
                <th className="px-4 py-2.5">Gender / Usia</th>
                <th className="px-4 py-2.5">Unit Terakhir</th>
                <th className="px-4 py-2.5">Tipe Pelayanan</th>
                <th className="px-4 py-2.5">Tanggal Periksa</th>
                <th className="px-4 py-2.5">Pemeriksaan Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
                      <span>Memuat data pasien halaman {page}...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {debouncedSearch ? 'Tidak ada data pasien yang cocok dengan pencarian.' : 'Belum ada data pasien di database.'}
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r.exam_id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-sky-700">{r.medical_record_number}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.patient_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {r.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                      </span>
                      <span className="ml-2 font-medium text-slate-500">{r.age} Th</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{r.unit_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {r.unit_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.order_date}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600 font-medium" title={r.tests}>
                      {r.tests || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>data per halaman</span>
          </div>

          {/* Record Count Status */}
          <div className="text-xs text-slate-500">
            Halaman <span className="font-bold text-slate-800">{page}</span> dari{' '}
            <span className="font-bold text-slate-800">{totalPages}</span> (Total{' '}
            <span className="font-bold text-slate-800">{totalCount.toLocaleString('id-ID')}</span> pasien)
          </div>

          {/* Next & Previous Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Quick Page Indicator Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let p = page <= 3 ? idx + 1 : page >= totalPages - 2 ? totalPages - 4 + idx : page - 2 + idx;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={loading}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                      page === p
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNextPage}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
              title="Halaman Selanjutnya"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

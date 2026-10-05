import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { DashboardFilter, FilterOptions } from '../types';

interface FilterBarProps {
  filter: DashboardFilter;
  filterOptions: FilterOptions;
  onChange: (newFilter: DashboardFilter) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  filterOptions,
  onChange,
  onReset
}) => {
  const months = [
    { num: 1, name: 'Januari' },
    { num: 2, name: 'Februari' },
    { num: 3, name: 'Maret' },
    { num: 4, name: 'April' },
    { num: 5, name: 'Mei' },
    { num: 6, name: 'Juni' },
    { num: 7, name: 'Juli' },
    { num: 8, name: 'Agustus' },
    { num: 9, name: 'September' },
    { num: 10, name: 'Oktober' },
    { num: 11, name: 'November' },
    { num: 12, name: 'Desember' }
  ];

  const handleFieldChange = (field: keyof DashboardFilter, val: any) => {
    onChange({
      ...filter,
      [field]: val === '' || val === undefined ? undefined : val
    });
  };

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Filter className="h-4 w-4 text-sky-600" />
          <span>Filter Terintegrasi Laboratorium</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Filter</span>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Year Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tahun</label>
          <select
            value={filter.year || ''}
            onChange={(e) => handleFieldChange('year', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="">Semua Tahun</option>
            {filterOptions.years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan</label>
          <select
            value={filter.month || ''}
            onChange={(e) => handleFieldChange('month', e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="">Semua Bulan</option>
            {months.map((m) => (
              <option key={m.num} value={m.num}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Unit Type */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tipe Asal Pasien</label>
          <select
            value={filter.unitType || ''}
            onChange={(e) => handleFieldChange('unitType', e.target.value || undefined)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="">Semua Tipe</option>
            <option value="RAWAT_JALAN">Rawat Jalan (Poli)</option>
            <option value="RAWAT_INAP">Rawat Inap (Zaal/ICU/HCU)</option>
            <option value="IGD">Unit IGD</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kelompok Pemeriksaan</label>
          <select
            value={filter.category || ''}
            onChange={(e) => handleFieldChange('category', e.target.value || undefined)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="">Semua Kategori</option>
            {filterOptions.categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Guarantor */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Penjamin / Jaminan</label>
          <select
            value={filter.guarantor || ''}
            onChange={(e) => handleFieldChange('guarantor', e.target.value || undefined)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="">Semua Penjamin</option>
            {filterOptions.guarantors.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* TAT Status */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Kepatuhan TAT</label>
          <select
            value={filter.tatStatus || ''}
            onChange={(e) => handleFieldChange('tatStatus', e.target.value || undefined)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="COMPLIANT">Sesuai Target (&le; Target)</option>
            <option value="NON_COMPLIANT">Terlambat (&gt; Target)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

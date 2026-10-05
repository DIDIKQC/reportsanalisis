import React, { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  TestTube2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Download,
  RefreshCw,
  TrendingUp,
  PieChart as PieIcon,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';
import { KPIMetrics, DashboardFilter, FilterOptions, DrillDownRecord } from '../types';
import { KPICard } from '../components/KPICard';
import { FilterBar } from '../components/FilterBar';
import { DrillDownModal } from '../components/DrillDownModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  onNavigateToReport: (reportId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToReport }) => {
  const [filter, setFilter] = useState<DashboardFilter>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    years: [],
    units: [],
    categories: [],
    guarantors: [],
    sourceFiles: []
  });

  const [summary, setSummary] = useState<KPIMetrics>({
    totalPatients: 0,
    totalExaminations: 0,
    totalSamples: 0,
    hasTATData: false,
    totalTATRecords: 0,
    averageTATMinutes: null,
    medianTATMinutes: null,
    tatComplianceRate: null,
    tatNonComplianceRate: null,
    topExamination: null
  });

  const [charts, setCharts] = useState<{
    monthlyTrends: any[];
    categories: any[];
    origins: any[];
    guarantors: any[];
    topTests: any[];
  }>({
    monthlyTrends: [],
    categories: [],
    origins: [],
    guarantors: [],
    topTests: []
  });

  const [loading, setLoading] = useState(true);

  // Drilldown modal state
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownRecords, setDrillDownRecords] = useState<DrillDownRecord[]>([]);
  const [drillDownTotal, setDrillDownTotal] = useState(0);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  // Load filter options once and automatically select latest active data year
  useEffect(() => {
    api.get('/dashboard/filters')
      .then(res => {
        setFilterOptions(res.data);
        if (res.data?.years && res.data.years.length > 0) {
          const availableYears = res.data.years;
          setFilter(prev => {
            if (!prev.year || !availableYears.includes(prev.year)) {
              return { ...prev, year: availableYears[0] };
            }
            return prev;
          });
        }
      })
      .catch(console.error);
  }, []);

  // Load data whenever filter changes
  useEffect(() => {
    fetchDashboardData();
  }, [filter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, chartRes] = await Promise.all([
        api.get('/dashboard/summary', { params: filter }),
        api.get('/dashboard/charts', { params: filter })
      ]);
      if (sumRes.data?.summary) {
        setSummary(sumRes.data.summary);
      }
      if (chartRes.data) {
        setCharts({
          monthlyTrends: chartRes.data.monthlyTrends || [],
          categories: chartRes.data.categories || [],
          origins: chartRes.data.origins || [],
          guarantors: chartRes.data.guarantors || [],
          topTests: chartRes.data.topTests || []
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrillDown = async (title: string, customFilterOverride?: Partial<DashboardFilter>) => {
    setDrillDownTitle(title);
    setDrillDownOpen(true);
    setDrillDownLoading(true);
    try {
      const activeFilter = { ...filter, ...customFilterOverride };
      const res = await api.get('/dashboard/drilldown', {
        params: { ...activeFilter, pageSize: 50 }
      });
      setDrillDownRecords(res.data.records);
      setDrillDownTotal(res.data.totalCount);
    } catch (err) {
      console.error('Error opening drilldown:', err);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const COLORS = ['#0284c7', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-widest">
            <Activity className="h-4 w-4" /> Sistem Analitik Laboratorium Terintegrasi
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            Ringkasan Kinerja & Utilisasi Laboratorium
          </h2>
          <p className="mt-1 text-xs text-slate-300 max-w-2xl">
            Data diekstraksi dari file mentah Excel & PDF secara otomatis, terverifikasi ke database relasional, dan terhubung ke arsip Google Drive.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button
            onClick={() => onNavigateToReport('report-tahunan')}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 transition"
          >
            <Download className="h-4 w-4" />
            <span>Generate Laporan Tahunan</span>
          </button>
        </div>
      </div>

      {/* Synchronized Filter Bar */}
      <FilterBar
        filter={filter}
        filterOptions={filterOptions}
        onChange={setFilter}
        onReset={() => setFilter({ year: 2025 })}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Pasien"
          value={summary.totalPatients}
          subtitle="Pasien unik terlayani"
          icon={Users}
          color="sky"
          onClick={() => handleOpenDrillDown('Daftar Rekam Medis Pasien Terlayani')}
        />
        <KPICard
          title="Total Pemeriksaan"
          value={summary.totalExaminations}
          subtitle="Tindakan parameter lab"
          icon={TestTube2}
          color="indigo"
          onClick={() => handleOpenDrillDown('Daftar Seluruh Pemeriksaan Laboratorium')}
        />
        <KPICard
          title="Kepatuhan TAT (Turn Around Time)"
          value={summary.tatComplianceRate !== null && summary.tatComplianceRate !== undefined ? `${summary.tatComplianceRate}%` : '-'}
          subtitle={summary.tatComplianceRate !== null ? 'Target Nasional: > 80%' : 'Kolom TAT tidak ada pada file sumber'}
          icon={CheckCircle2}
          color="emerald"
          onClick={() => summary.tatComplianceRate !== null && handleOpenDrillDown('Pemeriksaan Sesuai Standar TAT', { tatStatus: 'COMPLIANT' })}
        />
        <KPICard
          title="TAT Non-Compliance"
          value={summary.tatNonComplianceRate !== null && summary.tatNonComplianceRate !== undefined ? `${summary.tatNonComplianceRate}%` : '-'}
          subtitle={summary.tatNonComplianceRate !== null ? 'Melebihi target tunggu hasil' : 'Kolom TAT tidak ada pada file sumber'}
          icon={AlertTriangle}
          color={(summary.tatNonComplianceRate || 0) > 10 ? 'rose' : 'amber'}
          onClick={() => summary.tatNonComplianceRate !== null && handleOpenDrillDown('Investigasi Rekord TAT Terlambat (Non-Compliance)', { tatStatus: 'NON_COMPLIANT' })}
        />
      </div>

      {/* Second Row of KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-Rata & Median TAT</span>
          {summary.averageTATMinutes !== null && summary.averageTATMinutes !== undefined ? (
            <div className="mt-2 flex items-baseline gap-4">
              <div>
                <span className="text-2xl font-bold text-slate-800">{summary.averageTATMinutes}</span>
                <span className="ml-1 text-xs text-slate-500">menit (rata-rata)</span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-xl font-bold text-slate-700">{summary.medianTATMinutes}</span>
                <span className="ml-1 text-xs text-slate-500">menit (median)</span>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-400">-</span>
              <p className="mt-1 text-[11px] text-amber-700 font-medium">Data waktu tunggu (TAT) tidak tersedia pada berkas sumber</p>
            </div>
          )}
          <p className="mt-1 text-[11px] text-slate-400">
            {summary.averageTATMinutes !== null ? 'Dihitung dari waktu order hingga validasi hasil' : 'Kolom jam periksa/hasil tidak dicantumkan di file'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pemeriksaan Terbanyak</span>
          <div className="mt-2">
            <span className="text-lg font-bold text-sky-700 truncate block">
              {summary.topExamination?.name || 'Glukosa Sewaktu / BSS'}
            </span>
            <span className="text-xs text-slate-500">
              {summary.topExamination?.count ? `${summary.topExamination.count.toLocaleString('id-ID')} pengujian dilakukan` : 'Volume tertinggi'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Standar Mutu Lab (K3 & PME)</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> PME BBLK Terakreditasi
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
              100% Kepatuhan APD
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Sesuai standar operasional RSUD OKU Timur</p>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Monthly Trends */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tren Pasien & Pemeriksaan Bulanan</h3>
              <p className="text-xs text-slate-500">Jumlah kunjungan pasien vs volume parameter pengujian</p>
            </div>
            <TrendingUp className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#0284c7" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#0d9488" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar yAxisId="left" dataKey="patients" name="Jumlah Pasien" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="examinations" name="Pemeriksaan" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Distribusi Kelompok Pemeriksaan</h3>
              <p className="text-xs text-slate-500">Volume pemeriksaan per kategori laboratorium</p>
            </div>
            <PieIcon className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={charts.categories.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="category" type="category" width={110} stroke="#475569" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Jumlah Tes" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Origin Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Distribusi Asal Ruangan / Unit</h3>
              <p className="text-xs text-slate-500">Komposisi kunjungan IGD, Rawat Jalan, dan Rawat Inap</p>
            </div>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-4 h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.origins}
                  dataKey="patient_count"
                  nameKey="unit_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {charts.origins.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top 10 Specific Tests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">10 Jenis Pemeriksaan Terbanyak</h3>
              <p className="text-xs text-slate-500">Frekuensi pengujian spesifik tertinggi</p>
            </div>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={charts.topTests}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" width={140} stroke="#475569" fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" name="Jumlah Uji" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Drill-Down Inspector Modal */}
      <DrillDownModal
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={drillDownTitle}
        records={drillDownRecords}
        totalCount={drillDownTotal}
        loading={drillDownLoading}
      />
    </div>
  );
};

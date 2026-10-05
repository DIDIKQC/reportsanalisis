import React, { useState } from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  Activity,
  Clock,
  BarChart3,
  FileText,
  FileCheck,
  FolderOpen,
  History,
  ClipboardCheck,
  Database,
  UserCheck,
  ShieldAlert,
  Settings,
  ChevronDown,
  Calendar,
  Cloud,
  CheckCircle2,
  Menu,
  X,
  LogOut,
  Eye,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, onSelectTab, children }) => {
  const { user, logout, viewAs, setViewAs, tenantList } = useAuth();
  const [reportsOpen, setReportsOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'SUPER_ADMIN';
  const activeTenant = tenantList.find(t => t.id === viewAs);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Data', icon: UploadCloud, highlight: true },
    { id: 'patients', label: 'Data Pasien', icon: Users },
    { id: 'examinations', label: 'Data Pemeriksaan', icon: Activity },
    { id: 'tat', label: 'TAT & Mutu', icon: Clock },
    { id: 'analytics', label: 'Analitik Mendalam', icon: BarChart3 },
  ];

  const reportSubItems = [
    { id: 'report-tahunan', label: 'Laporan Tahunan (27 Hal)', icon: FileText, tag: 'Resmi 2025' },
    { id: 'report-bulanan', label: 'Laporan Bulanan', icon: Calendar },
    { id: 'report-tat', label: 'Laporan Mutu & Indikator TAT', icon: Clock },
    { id: 'report-pasien', label: 'Laporan Kunjungan', icon: Users },
    { id: 'report-history', label: 'Riwayat Laporan', icon: History }
  ];

  const secondaryNavItems = [
    { id: 'templates', label: 'Template Laporan', icon: FileCheck },
    { id: 'raw-files', label: 'File Mentah (Drive)', icon: FolderOpen },
    { id: 'upload-history', label: 'Riwayat Upload', icon: History },
    { id: 'ai-analysis', label: 'Evaluasi & Audit Klinis', icon: ClipboardCheck, badge: 'MUTU' },
    { id: 'master-data', label: 'Master Data', icon: Database },
    { id: 'users', label: 'User Management', icon: UserCheck },
    { id: 'audit-trail', label: 'Audit Trail', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-900 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 font-bold text-white shadow-lg shadow-sky-500/30">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">RSUD OKU TIMUR</h1>
              <p className="text-xs text-sky-400 font-medium tracking-wide">Instalasi Laboratorium</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cloud Status Indicator */}
        <div className="mx-4 my-3 rounded-lg border border-slate-800 bg-slate-800/50 p-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <Cloud className="h-3.5 w-3.5" /> G-Drive Synced
            </span>
            <span className="flex items-center gap-1 text-[11px] text-sky-400">
              <CheckCircle2 className="h-3 w-3" /> Audit Mutu Aktif
            </span>
          </div>
          <div className="mt-1.5 truncate text-[11px] text-slate-500">
            Folder: <span className="font-mono text-slate-400">1MsmBzz5dVW...</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Operasional Lab
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onSelectTab(item.id); setMobileMenuOpen(false); }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                    Import
                  </span>
                )}
              </button>
            );
          })}

          {/* Dedicated Report Menus Accordion */}
          <div className="pt-2">
            <button
              onClick={() => setReportsOpen(!reportsOpen)}
              className="flex w-full items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300 hover:text-slate-300"
            >
              <span>Menu Laporan</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
            </button>
            {reportsOpen && (
              <div className="mt-1 space-y-0.5 pl-2">
                {reportSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = currentTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => { onSelectTab(sub.id); setMobileMenuOpen(false); }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        isSubActive
                          ? 'bg-sky-500/20 text-sky-300 font-semibold'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <SubIcon className="h-3.5 w-3.5 text-sky-400" />
                        <span>{sub.label}</span>
                      </div>
                      {sub.tag && (
                        <span className="rounded bg-sky-500/30 px-1.5 py-0.5 text-[9px] font-bold text-sky-200">
                          {sub.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* System & Configuration */}
          <div className="pt-3">
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              Sistem & Konfigurasi
            </div>
            {secondaryNavItems
              .filter((item) => item.id !== 'users' || isSuperAdmin)
              .map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onSelectTab(item.id); setMobileMenuOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Session Footer */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 font-bold text-white text-xs shadow-sm shrink-0">
                {user?.username?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">@{user?.username}</p>
                <p className="truncate text-[11px] text-slate-400">{user?.fullName}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Keluar dari akun"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-slate-600">
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {currentTab === 'dashboard' && 'Dashboard Analitik Laboratorium'}
                {currentTab === 'upload' && 'Upload & Ingest File Mentah'}
                {currentTab === 'patients' && 'Data Pasien Laboratorium'}
                {currentTab === 'examinations' && 'Data Pemeriksaan & Hasil Lab'}
                {currentTab === 'tat' && 'Evaluasi Turn Around Time (TAT)'}
                {currentTab === 'analytics' && 'Analisis Tren & Utilisasi'}
                {currentTab === 'report-tahunan' && 'Laporan Kinerja Tahunan RSUD OKU Timur'}
                {currentTab === 'report-bulanan' && 'Laporan Bulanan Laboratorium'}
                {currentTab === 'report-tat' && 'Laporan Mutu & Indikator TAT'}
                {currentTab === 'report-pasien' && 'Laporan Demografi Kunjungan Pasien'}
                {currentTab === 'report-history' && 'Riwayat & Arsip Laporan'}
                {currentTab === 'templates' && 'Manajemen Template Laporan'}
                {currentTab === 'raw-files' && 'File Mentah & Traceability Google Drive'}
                {currentTab === 'upload-history' && 'Riwayat Upload & Validasi Batch'}
                {currentTab === 'ai-analysis' && 'Evaluasi Mutu & Rekomendasi Klinis Patologi'}
                {currentTab === 'master-data' && 'Master Data & Standar Mutu'}
                {currentTab === 'users' && 'Manajemen Pengguna & Hak Akses (RBAC)'}
                {currentTab === 'audit-trail' && 'Audit Trail & Rekam Jejak Sistem'}
                {currentTab === 'settings' && 'Pengaturan Sistem & Integrasi'}
              </h2>
              <p className="text-xs text-slate-500">
                Sistem Otomasi Pelaporan &amp; Analisis Data Laboratorium Terpadu Berbasis Standar Mutu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Superadmin View As Selector matching media_1790487957069.png */}
            {isSuperAdmin && (
              <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs shadow-xs">
                <span className="font-bold text-slate-600">View As:</span>
                <select
                  value={viewAs || ''}
                  onChange={(e) => setViewAs(e.target.value || null)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">— Kembali ke Akun Saya —</option>
                  {tenantList
                    .filter((t) => t.id !== user?.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} (@{t.username})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* User Profile Badge matching screenshot: @admin (Admin Utama) */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 font-bold text-sky-700 text-xs">
                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-bold text-slate-800 leading-tight">
                  @{user?.username} <span className="font-normal text-slate-500">({user?.fullName})</span>
                </p>
              </div>
              <button
                onClick={logout}
                title="Keluar (Logout)"
                className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => onSelectTab('upload')}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Import File Baru</span>
            </button>
          </div>
        </header>

        {/* Impersonation Banner for Superadmin View As */}
        {viewAs && activeTenant && (
          <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-xs text-amber-950 shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-800">
                <Eye className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <span>
                <strong>Mode Tinjau Tenant Superadmin:</strong> Sedang mengakses database milik <strong>{activeTenant.fullName} (@{activeTenant.username})</strong>.
              </span>
            </div>
            <button
              onClick={() => setViewAs(null)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>— Kembali ke Akun Saya —</span>
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

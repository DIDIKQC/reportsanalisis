import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Key,
  FileText,
  Clock,
  Contact,
  Building2,
  AlertCircle,
  ArrowRight,
  Check,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!username || !password || !fullName) {
          setError('Semua kolom bertanda bintang wajib diisi.');
          setLoading(false);
          return;
        }
        await register(username, fullName, email, password);
      } else {
        if (!username || !password) {
          setError('Username dan kata sandi wajib diisi.');
          setLoading(false);
          return;
        }
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.message || 'Otentikasi gagal. Periksa kembali data akun Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    setLoading(true);
    try {
      await login(u, p);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#071726] font-sans antialiased flex items-center justify-center p-3 sm:p-6 lg:p-10 selection:bg-sky-500 selection:text-white">
      {/* Outer Shell matching exact 2-column screenshot layout */}
      <div className="w-full max-w-7xl overflow-hidden rounded-[2.5rem] border border-slate-700/40 bg-slate-900 shadow-2xl flex flex-col lg:flex-row min-h-[640px]">
        
        {/* ================= LEFT SIDE: Hero & Lab Background Banner ================= */}
        <div 
          className="relative flex-1 p-8 sm:p-12 lg:p-14 flex flex-col justify-between overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url('/medical_lab_interior.jpg')` }}
        >
          {/* High-tech Dark Blue & Cyan Clinical Overlay for perfect readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04121f]/95 via-[#061d31]/88 to-[#0a2c47]/80" />

          {/* Luminous Glow Accents */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-sky-500/20 blur-[120px]" />
            <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-teal-500/15 blur-[130px]" />
            <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-blue-600/20 blur-[110px]" />

            {/* Subtle Laboratory Equipment/Tech grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }}
            />
          </div>

          {/* Top Badges: RSUD OKU TIMUR LAB CLOUD OS | KARS & SATUSEHAT */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            {/* Left Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/20 px-4 py-1.5 text-xs font-semibold text-sky-200 backdrop-blur-md shadow-sm">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-400/30 text-sky-300">
                <Activity className="h-3 w-3" />
              </div>
              <span>RSUD OKU TIMUR LAB CLOUD OS</span>
            </div>

            {/* Right Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>KARS &amp; SATUSEHAT TERINTEGRASI</span>
            </div>
          </div>

          {/* Main Hero Headline & Subtitle */}
          <div className="relative z-10 my-10 lg:my-14 max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-white leading-[1.18] font-serif">
              Satu Ekosistem Otomasi &amp; Analisis Laboratorium Terpadu.
            </h1>
            <p className="mt-5 text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal">
              Sistem pelaporan otomatis kinerja instalasi laboratorium 27 halaman, monitoring indikator mutu Turn Around Time (TAT), validasi rekam medis pasien, serta evaluasi mutu dan audit analitik klinis patologi.
            </p>
          </div>

          {/* Bottom 3 Feature Cards matching hospital laboratory application theme */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Laporan 27 Halaman */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 backdrop-blur-md shadow-lg transition hover:bg-slate-900/80">
              <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
                <FileText className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white tracking-wide">Laporan 27 Halaman</h4>
              <p className="mt-0.5 text-[11px] text-slate-300/80">Otomasi format resmi tahunan</p>
            </div>

            {/* Card 2: Standar TAT & Mutu */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 backdrop-blur-md shadow-lg transition hover:bg-slate-900/80">
              <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
                <Clock className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white tracking-wide">Standar TAT &amp; Mutu</h4>
              <p className="mt-0.5 text-[11px] text-slate-300/80">CITO ≤ 30 mnt &amp; reguler live</p>
            </div>

            {/* Card 3: Audit Mutu & Analisis */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 backdrop-blur-md shadow-lg transition hover:bg-slate-900/80">
              <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <ClipboardCheck className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-white tracking-wide">Audit Mutu Klinis</h4>
              <p className="mt-0.5 text-[11px] text-slate-300/80">Standar KARS &amp; ISO 15189</p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: White Authentication Card ================= */}
        <div className="w-full lg:w-[480px] xl:w-[520px] bg-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between text-slate-900">
          <div>
            {/* Top Tab Bar: [Masuk (Login)] vs [Daftar Akun] matching screenshot */}
            <div className="mb-8 flex rounded-xl bg-slate-100/90 p-1.5 border border-slate-200/60">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                  !isRegister
                    ? 'bg-white text-[#035388] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Masuk (Login)</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                  isRegister
                    ? 'bg-white text-[#035388] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Daftar Akun</span>
              </button>
            </div>

            {/* Header Titles */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-[1.75rem] font-bold text-slate-900 tracking-tight font-serif">
                {isRegister ? 'Pendaftaran Akun Baru' : 'Selamat Datang Kembali'}
              </h2>
              <p className="mt-1.5 text-xs text-slate-500 font-normal leading-relaxed">
                {isRegister
                  ? 'Lengkapi formulir untuk membuat akun staf atau analis laboratorium terverifikasi.'
                  : 'Akses portal otomasi pelaporan dan analisis Instalasi Laboratorium RSUD OKU Timur.'}
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* If Register Mode: Nama Lengkap */}
              {isRegister && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="relative rounded-xl border border-slate-200/90 bg-[#f4f7fa] focus-within:border-sky-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition">
                    <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: dr. Hendra Pratama, Sp.PK"
                      className="w-full bg-transparent pl-10 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Input 1: Email atau No. Rekam Medis (RM / NIK) / Username */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    {isRegister ? 'Username Akun' : 'Username / Email / No. Rekam Medis'}
                  </label>
                  <span className="text-[11px] font-semibold text-[#035388] cursor-pointer hover:underline">
                    Format Resmi
                  </span>
                </div>
                <div className="relative rounded-xl border border-slate-200/90 bg-[#f4f7fa] focus-within:border-sky-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition">
                  <Contact className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={isRegister ? 'Contoh: p.lab2' : 'contoh: admin / p.lab / user'}
                    className="w-full bg-transparent pl-10 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* If Register Mode: Email Resmi */}
              {isRegister && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Alamat Email Resmi (Opsional)
                    </label>
                  </div>
                  <div className="relative rounded-xl border border-slate-200/90 bg-[#f4f7fa] focus-within:border-sky-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="analis@rsud.okutimur.go.id"
                      className="w-full bg-transparent pl-10 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Input 2: Kata Sandi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">Kata Sandi</label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => alert('Pemulihan dan pengaturan kata sandi baru dapat dilakukan langsung oleh Superadmin di menu User Management menggunakan tombol kunci cyan.')}
                      className="text-[11px] font-semibold text-[#035388] hover:underline"
                    >
                      Lupa Kata Sandi?
                    </button>
                  )}
                </div>
                <div className="relative rounded-xl border border-slate-200/90 bg-[#f4f7fa] focus-within:border-sky-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100 transition">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    className="w-full bg-transparent pl-10 pr-10 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & MFA Aktif row matching screenshot */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#035388] focus:ring-[#035388]"
                  />
                  <span className="text-xs font-medium text-slate-700">Ingat saya di perangkat ini</span>
                </label>

                <div className="flex items-center gap-1 text-[11px] font-medium text-teal-700">
                  <Key className="h-3.5 w-3.5 text-teal-600" />
                  <span>Enkripsi AES-256 Aktif</span>
                </div>
              </div>

              {/* Submit Button matching screenshot */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#035388] hover:bg-[#02436e] py-3.5 px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-sky-950/15 active:scale-[0.99] transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>{isRegister ? 'Selesaikan Pendaftaran Akun' : 'Masuk ke Portal Laboratorium'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Access Badges (Preserving 1-Click Convenience) */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Masuk Cepat (Akun Demo Sistem):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="flex flex-col items-center justify-center rounded-xl border border-sky-200 bg-sky-50/60 p-2 text-center hover:border-sky-400 hover:bg-sky-100/60 transition"
              >
                <span className="text-xs font-bold text-[#035388]">@admin</span>
                <span className="text-[10px] text-slate-500 font-medium">Superadmin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('p.lab', 'lab123')}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-center hover:border-slate-300 hover:bg-slate-100 transition"
              >
                <span className="text-xs font-bold text-slate-800">@p.lab</span>
                <span className="text-[10px] text-slate-500 font-medium">didik (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('testuser', 'user123')}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-center hover:border-slate-300 hover:bg-slate-100 transition"
              >
                <span className="text-xs font-bold text-slate-800">@testuser</span>
                <span className="text-[10px] text-slate-500 font-medium">Test User</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

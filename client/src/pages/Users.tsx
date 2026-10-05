import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Key,
  Edit2,
  Trash2,
  Check,
  X,
  Shield,
  ShieldAlert,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface UserData {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role_id: string;
  role_name: string;
  status: string;
  expires_at: string;
  access_ia: number;
  access_al: number;
  only_al: number;
  is_active: number;
}

export const UsersPage: React.FC = () => {
  const { user: currentUser, refreshUsers } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [passwordModalUser, setPasswordModalUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState<UserData | null>(null);

  // Add/Edit Form state
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'user',
    status: 'Active',
    expiresAt: '19/07/2027',
    accessIa: false,
    accessAl: false,
    onlyAl: false,
    password: ''
  });

  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/master/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset (from cyan key icon)
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (newPassword.length < 5) {
      setErrorMsg('Password baru minimal 5 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak sesuai.');
      return;
    }

    setPasswordLoading(true);
    setErrorMsg(null);
    try {
      await api.put(`/master/users/${passwordModalUser.id}/password`, { password: newPassword });
      setSuccessMsg(`Password untuk user @${passwordModalUser.username} (${passwordModalUser.full_name}) berhasil diperbarui.`);
      setPasswordModalUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.post('/master/users', formData);
      setSuccessMsg(`User @${formData.username} berhasil ditambahkan.`);
      setAddModalOpen(false);
      setFormData({
        username: '',
        fullName: '',
        email: '',
        role: 'user',
        status: 'Active',
        expiresAt: '19/07/2027',
        accessIa: false,
        accessAl: false,
        onlyAl: false,
        password: ''
      });
      fetchUsers();
      refreshUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan user.');
    }
  };

  // Handle Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    setErrorMsg(null);
    try {
      await api.put(`/master/users/${editModalUser.id}`, {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        expiresAt: formData.expiresAt,
        accessIa: formData.accessIa,
        accessAl: formData.accessAl,
        onlyAl: formData.onlyAl
      });
      setSuccessMsg(`Data user @${editModalUser.username} berhasil diperbarui.`);
      setEditModalUser(null);
      fetchUsers();
      refreshUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui user.');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (u: UserData) => {
    if (!window.confirm(`Yakin ingin menghapus akun @${u.username} (${u.full_name})?`)) {
      return;
    }
    setErrorMsg(null);
    try {
      await api.delete(`/master/users/${u.id}`);
      setSuccessMsg(`User @${u.username} berhasil dihapus.`);
      fetchUsers();
      refreshUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus user.');
    }
  };

  const openEditModal = (u: UserData) => {
    setEditModalUser(u);
    setFormData({
      username: u.username,
      fullName: u.full_name,
      email: u.email,
      role: u.role_name,
      status: u.status || 'Active',
      expiresAt: u.expires_at || '19/07/2027',
      accessIa: Boolean(u.access_ia),
      accessAl: Boolean(u.access_al),
      onlyAl: Boolean(u.only_al),
      password: ''
    });
  };

  // Restrict view if not superadmin
  if (!isSuperAdmin) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas — Superadmin Only</h2>
        <p className="mt-2 max-w-md text-xs text-slate-500">
          Modul Manajemen Pengguna dan Penetapan Password hanya dapat diakses oleh akun Superadmin Utama.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <span className="font-semibold">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <span className="font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Header Matching Screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <UsersIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Users</h3>
            <p className="text-xs text-slate-500">
              Kelola seluruh akun pengguna laboratorium, status masa aktif, hak akses, dan tetapkan password baru.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setFormData({
              username: '',
              fullName: '',
              email: '',
              role: 'user',
              status: 'Active',
              expiresAt: '19/07/2027',
              accessIa: false,
              accessAl: false,
              onlyAl: false,
              password: ''
            });
            setAddModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 active:scale-[0.98] transition"
        >
          <Plus className="h-4 w-4" />
          <span>+ Tambah</span>
        </button>
      </div>

      {/* Table Exactly Matching Screenshot media_1790487957069.png */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                <th className="px-5 py-3.5">Username</th>
                <th className="px-5 py-3.5">Nama</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5 text-center">Role</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Masa Aktif</th>
                <th className="px-4 py-3.5 text-center">Akses IA</th>
                <th className="px-4 py-3.5 text-center">Akses AL</th>
                <th className="px-4 py-3.5 text-center">Hanya AL</th>
                <th className="px-4 py-3.5 text-center">Password</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    {/* Username */}
                    <td className="px-5 py-4 font-mono font-semibold text-slate-800">
                      {u.username}
                    </td>

                    {/* Nama */}
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {u.full_name}
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-slate-500 font-medium">
                      {u.email || '-'}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block rounded-md bg-cyan-100/70 px-2.5 py-1 text-[11px] font-bold text-cyan-800">
                        {u.role_name}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-[11px] font-bold text-emerald-800">
                        {u.status || 'Active'}
                      </span>
                    </td>

                    {/* Masa Aktif */}
                    <td className="px-5 py-4 text-center font-medium text-slate-600">
                      {u.expires_at || '19/07/2027'}
                    </td>

                    {/* Akses IA */}
                    <td className="px-4 py-4 text-center">
                      {u.access_ia ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700 font-bold text-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">-</span>
                      )}
                    </td>

                    {/* Akses AL */}
                    <td className="px-4 py-4 text-center">
                      {u.access_al ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700 font-bold text-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">-</span>
                      )}
                    </td>

                    {/* Hanya AL */}
                    <td className="px-4 py-4 text-center">
                      {u.only_al ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700 font-bold text-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">-</span>
                      )}
                    </td>

                    {/* Password Button (Cyan Key Icon Button as in Screenshot) */}
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        title="Atur / Tambahkan Password Baru"
                        onClick={() => {
                          setPasswordModalUser(u);
                          setNewPassword('');
                          setConfirmPassword('');
                          setErrorMsg(null);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500 text-white shadow-sm hover:bg-cyan-600 active:scale-95 transition"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                    </td>

                    {/* Aksi (Edit & Delete Buttons) */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          title="Edit Pengguna"
                          onClick={() => openEditModal(u)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Hapus Pengguna"
                          disabled={u.username === 'admin' || u.id === currentUser?.id}
                          onClick={() => handleDeleteUser(u)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 shadow-sm hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Set Password Baru (Triggered by Cyan Key Icon) */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-cyan-600 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <Key className="h-5 w-5" />
                <h3 className="text-sm font-bold">Atur Password Baru</h3>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4">
              <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-3 text-xs text-cyan-900">
                <p>
                  Mengubah password untuk akun <strong>@{passwordModalUser.username}</strong> ({passwordModalUser.full_name}).
                </p>
                <p className="mt-1 text-[11px] text-cyan-700">
                  Password yang baru akan langsung aktif dan dapat digunakan user untuk login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru minimal 5 karakter..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-cyan-700 disabled:opacity-50 transition"
                >
                  {passwordLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tambah User Baru */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-sky-600 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <Plus className="h-5 w-5" />
                <h3 className="text-sm font-bold">Tambah Pengguna Baru</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Contoh: p.lab2"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Contoh: dr. Ani, Sp.PK"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@rsud.okutimur.go.id"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimal 5 karakter..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="user">User (Viewer)</option>
                    <option value="admin">Admin (Lab Admin)</option>
                    <option value="manager">Manager</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Masa Aktif
                  </label>
                  <input
                    type="text"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    placeholder="19/07/2027"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Hak Akses Modul:</span>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accessIa}
                      onChange={(e) => setFormData({ ...formData, accessIa: e.target.checked })}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Akses IA (Indikator Akreditasi)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accessAl}
                      onChange={(e) => setFormData({ ...formData, accessAl: e.target.checked })}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Akses AL (Analisis Lab)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.onlyAl}
                      onChange={(e) => setFormData({ ...formData, onlyAl: e.target.checked })}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Hanya AL</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-sky-700 transition"
                >
                  Tambah User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit User */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-800 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <Edit2 className="h-5 w-5" />
                <h3 className="text-sm font-bold">Edit Pengguna: @{editModalUser.username}</h3>
              </div>
              <button onClick={() => setEditModalUser(null)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Masa Aktif
                  </label>
                  <input
                    type="text"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Hak Akses Modul:</span>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accessIa}
                      onChange={(e) => setFormData({ ...formData, accessIa: e.target.checked })}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Akses IA</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accessAl}
                      onChange={(e) => setFormData({ ...formData, accessAl: e.target.checked })}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Akses AL</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.onlyAl}
                      onChange={(e) => setFormData({ ...formData, onlyAl: e.target.checked })}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Hanya AL</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white shadow hover:bg-slate-900 transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

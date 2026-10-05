import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import db from '../db/database';
import crypto from 'crypto';

export const getMasterUnits = (req: AuthenticatedRequest, res: Response) => {
  try {
    const units = db.prepare('SELECT * FROM master_units ORDER BY name ASC').all();
    return res.json({ units });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil master unit.' });
  }
};

export const getMasterTATTargets = (req: AuthenticatedRequest, res: Response) => {
  try {
    const targets = db.prepare('SELECT * FROM master_tat_targets ORDER BY category ASC').all();
    return res.json({ targets });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil master TAT target.' });
  }
};

export const updateTATTarget = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { targetMinutes } = req.body;
    db.prepare('UPDATE master_tat_targets SET target_minutes = ? WHERE id = ?').run(targetMinutes, id);
    return res.json({ status: 'SUCCESS', message: 'Target TAT berhasil diperbarui.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui target TAT.' });
  }
};

export const getSystemSettings = (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings').all();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => { settingsMap[s.key] = s.value; });
    return res.json({ settings: settingsMap });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil pengaturan sistem.' });
  }
};

export const updateSystemSettings = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { settings } = req.body;
    if (settings && typeof settings === 'object') {
      const update = db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
      for (const [k, v] of Object.entries(settings)) {
        update.run(k, String(v));
      }
    }
    return res.json({ status: 'SUCCESS', message: 'Pengaturan berhasil diperbarui.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memperbarui pengaturan sistem.' });
  }
};

export const getAuditLogs = (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil log audit trail.' });
  }
};

import bcrypt from 'bcryptjs';

export const getUsers = (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.full_name, 
        u.role_id,
        r.name as role_name,
        u.status,
        u.expires_at,
        u.access_ia,
        u.access_al,
        u.only_al,
        u.is_active, 
        u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at ASC
    `).all();
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil daftar pengguna.' });
  }
};

export const createUser = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, fullName, email, role, status, expiresAt, accessIa, accessAl, onlyAl, password } = req.body;
    if (!username || !fullName || !password) {
      return res.status(400).json({ error: 'Username, Nama, dan Password wajib diisi.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain.' });
    }

    // Resolve role ID
    const roleRow = db.prepare('SELECT id FROM roles WHERE name = ? OR id = ?').get(role || 'user', role || 'user') as any;
    const roleId = roleRow ? roleRow.id : 'role-viewer';

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    db.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, full_name, role_id,
        status, expires_at, access_ia, access_al, only_al, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      userId,
      cleanUsername,
      email || `${cleanUsername}@rsud.okutimur.go.id`,
      passwordHash,
      fullName.trim(),
      roleId,
      status || 'Active',
      expiresAt || '19/07/2027',
      accessIa ? 1 : 0,
      accessAl ? 1 : 0,
      onlyAl ? 1 : 0
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, details)
      VALUES (?, ?, ?, 'CREATE_USER', 'users', ?)
    `).run(`audit-${Date.now()}`, req.user?.id, req.user?.fullName, JSON.stringify({ newUserId: userId, username: cleanUsername }));

    return res.status(201).json({
      status: 'SUCCESS',
      message: `User ${cleanUsername} berhasil ditambahkan.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Gagal menambahkan pengguna: ${err.message}` });
  }
};

export const updateUser = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, status, expiresAt, accessIa, accessAl, onlyAl } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    let roleId = user.role_id;
    if (role) {
      const roleRow = db.prepare('SELECT id FROM roles WHERE name = ? OR id = ?').get(role, role) as any;
      if (roleRow) roleId = roleRow.id;
    }

    db.prepare(`
      UPDATE users SET
        full_name = ?,
        email = ?,
        role_id = ?,
        status = ?,
        expires_at = ?,
        access_ia = ?,
        access_al = ?,
        only_al = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      fullName !== undefined ? fullName : user.full_name,
      email !== undefined ? email : user.email,
      roleId,
      status !== undefined ? status : user.status,
      expiresAt !== undefined ? expiresAt : user.expires_at,
      accessIa !== undefined ? (accessIa ? 1 : 0) : user.access_ia,
      accessAl !== undefined ? (accessAl ? 1 : 0) : user.access_al,
      onlyAl !== undefined ? (onlyAl ? 1 : 0) : user.only_al,
      id
    );

    return res.json({ status: 'SUCCESS', message: 'Data pengguna berhasil diperbarui.' });
  } catch (err: any) {
    return res.status(500).json({ error: `Gagal memperbarui pengguna: ${err.message}` });
  }
};

export const updateUserPassword = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 5) {
      return res.status(400).json({ error: 'Password baru minimal 5 karakter.' });
    }

    const user = db.prepare('SELECT id, username, full_name FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passwordHash, id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, details)
      VALUES (?, ?, ?, 'RESET_PASSWORD', 'users', ?)
    `).run(`audit-${Date.now()}`, req.user?.id, req.user?.fullName, JSON.stringify({ targetUserId: id, targetUsername: user.username }));

    return res.json({
      status: 'SUCCESS',
      message: `Password untuk akun ${user.username} (${user.full_name}) berhasil diperbarui.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Gagal mengubah password: ${err.message}` });
  }
};

export const deleteUser = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' });
    }

    const targetUser = db.prepare('SELECT username FROM users WHERE id = ?').get(id) as any;
    if (!targetUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    if (targetUser.username === 'admin' || targetUser.username === 'superadmin') {
      return res.status(400).json({ error: 'Akun Superadmin Utama dilindungi dan tidak dapat dihapus.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    return res.json({ status: 'SUCCESS', message: `Pengguna ${targetUser.username} berhasil dihapus.` });
  } catch (err: any) {
    return res.status(500).json({ error: `Gagal menghapus pengguna: ${err.message}` });
  }
};

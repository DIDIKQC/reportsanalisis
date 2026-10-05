import { Request, Response } from 'express';
import db from '../db/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_lab_key_2026';

export const login = (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan kata sandi wajib diisi.' });
    }

    const user = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = ? OR u.email = ?
    `).get(username, username) as any;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Username atau kata sandi tidak sesuai.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Akun Anda dinonaktifkan oleh administrator.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role_name, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, details)
      VALUES (?, ?, ?, 'LOGIN', 'auth', ?)
    `).run(`audit-${Date.now()}`, user.id, user.full_name, JSON.stringify({ ip: req.ip }));

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role_name,
        status: user.status || 'Active',
        expiresAt: user.expires_at || '19/07/2027',
        accessIa: user.access_ia || 0,
        accessAl: user.access_al || 0,
        onlyAl: user.only_al || 0
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat proses otentikasi.' });
  }
};

export const register = (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, Nama Lengkap, dan Kata Sandi wajib diisi.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username minimal 3 karakter.' });
    }
    if (password.length < 5) {
      return res.status(400).json({ error: 'Kata sandi minimal 5 karakter.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR (email = ? AND email != "")').get(cleanUsername, email || '') as any;
    if (existing) {
      return res.status(400).json({ error: 'Username atau Email sudah terdaftar dalam sistem.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const userEmail = email ? email.trim() : `${cleanUsername}@rsud.okutimur.go.id`;
    const defaultExpiry = '19/07/2027';

    // Assign role-adminlab by default for self-registered lab staff
    const insert = db.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, full_name, role_id,
        status, expires_at, access_ia, access_al, only_al, is_active
      ) VALUES (?, ?, ?, ?, ?, 'role-adminlab', 'Active', ?, 0, 0, 0, 1)
    `);

    insert.run(userId, cleanUsername, userEmail, passwordHash, fullName.trim(), defaultExpiry);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, details)
      VALUES (?, ?, ?, 'REGISTER', 'auth', ?)
    `).run(`audit-${Date.now()}`, userId, fullName.trim(), JSON.stringify({ username: cleanUsername, ip: req.ip }));

    const token = jwt.sign(
      { id: userId, username: cleanUsername, role: 'admin', fullName: fullName.trim() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      status: 'SUCCESS',
      message: 'Registrasi akun laboratorium berhasil.',
      token,
      user: {
        id: userId,
        username: cleanUsername,
        email: userEmail,
        fullName: fullName.trim(),
        role: 'admin',
        status: 'Active',
        expiresAt: defaultExpiry,
        accessIa: 0,
        accessAl: 0,
        onlyAl: 0
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Gagal melakukan registrasi: ${err.message}` });
  }
};

export const getMe = (req: any, res: Response) => {
  try {
    const user = db.prepare(`
      SELECT u.id, u.username, u.email, u.full_name, r.name as role,
             u.status, u.expires_at, u.access_ia, u.access_al, u.only_al
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(req.user?.id) as any;

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        status: user.status || 'Active',
        expiresAt: user.expires_at || '19/07/2027',
        accessIa: user.access_ia || 0,
        accessAl: user.access_al || 0,
        onlyAl: user.only_al || 0
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil profil pengguna.' });
  }
};

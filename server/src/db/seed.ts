import db from './database';
import bcrypt from 'bcryptjs';

export function seedDatabase() {
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)');
  insertRole.run('role-superadmin', 'superadmin', 'Super Administrator with full multi-tenant inspection');
  insertRole.run('role-adminlab', 'admin', 'Laboratory Administrator (Data, Upload, Report)');
  insertRole.run('role-viewer', 'user', 'Standard User / Room Analyst');
  insertRole.run('role-manager', 'manager', 'Executive / Lab Manager');

  // Permissions
  const permissions = [
    ['perm-upload', 'UPLOAD_DATA', 'Upload and process raw lab files'],
    ['perm-import', 'IMPORT_DATA', 'Validate and import data to database'],
    ['perm-reports', 'GENERATE_REPORT', 'Generate and configure reports'],
    ['perm-ai', 'AI_ANALYSIS', 'Run Gemini AI Analytics & Recommendations'],
    ['perm-master', 'MANAGE_MASTER', 'Manage master units, tests, and TAT'],
    ['perm-audit', 'VIEW_AUDIT', 'Inspect system audit trails'],
    ['perm-users', 'MANAGE_USERS', 'Manage user accounts and roles'],
    ['perm-view', 'VIEW_REPORTS', 'View dashboard and download reports']
  ];
  const insertPerm = db.prepare('INSERT OR IGNORE INTO permissions (id, code, description) VALUES (?, ?, ?)');
  const insertRolePerm = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
  
  permissions.forEach(([id, code, desc]) => {
    insertPerm.run(id, code, desc);
    insertRolePerm.run('role-superadmin', id);
  });
  ['perm-upload', 'perm-import', 'perm-reports', 'perm-master', 'perm-view'].forEach(p => {
    insertRolePerm.run('role-adminlab', p);
  });
  ['perm-ai', 'perm-reports', 'perm-view'].forEach(p => {
    insertRolePerm.run('role-manager', p);
  });
  insertRolePerm.run('role-viewer', 'perm-view');

  // Seed / Upsert Users matching the exact screenshot
  const salt = bcrypt.genSaltSync(10);
  const upsertUser = db.prepare(`
    INSERT INTO users (id, username, email, password_hash, full_name, role_id, status, expires_at, access_ia, access_al, only_al)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      full_name = excluded.full_name,
      email = excluded.email,
      role_id = excluded.role_id,
      status = excluded.status,
      expires_at = excluded.expires_at,
      access_ia = excluded.access_ia,
      access_al = excluded.access_al,
      only_al = excluded.only_al
  `);

  // 1. admin (Admin Utama) - Superadmin
  upsertUser.run(
    'usr-admin',
    'admin',
    'admin@didiqc.id',
    bcrypt.hashSync('admin123', salt),
    'Admin Utama',
    'role-superadmin',
    'Active',
    '19/07/2027',
    1, // Akses IA: checked
    0, // Akses AL: -
    0  // Hanya AL: -
  );

  // 2. p.lab (didik) - Admin
  upsertUser.run(
    'usr-plab',
    'p.lab',
    'plab@rsud.okutimur.go.id',
    bcrypt.hashSync('lab123', salt),
    'didik',
    'role-adminlab',
    'Active',
    '31/07/2026',
    0,
    0,
    0
  );

  // 3. testuser (Test User) - User
  upsertUser.run(
    'usr-testuser',
    'testuser',
    'test@test.com',
    bcrypt.hashSync('user123', salt),
    'Test User',
    'role-viewer',
    'Active',
    '19/07/2027',
    0,
    0,
    0
  );

  // Seed Master TAT Targets
  const insertTAT = db.prepare(`
    INSERT OR IGNORE INTO master_tat_targets (id, category, examination_name, service_type, target_minutes, start_event, end_event)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertTAT.run('tat-1', 'Hematologi', 'Hematologi Rutin', 'CITO', 30, 'SAMPLING', 'SELESAI');
  insertTAT.run('tat-2', 'Hematologi', 'Hematologi Rutin', 'REGULER', 60, 'SAMPLING', 'SELESAI');
  insertTAT.run('tat-3', 'Kimia Darah', 'Kimia Klinik CITO', 'CITO', 60, 'DITERIMA', 'SELESAI');
  insertTAT.run('tat-4', 'Kimia Darah', 'Kimia Klinik Reguler', 'REGULER', 120, 'DITERIMA', 'SELESAI');
  insertTAT.run('tat-5', 'Klinik rutin', 'Urin Rutin', 'REGULER', 120, 'DITERIMA', 'SELESAI');
  insertTAT.run('tat-6', 'Bank Darah', 'Penyediaan Darah', 'CITO', 60, 'DITERIMA', 'SELESAI');

  // Seed Report Types
  const insertReportType = db.prepare(`
    INSERT OR IGNORE INTO report_types (id, code, name, description, icon, route_path, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  insertReportType.run(
    'rt-tahunan',
    'TAHUNAN',
    'Laporan Kinerja Tahunan Laboratorium',
    'Laporan lengkap 27 halaman kinerja instalasi laboratorium mencakup SDM, utilisasi kunjungan, kategori tes, peralatan medis, kontrol mutu, indikator mutu, dan manajemen risiko.',
    'FileText',
    '/reports/tahunan'
  );
  insertReportType.run(
    'rt-bulanan',
    'BULANAN',
    'Laporan Bulanan Pelayanan Laboratorium',
    'Laporan operasional bulanan jumlah pasien, total pemeriksaan per jenis, dan rekapitulasi penjamin.',
    'Calendar',
    '/reports/bulanan'
  );
  insertReportType.run(
    'rt-tat',
    'TAT',
    'Laporan Turn Around Time & Kepatuhan Mutu',
    'Laporan evaluasi waktu tunggu hasil laboratorium per kategori pemeriksaan (CITO vs Reguler) serta kepatuhan standar mutu.',
    'Clock',
    '/reports/tat'
  );
  insertReportType.run(
    'rt-pasien',
    'PASIEN',
    'Laporan Demografi & Kunjungan Pasien',
    'Distribusi pasien berdasarkan asal ruangan (IGD, Rawat Jalan, Rawat Inap), usia, gender, dan jenis penjamin.',
    'Users',
    '/reports/pasien'
  );
  insertReportType.run(
    'rt-mutu',
    'MUTU',
    'Laporan Mutu & Keselamatan Pasien',
    'Rekapitulasi pelaporan nilai kritis, kepatuhan APD, kepatuhan identifikasi, dan pencegahan risiko.',
    'ShieldCheck',
    '/reports/mutu'
  );

  // Settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO system_settings (key, value, description) VALUES (?, ?, ?)');
  insertSetting.run('HOSPITAL_NAME', 'RSUD OKU TIMUR', 'Nama Fasilitas Kesehatan');
  insertSetting.run('LAB_NAME', 'INSTALASI LABORATORIUM', 'Nama Unit Laboratorium');
  insertSetting.run('LAB_HEAD', 'dr. Ruri Rizki Anriani, Sp.PK', 'Kepala Instalasi Laboratorium');
  insertSetting.run('DIRECTOR_NAME', 'dr. Sugihartono, M.Sc', 'Direktur Rumah Sakit');
  insertSetting.run('KABID_NAME', 'Yuni Elis, S. Kep., M.M', 'Kabid Penunjang Medis');
  insertSetting.run('CITY_DATE', 'Belitang, 19 Januari 2026', 'Lokasi & Tanggal Pengesahan');
  insertSetting.run('GOOGLE_DRIVE_FOLDER_ID', '1MsmBzz5dVW0jzK-ocWsyKh2DQ0Q9OZ1x', 'Folder Utama Google Drive');
}

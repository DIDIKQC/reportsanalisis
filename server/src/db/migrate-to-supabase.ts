import { Client } from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PG_CONNECTION_STRING = process.argv[2] || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!PG_CONNECTION_STRING || PG_CONNECTION_STRING.includes('[YOUR-PASSWORD]')) {
  console.error('Error: Please provide a valid PostgreSQL connection string with password.');
  console.error('Usage: npx tsx src/db/migrate-to-supabase.ts "postgresql://postgres:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"');
  process.exit(1);
}

const sqlitePath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/laboratory.sqlite');
console.log(`Connecting to local SQLite database: ${sqlitePath}`);
const sqlite = new Database(sqlitePath, { readonly: true });

async function migrate() {
  console.log(`Connecting to Supabase PostgreSQL...`);
  const pg = new Client({
    connectionString: PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await pg.connect();
  console.log(`Connected successfully to Supabase PostgreSQL!`);

  console.log(`Creating database schema in Supabase...`);
  await pg.query(`
    -- 1. Roles & Permissions
    CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
        role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role_id TEXT NOT NULL REFERENCES roles(id),
        status TEXT DEFAULT 'Active',
        expires_at TEXT DEFAULT '19/07/2027',
        access_ia INTEGER DEFAULT 0,
        access_al INTEGER DEFAULT 0,
        only_al INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Raw File Storage & Traceability
    CREATE TABLE IF NOT EXISTS source_files (
        id TEXT PRIMARY KEY,
        google_drive_file_id TEXT,
        google_drive_folder_id TEXT,
        google_drive_web_link TEXT,
        file_name TEXT NOT NULL,
        stored_file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        file_hash TEXT UNIQUE NOT NULL,
        period_year INTEGER,
        period_month INTEGER,
        upload_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        uploaded_by TEXT NOT NULL,
        processing_status TEXT NOT NULL,
        error_message TEXT,
        storage_path TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS upload_batches (
        id TEXT PRIMARY KEY,
        source_file_id TEXT NOT NULL REFERENCES source_files(id) ON DELETE CASCADE,
        total_records INTEGER DEFAULT 0,
        valid_records INTEGER DEFAULT 0,
        warning_records INTEGER DEFAULT 0,
        error_records INTEGER DEFAULT 0,
        duplicate_records INTEGER DEFAULT 0,
        missing_records INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS validation_errors (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL REFERENCES upload_batches(id) ON DELETE CASCADE,
        row_number INTEGER NOT NULL,
        column_name TEXT,
        error_type TEXT NOT NULL,
        error_message TEXT NOT NULL,
        raw_value TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Master Data
    CREATE TABLE IF NOT EXISTS master_units (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS master_examinations (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        normal_range TEXT,
        unit_measurement TEXT,
        unit_price NUMERIC DEFAULT 0,
        is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS master_tat_targets (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        examination_name TEXT,
        service_type TEXT NOT NULL,
        target_minutes INTEGER NOT NULL,
        start_event TEXT NOT NULL,
        end_event TEXT NOT NULL
    );

    -- 4. Patients & Clinical Records
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        medical_record_number TEXT NOT NULL,
        name TEXT NOT NULL,
        gender TEXT,
        age INTEGER,
        age_unit TEXT DEFAULT 'Th',
        phone TEXT,
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS examinations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        patient_id TEXT NOT NULL REFERENCES patients(id),
        source_file_id TEXT NOT NULL REFERENCES source_files(id),
        batch_id TEXT,
        registration_number TEXT,
        order_date DATE NOT NULL,
        registration_datetime TIMESTAMPTZ,
        sample_taken_datetime TIMESTAMPTZ,
        sample_received_datetime TIMESTAMPTZ,
        process_started_datetime TIMESTAMPTZ,
        result_completed_datetime TIMESTAMPTZ,
        result_validated_datetime TIMESTAMPTZ,
        result_released_datetime TIMESTAMPTZ,
        unit_name TEXT NOT NULL,
        unit_type TEXT NOT NULL,
        guarantor TEXT DEFAULT 'UMUM',
        doctor_name TEXT,
        shift TEXT,
        status TEXT DEFAULT 'COMPLETED',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS laboratory_results (
        id TEXT PRIMARY KEY,
        examination_id TEXT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
        test_name TEXT NOT NULL,
        category TEXT NOT NULL,
        result_value TEXT,
        unit_measurement TEXT,
        reference_range TEXT,
        flag TEXT DEFAULT 'NORMAL',
        critical_reported_at TIMESTAMPTZ,
        critical_reported_to TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tat_records (
        id TEXT PRIMARY KEY,
        examination_id TEXT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        service_type TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        duration_minutes INTEGER NOT NULL,
        target_minutes INTEGER NOT NULL,
        is_compliant INTEGER NOT NULL,
        delay_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Report Types, Templates & Versioning
    CREATE TABLE IF NOT EXISTS report_types (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        route_path TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS report_templates (
        id TEXT PRIMARY KEY,
        report_type_id TEXT NOT NULL REFERENCES report_types(id),
        name TEXT NOT NULL,
        description TEXT,
        active_version_id TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS report_template_versions (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL REFERENCES report_templates(id),
        version_number INTEGER NOT NULL,
        layout_config TEXT NOT NULL,
        sections_config TEXT NOT NULL,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS report_configurations (
        id TEXT PRIMARY KEY,
        report_type_id TEXT NOT NULL REFERENCES report_types(id),
        template_version_id TEXT NOT NULL REFERENCES report_template_versions(id),
        required_data TEXT NOT NULL,
        calculations TEXT NOT NULL,
        filters TEXT NOT NULL,
        tables TEXT NOT NULL,
        charts TEXT NOT NULL,
        narratives TEXT NOT NULL,
        output_formats TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generated_reports (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        report_type_id TEXT NOT NULL REFERENCES report_types(id),
        template_version_id TEXT NOT NULL REFERENCES report_template_versions(id),
        title TEXT NOT NULL,
        period_year INTEGER NOT NULL,
        period_month INTEGER,
        filters_applied TEXT NOT NULL,
        generated_by TEXT NOT NULL,
        generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        pdf_path TEXT,
        excel_path TEXT,
        file_size BIGINT,
        summary_metrics TEXT
    );

    -- 6. AI Results & Recommendations
    CREATE TABLE IF NOT EXISTS ai_analysis_results (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        period TEXT NOT NULL,
        filters TEXT NOT NULL,
        aggregated_input TEXT NOT NULL,
        summary TEXT NOT NULL,
        findings TEXT NOT NULL,
        comparison TEXT,
        recommendations TEXT NOT NULL,
        model_used TEXT NOT NULL,
        prompt_tokens INTEGER,
        response_tokens INTEGER,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Audit Trail & Settings
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
    CREATE INDEX IF NOT EXISTS idx_examinations_patient_id ON examinations(patient_id);
    CREATE INDEX IF NOT EXISTS idx_examinations_order_date ON examinations(order_date);
    CREATE INDEX IF NOT EXISTS idx_examinations_user_id ON examinations(user_id);
    CREATE INDEX IF NOT EXISTS idx_laboratory_results_exam_id ON laboratory_results(examination_id);
    CREATE INDEX IF NOT EXISTS idx_laboratory_results_category ON laboratory_results(category);
  `);
  console.log(`Schema created successfully in Supabase!`);

  // Migration tables order (respecting foreign key dependencies)
  const tables = [
    'roles',
    'permissions',
    'role_permissions',
    'users',
    'source_files',
    'upload_batches',
    'validation_errors',
    'master_units',
    'master_examinations',
    'master_tat_targets',
    'patients',
    'examinations',
    'laboratory_results',
    'tat_records',
    'report_types',
    'report_templates',
    'report_template_versions',
    'report_configurations',
    'generated_reports',
    'ai_analysis_results',
    'audit_logs',
    'system_settings'
  ];

  for (const tableName of tables) {
    try {
      const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all() as Record<string, any>[];
      if (rows.length === 0) {
        console.log(`Table ${tableName}: 0 rows (skipping).`);
        continue;
      }

      console.log(`Migrating table ${tableName}: ${rows.length} rows...`);
      const columns = Object.keys(rows[0]);
      const colNames = columns.map(c => `"${c}"`).join(', ');

      const CHUNK_SIZE = 500;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const valuePlaceholders: string[] = [];
        const flatValues: any[] = [];

        chunk.forEach((row, rowIndex) => {
          const rowParams: string[] = [];
          columns.forEach((col, colIndex) => {
            const paramIdx = rowIndex * columns.length + colIndex + 1;
            rowParams.push(`$${paramIdx}`);
            let val = row[col];
            if (val === undefined) val = null;
            flatValues.push(val);
          });
          valuePlaceholders.push(`(${rowParams.join(', ')})`);
        });

        const insertQuery = `
          INSERT INTO ${tableName} (${colNames})
          VALUES ${valuePlaceholders.join(',\n')}
          ON CONFLICT DO NOTHING
        `;

        await pg.query(insertQuery, flatValues);
        if (rows.length > CHUNK_SIZE) {
          const currentCount = Math.min(i + CHUNK_SIZE, rows.length);
          process.stdout.write(`  -> Inserted ${currentCount}/${rows.length} rows\r`);
        }
      }
      console.log(`  ✓ Table ${tableName} migration complete (${rows.length} rows).`);
    } catch (err: any) {
      console.error(`Error migrating table ${tableName}:`, err.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`MIGRATION TO SUPABASE COMPLETED SUCCESSFULLY!`);
  console.log(`========================================`);

  await pg.end();
  sqlite.close();
}

migrate().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});

import db from './database';

export function initializeSchema() {
  db.exec(`
    -- 1. Roles & Permissions
    CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
        role_id TEXT NOT NULL,
        permission_id TEXT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role_id TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        expires_at TEXT DEFAULT '19/07/2027',
        access_ia INTEGER DEFAULT 0,
        access_al INTEGER DEFAULT 0,
        only_al INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
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
        file_size INTEGER NOT NULL,
        file_hash TEXT UNIQUE NOT NULL,
        period_year INTEGER,
        period_month INTEGER,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        uploaded_by TEXT NOT NULL,
        processing_status TEXT NOT NULL,
        error_message TEXT,
        storage_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS upload_batches (
        id TEXT PRIMARY KEY,
        source_file_id TEXT NOT NULL,
        total_records INTEGER DEFAULT 0,
        valid_records INTEGER DEFAULT 0,
        warning_records INTEGER DEFAULT 0,
        error_records INTEGER DEFAULT 0,
        duplicate_records INTEGER DEFAULT 0,
        missing_records INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_file_id) REFERENCES source_files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS validation_errors (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        row_number INTEGER NOT NULL,
        column_name TEXT,
        error_type TEXT NOT NULL,
        error_message TEXT NOT NULL,
        raw_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES upload_batches(id) ON DELETE CASCADE
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
        unit_price REAL DEFAULT 0,
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

    -- 4. Patients & Clinical Records (Tenant Isolated)
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS examinations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        patient_id TEXT NOT NULL,
        source_file_id TEXT NOT NULL,
        batch_id TEXT,
        registration_number TEXT,
        order_date DATE NOT NULL,
        registration_datetime DATETIME,
        sample_taken_datetime DATETIME,
        sample_received_datetime DATETIME,
        process_started_datetime DATETIME,
        result_completed_datetime DATETIME,
        result_validated_datetime DATETIME,
        result_released_datetime DATETIME,
        unit_name TEXT NOT NULL,
        unit_type TEXT NOT NULL,
        guarantor TEXT DEFAULT 'UMUM',
        doctor_name TEXT,
        shift TEXT,
        status TEXT DEFAULT 'COMPLETED',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (source_file_id) REFERENCES source_files(id)
    );

    CREATE TABLE IF NOT EXISTS laboratory_results (
        id TEXT PRIMARY KEY,
        examination_id TEXT NOT NULL,
        test_name TEXT NOT NULL,
        category TEXT NOT NULL,
        result_value TEXT,
        unit_measurement TEXT,
        reference_range TEXT,
        flag TEXT DEFAULT 'NORMAL',
        critical_reported_at DATETIME,
        critical_reported_to TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (examination_id) REFERENCES examinations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tat_records (
        id TEXT PRIMARY KEY,
        examination_id TEXT NOT NULL,
        category TEXT NOT NULL,
        service_type TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        duration_minutes INTEGER NOT NULL,
        target_minutes INTEGER NOT NULL,
        is_compliant INTEGER NOT NULL,
        delay_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (examination_id) REFERENCES examinations(id) ON DELETE CASCADE
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
        report_type_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        active_version_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_type_id) REFERENCES report_types(id)
    );

    CREATE TABLE IF NOT EXISTS report_template_versions (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        layout_config TEXT NOT NULL,
        sections_config TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES report_templates(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS report_configurations (
        id TEXT PRIMARY KEY,
        report_type_id TEXT NOT NULL,
        template_version_id TEXT NOT NULL,
        required_data TEXT NOT NULL,
        calculations TEXT NOT NULL,
        filters TEXT NOT NULL,
        tables TEXT NOT NULL,
        charts TEXT NOT NULL,
        narratives TEXT NOT NULL,
        output_formats TEXT NOT NULL,
        FOREIGN KEY (report_type_id) REFERENCES report_types(id),
        FOREIGN KEY (template_version_id) REFERENCES report_template_versions(id)
    );

    CREATE TABLE IF NOT EXISTS generated_reports (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        report_type_id TEXT NOT NULL,
        template_version_id TEXT NOT NULL,
        title TEXT NOT NULL,
        period_year INTEGER NOT NULL,
        period_month INTEGER,
        filters_applied TEXT NOT NULL,
        generated_by TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        pdf_path TEXT,
        excel_path TEXT,
        file_size INTEGER,
        summary_metrics TEXT,
        FOREIGN KEY (report_type_id) REFERENCES report_types(id),
        FOREIGN KEY (template_version_id) REFERENCES report_template_versions(id)
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migrations for newly added columns if table previously existed
  const addColumnIfNotExists = (tableName: string, colDef: string) => {
    try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colDef}`);
    } catch {
      // Column already exists, safe to ignore
    }
  };

  addColumnIfNotExists('users', 'status TEXT DEFAULT "Active"');
  addColumnIfNotExists('users', 'expires_at TEXT DEFAULT "19/07/2027"');
  addColumnIfNotExists('users', 'access_ia INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'access_al INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'only_al INTEGER DEFAULT 0');
  addColumnIfNotExists('patients', 'user_id TEXT');
  addColumnIfNotExists('examinations', 'user_id TEXT');
  addColumnIfNotExists('generated_reports', 'user_id TEXT');
  addColumnIfNotExists('ai_analysis_results', 'user_id TEXT');

  // Performance Indexes (created after columns guaranteed to exist)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_examinations_order_date ON examinations(order_date);
    CREATE INDEX IF NOT EXISTS idx_examinations_user ON examinations(user_id);
    CREATE INDEX IF NOT EXISTS idx_examinations_unit ON examinations(unit_name, unit_type);
    CREATE INDEX IF NOT EXISTS idx_examinations_source ON examinations(source_file_id);
    CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);
    CREATE INDEX IF NOT EXISTS idx_lab_results_exam ON laboratory_results(examination_id);
    CREATE INDEX IF NOT EXISTS idx_tat_exam ON tat_records(examination_id);
  `);
}

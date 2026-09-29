-- V17: Global System Control, Automated Backups, and Dynamic Feature Flags

CREATE TABLE IF NOT EXISTS system_control (
    id INT PRIMARY KEY DEFAULT 1,
    system_state VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    maintenance_title VARCHAR(255) DEFAULT 'System Maintenance',
    maintenance_message TEXT DEFAULT 'The system is currently undergoing scheduled maintenance. Please check back shortly.',
    expected_recovery_time TIMESTAMP,
    shutdown_reason TEXT,
    shutdown_by VARCHAR(128),
    shutdown_at TIMESTAMP,
    allow_admin_bypass BOOLEAN DEFAULT TRUE,
    allow_worker_trips BOOLEAN DEFAULT TRUE,
    allow_accounts_payments BOOLEAN DEFAULT TRUE,
    lock_sensitive_ops BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(128) DEFAULT 'SYSTEM'
);

INSERT INTO system_control (
    id, system_state, maintenance_title, maintenance_message, allow_admin_bypass, allow_worker_trips, allow_accounts_payments, lock_sensitive_ops, updated_by
) VALUES (
    1, 'ONLINE', 'System Maintenance', 'The system is currently undergoing scheduled maintenance. Normal access will resume shortly.', TRUE, TRUE, TRUE, FALSE, 'SYSTEM'
) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS backup_records (
    id VARCHAR(64) PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(32) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    checksum_sha256 VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    entity_counts_json TEXT,
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    restored_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_backup_created ON backup_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_status ON backup_records(status);

CREATE TABLE IF NOT EXISTS backup_schedules (
    id VARCHAR(32) PRIMARY KEY,
    schedule_type VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    day_of_week INT DEFAULT 7,
    day_of_month INT DEFAULT 1,
    execution_time VARCHAR(16) DEFAULT '02:00',
    retention_count INT NOT NULL DEFAULT 4,
    destination VARCHAR(128) DEFAULT 'LOCAL_SNAPSHOT_STORE',
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(128) DEFAULT 'SYSTEM'
);

INSERT INTO backup_schedules (id, schedule_type, enabled, day_of_week, day_of_month, execution_time, retention_count, destination, updated_by)
VALUES
('WEEKLY', 'WEEKLY', TRUE, 7, 1, '02:00', 4, 'LOCAL_SNAPSHOT_STORE', 'SYSTEM'),
('MONTHLY', 'MONTHLY', TRUE, 7, 1, '03:00', 12, 'LOCAL_SNAPSHOT_STORE', 'SYSTEM')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS system_feature_flags (
    flag_key VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    category VARCHAR(64) DEFAULT 'OPERATIONS',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by VARCHAR(128) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_feature_flags (flag_key, name, description, category, enabled, updated_by)
VALUES
('WORKER_NEW_TRIP', 'Worker New Trip Creation', 'Allows field workers to dispatch and record new freight trips', 'OPERATIONS', TRUE, 'SYSTEM'),
('ACCOUNTS_PAYMENTS', 'Accounts Payment Processing', 'Allows accounting staff to record collections, debit vouchers, and contra entries', 'FINANCE', TRUE, 'SYSTEM'),
('REPORTS_GENERATION', 'Financial & Ledger Reports', 'Enables generation and CSV/Excel export of GST ledgers and profitability reports', 'REPORTING', TRUE, 'SYSTEM'),
('NEW_CUSTOMER_CREATION', 'Client Onboarding', 'Allows creating new client masters with credit policies and GSTINs', 'MASTERS', TRUE, 'SYSTEM'),
('ONLINE_APIS', 'External REST API Gateways', 'Enables partner ERP and tracking webhooks', 'INTEGRATIONS', TRUE, 'SYSTEM'),
('MAINTENANCE_OVERRIDE', 'Admin Emergency Bypass', 'Allows Super Admins to bypass maintenance restriction filters', 'SECURITY', TRUE, 'SYSTEM')
ON CONFLICT (flag_key) DO NOTHING;

-- V19: Setup production accounts and deactivate obsolete demo credentials

-- 1. Ensure the five production accounts exist with BCrypt hashes
INSERT INTO users (id, username, password_hash, full_name, email, phone, role_id, status) VALUES
('USR-PROD-ADM', 'admin@transports', '$2a$10$HfV00/FG10dxZwEalG4DbeTv7/fZJBPwFFJW1E78w.9Lu1IWSTIDu', 'System Administrator', 'admin@transports', '+91 98421 88001', 'ROLE_ADMIN', 'ACTIVE'),
('USR-PROD-MD', 'md@transports', '$2a$10$ARzzAYLu/wCgfytVwpyA1eSK5Etn3wQK3jfJDuSqa8y4dlHk0./sa', 'Managing Director', 'md@transports', '+91 98421 88002', 'ROLE_MD', 'ACTIVE'),
('USR-PROD-MGR', 'manager@transports', '$2a$10$TOS/900r49Nbnk8DY0PB.ePrlOUbPnQw8711j9fl81TJj0pSmxk1G', 'Operations Manager', 'manager@transports', '+91 98421 88003', 'ROLE_MANAGER', 'ACTIVE'),
('USR-PROD-ACC', 'accounts@transports', '$2a$10$sJG6S97caryXU/kJQS6yqOlsomq7kHfM1VVGDdD5wmreMD8tuxXl.', 'Finance & Accounts', 'accounts@transports', '+91 98421 88004', 'ROLE_ACCOUNTS', 'ACTIVE'),
('USR-PROD-WRK', 'worker@transports', '$2a$10$/0m4LfcN3pLN60Gnv5eCd.6gr7opMRwuVcmc6RwIyc.K7dXPdDlY.', 'Operational Worker', 'worker@transports', '+91 98421 88005', 'ROLE_WORKER', 'ACTIVE')
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email,
    role_id = EXCLUDED.role_id,
    status = 'ACTIVE';

-- 2. Deactivate obsolete demo accounts while preserving business history and references
UPDATE users SET status = 'INACTIVE' 
WHERE (username IN ('admin', 'md', 'manager', 'accounts', 'worker', 'karthik.w')
   OR id IN ('USR-001', 'USR-002', 'USR-003', 'USR-004', 'USR-005', 'USR-29332'))
   AND username NOT LIKE '%@transports';

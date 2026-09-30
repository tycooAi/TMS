-- V19: Setup production accounts and deactivate obsolete demo credentials

-- 1. Ensure the five production accounts exist with BCrypt hashes
INSERT INTO users (id, username, password_hash, full_name, email, phone, role_id, status) VALUES
('USR-PROD-ADM', 'admin@transports', '$2a$10$whF6OOsA6BIYWfSXy9ebDeLPYUNOgzjxj1Fa5IUSiN/JZTZgDQEQ.', 'System Administrator', 'admin@transports', '+91 98421 88001', 'ROLE_ADMIN', 'ACTIVE'),
('USR-PROD-MD', 'md@transports', '$2a$10$OEsSzPAHd/qM5T4NNv.touzxx9HMlu6njdTy/CDxr1QsYJ/GXx2V.', 'Managing Director', 'md@transports', '+91 98421 88002', 'ROLE_MD', 'ACTIVE'),
('USR-PROD-MGR', 'manager@transports', '$2a$10$oRLxxQ71x9TA2MQiPfVn2OzSnoY1ISwskl.RIOyZdwhkZKl378LEu', 'Operations Manager', 'manager@transports', '+91 98421 88003', 'ROLE_MANAGER', 'ACTIVE'),
('USR-PROD-ACC', 'accounts@transports', '$2a$10$WU6hpi4.oBeaUmcz/cmz4eZA4qNJPnHs1.7I8uwcD.StkmnFuKM7S', 'Finance & Accounts', 'accounts@transports', '+91 98421 88004', 'ROLE_ACCOUNTS', 'ACTIVE'),
('USR-PROD-WRK', 'worker@transports', '$2a$10$yztZ4XM1.xM3AewXNKVase3ApVbggoN9NksEsHjV8k3HKI9kRl6ha', 'Operational Worker', 'worker@transports', '+91 98421 88005', 'ROLE_WORKER', 'ACTIVE')
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

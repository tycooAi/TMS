-- V20: Clean all business/demo/mock data for production deployment
-- Preserves schema, tables, foreign keys, indexes, roles, permissions, system control, company settings, and the 5 production accounts

-- 1. Remove child records first (dependency order)
DELETE FROM correction_request_items;
DELETE FROM correction_requests;
DELETE FROM trip_status_history;
DELETE FROM invoice_items;
DELETE FROM payment_allocations;
DELETE FROM contra_transfers;
DELETE FROM diesel_logs;
DELETE FROM vehicle_expenses;
DELETE FROM wage_advances;
DELETE FROM worker_wages;

-- 2. Remove trips, invoices, payments, and financial ledger transactions
DELETE FROM trips;
DELETE FROM invoices;
DELETE FROM payments;
DELETE FROM financial_transactions;

-- 3. Remove operational master configuration & rate cards
DELETE FROM configured_rates;

-- 4. Remove operational masters (workers, drivers, vehicles, customers, sources, materials, locations, fuel stations, cash/bank accounts)
DELETE FROM workers;
DELETE FROM drivers;
DELETE FROM vehicles;
DELETE FROM customers;
DELETE FROM sources;
DELETE FROM materials;
DELETE FROM locations;
DELETE FROM fuel_stations;
DELETE FROM cash_bank_accounts;

-- 5. Clean operational trip audit logs (preserve system control and backup audits)
DELETE FROM audit_logs WHERE entity_type NOT IN ('SYSTEM_CONTROL', 'BACKUP');

-- 6. Remove obsolete inactive demo accounts, leaving ONLY the 5 production accounts
DELETE FROM users 
WHERE username IN ('admin', 'md', 'manager', 'accounts', 'worker', 'karthik.w')
   OR id IN ('USR-001', 'USR-002', 'USR-003', 'USR-004', 'USR-005', 'USR-29332');

-- 7. Reset sequence counters safely
ALTER SEQUENCE trip_status_history_id_seq RESTART WITH 1;
ALTER SEQUENCE invoice_items_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_allocations_id_seq RESTART WITH 1;
ALTER SEQUENCE correction_request_items_id_seq RESTART WITH 1;

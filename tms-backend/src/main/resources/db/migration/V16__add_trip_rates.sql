-- V16: Add explicit rate fields to trips for rate transparency and historical integrity
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS billing_rate NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS transport_rate NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS purchase_rate NUMERIC(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS per_km_rate NUMERIC(12,2) DEFAULT 0.00;

-- Backfill existing records with applied_rate as billing_rate
UPDATE trips 
SET billing_rate = applied_rate
WHERE billing_rate = 0.00 OR billing_rate IS NULL;

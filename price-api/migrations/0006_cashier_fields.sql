ALTER TABLE receipt_jobs ADD COLUMN cashier_label_raw TEXT;
ALTER TABLE receipt_jobs ADD COLUMN cashier_hash TEXT;
ALTER TABLE receipt_jobs ADD COLUMN cashier_operator_id TEXT;

CREATE INDEX IF NOT EXISTS idx_receipt_jobs_cashier_hash ON receipt_jobs(cashier_hash);

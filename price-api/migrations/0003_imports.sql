CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  territory TEXT NOT NULL CHECK (territory IN ('fr', 'gp', 'mq')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'success', 'partial', 'failed')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS import_rows (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  ean TEXT,
  retailer TEXT,
  territory TEXT,
  price_cents INTEGER,
  status TEXT NOT NULL CHECK (status IN ('ok', 'invalid', 'error')),
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES import_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_import_job_status ON import_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_rows_job ON import_rows(job_id, row_number);
CREATE INDEX IF NOT EXISTS idx_import_rows_ean ON import_rows(ean);

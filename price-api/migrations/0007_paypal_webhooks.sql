CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  paypal_subscription_id TEXT UNIQUE,
  payer_id TEXT,
  email TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_updated_at
  ON subscriptions (user_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions (status);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  create_time TEXT,
  received_at TEXT DEFAULT (datetime('now')),
  raw_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
  ON webhook_events (received_at);

CREATE TRIGGER IF NOT EXISTS trg_subscriptions_updated_at
AFTER UPDATE ON subscriptions
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE subscriptions
  SET updated_at = datetime('now')
  WHERE id = OLD.id;
END;

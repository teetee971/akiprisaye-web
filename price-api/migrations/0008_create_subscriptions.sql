CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  plan_code TEXT,
  status TEXT,
  paypal_subscription_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Table des prix (Carburants et Courses)
CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  price REAL NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL, -- 'essence', 'supermarché', 'marché'
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table de santé des robots
CREATE TABLE IF NOT EXISTS scraper_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  robot_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

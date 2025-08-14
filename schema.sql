-- SQL schema for the Tunc application
-- Table storing metadata about each capsule (timeline)
CREATE TABLE IF NOT EXISTS capsules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table storing items within a capsule. Each item can be a message or media reference.
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  capsule_id TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opening_date DATETIME,
  FOREIGN KEY (capsule_id) REFERENCES capsules(id)
);

-- Table storing generic timeline events for analytics or logging.
CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  value TEXT,
  type TEXT,
  details TEXT
);

-- SQL schema for the Tunc application
-- Table storing metadata about each capsule (timeline)
CREATE TABLE IF NOT EXISTS capsules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table storing items within a capsule. Each item can be a message, media reference, or other event.
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  capsule_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reveal_at DATETIME,
  FOREIGN KEY (capsule_id) REFERENCES capsules(id)
);

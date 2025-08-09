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
  opening_date TEXT,
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE
);

-- Index to speed up lookups by capsule and creation time
CREATE INDEX IF NOT EXISTS idx_items_capsule_id_created_at ON items (capsule_id, created_at);

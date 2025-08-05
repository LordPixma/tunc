-- Initialize database schema
CREATE TABLE IF NOT EXISTS capsules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  capsule_id TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opening_date DATETIME,
  FOREIGN KEY (capsule_id) REFERENCES capsules(id)
);

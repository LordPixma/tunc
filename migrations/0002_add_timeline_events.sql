-- Add timeline_events table for logging generic events
CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  value TEXT,
  type TEXT,
  details TEXT
);

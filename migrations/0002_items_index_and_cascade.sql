-- Update items table: add ON DELETE CASCADE, index, and store opening_date as ISO 8601 text
BEGIN TRANSACTION;

CREATE TABLE items_new (
  id TEXT PRIMARY KEY,
  capsule_id TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opening_date TEXT,
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE
);

INSERT INTO items_new (id, capsule_id, message, attachments, created_at, opening_date)
SELECT id, capsule_id, message, attachments, created_at, opening_date FROM items;

DROP TABLE items;
ALTER TABLE items_new RENAME TO items;

CREATE INDEX idx_items_capsule_id_created_at ON items (capsule_id, created_at);

COMMIT;

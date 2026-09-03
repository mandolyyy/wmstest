-- Warehouse Management System schema
-- Storage hierarchy: Zone -> Aisle -> Rack -> Shelf -> Bin

CREATE TABLE IF NOT EXISTS zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS aisles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE CASCADE,
  UNIQUE (zone_id, name)
);

CREATE TABLE IF NOT EXISTS racks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aisle_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (aisle_id) REFERENCES aisles(id) ON DELETE CASCADE,
  UNIQUE (aisle_id, name)
);

CREATE TABLE IF NOT EXISTS shelves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rack_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (rack_id) REFERENCES racks(id) ON DELETE CASCADE,
  UNIQUE (rack_id, name)
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_code TEXT NOT NULL UNIQUE,
  description TEXT,
  weight REAL NOT NULL,
  length REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'inbound', -- inbound | stored | outbound_requested | shipped
  bin_id INTEGER,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  FOREIGN KEY (bin_id) REFERENCES bins(id)
);

CREATE TABLE IF NOT EXISTS bins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bin_code TEXT NOT NULL UNIQUE,
  shelf_id INTEGER NOT NULL,
  max_weight REAL NOT NULL,
  max_length REAL NOT NULL,
  max_width REAL NOT NULL,
  max_height REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'empty', -- empty | occupied
  current_item_id INTEGER,
  FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE,
  FOREIGN KEY (current_item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS outbound_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  requested_at TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | completed | cancelled
  completed_at TEXT,
  completed_by TEXT,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  user_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE INDEX IF NOT EXISTS idx_logs_item ON logs(item_id);
CREATE INDEX IF NOT EXISTS idx_bins_status ON bins(status);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);

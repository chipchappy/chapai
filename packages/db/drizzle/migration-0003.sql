CREATE TABLE IF NOT EXISTS access_keys (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  normalized_code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER,
  max_redeems INTEGER NOT NULL DEFAULT 1,
  redeem_count INTEGER NOT NULL DEFAULT 0,
  last_redeemed_at INTEGER,
  notes TEXT
);

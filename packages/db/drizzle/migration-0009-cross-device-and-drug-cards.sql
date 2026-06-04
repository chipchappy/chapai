-- Migration 0009 — cross-device resume + achievement event log + drug cards lane

-- Cross-device practice-exam resume: persist the answered cursor server-side
-- so a student can start on phone and finish on laptop.
ALTER TABLE quiz_sessions ADD COLUMN current_index INTEGER NOT NULL DEFAULT 0;

-- Achievement events log — mirrors the client-side toast "seen" flags so the
-- dashboard can later render a milestone history without rebuilding from
-- localStorage. UNIQUE(user_id, achievement_key) prevents double-logging.
CREATE TABLE IF NOT EXISTS achievement_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  occurred_at INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata TEXT
);
CREATE INDEX IF NOT EXISTS idx_achievement_events_user
  ON achievement_events (user_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_achievement_events_user_key
  ON achievement_events (user_id, achievement_key);

-- Drug cards content lane — schema only. Content lands in follow-up via a
-- seeding script; the lookup helper safely returns nothing until rows exist.
CREATE TABLE IF NOT EXISTS drug_cards (
  id TEXT PRIMARY KEY,
  generic_name TEXT NOT NULL,
  brand_names TEXT,
  drug_class TEXT NOT NULL,
  mechanism TEXT,
  indications TEXT,
  contraindications TEXT,
  black_box_warning TEXT,
  priority_labs TEXT,
  patient_teaching TEXT,
  nursing_implications TEXT,
  related_tags TEXT,
  publish_state TEXT NOT NULL DEFAULT 'published',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_drug_cards_class ON drug_cards (drug_class);
CREATE INDEX IF NOT EXISTS idx_drug_cards_publish ON drug_cards (publish_state);

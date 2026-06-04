-- Migration 0010 — drug card bookmarks with SM-2 spaced review fields.
-- Lives in a dedicated table (not review_schedule) because review_schedule.question_id
-- has an FK to questions; drug cards aren't questions.

CREATE TABLE IF NOT EXISTS drug_card_bookmarks (
  user_id TEXT NOT NULL,
  drug_card_id TEXT NOT NULL,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_at INTEGER,
  last_reviewed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, drug_card_id)
);

CREATE INDEX IF NOT EXISTS idx_drug_card_bookmarks_review
  ON drug_card_bookmarks (user_id, next_review_at);

-- Migration 0008 — server-side readiness sync
-- Adds practice_exam_id column to quiz_sessions to link cross-device exam attempts
-- to their catalog exam id (e.g., "nclex-sim-1"). Also adds a free-form mode column
-- so we can distinguish "standard" vs "practice-exam" sessions when querying.

ALTER TABLE quiz_sessions ADD COLUMN practice_exam_id TEXT;
ALTER TABLE quiz_sessions ADD COLUMN mode TEXT;

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_practice_exam
  ON quiz_sessions (user_id, practice_exam_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_completed
  ON quiz_sessions (user_id, completed_at DESC);

-- Streak-protection opt-out store (one row per opt-out; not per user).
-- Keep it simple: presence = opted out. Email is normalized lowercase.
CREATE TABLE IF NOT EXISTS streak_email_optouts (
  email TEXT PRIMARY KEY,
  opted_out_at INTEGER NOT NULL DEFAULT (unixepoch()),
  source TEXT
);

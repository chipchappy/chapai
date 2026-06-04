-- ChapAI D1 Launch Week Migration
-- Run with: npx wrangler d1 execute chapai-prod --remote --file=packages/db/drizzle/migration-0002.sql

CREATE TABLE IF NOT EXISTS legal_acceptances (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  policy_type TEXT NOT NULL CHECK(policy_type IN ('terms','privacy')),
  policy_version TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('auth_login','checkout')),
  ip_hash TEXT,
  user_agent TEXT,
  accepted_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_email ON legal_acceptances(email, accepted_at);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user ON legal_acceptances(user_id, accepted_at);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_policy ON legal_acceptances(policy_type, policy_version);

CREATE TABLE IF NOT EXISTS practice_exam_unlocks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL,
  exam_track TEXT NOT NULL CHECK(exam_track IN ('nclex','ccrn')),
  source_plan_code TEXT NOT NULL,
  first_opened_at INTEGER DEFAULT (unixepoch()),
  last_opened_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_exam_unlocks_user ON practice_exam_unlocks(user_id, first_opened_at);

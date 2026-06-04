-- ChapAI D1 Initial Migration
-- Run with: npx wrangler d1 execute chapai-prod --file=packages/db/drizzle/migration-0001.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  tier TEXT DEFAULT 'free' CHECK(tier IN ('free','plus','pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_current_period_end INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS sessions (
  session_token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  tier TEXT NOT NULL CHECK(tier IN ('plus','pro')),
  plan_code TEXT NOT NULL,
  status TEXT NOT NULL,
  exam_track TEXT NOT NULL DEFAULT 'all' CHECK(exam_track IN ('all','nclex','ccrn')),
  entitlements TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_checkout_session_id TEXT,
  current_period_end INTEGER,
  expires_at INTEGER,
  canceled_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  stripe_event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  processed_at INTEGER DEFAULT (unixepoch()),
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_entitlements (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  tier TEXT NOT NULL CHECK(tier IN ('plus','pro')),
  plan_code TEXT NOT NULL,
  status TEXT NOT NULL,
  exam_track TEXT NOT NULL DEFAULT 'all' CHECK(exam_track IN ('all','nclex','ccrn')),
  entitlements TEXT NOT NULL,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  expires_at INTEGER,
  current_period_end INTEGER,
  source_event_id TEXT REFERENCES billing_events(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam TEXT NOT NULL CHECK(exam IN ('nclex','ccrn')),
  type TEXT DEFAULT 'mcq' CHECK(type IN ('mcq','sata','ordering','matrix','case_study','bow_tie')),
  category TEXT NOT NULL,
  subcategory TEXT,
  difficulty INTEGER CHECK(difficulty BETWEEN 1 AND 5),
  stem TEXT NOT NULL,
  options TEXT NOT NULL,
  answer TEXT NOT NULL,
  rationale TEXT NOT NULL,
  distractor_rationales TEXT,
  tags TEXT,
  blueprint_pct REAL,
  concept_notes TEXT,
  provenance TEXT,
  review_status TEXT,
  revision INTEGER,
  publish_state TEXT,
  correct_order TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  exam TEXT NOT NULL CHECK(exam IN ('nclex','ccrn')),
  category TEXT,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER DEFAULT 0,
  started_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER,
  question_ids TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_answers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  time_spent_ms INTEGER,
  answered_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS review_schedule (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_at INTEGER,
  last_reviewed_at INTEGER,
  PRIMARY KEY (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS case_studies (
  id TEXT PRIMARY KEY,
  exam TEXT DEFAULT 'nclex' CHECK(exam IN ('nclex','ccrn')),
  title TEXT NOT NULL,
  scenario TEXT NOT NULL,
  nurses_notes TEXT NOT NULL,
  vital_signs TEXT NOT NULL,
  lab_values TEXT,
  orders TEXT,
  questions_json TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS daily_usage (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  tutor_calls_used INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_exam_category ON questions(exam, category);
CREATE INDEX IF NOT EXISTS idx_questions_exam_difficulty ON questions(exam, difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user_id ON quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_review_schedule_next ON review_schedule(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer ON billing_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_subscription ON billing_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_customer ON user_entitlements(stripe_customer_id);

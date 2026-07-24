CREATE TABLE IF NOT EXISTS readiness_exam_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  launch_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  assembly_version TEXT NOT NULL,
  content_fingerprint TEXT NOT NULL,
  question_ids TEXT NOT NULL,
  scoring_manifest TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK(status IN ('in_progress', 'completed', 'abandoned')),
  total_items INTEGER NOT NULL,
  answered_items INTEGER NOT NULL DEFAULT 0,
  points_earned REAL NOT NULL DEFAULT 0,
  points_possible REAL NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL DEFAULT (unixepoch()),
  completed_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, launch_id)
);

CREATE TABLE IF NOT EXISTS readiness_exam_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES readiness_exam_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_snapshot TEXT NOT NULL,
  form_position INTEGER NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  points_earned REAL NOT NULL,
  points_possible REAL NOT NULL,
  partial_credit REAL NOT NULL,
  time_spent_ms INTEGER,
  answered_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_readiness_attempts_user_started
  ON readiness_exam_attempts(user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_readiness_attempts_exam_status
  ON readiness_exam_attempts(exam_id, status);

CREATE INDEX IF NOT EXISTS idx_readiness_answers_attempt
  ON readiness_exam_answers(attempt_id, form_position);

CREATE INDEX IF NOT EXISTS idx_readiness_answers_question
  ON readiness_exam_answers(question_id, answered_at);

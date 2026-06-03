-- Premium Rationale Lane: 600-1200 char deep rationale with mechanism +
-- per-distractor + citations. Free tier sees the existing short rationale;
-- paid tier additionally sees the deep_rationale block.
--
-- Also flags which questions have been authored by the Opus pass so we
-- can resume the run idempotently.
ALTER TABLE questions ADD COLUMN deep_rationale TEXT;
ALTER TABLE questions ADD COLUMN deep_rationale_authored_at INTEGER;

-- Composite index so the authoring script can find next-N candidates fast.
CREATE INDEX IF NOT EXISTS idx_questions_deep_rationale_pending
  ON questions(exam, publish_state, deep_rationale_authored_at);

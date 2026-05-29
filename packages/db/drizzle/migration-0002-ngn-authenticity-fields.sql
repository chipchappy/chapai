-- P1 NGN authenticity fields.
-- Run against D1 before syncing generated case-study or bow-tie content.

ALTER TABLE questions ADD COLUMN case_study_id TEXT;
ALTER TABLE questions ADD COLUMN cjmm_step TEXT CHECK (
  cjmm_step IS NULL OR cjmm_step IN (
    'recognize-cues',
    'analyze-cues',
    'prioritize-hypotheses',
    'generate-solutions',
    'take-actions',
    'evaluate-outcomes'
  )
);
ALTER TABLE questions ADD COLUMN bow_tie TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_case_study_id ON questions(case_study_id);
CREATE INDEX IF NOT EXISTS idx_questions_cjmm_step ON questions(cjmm_step);

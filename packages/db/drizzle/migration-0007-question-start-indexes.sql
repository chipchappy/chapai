CREATE INDEX IF NOT EXISTS idx_questions_exam_publish_type ON questions(exam, publish_state, type);
CREATE INDEX IF NOT EXISTS idx_questions_exam_publish_category ON questions(exam, publish_state, category);

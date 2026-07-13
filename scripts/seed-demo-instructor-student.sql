INSERT INTO users (id, email, name, tier, created_at, updated_at)
VALUES (
  'demo-test-student-july-2026',
  'test.student@claritynclex.com',
  'Test Student',
  'pro',
  unixepoch() - 86400,
  unixepoch()
)
ON CONFLICT(email) DO UPDATE SET
  name = 'Test Student',
  tier = 'pro',
  updated_at = unixepoch();

INSERT OR REPLACE INTO access_key_grants (
  id, user_id, email, key_id, key_code, key_type, institution,
  granted_at, expires_at, role, cohort
)
SELECT
  'demo-test-grant-july-2026',
  (SELECT id FROM users WHERE email = 'test.student@claritynclex.com'),
  'test.student@claritynclex.com',
  id,
  code,
  type,
  notes,
  unixepoch() - 86400,
  expires_at,
  'student',
  'demo-adn-cohort-july-2026'
FROM access_keys
WHERE id = 'trial-3d0aa583' AND status = 'active';

DELETE FROM quiz_answers WHERE session_id = 'demo-test-session-july-2026';

INSERT OR REPLACE INTO quiz_sessions (
  id, user_id, exam, category, total_questions, correct_count,
  started_at, completed_at, question_ids
)
SELECT
  'demo-test-session-july-2026',
  (SELECT id FROM users WHERE email = 'test.student@claritynclex.com'),
  'nclex',
  NULL,
  32,
  24,
  unixepoch() - 5400,
  unixepoch() - 1800,
  (
    SELECT json_group_array(id)
    FROM (
      SELECT id
      FROM questions
      WHERE exam = 'nclex'
        AND publish_state = 'published'
        AND type = 'mcq'
        AND upper(answer) IN ('A', 'B', 'C', 'D')
      ORDER BY id
      LIMIT 32
    )
  );

WITH selected AS (
  SELECT id, upper(answer) AS answer, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM questions
  WHERE exam = 'nclex'
    AND publish_state = 'published'
    AND type = 'mcq'
    AND upper(answer) IN ('A', 'B', 'C', 'D')
  ORDER BY id
  LIMIT 32
)
INSERT INTO quiz_answers (
  id, session_id, question_id, user_id, selected_answer, is_correct,
  points_earned, points_possible, partial_credit, time_spent_ms, answered_at
)
SELECT
  'demo-test-answer-' || printf('%02d', rn),
  'demo-test-session-july-2026',
  id,
  (SELECT id FROM users WHERE email = 'test.student@claritynclex.com'),
  CASE WHEN rn <= 24 THEN answer ELSE CASE answer WHEN 'A' THEN 'B' ELSE 'A' END END,
  CASE WHEN rn <= 24 THEN 1 ELSE 0 END,
  CASE WHEN rn <= 24 THEN 1.0 ELSE 0.0 END,
  1.0,
  CASE WHEN rn <= 24 THEN 1.0 ELSE 0.0 END,
  45000 + rn * 900,
  unixepoch() - 5400 + rn * 90
FROM selected;

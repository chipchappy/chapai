-- P1 bow-tie partial-credit analytics fields.
-- Prefer scripts/apply-d1-p1-ngn-migration.mjs for D1 because it is idempotent.

ALTER TABLE quiz_answers ADD COLUMN points_earned REAL;
ALTER TABLE quiz_answers ADD COLUMN points_possible REAL;
ALTER TABLE quiz_answers ADD COLUMN partial_credit REAL;

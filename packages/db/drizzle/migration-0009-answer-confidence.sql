-- Confidence calibration.
-- Lets a student mark how sure they were on each answer, so we can surface
-- "confident and wrong" -- the quadrant a student never reviews voluntarily
-- because they don't know it's broken. Nullable: every existing row predates
-- this feature and must stay valid.

ALTER TABLE quiz_answers ADD COLUMN confidence TEXT CHECK (
  confidence IS NULL OR confidence IN ('sure', 'unsure', 'guess')
);

CREATE TABLE IF NOT EXISTS access_key_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  key_id TEXT NOT NULL,
  key_code TEXT NOT NULL,
  key_type TEXT NOT NULL,
  institution TEXT,
  granted_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  role TEXT DEFAULT 'student',
  cohort TEXT
);

CREATE INDEX IF NOT EXISTS idx_access_key_grants_cohort_role
  ON access_key_grants(cohort, role, expires_at);

CREATE INDEX IF NOT EXISTS idx_access_key_grants_identity
  ON access_key_grants(user_id, email, role, expires_at);

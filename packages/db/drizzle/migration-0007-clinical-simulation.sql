-- Additive Clinical Simulation storage. No existing table is altered.
CREATE TABLE IF NOT EXISTS clinical_simulation_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  scenario_version TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('guided', 'independent')),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  seed INTEGER NOT NULL,
  virtual_minute INTEGER NOT NULL DEFAULT 0,
  current_state TEXT NOT NULL,
  score_domains TEXT,
  critical_errors TEXT NOT NULL DEFAULT '[]',
  debrief_viewed INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_clinical_sim_attempt_user_status
  ON clinical_simulation_attempts(user_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_clinical_sim_attempt_scenario
  ON clinical_simulation_attempts(scenario_id, scenario_version, status);

CREATE TABLE IF NOT EXISTS clinical_simulation_actions (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES clinical_simulation_attempts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  category TEXT NOT NULL,
  classification TEXT NOT NULL,
  virtual_minute INTEGER NOT NULL,
  details TEXT NOT NULL DEFAULT '{}',
  state_transition TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_clinical_sim_action_attempt
  ON clinical_simulation_actions(attempt_id, virtual_minute, created_at);
CREATE INDEX IF NOT EXISTS idx_clinical_sim_action_user
  ON clinical_simulation_actions(user_id, created_at);

CREATE TABLE IF NOT EXISTS clinical_simulation_assignments (
  id TEXT PRIMARY KEY,
  cohort TEXT NOT NULL,
  instructor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('guided', 'independent')),
  minimum_domain_level TEXT,
  due_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_clinical_sim_assignment_cohort
  ON clinical_simulation_assignments(cohort, due_at);

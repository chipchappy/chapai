-- Reversible rollback for migration-0007. Only simulation-owned data is removed.
DROP TABLE IF EXISTS clinical_simulation_actions;
DROP TABLE IF EXISTS clinical_simulation_assignments;
DROP TABLE IF EXISTS clinical_simulation_attempts;

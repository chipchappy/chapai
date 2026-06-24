ALTER TABLE legal_acceptances ADD COLUMN created_at INTEGER;
UPDATE legal_acceptances SET created_at = COALESCE(created_at, accepted_at);

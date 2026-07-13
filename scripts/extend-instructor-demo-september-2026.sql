-- End of September 1, 2026 in America/Los_Angeles (PDT), stored as UTC.
-- Re-running this script is idempotent. D1 executes the uploaded batch without
-- explicit transaction statements.

UPDATE access_keys
SET expires_at = CAST(strftime('%s', '2026-09-02 06:59:59') AS INTEGER)
WHERE type = 'instructor-pass' AND status = 'active';

UPDATE access_key_grants
SET expires_at = CAST(strftime('%s', '2026-09-02 06:59:59') AS INTEGER)
WHERE role = 'instructor' OR key_type = 'instructor-pass';

UPDATE user_entitlements
SET expires_at = CAST(strftime('%s', '2026-09-02 06:59:59') AS INTEGER),
    current_period_end = CAST(strftime('%s', '2026-09-02 06:59:59') AS INTEGER),
    updated_at = unixepoch()
WHERE plan_code = 'institutional_trial'
  AND (
    user_id IN (SELECT user_id FROM access_key_grants WHERE role = 'instructor' AND user_id IS NOT NULL)
    OR LOWER(email) IN (SELECT LOWER(email) FROM access_key_grants WHERE role = 'instructor' AND email IS NOT NULL)
  );

UPDATE billing_subscriptions
SET expires_at = CAST(strftime('%s', '2026-09-02 06:59:59') AS INTEGER),
    current_period_end = CAST(strftime('%s', '2026-09-02 06:59:59') AS INTEGER),
    updated_at = unixepoch()
WHERE plan_code = 'institutional_trial'
  AND (
    user_id IN (SELECT user_id FROM access_key_grants WHERE role = 'instructor' AND user_id IS NOT NULL)
    OR LOWER(email) IN (SELECT LOWER(email) FROM access_key_grants WHERE role = 'instructor' AND email IS NOT NULL)
  );

UPDATE users
SET stripe_current_period_end = CAST(strftime('%s', '2026-09-02 06:59:59') AS INTEGER),
    updated_at = unixepoch()
WHERE id IN (SELECT user_id FROM access_key_grants WHERE role = 'instructor' AND user_id IS NOT NULL)
   OR LOWER(email) IN (SELECT LOWER(email) FROM access_key_grants WHERE role = 'instructor' AND email IS NOT NULL);

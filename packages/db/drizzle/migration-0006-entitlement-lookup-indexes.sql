CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_status_updated
  ON user_entitlements(user_id, status, updated_at);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_email_status_updated
  ON user_entitlements(email, status, updated_at);


-- Migration 016: Enhance password_reset_tokens to support token reuse within 20m window and cooldown tracking

ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS raw_token text;
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS last_sent_at timestamp with time zone DEFAULT NOW();
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS ip_address text;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_active
  ON password_reset_tokens (user_id, consumed_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_ip
  ON password_reset_tokens (ip_address, created_at);

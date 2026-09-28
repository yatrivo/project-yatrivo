-- Yatrivo migration 015: Add must_change_password to users table and optimize reset token lookups
BEGIN;

-- Add must_change_password flag to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Add partial index for fast lookup of unused password reset tokens
CREATE INDEX IF NOT EXISTS password_reset_tokens_unconsumed_idx 
ON password_reset_tokens(user_id) 
WHERE consumed_at IS NULL;

COMMIT;

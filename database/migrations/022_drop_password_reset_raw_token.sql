-- Migration 022: Drop raw_token column from password_reset_tokens to ensure zero plaintext token storage

ALTER TABLE password_reset_tokens DROP COLUMN IF EXISTS raw_token;

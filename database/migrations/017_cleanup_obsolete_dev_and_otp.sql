-- Migration 017: Drop obsolete OTP challenges table and relax unused default hero fields
DROP TABLE IF EXISTS otp_challenges CASCADE;

ALTER TABLE homepage_config ALTER COLUMN hero_title DROP NOT NULL;
ALTER TABLE homepage_config ALTER COLUMN hero_subtitle DROP NOT NULL;

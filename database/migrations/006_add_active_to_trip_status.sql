-- Add 'active' to trip_status enum
ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'active';

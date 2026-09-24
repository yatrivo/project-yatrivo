-- Add 'active' to destination_status enum
ALTER TYPE destination_status ADD VALUE IF NOT EXISTS 'active';

-- Migration 024: Add completed_photos array to trip_instances
ALTER TABLE trip_instances
ADD COLUMN IF NOT EXISTS completed_photos text[] DEFAULT '{}';

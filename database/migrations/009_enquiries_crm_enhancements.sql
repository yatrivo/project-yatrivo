-- 009_enquiries_crm_enhancements.sql
-- Expand enquiry_status enum to cover complete CRM lifecycle:
-- 'received', 'contacted', 'quoted', 'in_discussion', 'converted', 'confirmed', 'closed', 'lost', 'cancelled'

ALTER TYPE enquiry_status ADD VALUE IF NOT EXISTS 'in_discussion';
ALTER TYPE enquiry_status ADD VALUE IF NOT EXISTS 'converted';
ALTER TYPE enquiry_status ADD VALUE IF NOT EXISTS 'closed';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS enquiry_notes_enquiry_created_idx ON enquiry_notes(enquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS enquiry_events_enquiry_created_idx ON enquiry_events(enquiry_id, created_at ASC);
CREATE INDEX IF NOT EXISTS enquiries_assigned_user_idx ON enquiries(assigned_to_user_id);

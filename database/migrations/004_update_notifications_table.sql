-- Migration: Update notifications table to support all CRUD operations
-- Run this in your Supabase SQL Editor

-- Update notifications table to support more notification types
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'CheckIn', 'CheckOut', 'Birthday', 'Reminder', 'OTP',
    'ChildCreated', 'ChildApproved', 'ChildRejected', 'ChildUpdated',
    'UserCreated', 'UserUpdated', 'UserSuspended', 'UserActivated', 'UserDeleted',
    'SessionCreated', 'SessionUpdated', 'SessionDeleted',
    'GroupAssigned', 'GroupUpdated'
  ));

-- Add user_id column for user-specific notifications
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- Add read column for tracking read status
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- Add metadata JSONB column for additional data
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_guardian ON notifications(guardian_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);


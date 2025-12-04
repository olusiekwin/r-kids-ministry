-- Migration: Add sessions/events table
-- Run this in your Supabase SQL Editor

-- Sessions/Events table for managing Sunday sessions and special events
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('Regular', 'Special Event', 'Holiday', 'Outing')),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50), -- 'weekly', 'monthly', 'yearly', etc.
    location VARCHAR(255),
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(church_id, session_date, group_id, start_time)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_church_date ON sessions(church_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_group ON sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id);


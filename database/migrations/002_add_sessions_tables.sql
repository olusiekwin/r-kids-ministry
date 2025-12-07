-- Migration: Add Sessions and Session Bookings Tables
-- Purpose: Link check-in/check-out to specific ministry sessions/events

-- Sessions table (ministry classes/events)
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    group_id UUID REFERENCES groups(group_id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    session_type VARCHAR(50) NOT NULL DEFAULT 'Regular' CHECK (session_type IN ('Regular', 'Special Event', 'Holiday', 'Outing')),
    location VARCHAR(255),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(church_id, title, session_date, start_time)
);

-- Session Bookings (parent books child for a session)
CREATE TABLE IF NOT EXISTS session_bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(guardian_id) ON DELETE SET NULL,
    qr_code VARCHAR(500),
    otp_code VARCHAR(10),
    status VARCHAR(50) DEFAULT 'booked' CHECK (status IN ('booked', 'checked_in', 'checked_out', 'cancelled')),
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_in_at TIMESTAMP,
    checked_out_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, child_id)
);

-- Add session_id and booking_id to check_in_records
ALTER TABLE check_in_records 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES session_bookings(booking_id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_church_id ON sessions(church_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_group_id ON sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);

CREATE INDEX IF NOT EXISTS idx_session_bookings_session_id ON session_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_child_id ON session_bookings(child_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_status ON session_bookings(status);

CREATE INDEX IF NOT EXISTS idx_check_in_records_session_id ON check_in_records(session_id);
CREATE INDEX IF NOT EXISTS idx_check_in_records_booking_id ON check_in_records(booking_id);

-- Trigger for updated_at on sessions
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- R KIDS Management System - Database Schema
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Churches (Multi-tenant support)
CREATE TABLE churches (
    church_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Accounts (must be created before groups due to foreign key)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Teacher', 'Parent', 'Teen')),
    linked_guardian_id UUID,
    linked_child_id UUID,
    mfa_secret VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(church_id, email)
);

-- Groups (created after users to reference teacher_id)
CREATE TABLE groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age_range_min INTEGER NOT NULL,
    age_range_max INTEGER NOT NULL,
    room VARCHAR(100),
    schedule VARCHAR(255),
    teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(church_id, name)
);

-- Guardians (Parents)
CREATE TABLE guardians (
    guardian_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    parent_id VARCHAR(50) NOT NULL, -- e.g., RS073
    name VARCHAR(255) NOT NULL,
    photo_url VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(20),
    relationship VARCHAR(20) NOT NULL CHECK (relationship IN ('Primary', 'Secondary')),
    is_primary BOOLEAN DEFAULT false,
    active_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(church_id, parent_id)
);

-- Children
CREATE TABLE children (
    child_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES guardians(guardian_id) ON DELETE CASCADE,
    registration_id VARCHAR(50) NOT NULL, -- e.g., RS073/01
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    group_id UUID REFERENCES groups(group_id),
    photo_url VARCHAR(500),
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(church_id, registration_id)
);

-- Child-Guardian Relationships (for secondary guardians)
CREATE TABLE child_guardians (
    child_guardian_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(guardian_id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    is_authorized BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(child_id, guardian_id)
);

-- Check-In/Check-Out Records
CREATE TABLE check_in_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(guardian_id),
    teacher_id UUID NOT NULL REFERENCES users(user_id),
    timestamp_in TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    timestamp_out TIMESTAMP,
    method VARCHAR(10) NOT NULL CHECK (method IN ('QR', 'OTP')),
    check_in_photo_url VARCHAR(500),
    check_out_photo_url VARCHAR(500),
    qr_code VARCHAR(500),
    otp_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Summary
CREATE TABLE attendance_summary (
    summary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    present_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    male_count INTEGER DEFAULT 0,
    female_count INTEGER DEFAULT 0,
    teacher_id UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(church_id, group_id, date)
);

-- Notifications
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('CheckIn', 'CheckOut', 'Birthday', 'Reminder', 'OTP')),
    child_id UUID REFERENCES children(child_id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(guardian_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    delivery_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP
);

-- Audit Log
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    action_performed VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_children_church_id ON children(church_id);
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_children_group_id ON children(group_id);
CREATE INDEX idx_children_registration_id ON children(registration_id);

CREATE INDEX idx_guardians_church_id ON guardians(church_id);
CREATE INDEX idx_guardians_parent_id ON guardians(parent_id);

CREATE INDEX idx_users_church_id ON users(church_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_check_in_records_church_id ON check_in_records(church_id);
CREATE INDEX idx_check_in_records_child_id ON check_in_records(child_id);
CREATE INDEX idx_check_in_records_date ON check_in_records(timestamp_in);

CREATE INDEX idx_attendance_summary_church_id ON attendance_summary(church_id);
CREATE INDEX idx_attendance_summary_group_id ON attendance_summary(group_id);
CREATE INDEX idx_attendance_summary_date ON attendance_summary(date);

CREATE INDEX idx_notifications_church_id ON notifications(church_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_audit_logs_church_id ON audit_logs(church_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON guardians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate child registration ID
CREATE OR REPLACE FUNCTION generate_child_registration_id()
RETURNS TRIGGER AS $$
DECLARE
    parent_prefix VARCHAR(50);
    child_count INTEGER;
    new_reg_id VARCHAR(50);
BEGIN
    -- Get parent prefix (e.g., RS073)
    SELECT g.parent_id INTO parent_prefix
    FROM guardians g
    WHERE g.guardian_id = NEW.parent_id;
    
    -- Count existing children for this parent
    SELECT COUNT(*) INTO child_count
    FROM children c
    WHERE c.parent_id = NEW.parent_id;
    
    -- Generate registration ID (e.g., RS073/01, RS073/02)
    new_reg_id := parent_prefix || '/' || LPAD((child_count + 1)::TEXT, 2, '0');
    
    NEW.registration_id := new_reg_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-generating child registration ID
CREATE TRIGGER generate_child_reg_id BEFORE INSERT ON children
    FOR EACH ROW EXECUTE FUNCTION generate_child_registration_id();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default church (Ruach South)
INSERT INTO churches (church_id, name, location, settings) VALUES
('00000000-0000-0000-0000-000000000001', 'Ruach South', 'South Location', '{"timezone": "UTC", "locale": "en-US"}');

-- Insert default groups
INSERT INTO groups (church_id, name, age_range_min, age_range_max, room, schedule) VALUES
('00000000-0000-0000-0000-000000000001', 'Little Angels', 3, 5, 'Room 101', 'Sundays 9:30 AM'),
('00000000-0000-0000-0000-000000000001', 'Saints', 6, 9, 'Room 102', 'Sundays 9:30 AM'),
('00000000-0000-0000-0000-000000000001', 'Disciples', 10, 12, 'Room 201', 'Sundays 9:30 AM'),
('00000000-0000-0000-0000-000000000001', 'Trendsetters', 13, 19, 'Room 205', 'Sundays 9:30 AM');


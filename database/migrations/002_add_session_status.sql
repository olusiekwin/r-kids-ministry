-- Migration: Add session status field
-- Purpose: Track session state (scheduled, active, ended)

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled' 
CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled'));

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;

COMMENT ON COLUMN sessions.status IS 'Session status: scheduled, active, ended, or cancelled';
COMMENT ON COLUMN sessions.started_at IS 'Timestamp when session was started';
COMMENT ON COLUMN sessions.ended_at IS 'Timestamp when session was ended';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

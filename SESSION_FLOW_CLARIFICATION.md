# Session Flow Clarification

## Understanding: Sessions = Ministry Classes/Events

**Sessions** are the actual ministry classes/events that children attend:
- Sunday Service (9:30 AM)
- Bible Study (Wednesday 6 PM)
- Youth Group (Friday 7 PM)
- Special Events (Christmas, Easter, etc.)

## Current Flow (What Exists)

✅ **Check-In/Check-Out System** - Works but NOT tied to sessions
- Parent generates QR code
- Teacher scans QR → Child checked in
- Teacher sends pickup notification
- Parent verifies → Child checked out

❌ **Missing: Session Context**
- Check-in doesn't know which SESSION the child is checking into
- No way to book children for specific sessions
- No calendar showing upcoming sessions
- No way to see which children are in which session

## Required Flow (What's Needed)

### 1. **Session Management**
- Admin/Teacher creates sessions (date, time, group, type)
- Sessions stored in database
- Calendar view of all sessions

### 2. **Session Booking** (Parent)
- Parent views upcoming sessions
- Parent books child(ren) for a session
- System generates QR/OTP for that SPECIFIC session
- Booking stored in `session_bookings` table

### 3. **Check-In to Session** (Teacher)
- Teacher selects which SESSION they're checking children into
- QR scan includes session_id
- Check-in record links to session_id
- Only children booked for that session can check in

### 4. **Check-Out from Session** (Teacher)
- Teacher selects session
- Shows children checked into that session
- Sends pickup notification
- Check-out record links to session_id

## Database Changes Needed

```sql
-- Sessions table (ministry classes/events)
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    church_id UUID NOT NULL REFERENCES churches(church_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    group_id UUID REFERENCES groups(group_id),
    teacher_id UUID REFERENCES users(user_id),
    session_type VARCHAR(50) CHECK (session_type IN ('Regular', 'Special Event', 'Holiday', 'Outing')),
    location VARCHAR(255),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Bookings (parent books child for session)
CREATE TABLE session_bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(child_id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(guardian_id),
    qr_code VARCHAR(500),
    otp_code VARCHAR(10),
    status VARCHAR(50) DEFAULT 'booked' CHECK (status IN ('booked', 'checked_in', 'checked_out', 'cancelled')),
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_in_at TIMESTAMP,
    checked_out_at TIMESTAMP,
    UNIQUE(session_id, child_id)
);

-- Update check_in_records to link to sessions
ALTER TABLE check_in_records ADD COLUMN session_id UUID REFERENCES sessions(session_id);
ALTER TABLE check_in_records ADD COLUMN booking_id UUID REFERENCES session_bookings(booking_id);
```

## UI Pages Needed

1. **Calendar/Sessions Page** (`/calendar`)
   - View all sessions in calendar format
   - Filter by group, date, type
   - Create/edit sessions (Admin/Teacher)

2. **Book Session Page** (`/parent/book-session`)
   - List upcoming sessions
   - Select child(ren)
   - Book for session
   - Generate QR/OTP for that session

3. **Session Check-In Page** (`/teacher/session-checkin/:sessionId`)
   - Teacher selects session
   - Shows children booked for that session
   - QR scanner for that session
   - Manual check-in for that session

4. **Session Check-Out Page** (`/teacher/session-checkout/:sessionId`)
   - Teacher selects session
   - Shows children checked into that session
   - Send pickup notifications
   - Verify and check out

## Backend API Changes Needed

### Sessions API (Complete)
- `GET /api/sessions` - List sessions (with filters)
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Session Bookings API (NEW)
- `GET /api/sessions/:sessionId/bookings` - Get bookings for session
- `POST /api/sessions/:sessionId/book` - Book child for session
- `POST /api/sessions/:sessionId/book` - Book multiple children
- `DELETE /api/bookings/:bookingId` - Cancel booking

### Check-In API (Update)
- `POST /api/checkin/scan-qr` - Add `session_id` parameter
- `POST /api/checkin/manual` - Add `session_id` parameter
- `POST /api/checkin/verify-otp` - Add `session_id` parameter
- Link check-in records to `session_id` and `booking_id`

### Check-Out API (Update)
- `POST /api/checkout/notify/:childId` - Add `session_id` parameter
- `POST /api/checkout/release/:childId` - Add `session_id` parameter
- Link check-out records to `session_id`

## Implementation Priority

1. **HIGH:** Database schema (sessions, session_bookings)
2. **HIGH:** Sessions API (complete CRUD)
3. **HIGH:** Session Bookings API
4. **HIGH:** Update Check-In API to include session_id
5. **HIGH:** Update Check-Out API to include session_id
6. **MEDIUM:** Calendar UI page
7. **MEDIUM:** Book Session UI page
8. **MEDIUM:** Session-specific Check-In UI
9. **MEDIUM:** Session-specific Check-Out UI


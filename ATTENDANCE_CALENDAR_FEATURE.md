# Attendance Tracking & Calendar Feature Design

## Overview
A comprehensive attendance tracking system with calendar view, allowing admins to track check-in/checkout activity, view reports, and manage children by age/group.

---

## Feature Requirements

### 1. **Calendar View with Sunday Sessions**
- **Calendar Display**: Monthly/weekly calendar showing all Sundays
- **Session Time Slots**: Display time for each session (e.g., 9:00 AM, 11:00 AM)
- **Visual Indicators**:
  - Green dot = Session with children checked in
  - Red dot = Session with no check-ins
  - Blue dot = Upcoming session
- **Click to View**: Click on any Sunday to see detailed session info

### 2. **Child Filtering by Age/Group**
- **Filter Options**:
  - By Age Range (e.g., 0-2, 3-5, 6-8, 9-12, 13+)
  - By Group (Little Angels, Saints, Disciples, Trendsetters)
  - By Individual Child (search by name/registration ID)
- **Quick Filters**: Buttons for common age ranges
- **Search Bar**: Search children by name or registration ID

### 3. **Check-In/Check-Out from Calendar**
- **Inline Actions**: 
  - Check-in button next to each child in calendar view
  - Check-out button for checked-in children
  - Bulk check-in for group
- **Status Indicators**:
  - ✅ Checked In (green)
  - ⏳ Not Checked In (gray)
  - ✅ Checked Out (blue)
- **Quick Actions**: Right-click menu for check-in/out

### 4. **Daily Attendance View**
- **Date Picker**: Select any date to view attendance
- **Session Breakdown**: 
  - Morning Session (9:00 AM)
  - Afternoon Session (11:00 AM)
  - Evening Session (if applicable)
- **Statistics**:
  - Total checked in
  - Total checked out
  - Attendance rate
  - By group breakdown

### 5. **Monthly Attendance Report**
- **Report Period**: Select month/year
- **Views**:
  - **Summary View**: Overall statistics
    - Total sessions
    - Average attendance per session
    - Peak attendance day
    - Lowest attendance day
  - **Group View**: Breakdown by group
  - **Individual Child View**: Per-child attendance
- **Export Options**: PDF, Excel, CSV

### 6. **Individual Child Activity Timeline**
- **Child Profile**: Click on child to see full history
- **Timeline View**:
  - All check-ins with date/time
  - All check-outs with date/time
  - Duration in session
  - Method used (QR/OTP/PARENT_ID)
- **Statistics**:
  - Total sessions attended
  - Attendance rate (%)
  - Average session duration
  - Most frequent check-in time

### 7. **Group Activity Dashboard**
- **Group Overview**: Select group to see all children
- **Real-time Status**: Who's checked in right now
- **Today's Attendance**: List of all children with status
- **Quick Actions**: Bulk check-in/out for group

---

## User Interface Design

### Main Calendar Page (`/admin/attendance-calendar`)

```
┌─────────────────────────────────────────────────────────────┐
│  Attendance Calendar                    [Today] [Export]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Filters:                                                    │
│  [All Ages] [0-2] [3-5] [6-8] [9-12] [13+]                 │
│  [All Groups] [Little Angels] [Saints] [Disciples] [Trend] │
│  🔍 Search: [________________]                              │
│                                                              │
│  View: [Day] [Week] [Month]  Period: [Daily] [Monthly]     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  December 2025                                        │  │
│  │  Sun  Mon  Tue  Wed  Thu  Fri  Sat                   │  │
│  │  ────────────────────────────────────────────────     │  │
│  │   1    2    3    4    5    6    7                    │  │
│  │  [8]   9   10   11   12   13   14                    │  │
│  │  [15]  16  17   18   19   20   21                    │  │
│  │  [22]  23  24   25   26   27   28                    │  │
│  │  [29]  30  31                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Selected: Sunday, Dec 8, 2025                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Morning Session (9:00 AM)                           │  │
│  │  ✅ 15 checked in | ⏳ 5 not checked in              │  │
│  │                                                       │  │
│  │  Children:                                           │  │
│  │  ✅ John Doe (RS001) - 9:15 AM    [Check Out]       │  │
│  │  ✅ Jane Smith (RS002) - 9:20 AM  [Check Out]       │  │
│  │  ⏳ Bob Johnson (RS003)            [Check In]        │  │
│  │  ...                                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Afternoon Session (11:00 AM)                         │  │
│  │  ✅ 12 checked in | ⏳ 8 not checked in               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Individual Child Activity Page (`/admin/attendance-calendar/child/:childId`)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Calendar                                          │
│                                                              │
│  John Doe (RS001) - Age 7 - Little Angels                    │
│                                                              │
│  Statistics:                                                 │
│  Total Sessions: 45 | Attendance Rate: 89% | Avg Duration: 2h│
│                                                              │
│  Activity Timeline:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Dec 8, 2025 - Sunday                                │  │
│  │  ✅ Checked In:  9:15 AM (QR Code)                   │  │
│  │  ✅ Checked Out: 11:30 AM                            │  │
│  │  Duration: 2h 15m                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Dec 1, 2025 - Sunday                                │  │
│  │  ✅ Checked In:  9:20 AM (OTP)                        │  │
│  │  ✅ Checked Out: 11:45 AM                            │  │
│  └──────────────────────────────────────────────────────┘  │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Monthly Report Page (`/admin/attendance-calendar/reports`)

```
┌─────────────────────────────────────────────────────────────┐
│  Monthly Attendance Report                                   │
│                                                              │
│  Period: [December 2025 ▼]  [Export PDF] [Export Excel]     │
│                                                              │
│  Summary:                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Total Sundays: 5                                    │  │
│  │  Average Attendance: 18.5 children/session          │  │
│  │  Peak Day: Dec 15 (25 children)                      │  │
│  │  Lowest Day: Dec 1 (12 children)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  By Group:                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Little Angels: 45 sessions | 89% attendance         │  │
│  │  Saints: 38 sessions | 76% attendance                │  │
│  │  Disciples: 42 sessions | 84% attendance             │  │
│  │  Trendsetters: 40 sessions | 80% attendance          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Weekly Breakdown:                                           │
│  [Chart showing attendance per Sunday]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend API Endpoints Needed

### 1. Calendar & Sessions
```
GET /api/attendance-calendar/sessions
  Query params: date, group_id, child_id
  Returns: List of sessions with check-in status

GET /api/attendance-calendar/sunday-sessions
  Query params: year, month
  Returns: All Sunday sessions for the month
```

### 2. Child Activity
```
GET /api/attendance-calendar/child/:childId/activity
  Query params: date_from, date_to, period (daily/monthly)
  Returns: Full activity timeline for child

GET /api/attendance-calendar/child/:childId/stats
  Returns: Statistics for child (attendance rate, etc.)
```

### 3. Group Activity
```
GET /api/attendance-calendar/group/:groupId/activity
  Query params: date
  Returns: All children in group with check-in status

GET /api/attendance-calendar/group/:groupId/stats
  Query params: period (daily/monthly)
  Returns: Group statistics
```

### 4. Reports
```
GET /api/attendance-calendar/reports/monthly
  Query params: year, month, group_id (optional)
  Returns: Monthly attendance report

GET /api/attendance-calendar/reports/daily
  Query params: date, group_id (optional)
  Returns: Daily attendance report
```

### 5. Check-In/Out from Calendar
```
POST /api/attendance-calendar/checkin
  Body: { child_id, session_id, teacher_id, method }
  Same as existing check-in endpoint

POST /api/attendance-calendar/checkout
  Body: { child_id, guardian_id }
  Same as existing checkout endpoint
```

---

## Database Queries Needed

### 1. Get Sunday Sessions with Check-in Status
```sql
SELECT 
  s.session_id,
  s.session_date,
  s.start_time,
  s.end_time,
  s.group_id,
  COUNT(DISTINCT cir.child_id) as checked_in_count,
  COUNT(DISTINCT c.child_id) - COUNT(DISTINCT cir.child_id) as not_checked_in_count
FROM sessions s
LEFT JOIN groups g ON s.group_id = g.group_id
LEFT JOIN children c ON c.group_id = g.group_id
LEFT JOIN check_in_records cir ON cir.child_id = c.child_id 
  AND DATE(cir.timestamp_in) = s.session_date
  AND cir.timestamp_out IS NULL
WHERE EXTRACT(DOW FROM s.session_date) = 0  -- Sunday
  AND s.session_date BETWEEN :start_date AND :end_date
GROUP BY s.session_id, s.session_date, s.start_time, s.end_time, s.group_id
```

### 2. Get Child Activity Timeline
```sql
SELECT 
  cir.record_id,
  cir.timestamp_in,
  cir.timestamp_out,
  cir.method,
  EXTRACT(EPOCH FROM (cir.timestamp_out - cir.timestamp_in))/60 as duration_minutes,
  s.session_date,
  s.start_time
FROM check_in_records cir
LEFT JOIN sessions s ON s.session_id = cir.session_id
WHERE cir.child_id = :child_id
  AND cir.timestamp_in >= :date_from
  AND cir.timestamp_in <= :date_to
ORDER BY cir.timestamp_in DESC
```

### 3. Get Monthly Statistics
```sql
SELECT 
  DATE_TRUNC('month', cir.timestamp_in) as month,
  COUNT(DISTINCT DATE(cir.timestamp_in)) as total_sessions,
  COUNT(DISTINCT cir.child_id) as unique_children,
  AVG(session_count) as avg_attendance_per_session
FROM check_in_records cir
WHERE cir.timestamp_in >= :start_date
  AND cir.timestamp_in <= :end_date
GROUP BY DATE_TRUNC('month', cir.timestamp_in)
```

---

## Implementation Phases

### Phase 1: Basic Calendar View (Week 1)
- [ ] Create calendar component showing Sundays
- [ ] Display sessions for selected Sunday
- [ ] Show check-in status for each child
- [ ] Basic filtering by group

### Phase 2: Check-In/Out Integration (Week 1)
- [ ] Add check-in button in calendar view
- [ ] Add check-out button for checked-in children
- [ ] Real-time status updates
- [ ] Bulk check-in for groups

### Phase 3: Child Activity Timeline (Week 2)
- [ ] Individual child activity page
- [ ] Timeline view with all check-ins/outs
- [ ] Statistics calculation
- [ ] Filter by date range

### Phase 4: Reports (Week 2)
- [ ] Daily report view
- [ ] Monthly report view
- [ ] Export functionality (PDF/Excel)
- [ ] Charts and visualizations

### Phase 5: Advanced Features (Week 3)
- [ ] Age-based filtering
- [ ] Search functionality
- [ ] Advanced statistics
- [ ] Notifications for low attendance

---

## Technical Considerations

1. **Performance**: 
   - Cache session data for current month
   - Lazy load child details
   - Paginate activity timeline

2. **Real-time Updates**:
   - WebSocket or polling for live status
   - Update calendar when check-in/out happens

3. **Data Aggregation**:
   - Pre-calculate monthly statistics
   - Store aggregated data for faster reports

4. **Mobile Responsiveness**:
   - Touch-friendly calendar
   - Swipe between weeks/months
   - Mobile-optimized check-in buttons

---

## Next Steps

1. Review and approve this design
2. Create database migration if needed (add indexes for performance)
3. Implement backend API endpoints
4. Build frontend components
5. Test with real data
6. Deploy and gather feedback


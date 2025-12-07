# Missing Features Analysis

## Status: "Uncooked Rice" - System Needs Completion

### ❌ Missing UI Pages/Features

1. **Calendar/Events Page** - NO
   - No route in App.tsx
   - No Calendar.tsx component
   - Backend has sessions API but no UI to view/create events

2. **Session Booking Page** - NO
   - Parents can't book sessions for children
   - No UI to select session and book child
   - Backend has sessions API but no booking UI

3. **Donations/Offering Page** - NO
   - No donations route
   - No Donations.tsx component
   - No backend API for donations

4. **Planning/Sermons Page** - NO
   - No planning route
   - No Sermons.tsx component
   - No backend API for sermons/lessons

5. **Teen Check-in/Check-out UI** - PARTIAL
   - TeenDashboard exists but may not have check-in/out functionality
   - Backend has teens API

### ⚠️ Incomplete Backend Features

1. **Sessions API** - PARTIAL
   - Uses check_in_records as proxy
   - No dedicated sessions table in schema
   - No booking/registration system

2. **Donations API** - MISSING
   - No donations table in schema
   - No donations routes

3. **Planning/Sermons API** - MISSING
   - No sermons/lessons table in schema
   - No planning routes

### ✅ What Exists

- Parent dashboard, add children, guardians
- Teacher check-in, QR/OTP verification
- Admin user management, groups
- Notifications system
- Attendance tracking
- Basic analytics

### 🔧 What Needs to Be Done

1. **Create Calendar/Events Page**
   - View sessions/events in calendar format
   - Create/edit events
   - Show attendance per session

2. **Create Session Booking Page**
   - Parent selects session
   - Books children for session
   - Generates QR/OTP for booked session

3. **Create Donations Page**
   - Donation form
   - Payment integration (stub for now)
   - Donation history

4. **Create Planning/Sermons Page**
   - Create sermons/lessons
   - Assign to sessions
   - View planning calendar

5. **Complete Sessions Backend**
   - Add sessions table to schema
   - Proper session CRUD
   - Booking/registration system

6. **Add Donations Backend**
   - Donations table
   - Donations API routes

7. **Add Planning Backend**
   - Sermons/lessons table
   - Planning API routes


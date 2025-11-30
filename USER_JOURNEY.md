# R-KIDS Ministry - Complete User Journey Guide

## 🎯 Overview
This document walks through the complete user journey for each role in the R-KIDS Ministry Management System.

---

## 👨‍💼 ADMIN USER JOURNEY

### Step 1: Login
1. Go to landing page: `http://localhost:8080/`
2. Click "Admin Login" or navigate to `/login`
3. Enter credentials:
   - **Email:** `admin@rkids.church`
   - **Password:** `password123`
4. Enter OTP code (shown in backend console)
5. ✅ **Logged in** → Redirected to `/admin`

### Step 2: Create Users (Teachers, Teens, Parents)
1. Navigate to **"Manage Users"** in sidebar
2. Select tab: **Teachers**, **Teens**, or **Parents**
3. Click **"+ Add User"** button
4. Fill form:
   - Name: `John Doe`
   - Email: `teacher@rkids.church`
   - Role: `Teacher` (auto-selected based on tab)
5. Click **"Create User"**
6. ✅ **User created** with status: `pending_password`
7. User receives invitation (email/SMS in production)

### Step 3: New User's First Login (Password Setup)
**When the new user tries to login:**
1. User goes to `/login`
2. Enters email: `teacher@rkids.church`
3. Tries any password
4. ❌ **Error:** "Password not set"
5. ✅ **Auto-redirected** to `/set-password?email=teacher@rkids.church`
6. User sees password setup form
7. Enters:
   - New Password: `MySecurePass123`
   - Confirm Password: `MySecurePass123`
8. Clicks **"Set Password & Continue"**
9. ✅ **Password set** → Proceeds to MFA verification
10. Enters OTP code
11. ✅ **Logged in** → Redirected to their dashboard

### Step 4: Approve Children
1. Navigate to **"Pending Approvals"** in sidebar
2. See list of children submitted by parents
3. For each child:
   - Review details (name, age, gender, medical info)
   - Review guardians (primary + secondary)
   - **Select Group** from dropdown (required)
4. Click **"Approve & Assign Group"**
5. ✅ **Child approved** → Status changes to `active`
6. Parent receives notification

### Step 5: Assign Teachers to Groups
1. Navigate to **"Groups"** in sidebar
2. Select a group (e.g., "Little Angels")
3. See list of teachers in dropdown
4. Select teacher from **"Assign Teacher"** dropdown
5. Click **"Assign"**
6. ✅ **Teacher assigned** → Teacher can now manage that group

### Step 6: View All Children
1. Navigate to **"All Children"** in sidebar
2. See all registered children (from all parents)
3. Filter by:
   - Search: name, ID, guardian
   - Group: All Groups / Little Angels / Saints / etc.
4. View child details:
   - Photo, name, registration ID
   - Age, gender, group
   - Status (active/pending/rejected)
   - All guardians (primary + secondary)

### Step 7: Track Check-Ins & Check-Outs
1. Navigate to **"Check-Ins & Check-Outs"** in sidebar
2. See real-time status:
   - Children checked in (not yet picked up)
   - Children checked out (picked up)
3. Filter by:
   - Date
   - Status (checked in / checked out)
   - Search by child name or teacher
4. View details:
   - Check-in time
   - Check-out time
   - Method (QR/OTP/Manual)
   - Guardian who picked up

### Step 8: View Reports
1. Navigate to **"Reports"** in sidebar
2. Select tab: **"Children Attendance"** or **"Teen Attendance"**
3. Filter by:
   - Period: Daily / Monthly / Quarterly / Annual
   - Group: (for children only)
4. View attendance data:
   - Date, Group, Present, Absent, Teacher
5. Export: CSV / Excel / Print

---

## 👨‍🏫 TEACHER USER JOURNEY

### Step 1: Login
1. Go to `/login`
2. Enter credentials:
   - **Email:** `teacher@rkids.church`
   - **Password:** (set during first login)
3. Enter OTP code
4. ✅ **Logged in** → Redirected to `/teacher`

### Step 2: View Assigned Group
1. Dashboard shows assigned group (e.g., "Little Angels")
2. See list of children in that group
3. View child status:
   - Not checked in
   - Checked in
   - Ready for pickup

### Step 3: Check-In Child (QR Code Method)
1. Parent arrives with QR code (from pre-check-in)
2. Click **"Scan QR Code"** button
3. Camera opens
4. Scan parent's QR code
5. System shows:
   - Child details (photo, name, ID)
   - Guardian list
6. Click **"Confirm Check-In"**
7. ✅ **Child checked in** → Parent receives confirmation

### Step 4: Check-In Child (OTP Method)
1. Click **"Manual Check-In"** button
2. Enter Parent ID: `RS073`
3. Click **"Send OTP"**
4. System sends OTP to parent
5. Parent provides OTP verbally
6. Enter OTP code
7. Click **"Verify"**
8. ✅ **Child checked in** → Parent receives confirmation

### Step 5: Send Pickup Notification
1. Service ends
2. Find child in checked-in list
3. Click **"Send Pickup Notification"** for that child
4. System generates:
   - Teacher QR code (for parent to scan)
   - Parent QR code + OTP (for parent to show)
5. ✅ **Notification sent** → Parent receives email + SMS
6. Child status: `ready_for_pickup`

### Step 6: Verify Pickup & Check-Out
1. Parent arrives for pickup
2. Parent shows QR code OR tells teacher OTP
3. Teacher verifies code
4. System shows authorized guardians list
5. Teacher selects guardian
6. **Review guardian photo** (required)
7. Check **"I confirm this is the authorized guardian"**
8. System sends OTP to guardian
9. Guardian provides OTP
10. Teacher enters OTP
11. Click **"Verify & Release"**
12. ✅ **Child checked out** → Parent receives confirmation

---

## 👨‍👩‍👧 PARENT USER JOURNEY

### Step 1: Login
1. Go to `/login`
2. Enter credentials:
   - **Email:** `parent@rkids.church`
   - **Password:** (set during first login)
3. Enter OTP code
4. ✅ **Logged in** → Redirected to `/parent`

### Step 2: Add Child
1. Click **"+ Add Child"** button
2. Fill child information:
   - Name, Date of Birth, Gender
   - Upload photo (optional)
   - Medical info (allergies, medications, special needs)
3. **Add Primary Guardians** (max 2):
   - Name, Email, Phone (required)
4. **Add Secondary Guardians** (max 2, optional):
   - Name, Phone, Relationship (required)
   - Email (optional)
5. Click **"Submit for Approval"**
6. ✅ **Child submitted** → Status: `pending`
7. Wait for admin approval

### Step 3: Pre-Check-In (Before Arriving at Church)
1. On dashboard, find child card
2. Click **"Pre-Check-In"** button
3. QR code generated (valid 15 minutes)
4. QR code sent via:
   - Email
   - SMS
5. ✅ **Ready for check-in** → Show QR at church

### Step 4: At Church - Check-In
**Option A: QR Code**
1. Show QR code to teacher
2. Teacher scans QR code
3. ✅ **Child checked in** → Receive confirmation

**Option B: OTP**
1. Teacher enters your Parent ID
2. You receive OTP via email/SMS
3. Provide OTP to teacher
4. ✅ **Child checked in** → Receive confirmation

### Step 5: Receive Pickup Notification
1. Service ends
2. Teacher sends pickup notification
3. You receive:
   - Email: "Maria is ready to be picked up"
   - SMS: "Maria is ready for pickup"
4. Open app → See notification badge
5. Click notification

### Step 6: Pick Up Child
**Option A: Scan Teacher's QR**
1. Click **"Scan Teacher's QR Code"**
2. Camera opens
3. Scan QR code displayed by teacher
4. ✅ **Child released** → Receive confirmation

**Option B: Show Your Code**
1. Click **"Receive Pickup Code"**
2. See QR code + OTP on screen
3. Show QR code OR tell teacher OTP
4. Teacher verifies
5. ✅ **Child released** → Receive confirmation

### Step 7: View Attendance
1. Click on child card
2. Click **"View Attendance"**
3. See:
   - Statistics (sessions attended)
   - History table (dates, times, status)
   - Check-in/check-out times

---

## 👨‍🎓 TEEN USER JOURNEY

### Step 1: Login
1. Go to `/login`
2. Enter credentials:
   - **Email:** `teen@rkids.church`
   - **Password:** (set during first login)
3. Enter OTP code
4. ✅ **Logged in** → Redirected to `/teen`

### Step 2: View Own Attendance
1. Dashboard shows:
   - Attendance summary
   - Recent attendance history
   - Check-in times
2. View statistics:
   - Sessions attended
   - Attendance percentage
   - Last check-in date

### Step 3: Receive Updates
1. Receive ministry updates (notifications)
2. View updates on dashboard
3. See announcements and events

---

## 🔄 COMPLETE SUNDAY SERVICE FLOW

### Before Service (15 minutes before)
1. **System sends** class start reminder to parents
2. **Parents** receive notification: "Class is about to start!"

### During Service
1. **Parents** arrive with children
2. **Teachers** check in children (QR or OTP)
3. **System records** check-in time
4. **Parents** receive confirmation: "Maria checked in at 9:15 AM"

### End of Service
1. **Teachers** send pickup notification
2. **Parents** receive: "Maria is ready to be picked up"
3. **Parents** arrive at pickup area
4. **Teachers** verify pickup (QR/OTP + photo confirmation)
5. **System records** check-out time
6. **Parents** receive confirmation: "Maria picked up by [Guardian] at 11:30 AM"

---

## 🔐 AUTHENTICATION FLOW

### First-Time User (Created by Admin)
1. Admin creates user → Status: `pending_password`
2. User tries to login → **Redirected to `/set-password`**
3. User sets password → Status: `active`
4. User proceeds to MFA → **Logged in**

### Returning User
1. User goes to `/login`
2. Enters email + password
3. Receives OTP code
4. Enters OTP
5. ✅ **Logged in**

### Session Management
- **Auto-logout:** After 15 minutes of inactivity
- **Warning:** Shows 1 minute before logout
- **Activity resets timer:** Mouse, keyboard, scroll, touch, click

---

## 📱 KEY FEATURES BY ROLE

### Admin
- ✅ Create users (teachers, teens, parents)
- ✅ Approve children and assign groups
- ✅ Assign teachers to groups
- ✅ View all children and guardians
- ✅ Track check-ins/check-outs
- ✅ View reports (children + teens)
- ✅ Manage guardians
- ✅ Audit logs

### Teacher
- ✅ View assigned group
- ✅ Check-in children (QR/OTP)
- ✅ Send pickup notifications
- ✅ Verify pickup (photo + OTP)
- ✅ Check-out children
- ✅ View attendance

### Parent
- ✅ Add children (with guardians)
- ✅ Pre-check-in (generate QR)
- ✅ View children status
- ✅ Receive notifications
- ✅ Pick up children (QR/OTP)
- ✅ View attendance

### Teen
- ✅ View own attendance
- ✅ Receive ministry updates
- ✅ Check-in status

---

## 🎯 Quick Test Flow

### Test Admin Creating User:
1. Login as admin: `admin@rkids.church` / `password123`
2. Go to "Manage Users" → "Teachers" tab
3. Click "+ Add User"
4. Create: `testteacher@rkids.church`
5. ✅ User created with `pending_password` status

### Test New User Login:
1. Logout
2. Try to login as: `testteacher@rkids.church` / `anypassword`
3. ✅ Redirected to `/set-password`
4. Set password: `TestPass123`
5. ✅ Proceeds to MFA → Logged in

---

This is the complete user journey for all roles in the R-KIDS Ministry Management System! 🎉


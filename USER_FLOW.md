# R KIDS Ministry - User Flow

## 🎯 Overview
Complete user flow documentation for Admin, Teacher, and Parent roles.

---

## 🏠 Landing Page Flow

```
Landing Page (/)
├── Click "Parent Login" → Login Page (role=parent)
├── Click "Teacher Login" → Login Page (role=teacher)
├── Click "Admin Login" → Login Page (role=admin)
└── Click Role Card → Login Page (role=selected)
```

---

## 🔐 Authentication Flow

```
Login Page (/login)
├── Enter Email: [role]@rkids.church
├── Enter Password: password123
├── Click "Sign in"
└── MFA Verification Page
    ├── Enter Code: 123456
    ├── Click "Verify"
    └── Redirect to Dashboard
        ├── Admin → /admin
        ├── Teacher → /teacher
        ├── Parent → /parent
        └── Teen → /teen
```

---

## 👨‍💼 ADMIN USER FLOW

### Main Dashboard
```
Admin Dashboard (/admin)
├── Create Parent → /admin/create-parent
├── Pending Approvals → /admin/pending-approvals
├── Manage Guardians → /admin/guardians
├── Groups → /admin/groups
├── Reports → /admin/reports
└── Audit Log → /admin/audit-log
```

### Create Parent Flow
```
/admin/create-parent
├── Fill Form (Name, Email, Phone, Address)
├── Click "Create Parent"
└── Success → Back to Dashboard
```

### Pending Approvals Flow
```
/admin/pending-approvals
├── View Pending Children
├── Click "Approve" → Child Approved
├── Click "Reject" → Enter Reason → Child Rejected
└── Both → Notification Sent to Parent
```

### Manage Guardians Flow
```
/admin/guardians
├── Search Child/Guardian
├── Add Guardian → Fill Form → Set Expiry
├── Renew Guardian → Extend 90 Days
└── Remove Guardian → Confirm
```

---

## 👨‍🏫 TEACHER USER FLOW

### Main Dashboard
```
Teacher Dashboard (/teacher)
├── Select Group (Little Angels, Saints, Disciples, Trendsetters)
├── Scan QR Code → /teacher/checkin
├── Manual Check-In → /teacher/manual-checkin
└── Add Child to Group → /teacher/add-child
```

### Check-In Flow (QR Code)
```
/teacher/checkin
├── Camera Opens
├── Scan Parent's QR Code
├── View Child Details (Photo, Name, ID, Guardians)
├── Click "Confirm Check-In"
└── Child Checked In → Parent Notified
```

### Manual Check-In Flow
```
/teacher/manual-checkin
├── Enter Parent ID (e.g., RS073)
├── Click "Send OTP"
├── Parent Provides OTP
├── Enter OTP → Verify
└── Proceed to Guardian Authorization
```

### Send Pickup Notification Flow
```
Teacher Dashboard → Find Child → Send Pickup Notification
├── /teacher/send-pickup/:childId
├── System Generates:
│   ├── Teacher QR Code (for parent to scan)
│   └── Parent QR Code + OTP (for parent to show)
├── Notification Sent (Email + SMS)
└── Teacher Sees Pickup Codes
```

### Verify Pickup & Check-Out Flow
```
Parent Arrives → Shows Code OR Scans Teacher's QR
├── Teacher Verifies Code
├── Select Guardian from List
├── System Sends OTP to Guardian
├── Guardian Provides OTP
├── Teacher Verifies OTP
├── Click "Confirm Release"
└── Child Checked Out → Parent Notified
```

---

## 👨‍👩‍👧 PARENT USER FLOW

### Main Dashboard
```
Parent Dashboard (/parent)
├── View Children List
├── Notifications → /parent/notifications
└── Add Child → /parent/add-child
```

### Add Child Flow
```
/parent/add-child
├── Fill Form:
│   ├── Child Name, DOB, Gender
│   ├── Select Group
│   ├── Upload Photo (optional)
│   └── Medical Info (allergies, medications, special needs)
├── Click "Submit for Approval"
└── Status: Pending → Admin Reviews
```

### Pre-Check-In Flow
```
Parent Dashboard → Child Card → Pre-Check-In
├── Click "Pre-Check-In" Button
├── QR Code Generated
├── QR Code Displayed on Screen
├── QR Code Sent via Email + SMS
├── QR Code Valid for 15 Minutes
└── Parent Ready to Show QR at Church
```

### At Church - Check-In Flow
```
Parent Arrives at Church
├── Show QR Code to Teacher
├── Teacher Scans QR Code
├── Child Checked In
└── Parent Receives Confirmation:
    ├── Email: "Maria checked in at 9:15 AM"
    └── SMS: "Maria checked in successfully"
```

### Receive Pickup Notification Flow
```
Service Ends → Teacher Sends Notification
├── Parent Receives Notification (Email + SMS)
├── "Maria is ready to be picked up"
├── Open App → See Notification Badge
├── Click Notification → /parent/notifications
└── See "Ready for Pickup" Alert
```

### Pick Up Child Flow (Option 1: Scan Teacher's QR)
```
/parent/notifications → Pick Up Now
├── Choose "Scan Teacher's QR Code"
├── Camera Opens
├── Scan QR Code Displayed by Teacher
├── System Verifies
└── Child Released → Confirmation Sent
```

### Pick Up Child Flow (Option 2: Show Your Code)
```
/parent/notifications → Pick Up Now
├── Choose "Receive Pickup Code"
├── See QR Code + OTP on Screen
├── Show QR Code OR Tell Teacher OTP
├── Teacher Verifies
└── Child Released → Confirmation Sent
```

### View Attendance Flow
```
Parent Dashboard → Child Card → Attendance
├── /parent/attendance
├── View Statistics (Sessions Attended)
├── View History Table (Dates, Times)
└── See Status (Present/Absent)
```

### View Child Profile Flow
```
Parent Dashboard → Child Card → View Profile
├── /parent/child/:childId
├── See Child Photo and Basic Info
├── Registration ID
├── Group and Age
├── Authorized Guardians List
├── Medical Information
└── Emergency Contacts
```

---

## 🔄 COMPLETE SUNDAY SERVICE FLOW

### Morning Flow (8:45 AM - 9:15 AM)
```
1. Parent at Home
   └── Pre-Check-In → Generate QR Code

2. Parent Arrives at Church (9:00 AM)
   └── Show QR → Teacher Scans → Child Checked In

3. During Service (9:00 AM - 11:00 AM)
   └── Child Participates → Status: "Checked In"
```

### Afternoon Flow (11:00 AM - 11:30 AM)
```
4. Service Ending (11:00 AM)
   └── Teacher Sends Pickup Notification

5. Parent Receives Notification (11:00 AM)
   └── "Maria is ready to be picked up"

6. Parent Arrives at Pickup (11:15 AM)
   ├── Option A: Scan Teacher's QR Code
   └── Option B: Show Pickup Code/OTP

7. Teacher Verifies & Releases (11:15 AM)
   └── Child Checked Out → Confirmation Sent
```

---

## 📱 Navigation Flow

### Header Navigation (All Roles)
```
Header
├── Logo: R KIDS
├── Role Badge (Admin/Teacher/Parent/Teen)
├── User Name & Email (Desktop)
└── Sign Out Button
```

### Mobile Navigation (Parent)
```
Mobile Nav (Bottom)
├── Dashboard
├── Notifications
├── Add Child
└── Settings
```

---

## 🔔 Notification Flow

### Notification Types
```
1. Child Approved
   └── Parent receives: "Your child [name] has been approved"

2. Child Rejected
   └── Parent receives: "Your child [name] was rejected. Reason: [reason]"

3. Check-In Confirmation
   └── Parent receives: "[Child] checked in at [time]"

4. Pickup Notification
   └── Parent receives: "[Child] is ready to be picked up"

5. Check-Out Confirmation
   └── Parent receives: "[Child] released to [guardian] at [time]"
```

### Notification Access
```
All Roles
├── Notification Badge (Header) → /parent/notifications
├── View All Notifications
├── Click Notification → Action Page
└── Mark as Read
```

---

## 🎯 Key User Paths Summary

### Admin Paths
- **Create Parent** → Fill Form → Submit → Success
- **Approve Child** → Review → Approve/Reject → Notify Parent
- **View Reports** → Select Period → View Charts → Export

### Teacher Paths
- **Check-In** → Scan QR → Verify → Confirm
- **Send Pickup** → Select Child → Generate Codes → Notify Parent
- **Verify Pickup** → Verify Code → Select Guardian → Verify OTP → Release

### Parent Paths
- **Add Child** → Fill Form → Submit → Wait for Approval
- **Pre-Check-In** → Generate QR → Show at Church
- **Pick Up** → Receive Notification → Scan/Show Code → Child Released

---

*This flow covers all main user journeys in the R KIDS Ministry Management System.*


# R-KIDS Ministry - Complete User Case Flow

## From Parent Adding Child → Check-In → Check-Out

This document outlines the complete user journey and technical flow for the R-KIDS Ministry management system.

---

## 🎯 Overview

**Parties Involved:**
1. **Parent** - Registers and manages their children
2. **Child** - The participant in the ministry
3. **Admin** - Approves children and manages the system
4. **Teacher** - Performs check-in/check-out operations
5. **Secondary Guardians** - Authorized pickup persons (optional)

---

## 📋 Phase 1: Parent Adds Child/Children

### **User Story:**
"As a parent, I want to register my child(ren) so they can participate in R-KIDS Ministry programs."

### **Flow:**

#### Step 1.1: Parent Access
- **Role:** Parent
- **Entry Point:** Parent Dashboard → "Add Child" button
- **Route:** `/parent/add-child`
- **Component:** `src/pages/parent/AddChild.tsx`
- **Status:** ✅ **IMPLEMENTED**

#### Step 1.2: Parent Fills Child Information
Parent provides:
- Child's Full Name
- Date of Birth (to calculate age automatically)
- Gender
- Photo (optional)
- Guardian relationship (if adding themselves as guardian)

#### Step 1.3: System Processing
- **Backend:** `POST /api/guardians` (creates guardian record)
- **Backend:** `POST /api/children` (creates child record)
- **Auto-assignment:**
  - Age is calculated from date of birth
  - Child is automatically assigned to appropriate group:
    - **Little Angels:** 3-5 years
    - **Saints:** 6-9 years
    - **Disciples:** 10-12 years
    - **Trendsetters:** 13-19 years
- **Registration ID:** Auto-generated (e.g., `RS073/01`)
- **Status:** Set to `pending` awaiting admin approval

#### Step 1.4: Database Storage
- **Guardian Record:** Stored in `guardians` table
- **Child Record:** Stored in `children` table with:
  - `parent_id` (guardian_id)
  - `group_id` (auto-assigned based on age)
  - `status: 'pending'`

**Status:** ✅ **IMPLEMENTED**

---

## 📋 Phase 2: Admin Approval

### **User Story:**
"As an admin, I want to review and approve children registered by parents before they can participate."

### **Flow:**

#### Step 2.1: Admin Reviews Pending Children
- **Role:** Admin
- **Entry Point:** Admin Dashboard → "Pending Approvals"
- **Route:** `/admin/pending-approvals`
- **Component:** `src/pages/admin/PendingApprovals.tsx`
- **Status:** ✅ **IMPLEMENTED**

#### Step 2.2: Admin Approves Child
- Admin reviews child information
- Clicks "Approve" button
- **Backend:** `POST /api/children/<child_id>/approve`
- **System Action:**
  - Child status changes from `pending` → `active`
  - Child is confirmed in assigned group
  - Parent receives notification (if implemented)
- **Database:** `children.status = 'active'`

**Status:** ✅ **IMPLEMENTED**

---

## 📋 Phase 3: Child Arrives at Church/Event - Check-In

### **User Story:**
"When a child arrives at church or an event, the teacher checks them in using QR code or manual entry."

### **Flow:**

#### Option A: Pre-Check-In (Parent Prepares Ahead)

##### Step 3A.1: Parent Generates QR Code
- **Role:** Parent
- **Action:** Parent clicks "Pre-Check-In" on child's card
- **Component:** `src/pages/parent/ParentDashboard.tsx`
- **Backend:** `POST /api/check-in/generate-qr`
- **Response:** QR code with 15-minute validity
- **UI:** Modal displays QR code
- **Status:** ✅ **IMPLEMENTED**

##### Step 3A.2: Parent Shows QR at Church
- Parent arrives at church/event
- Shows QR code on phone to teacher
- Teacher scans QR code

#### Option B: On-Site Check-In

##### Step 3B.1: Teacher Accesses Check-In
- **Role:** Teacher
- **Entry Point:** Teacher Dashboard → "Scan QR Code" or "Manual Check-In"
- **Routes:**
  - `/teacher/checkin` - QR Scanner
  - `/teacher/manual-checkin` - Manual entry
- **Components:**
  - `src/pages/teacher/CheckIn.tsx`
  - `src/pages/teacher/ManualCheckIn.tsx`
- **Status:** ✅ **IMPLEMENTED**

##### Step 3B.2: Teacher Scans QR Code
- Teacher opens QR scanner
- Scans parent's QR code (from pre-check-in)
- OR scans child's registration ID QR code
- **Backend:** `POST /api/check-in/verify-qr`
- **System Validates:**
  - QR code is valid
  - Child is approved (status = 'active')
  - Child is assigned to teacher's group

##### Step 3B.3: Manual Check-In (Alternative)
- Teacher selects group
- Searches for child by name or registration ID
- Selects child from list
- Clicks "Check In"
- **Backend:** `POST /api/check-in/manual`

##### Step 3B.4: Check-In Record Created
- **Backend:** `POST /api/check-in`
- **Database:** Record created in `check_in_records` table:
  ```sql
  - record_id (UUID)
  - church_id
  - child_id
  - guardian_id (parent who checked in)
  - teacher_id
  - timestamp_in (current timestamp)
  - method ('QR' or 'OTP')
  - check_in_photo_url (optional)
  - status: 'checked_in'
  ```
- **Notifications:**
  - Parent receives notification: "Your child [Name] has been checked in"
  - Notification stored in `notifications` table
  - **Status:** ⚠️ **NOTIFICATION PARTIALLY IMPLEMENTED**

**Status:** ✅ **CHECK-IN IMPLEMENTED**

---

## 📋 Phase 4: Child During Session

### **User Story:**
"While the child is in session, parents and teachers can monitor status and attendance is tracked."

### **Flow:**

#### Step 4.1: Attendance Tracking
- **Role:** Teacher/System
- **Action:** Attendance automatically tracked via check-in records
- **Database:** `attendance_summary` table updated per session
- **Status:** ✅ **IMPLEMENTED**

#### Step 4.2: Real-Time Status
- **Parent Dashboard:** Shows child status:
  - "Checked In" - Child is in session
  - "Ready for Pickup" - Session ending soon
  - "Checked Out" - Already picked up
- **Teacher Dashboard:** Shows all checked-in children for their groups
- **Status:** ✅ **IMPLEMENTED**

---

## 📋 Phase 5: Session Ending - Preparing for Pickup

### **User Story:**
"When session is ending, teachers mark children as ready for pickup and notify parents."

### **Flow:**

#### Step 5.1: Teacher Marks Child Ready for Pickup
- **Role:** Teacher
- **Action:** Teacher clicks "Ready for Pickup" on child's record
- **Component:** `src/pages/teacher/TeacherDashboard.tsx` or dedicated pickup page
- **Backend:** `POST /api/check-out/prepare`
- **System Action:**
  - Child status changes: `checked_in` → `ready_for_pickup`
  - Parent receives notification: "Your child [Name] is ready for pickup"
  - Notification stored in `notifications` table
- **Status:** ⚠️ **PARTIALLY IMPLEMENTED** (Notification component exists)

#### Step 5.2: Parent Receives Notification
- **Parent Dashboard:** Shows notification badge
- **Notifications Page:** Parent can view all notifications
- **Component:** `src/pages/parent/Notifications.tsx`
- **Component:** `src/components/Header.tsx` (notification dropdown)
- **Status:** ✅ **NOTIFICATION UI IMPLEMENTED**

---

## 📋 Phase 6: Parent/Guardian Arrives - Check-Out

### **User Story:**
"When parent or authorized guardian arrives, they verify identity and check the child out."

### **Flow:**

#### Option A: Primary Parent Check-Out

##### Step 6A.1: Parent Arrives at Pickup Point
- **Role:** Parent
- **Action:** Parent approaches pickup area

##### Step 6A.2: Teacher Initiates Check-Out
- **Role:** Teacher
- **Action:** Teacher selects child and clicks "Check Out" or "Verify Pickup"
- **Component:** `src/pages/teacher/SendPickupNotification.tsx`
- **Backend:** `POST /api/checkout/send-notification`
- **System Generates:**
  - Teacher QR code (for verification)
  - Parent QR code (for pickup)
  - OTP code (alternative verification method)

##### Step 6A.3: Identity Verification
- **Method 1: QR Code**
  - Parent shows QR code from notification
  - Teacher scans QR code
  - **Backend:** `POST /api/checkout/verify-pickup`
  - System verifies QR code validity

- **Method 2: OTP Code**
  - Parent receives OTP code via SMS/Email
  - Parent provides OTP to teacher
  - Teacher enters OTP
  - **Backend:** `POST /api/checkout/verify-pickup`
  - System verifies OTP code

- **Method 3: Photo Verification** (if implemented)
  - Teacher compares parent's photo with stored guardian photo
  - Manual verification

##### Step 6A.4: Check-Out Confirmed
- **Backend:** `POST /api/checkout/complete`
- **Database:** `check_in_records` table updated:
  ```sql
  - timestamp_out (current timestamp)
  - check_out_photo_url (optional)
  - status: 'checked_out'
  ```
- **Notifications:**
  - Parent receives confirmation: "You have successfully picked up [Child Name]"
  - All guardians receive notification (if multiple)

**Status:** ✅ **CHECK-OUT IMPLEMENTED**

#### Option B: Secondary Guardian Check-Out

##### Step 6B.1: Guardian Authorization Setup
- **Role:** Parent
- **Action:** Parent adds secondary guardian (e.g., spouse, relative, nanny)
- **Component:** Guardian management (to be implemented)
- **Database:** `child_guardians` table:
  ```sql
  - child_guardian_id
  - child_id
  - guardian_id
  - relationship ('Mom', 'Dad', 'Auntie', 'Uncle', 'Cousin', 'Brother', 'Maid', 'Driver', etc.)
  - is_authorized (true/false)
  - expires_at (optional expiration)
  ```

##### Step 6B.2: Teacher Verifies Authorization
- **Role:** Teacher
- **Action:** Before check-out, teacher checks if guardian is authorized
- **Backend:** `GET /api/children/<child_id>/guardians`
- **System Checks:**
  - Guardian is in authorized list
  - Authorization hasn't expired
  - Relationship matches

##### Step 6B.3: Guardian Identity Verification
- Same verification process as primary parent (QR, OTP, or photo)
- **Backend:** `POST /api/checkout/verify-pickup`
- System verifies guardian is authorized

##### Step 6B.4: Check-Out Record
- **Database:** `check_in_records` table:
  ```sql
  - guardian_id (secondary guardian's ID)
  - relationship (e.g., 'Auntie', 'Cousin')
  ```

**Status:** ⚠️ **GUARDIAN AUTHORIZATION PARTIALLY IMPLEMENTED**
- Database schema supports it
- Teacher authorization page exists: `src/pages/teacher/GuardianAuthorize.tsx`
- Full flow needs completion

---

## 📋 Phase 7: Post Check-Out

### **User Story:**
"After check-out, attendance is recorded, notifications sent, and records updated."

### **Flow:**

#### Step 7.1: Attendance Summary Updated
- **Database:** `attendance_summary` table updated:
  ```sql
  - group_id
  - date
  - present_count (incremented)
  - present children list
  ```
- **Status:** ✅ **IMPLEMENTED**

#### Step 7.2: Analytics Updated
- **Teacher Dashboard:** Shows updated attendance stats
- **Admin Dashboard:** Shows overall attendance analytics
- **Parent Dashboard:** Shows child's attendance progress
- **Status:** ✅ **IMPLEMENTED**

#### Step 7.3: Audit Log
- All check-in/check-out actions logged
- **Database:** `audit_logs` table
- **Backend:** `log_activity()` function called
- **Status:** ✅ **IMPLEMENTED**

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: PARENT ADDS CHILD                                  │
├─────────────────────────────────────────────────────────────┤
│ Parent → Add Child Form → Submit                            │
│   ↓                                                         │
│ System → Auto-assign Group → Create Guardian → Create Child │
│   ↓                                                         │
│ Status: PENDING                                             │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: ADMIN APPROVAL                                     │
├─────────────────────────────────────────────────────────────┤
│ Admin → Review Pending → Approve Child                      │
│   ↓                                                         │
│ System → Update Status: ACTIVE → Notify Parent              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: CHECK-IN (Child Arrives)                           │
├─────────────────────────────────────────────────────────────┤
│ Option A: Pre-Check-In                                      │
│   Parent → Generate QR → Show at Church                     │
│                                                             │
│ Option B: On-Site Check-In                                  │
│   Teacher → Scan QR / Manual Entry                          │
│   ↓                                                         │
│ System → Validate → Create Check-In Record                  │
│   ↓                                                         │
│ Status: CHECKED_IN → Notify Parent                          │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: DURING SESSION                                     │
├─────────────────────────────────────────────────────────────┤
│ System → Track Attendance → Update Dashboard                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: READY FOR PICKUP                                   │
├─────────────────────────────────────────────────────────────┤
│ Teacher → Mark Ready for Pickup                             │
│   ↓                                                         │
│ System → Status: READY_FOR_PICKUP → Notify Parent           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 6: CHECK-OUT (Parent/Guardian Arrives)                │
├─────────────────────────────────────────────────────────────┤
│ Parent/Guardian → Arrive at Pickup                          │
│   ↓                                                         │
│ Teacher → Generate Pickup QR/OTP → Verify Identity          │
│   ↓                                                         │
│ System → Verify → Update Check-Out Record                   │
│   ↓                                                         │
│ Status: CHECKED_OUT → Notify Parent                         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 7: POST CHECK-OUT                                     │
├─────────────────────────────────────────────────────────────┤
│ System → Update Attendance Summary → Update Analytics       │
│   ↓                                                         │
│ Log Activity → Send Final Notifications                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Implementation Status by Phase

| Phase | Component | Status | Notes |
|-------|-----------|--------|-------|
| **1. Add Child** | Parent Form | ✅ Complete | Auto-group assignment working |
| | Guardian Creation | ✅ Complete | |
| | Child Creation | ✅ Complete | |
| **2. Admin Approval** | Review Interface | ✅ Complete | |
| | Approval Endpoint | ✅ Complete | |
| | Notification | ⚠️ Partial | UI exists, backend needs completion |
| **3. Check-In** | Pre-Check-In QR | ✅ Complete | 15-min validity |
| | QR Scanner | ✅ Complete | |
| | Manual Check-In | ✅ Complete | |
| | Check-In Record | ✅ Complete | |
| **4. During Session** | Attendance Tracking | ✅ Complete | |
| | Status Display | ✅ Complete | |
| **5. Ready for Pickup** | Mark Ready | ⚠️ Partial | Component exists, needs integration |
| | Notification | ⚠️ Partial | UI exists, backend needs completion |
| **6. Check-Out** | Pickup QR/OTP | ✅ Complete | |
| | Identity Verification | ✅ Complete | |
| | Check-Out Record | ✅ Complete | |
| | Guardian Authorization | ⚠️ Partial | Schema ready, UI partial |
| **7. Post Check-Out** | Attendance Summary | ✅ Complete | |
| | Analytics Update | ✅ Complete | |
| | Audit Log | ✅ Complete | |

---

## 🔐 Security & Authorization

### **Authentication Required:**
- ✅ All endpoints require authentication token
- ✅ Role-based access control (RBAC) implemented

### **Authorization Checks:**
- ✅ Parents can only see/manage their own children
- ✅ Teachers can only check-in children in their assigned groups
- ✅ Admins have full access
- ✅ Secondary guardian authorization checked before check-out

---

## 📱 Notifications System

### **Notification Types:**
1. **Check-In Notification** - "Your child has been checked in"
2. **Ready for Pickup** - "Your child is ready for pickup"
3. **Check-Out Confirmation** - "You have successfully picked up [Child]"
4. **Approval Status** - "Your child has been approved"

### **Notification Channels:**
- ✅ In-App Notifications (Header dropdown)
- ⚠️ Email Notifications (Backend ready, needs configuration)
- ⚠️ SMS Notifications (Backend ready, needs configuration)

---

## 📝 Key Backend Endpoints

### **Child Management:**
- `POST /api/guardians` - Create guardian (parent)
- `POST /api/children` - Create child
- `GET /api/children?parent_id=<id>` - List parent's children
- `POST /api/children/<id>/approve` - Approve child

### **Check-In:**
- `POST /api/check-in/generate-qr` - Generate pre-check-in QR
- `POST /api/check-in/verify-qr` - Verify QR code
- `POST /api/check-in/manual` - Manual check-in
- `POST /api/check-in` - Create check-in record

### **Check-Out:**
- `POST /api/checkout/send-notification` - Send pickup notification
- `POST /api/checkout/verify-pickup` - Verify pickup identity
- `POST /api/checkout/complete` - Complete check-out

### **Guardians:**
- `GET /api/children/<id>/guardians` - List authorized guardians
- `POST /api/guardians/authorize` - Authorize secondary guardian

---

## 🎯 Next Steps for Full Implementation

1. **Complete Notification System**
   - Integrate email/SMS sending
   - Test notification delivery

2. **Complete Guardian Authorization UI**
   - Add guardian form for parents
   - Complete authorization flow

3. **Ready for Pickup Integration**
   - Connect "Ready for Pickup" button to notification system
   - Update status properly

4. **Photo Verification**
   - Add photo upload during guardian creation
   - Implement photo comparison UI

5. **Session Management**
   - Link check-in/check-out to specific sessions
   - Track attendance per session

---

## 📚 Related Files

### **Frontend Components:**
- `src/pages/parent/AddChild.tsx`
- `src/pages/parent/ParentDashboard.tsx`
- `src/pages/admin/PendingApprovals.tsx`
- `src/pages/teacher/CheckIn.tsx`
- `src/pages/teacher/ManualCheckIn.tsx`
- `src/pages/teacher/SendPickupNotification.tsx`
- `src/pages/teacher/GuardianAuthorize.tsx`

### **Backend Endpoints:**
- `backend/app.py` - Main Flask application
- Check-in endpoints: Lines ~600-800
- Check-out endpoints: Lines ~800-1000
- Child endpoints: Lines ~400-600

### **Database Tables:**
- `guardians` - Parent/guardian records
- `children` - Child records
- `check_in_records` - Check-in/out history
- `attendance_summary` - Daily attendance stats
- `notifications` - Notification records
- `child_guardians` - Secondary guardian relationships

---

**Document Version:** 1.0  
**Last Updated:** Current Date  
**Status:** Comprehensive flow documented, most features implemented ✅


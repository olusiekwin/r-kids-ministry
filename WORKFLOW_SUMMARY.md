# R-KIDS Ministry - Complete Workflow Summary

## 🔄 Complete Registration & Check-In/Check-Out Flow

### 1. PARENT REGISTRATION FLOW

#### Step 1: Parent Adds Child + Guardians
- **Page:** `/parent/add-child`
- **What Parent Does:**
  1. Fills child information (name, DOB, gender, medical info)
  2. Uploads child photo (optional)
  3. Adds **Primary Guardians** (max 2):
     - Name, Email, Phone required
     - These are the parents/primary caregivers
  4. Adds **Secondary Guardians** (max 2, optional):
     - Name, Phone, Relationship required
     - Email optional
     - Auto-expires in 90 days
  5. Submits for approval
- **System Action:**
  - Child status: `pending`
  - Admin notified
  - Parent ID format: `RS073` (system-generated)
  - Child ID format: `RS073/01`, `RS073/02` (assigned on approval)

#### Step 2: Admin Approves & Assigns
- **Page:** `/admin/pending-approvals`
- **What Admin Does:**
  1. Reviews child details and guardians
  2. **Assigns child to group** (required before approval)
  3. Clicks "Approve & Assign Group"
- **System Action:**
  - Child status: `active`
  - Registration ID assigned (e.g., `RS073/01`)
  - Child assigned to selected group
  - Parent notified of approval

#### Step 3: Admin Assigns Teacher to Group
- **Page:** `/admin/groups`
- **What Admin Does:**
  1. Views all groups
  2. Selects a group
  3. Assigns teacher from dropdown
- **System Action:**
  - Teacher assigned to group
  - Teacher can now manage that group

---

### 2. CHECK-IN FLOW (Sunday Service)

#### Step 1: Class Start Notification
- **System Action:**
  - Sends notification to parents (Email + SMS)
  - "Class is about to start! Please check in your child."
  - Sent 15 minutes before class time

#### Step 2: Parent Pre-Check-In (Optional)
- **Page:** `/parent` → Child Card → "Pre-Check-In"
- **What Parent Does:**
  1. Clicks "Pre-Check-In" button
  2. QR code generated (valid 15 minutes)
  3. QR code sent via Email + SMS
- **System Action:**
  - QR code generated with child ID, parent ID, timestamp
  - Expires in 15 minutes

#### Step 3: At Church - Check-In
- **Method A: QR Code Scan**
  - Teacher scans parent's QR code
  - System verifies and checks in child
  - Parent receives confirmation (Email + SMS)

- **Method B: OTP Verification**
  - Teacher enters Parent ID (e.g., `RS073`)
  - System sends OTP to parent
  - Parent provides OTP verbally
  - Teacher enters OTP → Child checked in

- **System Action:**
  - Check-in time recorded
  - Attendance marked
  - Parent notified: "Maria checked in at 9:15 AM"

---

### 3. CHECK-OUT FLOW (End of Service)

#### Step 1: Pickup Notification
- **Page:** `/teacher/send-pickup/:childId`
- **What Teacher Does:**
  1. Service ends
  2. Finds child in checked-in list
  3. Clicks "Send Pickup Notification"
- **System Action:**
  - Generates Teacher QR code (for parent to scan)
  - Generates Parent QR code + OTP (for parent to show)
  - Sends notification to parent (Email + SMS):
    - "Maria is ready to be picked up"
  - Child status: `ready_for_pickup`

#### Step 2: Parent Arrives for Pickup
- **Method A: Scan Teacher's QR**
  - Parent scans teacher's QR code displayed on teacher's device
  - System verifies → Proceeds to guardian verification

- **Method B: Show Parent Code**
  - Parent shows QR code OR tells teacher OTP
  - Teacher verifies code → Proceeds to guardian verification

#### Step 3: Guardian Verification & Photo Confirmation
- **Page:** `/teacher/authorize/:childId`
- **What Teacher Does:**
  1. System displays authorized guardians list
  2. Teacher selects guardian from list
  3. **Reviews guardian photo** (required)
  4. Checks "I confirm this is the authorized guardian"
  5. System sends OTP to guardian's phone/email
  6. Guardian provides OTP
  7. Teacher enters OTP
  8. Clicks "Verify & Release"
- **System Action:**
  - OTP verified
  - **Photo confirmation required** ✅
  - Check-out time recorded
  - Child status: `checked_out`
  - Parent notified: "Maria picked up by [Guardian Name] at 11:30 AM"

---

### 4. NOTIFICATION SYSTEM

#### Automated Notifications:
1. **Class Start Reminder** (15 min before)
   - Email + SMS
   - "Class is about to start! Please check in your child."

2. **Check-In Confirmation**
   - Email + SMS
   - "Maria checked in at 9:15 AM"

3. **Pickup Notification**
   - Email + SMS
   - "Maria is ready to be picked up"

4. **Check-Out Confirmation**
   - Email + SMS
   - "Maria picked up by [Guardian Name] at 11:30 AM"

5. **Weekly Reminders**
   - Sent every week
   - "Don't forget to bring your children to church this Sunday!"

6. **Birthday Wishes**
   - Sent on child's date of birth
   - "Happy Birthday [Child Name]!"

---

### 5. ADMIN TRACKING CAPABILITIES

#### View All Children
- **Page:** `/admin/children`
- Shows all children added by parents
- Filter by status (active/pending/rejected), group
- View guardians count per child

#### Track Check-Ins & Check-Outs
- **Page:** `/admin/check-ins`
- View children received (checked in)
- View children yet to be picked up (checked in but not checked out)
- Filter by date and group
- See check-in/check-out timestamps

#### View Teen Attendance
- **Page:** `/admin/reports` → "Teen Attendance" tab
- View attendance for Trendsetters group (ages 13-19)
- See check-in/check-out times
- Track attendance patterns

---

### 6. ID FORMAT

- **Parent ID:** `RS073` (system-generated, unique per parent)
- **Child ID:** `RS073/01`, `RS073/02`, etc. (based on parent ID + sequential number)
- Format: `{ParentID}/{ChildNumber}`

---

### 7. SECURITY FEATURES

- ✅ QR codes expire in 15 minutes
- ✅ OTP required for check-in/out (unless admin MFA override)
- ✅ **Photo confirmation required at pickup**
- ✅ Guardian authorization list verification
- ✅ OTP sent to guardian's registered phone/email
- ✅ All transmissions encrypted

---

### 8. GUARDIAN RULES

- **Primary Guardians:** Max 2, no expiry
- **Secondary Guardians:** Max 2, expires in 90 days
- Secondary guardians can be renewed by admin upon parent request
- All guardians can receive QR codes and OTPs for pickup

---

This workflow ensures:
- ✅ Parents add children AND guardians in one flow
- ✅ Admin assigns children to groups (no auto-assignment)
- ✅ Admin assigns teachers to groups
- ✅ Notifications sent for class start and pickup
- ✅ Photo confirmation required at pickup
- ✅ Complete tracking of check-in/check-out times
- ✅ Teen attendance tracking


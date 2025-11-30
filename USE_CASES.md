# R KIDS Ministry - Use Cases

Complete use case documentation for all user roles.

---

## 👨‍💼 ADMIN USE CASES

### UC-ADMIN-001: Approve New Child Registration

**Actor:** Administrator  
**Goal:** Review and approve child registration requests from parents or teachers

**Preconditions:**
- Admin is logged in
- Child registration request exists with status "pending"

**Main Flow:**
1. Admin navigates to Dashboard
2. Admin sees "Pending Approvals" badge with count
3. Admin clicks "Pending Approvals"
4. System displays list of pending children
5. Admin reviews child details:
   - Name, age, date of birth, gender
   - Group assignment
   - Medical information (allergies, medications, special needs)
   - Submitted by (parent/teacher)
   - Submission date
6. Admin clicks "Approve" button
7. System updates child status to "active"
8. System generates registration ID (e.g., RS073/01)
9. System sends notification to parent
10. System logs action in audit log

**Postconditions:**
- Child status is "active"
- Parent receives approval notification
- Child appears in parent's dashboard

**Alternative Flow (Reject):**
6a. Admin clicks "Reject" button
7a. Admin enters rejection reason
8a. System updates child status to "rejected"
9a. System sends rejection notification to parent with reason
10a. System logs action in audit log

---

### UC-ADMIN-002: Create Parent Account

**Actor:** Administrator  
**Goal:** Create a new parent account in the system

**Preconditions:**
- Admin is logged in

**Main Flow:**
1. Admin navigates to Dashboard
2. Admin clicks "Create Parent"
3. System displays parent creation form
4. Admin fills in:
   - Name
   - Email
   - Phone number
   - Address
   - Emergency contact
5. Admin clicks "Create Parent"
6. System validates form data
7. System generates Parent ID (e.g., RS073)
8. System creates parent account
9. System sends login credentials to parent via email
10. System displays success message

**Postconditions:**
- Parent account created
- Parent ID assigned
- Login credentials sent to parent

**Exception Flow:**
6a. Validation fails
7a. System displays error messages
8a. Admin corrects errors and resubmits

---

### UC-ADMIN-003: Manage Guardians

**Actor:** Administrator  
**Goal:** Add, update, or remove guardians for a child

**Preconditions:**
- Admin is logged in
- Child exists in system

**Main Flow:**
1. Admin navigates to "Manage Guardians"
2. Admin searches for child or guardian
3. System displays matching results
4. Admin selects child
5. System displays current guardians list with:
   - Name, relationship, status
   - Expiry dates
   - Photos
6. Admin performs action:
   - **Add:** Clicks "Add Guardian" → Fills form → Sets expiry → Saves
   - **Renew:** Clicks "Renew" → Extends by 90 days → Confirms
   - **Remove:** Clicks "Remove" → Confirms removal
7. System updates guardian list
8. System sends notification to affected parties
9. System logs action

**Postconditions:**
- Guardian list updated
- Notifications sent
- Audit log updated

---

### UC-ADMIN-004: View Attendance Reports

**Actor:** Administrator  
**Goal:** Generate and view attendance reports

**Preconditions:**
- Admin is logged in

**Main Flow:**
1. Admin navigates to "Reports"
2. Admin selects time period (Daily/Monthly/Quarterly/Annual)
3. Admin optionally filters by group
4. System generates report data
5. System displays:
   - Attendance charts
   - Gender distribution
   - Group statistics
   - Teacher performance metrics
6. Admin clicks "Export CSV" or "Export Excel"
7. System generates file and downloads

**Postconditions:**
- Report displayed
- Export file downloaded (if requested)

---

### UC-ADMIN-005: Review Audit Logs

**Actor:** Administrator  
**Goal:** Review system activity and security logs

**Preconditions:**
- Admin is logged in

**Main Flow:**
1. Admin navigates to "Audit Log"
2. Admin applies filters:
   - Action type (Login, Create, Update, Delete)
   - User
   - Date range
3. System displays filtered audit entries
4. Admin reviews entries with:
   - Timestamp
   - User
   - Action
   - Details
   - IP address
5. Admin optionally exports log

**Postconditions:**
- Audit log reviewed
- Export file downloaded (if requested)

---

## 👨‍🏫 TEACHER USE CASES

### UC-TEACHER-001: Check-In Child Using QR Code

**Actor:** Teacher  
**Goal:** Quickly check in a child using parent's QR code

**Preconditions:**
- Teacher is logged in
- Teacher has selected their group
- Parent has generated pre-check-in QR code

**Main Flow:**
1. Teacher navigates to "Scan QR" page
2. Teacher clicks "Start Camera"
3. System requests camera permission
4. Teacher grants permission
5. System opens camera view
6. Parent shows QR code
7. Teacher scans QR code
8. System validates QR code:
   - Checks expiration (< 15 minutes)
   - Verifies child ID
   - Verifies parent authorization
9. System displays child information:
   - Photo
   - Name and registration ID
   - Group
   - List of authorized guardians with photos
10. Teacher reviews information
11. Teacher clicks "Confirm Check-In"
12. System records check-in:
    - Timestamp
    - Method: "QR"
    - Teacher ID
13. System sends confirmation to parent (Email + SMS)
14. System updates child status to "checked_in"

**Postconditions:**
- Child checked in
- Parent notified
- Attendance recorded

**Exception Flow:**
8a. QR code expired
9a. System displays error: "QR code expired. Please generate a new one."
10a. Teacher asks parent to generate new QR code

8b. Invalid QR code
9b. System displays error: "Invalid QR code. Please try again."

---

### UC-TEACHER-002: Manual Check-In Using OTP

**Actor:** Teacher  
**Goal:** Check in child when parent doesn't have QR code

**Preconditions:**
- Teacher is logged in
- Parent is present at check-in area

**Main Flow:**
1. Teacher navigates to "Manual Check-In"
2. Teacher enters Parent ID (e.g., RS073)
3. Teacher clicks "Send OTP"
4. System generates OTP
5. System sends OTP to parent's phone/email
6. Parent provides OTP verbally
7. Teacher enters OTP
8. Teacher clicks "Verify"
9. System validates OTP
10. System displays child information
11. Teacher proceeds to guardian authorization
12. System records check-in with method "OTP"

**Postconditions:**
- Child checked in via OTP
- Attendance recorded

**Exception Flow:**
9a. OTP invalid or expired
10a. System displays error
11a. Teacher requests new OTP

---

### UC-TEACHER-003: Send Pickup Notification

**Actor:** Teacher  
**Goal:** Notify parent that child is ready for pickup

**Preconditions:**
- Teacher is logged in
- Child is checked in
- Service is ending

**Main Flow:**
1. Teacher navigates to Dashboard
2. Teacher finds child in checked-in list
3. Teacher clicks "Send Pickup Notification"
4. System generates:
   - Teacher QR code (for parent to scan)
   - Parent QR code + OTP (for parent to show)
5. System sends notification to parent:
   - Email: "Maria is ready to be picked up"
   - SMS: "Maria is ready for pickup. Please proceed to pickup area."
6. System displays pickup codes on teacher's screen
7. System updates child status to "ready_for_pickup"

**Postconditions:**
- Parent notified
- Pickup codes generated
- Child status updated

---

### UC-TEACHER-004: Verify Pickup and Check-Out Child

**Actor:** Teacher  
**Goal:** Safely release child to authorized guardian

**Preconditions:**
- Teacher is logged in
- Pickup notification sent
- Parent/guardian arrives at pickup area

**Main Flow:**
1. Parent arrives and shows pickup code OR scans teacher's QR code
2. Teacher verifies code matches
3. System displays authorized guardians list
4. Teacher selects guardian from list
5. System sends OTP to guardian's phone/email
6. Guardian provides OTP
7. Teacher enters OTP
8. Teacher clicks "Verify OTP"
9. System validates OTP
10. Teacher reviews guardian photo and information
11. Teacher clicks "Confirm Release"
12. System records check-out:
    - Timestamp
    - Guardian ID
    - Teacher ID
    - Method (QR scan or code verification)
13. System sends confirmation to parent
14. System updates child status to "checked_out"

**Postconditions:**
- Child safely released
- Check-out recorded
- Parent notified

**Exception Flow:**
9a. OTP invalid
10a. System displays error
11a. Teacher requests new OTP

4a. Guardian not in authorized list
5a. System displays error: "Guardian not authorized"
6a. Teacher contacts admin or parent

---

### UC-TEACHER-005: Submit Attendance

**Actor:** Teacher  
**Goal:** Record attendance for their group after service

**Preconditions:**
- Teacher is logged in
- Service has ended

**Main Flow:**
1. Teacher navigates to "Attendance"
2. Teacher selects date and group
3. System displays children in group
4. Teacher marks each child:
   - Present/Absent
   - By gender (for statistics)
5. Teacher adds optional notes
6. Teacher clicks "Submit Attendance"
7. System validates data
8. System saves attendance records
9. System updates reports
10. System displays success message

**Postconditions:**
- Attendance recorded
- Reports updated

---

### UC-TEACHER-006: Add Child to Group (Walk-In)

**Actor:** Teacher  
**Goal:** Add new child to group when family arrives without pre-registration

**Preconditions:**
- Teacher is logged in
- New family arrives at church

**Main Flow:**
1. Teacher navigates to "Add Child to Group"
2. Teacher enters:
   - Parent ID (if known) or creates new
   - Child name, DOB, gender
   - Group assignment
   - Reason (walk-in, new family, etc.)
3. Teacher clicks "Submit for Approval"
4. System creates child record with status "pending"
5. System notifies admin
6. Child can participate (pending approval)
7. Admin reviews and approves later

**Postconditions:**
- Child added (pending approval)
- Admin notified
- Child can participate

---

## 👨‍👩‍👧 PARENT USE CASES

### UC-PARENT-001: Add Child (Self-Registration)

**Actor:** Parent  
**Goal:** Register a new child in the system

**Preconditions:**
- Parent is logged in

**Main Flow:**
1. Parent navigates to Dashboard
2. Parent clicks "+ Add Child"
3. System displays child registration form
4. Parent fills in:
   - Child name
   - Date of birth
   - Gender
   - Group (auto-suggested by age)
   - Upload photo (optional)
   - Medical information:
     - Allergies
     - Medications
     - Special needs
5. Parent clicks "Submit for Approval"
6. System validates form data
7. System creates child record with status "pending"
8. System notifies admin
9. System displays confirmation: "Child submitted for approval"
10. Parent sees child in dashboard with "Pending Approval" status

**Postconditions:**
- Child record created (pending)
- Admin notified
- Parent can see pending child

**Exception Flow:**
6a. Validation fails
7a. System displays error messages
8a. Parent corrects errors and resubmits

---

### UC-PARENT-002: Pre-Check-In Child

**Actor:** Parent  
**Goal:** Generate QR code before arriving at church

**Preconditions:**
- Parent is logged in
- Child is approved (status: "active")

**Main Flow:**
1. Parent navigates to Dashboard
2. Parent sees child card
3. Parent clicks "Pre-Check-In" button
4. System generates QR code with:
   - Child ID
   - Parent ID
   - Timestamp
   - Expiration (15 minutes)
5. System displays QR code on screen
6. System sends QR code via:
   - Email with QR code image
   - SMS with QR code link
7. Parent can:
   - Download QR code
   - Share QR code
   - View on phone
8. QR code valid for 15 minutes

**Postconditions:**
- QR code generated
- QR code sent to parent
- Parent ready for check-in

**Exception Flow:**
3a. Child already checked in
4a. System displays: "Child is already checked in"

---

### UC-PARENT-003: At Church - Check-In Process

**Actor:** Parent  
**Goal:** Complete check-in process at church entrance

**Preconditions:**
- Parent has QR code (from pre-check-in)
- Parent arrives at church with child

**Main Flow:**
1. Parent arrives at church entrance
2. Parent shows QR code to teacher (on phone or printed)
3. Teacher scans QR code
4. System validates QR code
5. System records check-in
6. System sends confirmation to parent:
   - Email: "Maria checked in at 9:15 AM"
   - SMS: "Maria checked in successfully"
7. Child goes to assigned group
8. Parent sees status update: "Checked In"

**Postconditions:**
- Child checked in
- Parent notified
- Status updated

---

### UC-PARENT-004: Receive Pickup Notification

**Actor:** Parent  
**Goal:** Be notified when child is ready for pickup

**Preconditions:**
- Parent is logged in
- Child is checked in
- Service is ending

**Main Flow:**
1. Teacher sends pickup notification
2. Parent receives notification:
   - Email: "Maria is ready to be picked up"
   - SMS: "Maria is ready for pickup"
3. Parent opens app
4. Parent sees notification badge (red dot with count)
5. Parent clicks notification badge OR navigates to Notifications page
6. System displays notification:
   - "Maria is ready to be picked up"
   - Time received
   - Action button: "Pick Up Now"
7. Parent clicks "Pick Up Now"
8. System displays pickup options

**Postconditions:**
- Parent notified
- Parent ready to proceed to pickup

---

### UC-PARENT-005: Pick Up Child (Scan Teacher's QR)

**Actor:** Parent  
**Goal:** Pick up child by scanning teacher's QR code

**Preconditions:**
- Parent received pickup notification
- Parent is at pickup area
- Teacher has QR code displayed

**Main Flow:**
1. Parent navigates to Notifications
2. Parent clicks "Pick Up Now"
3. System displays pickup options
4. Parent selects "Scan Teacher's QR Code"
5. System requests camera permission
6. Parent grants permission
7. System opens camera view
8. Parent scans QR code displayed by teacher
9. System validates QR code
10. System verifies parent authorization
11. System releases child
12. System sends confirmation:
    - "Maria released to you at 11:15 AM"
13. System updates child status to "checked_out"

**Postconditions:**
- Child picked up
- Confirmation sent
- Status updated

**Exception Flow:**
9a. QR code invalid
10a. System displays error
11a. Parent tries again or uses alternative method

---

### UC-PARENT-006: Pick Up Child (Show Your Code)

**Actor:** Parent  
**Goal:** Pick up child by showing pickup code to teacher

**Preconditions:**
- Parent received pickup notification
- Parent is at pickup area

**Main Flow:**
1. Parent navigates to Notifications
2. Parent clicks "Pick Up Now"
3. System displays pickup options
4. Parent selects "Receive Pickup Code"
5. System generates:
   - QR code (for scanning)
   - OTP code (6 digits)
6. System displays codes on screen
7. Parent shows QR code OR tells teacher OTP
8. Teacher verifies code
9. Teacher selects guardian and verifies OTP
10. System releases child
11. System sends confirmation to parent
12. System updates child status

**Postconditions:**
- Child picked up
- Confirmation sent
- Status updated

---

### UC-PARENT-007: View Attendance History

**Actor:** Parent  
**Goal:** View child's attendance records

**Preconditions:**
- Parent is logged in
- Child exists in system

**Main Flow:**
1. Parent navigates to Dashboard
2. Parent clicks child card → "Attendance"
3. System displays attendance page
4. Parent sees:
   - Statistics (sessions attended, attendance rate)
   - History table:
     - Date
     - Check-in time
     - Check-out time
     - Status (Present/Absent)
5. Parent can filter by date range
6. Parent can export data (if available)

**Postconditions:**
- Attendance history viewed

---

### UC-PARENT-008: View Child Profile

**Actor:** Parent  
**Goal:** View complete child profile information

**Preconditions:**
- Parent is logged in
- Child exists in system

**Main Flow:**
1. Parent navigates to Dashboard
2. Parent clicks child card → "View Profile"
3. System displays child profile:
   - Photo
   - Basic info (name, age, DOB, gender)
   - Registration ID
   - Group assignment
   - Authorized guardians list (with photos)
   - Medical information
   - Emergency contacts
4. Parent can edit information (if allowed)

**Postconditions:**
- Child profile viewed

---

## 👦 TEEN USE CASES

### UC-TEEN-001: View Personal Attendance

**Actor:** Teen  
**Goal:** View own attendance history

**Preconditions:**
- Teen is logged in

**Main Flow:**
1. Teen navigates to Dashboard
2. Teen clicks "Attendance"
3. System displays:
   - Attendance statistics
   - History table (dates, status)
   - Group information
4. Teen can filter by date range

**Postconditions:**
- Attendance history viewed

---

### UC-TEEN-002: View Group Information

**Actor:** Teen  
**Goal:** View group details and schedule

**Preconditions:**
- Teen is logged in

**Main Flow:**
1. Teen navigates to Dashboard
2. Teen sees group information:
   - Group name
   - Age range
   - Room number
   - Meeting time
   - Teacher name
3. Teen can view group members (if allowed)

**Postconditions:**
- Group information viewed

---

## 🔄 CROSS-ROLE USE CASES

### UC-SHARED-001: Login and Authentication

**Actor:** All Users  
**Goal:** Securely access the system

**Main Flow:**
1. User navigates to landing page
2. User selects role or clicks login button
3. System redirects to login page
4. User enters email and password
5. System validates credentials
6. System prompts for MFA code
7. User enters MFA code (123456 for demo)
8. System verifies MFA
9. System redirects to role-specific dashboard

**Postconditions:**
- User authenticated
- User redirected to dashboard

---

### UC-SHARED-002: View Notifications

**Actor:** All Users  
**Goal:** View and manage system notifications

**Main Flow:**
1. User sees notification badge (if notifications exist)
2. User clicks notification badge
3. System displays notifications list
4. User views notifications:
   - Type (approval, check-in, pickup, etc.)
   - Message
   - Timestamp
   - Status (read/unread)
5. User clicks notification → Action page
6. User marks as read (optional)

**Postconditions:**
- Notifications viewed
- Actions taken (if applicable)

---

*This document covers all primary use cases for Admin, Teacher, Parent, and Teen roles.*


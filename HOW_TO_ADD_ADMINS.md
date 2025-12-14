# How to Add Admin Users (Super Admin Guide)

## Overview
Only **Super Admins** can create and manage other admin users. Regular admins do not have this permission.

## Step-by-Step Instructions

### 1. Login as Super Admin
- Email: `superadmin@rkids.church`
- Password: `password123`
- After login, you'll be redirected to `/admin`

### 2. Navigate to Manage Users
- Click on **"Manage Users"** in the admin sidebar or dashboard
- Or go directly to: `/admin/manage-users`

### 3. Access the Admins Tab
- You'll see tabs at the top: **Admins**, Teachers, Teens, Parents
- **Note:** The "Admins" tab is **only visible to Super Admins**
- Click on the **"Admins"** tab

### 4. Click "Add Admin" Button
- In the top right, click the **"+ Add Admin"** button
- This opens a modal form

### 5. Fill in Admin Details
The form requires:
- **First Name** * (required)
- **Last Name** * (required)
- **Email (Username)** * (required)
  - This will be their login email
  - Example: `admin@rkids.church`
- **Send invitation email** (checkbox)
  - If checked, an invitation email will be sent
  - If unchecked, user is created but no email is sent
- **Custom Email Message** (optional)
  - Only shown if "Send invitation email" is checked
  - Leave blank to use default invitation message

### 6. Submit the Form
- Click **"Create & Send Invitation"** (if email is enabled)
- Or **"Create User"** (if email is disabled)
- The new admin will be created with:
  - Status: `pending_password` (they must set password on first login)
  - Profile: `pending` (they may need to update profile)
  - Role: `admin`

### 7. New Admin First Login
When the new admin logs in for the first time:
1. They'll be prompted to **change their password** (mandatory)
2. After setting password, they can access all admin features
3. They **cannot** create other admins (only super admins can)

## Important Notes

### Permissions
- ✅ **Super Admin** can:
  - Create admin users
  - Suspend/activate admin users
  - Delete admin users
  - View all admins and super admins

- ❌ **Regular Admin** cannot:
  - See the "Admins" tab
  - Create admin users
  - Modify admin users
  - Suspend/activate admin users

### Security
- New admins **must** change their password on first login
- The system enforces this with a redirect to `/change-password`
- Admins cannot change their own role to `super_admin`

### User Management Actions
Once an admin is created, you can:
- **Resend Invitation** - Send the invitation email again
- **Suspend** - Temporarily disable the admin account
- **Activate** - Re-enable a suspended admin
- **Delete** - Permanently remove the admin (use with caution!)

## Visual Guide

```
Admin Dashboard
    ↓
Manage Users (sidebar or dashboard)
    ↓
Click "Admins" tab (only visible to super admin)
    ↓
Click "+ Add Admin" button
    ↓
Fill form: First Name, Last Name, Email
    ↓
Optional: Check "Send invitation email"
    ↓
Click "Create & Send Invitation"
    ↓
✅ Admin created! They'll receive email (if enabled)
```

## Troubleshooting

### "Admins" tab not visible?
- Make sure you're logged in as **super_admin** (not regular admin)
- Check your role in the user profile/settings
- Only super admins can see this tab

### "Only super admins can create admin users" error?
- You're logged in as a regular admin
- Logout and login as super admin
- Or contact a super admin to create the user

### Admin can't login?
- Check if their account is suspended
- Verify their email is correct
- They may need to check their email for the invitation
- First-time login requires password change

## API Endpoint
The backend endpoint used is:
```
POST /api/users
Authorization: Bearer <super_admin_token>
Body: {
  "name": "Full Name",
  "email": "admin@rkids.church",
  "role": "admin"
}
```

Only super admins can successfully call this endpoint with `role: "admin"`.

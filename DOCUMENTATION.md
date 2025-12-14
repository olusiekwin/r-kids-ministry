# R-KIDS Ministry Management System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Setup & Installation](#setup--installation)
3. [Database Setup](#database-setup)
4. [Features](#features)
5. [User Roles & Permissions](#user-roles--permissions)
6. [API Documentation](#api-documentation)
7. [Deployment](#deployment)
8. [Testing](#testing)

---

## Overview

R-KIDS is a comprehensive ministry management system for managing children's ministry operations including:
- Child registration and management
- Parent/guardian management
- Check-in/check-out system
- Session and event management
- Attendance tracking
- User management with role-based access control

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Flask + Python
- Database: PostgreSQL (Supabase)
- Deployment: Vercel (Frontend) + Render (Backend)

---

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+
- Supabase account

### Frontend Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (see .env.example)
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
python app.py
```

---

## Database Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Note your project URL and API keys

### 2. Run Schema Migration
1. Go to Supabase Dashboard → SQL Editor
2. Run the main schema from `database/supabase_schema.sql`
3. Run the complete migration from `database/migrations/001_complete_schema_migration.sql`

### 3. Environment Variables
Set these in your `backend/.env` file:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # RECOMMENDED
```

**Important:** Use `SUPABASE_SERVICE_ROLE_KEY` for backend operations to bypass RLS. Never expose this key to the frontend!

---

## Features

### Core Features
- ✅ Child registration and approval workflow
- ✅ Parent/guardian management
- ✅ Check-in/check-out with QR codes and OTP
- ✅ Session and event management
- ✅ Attendance tracking
- ✅ User management with roles
- ✅ Notifications system
- ✅ Audit logging

### User Management
- **Super Admin**: Full access, can create/manage admins
- **Admin**: Full access except creating admins
- **Teacher**: Check-in/check-out, attendance tracking
- **Parent**: Register children, view attendance
- **Teen**: Self-service attendance

### Session Management
- Create and manage ministry sessions
- Book children for sessions
- Gender restrictions (Male/Female only)
- Recurring sessions support

---

## User Roles & Permissions

### Super Admin
- ✅ All admin permissions
- ✅ Create and manage admin users
- ✅ Suspend/activate admin users
- ✅ Full site management

### Admin
- ✅ Manage all users (except admins)
- ✅ Approve/reject child registrations
- ✅ Manage groups and sessions
- ✅ View reports and analytics
- ❌ Cannot create/modify admins

### Teacher
- ✅ Check-in/check-out children
- ✅ Track attendance
- ✅ View assigned groups
- ❌ Cannot manage users or settings

### Parent
- ✅ Register children
- ✅ Book sessions
- ✅ View child attendance
- ✅ Manage secondary guardians
- ❌ Cannot access admin features

### Teen
- ✅ Submit own attendance
- ✅ View personal stats
- ❌ Cannot access other features

---

## API Documentation

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/verify-mfa` - Verify MFA code
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - List users (admin/super_admin only)
- `GET /api/users?role=<role>` - List users by role
- `POST /api/users` - Create user (admin/super_admin only)
- `PUT /api/users/<id>` - Update user
- `POST /api/users/<id>/suspend` - Suspend user
- `POST /api/users/<id>/activate` - Activate user

**Note:** Only super admins can create/modify admin users.

### Children
- `GET /api/children` - List children
- `POST /api/children` - Create child registration
- `POST /api/children/<id>/approve` - Approve child
- `POST /api/children/<id>/reject` - Reject child

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/<id>` - Get session details
- `PUT /api/sessions/<id>` - Update session

### Check-In/Check-Out
- `POST /api/checkin/scan-qr` - Scan QR code
- `POST /api/checkin/manual` - Manual check-in
- `POST /api/checkout/verify` - Verify pickup
- `POST /api/checkout/release/<child_id>` - Release child

---

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `VITE_API_BASE_URL` - Your backend API URL
3. Deploy

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `gunicorn wsgi:app`
5. Add environment variables from `.env`
6. Deploy

---

## Testing

### Backend API Tests
Run the test script:
```bash
bash test_api_manual.sh
```

### Manual Testing Checklist
- [ ] Super admin can create admin users
- [ ] Regular admin cannot create admins
- [ ] Check-in/check-out workflow
- [ ] Session booking
- [ ] Attendance tracking
- [ ] Notifications

---

## Database Schema

### Core Tables
- `churches` - Multi-tenant church information
- `users` - User accounts (Admin, SuperAdmin, Teacher, Parent, Teen)
- `groups` - Children's groups
- `guardians` - Parent/guardian information
- `children` - Child registration and information
- `child_guardians` - Relationships between children and guardians

### Operations Tables
- `check_in_records` - Check-in/check-out tracking
- `attendance_summary` - Daily attendance summaries
- `sessions` - Ministry sessions/events
- `session_bookings` - Parent bookings for sessions
- `notifications` - Email/SMS notifications
- `audit_logs` - System audit trail

---

## Security

### Authentication
- Token-based authentication
- MFA (Multi-Factor Authentication) required
- Password hashing (SHA256 - upgrade to bcrypt in production)

### Authorization
- Role-based access control (RBAC)
- Backend enforces all authorization checks
- Frontend provides UI restrictions

### Best Practices
- Use `SUPABASE_SERVICE_ROLE_KEY` for backend (never expose to frontend)
- Keep API keys secure
- Implement proper password hashing in production
- Add rate limiting for production

---

## Support & Troubleshooting

### Common Issues

**Backend not connecting to Supabase:**
- Check environment variables in `.env`
- Verify Supabase URL and keys
- Ensure service role key is set (recommended)

**RLS Policy Errors:**
- Use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Or run RLS policies migration (see migration file)

**CORS Errors:**
- Check CORS configuration in `backend/app.py`
- Verify frontend URL is in allowed origins

---

## License

Proprietary - R-KIDS Ministry Management System

---

## Changelog

### Latest Updates
- ✅ Super admin role implementation
- ✅ Session management with gender restrictions
- ✅ Enhanced user management
- ✅ Improved validation constraints
- ✅ Consolidated migrations

---

For more details, see individual feature documentation files.

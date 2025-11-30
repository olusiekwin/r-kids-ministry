<div align="center">

<img src="public/logo.jpg" alt="R-KIDS Logo - Ruach South Assembly" width="200" height="200"/>

# R-KIDS Ministry Management System

### Ruach South Assembly

**Growth Happens Here** 🌱

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

*Children & Teens Ministry Management System*

</div>

---

## 📖 About

R-KIDS is a comprehensive ministry management system designed for Ruach South Assembly to efficiently manage children and teens ministry operations. The system provides tools for check-in/check-out, attendance tracking, parent communication, guardian management, and comprehensive reporting.

### Key Features

- 👥 **User Management** - Admin, Teacher, Parent, and Teen roles with secure authentication
- ✅ **Check-In/Check-Out System** - QR code and OTP-based check-in/check-out tracking
- 📊 **Attendance Management** - Real-time attendance tracking and reporting
- 👨‍👩‍👧‍👦 **Guardian Management** - Authorized guardian system with expiry dates
- 📱 **Notifications** - Email and SMS notifications for parents
- 📈 **Reports & Analytics** - Comprehensive attendance and activity reports
- 🔍 **Audit Logging** - Complete activity tracking and audit trail
- 🔐 **Security** - MFA authentication, role-based access control

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS & shadcn/ui components
- ⚡ Vite for fast development
- 🔄 React Router for navigation

**Backend:**
- 🐍 Python 3.11+ with Flask
- 🗄️ Supabase (PostgreSQL) for database
- 🔐 JWT-based authentication with MFA
- 📡 RESTful API architecture

**Database:**
- 🐘 PostgreSQL (via Supabase)
- 🔒 Row-Level Security (RLS)
- 📝 Comprehensive audit logging

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Supabase account

### Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Supabase credentials
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# DATABASE_URL=postgresql://...

# Start backend server
python app.py
```

Backend will be available at `http://localhost:5000`

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the schema file in Supabase SQL Editor:
   - `database/supabase_schema.sql` - Main schema
   - `database/migrations/001_add_user_profile_fields.sql` - User profile fields
3. Configure environment variables (see `backend/DEPLOYMENT.md`)

---

## 📱 User Roles

### 👨‍💼 Admin
- Create and manage users (Teachers, Teens, Parents)
- Approve/reject child registrations
- Manage guardians and groups
- View comprehensive reports
- Access audit logs and user activity tracking

### 👨‍🏫 Teacher
- Check-in/check-out children
- Track attendance
- Send pickup notifications
- Manage assigned groups

### 👨‍👩‍👧 Parent
- Register children
- View check-in/check-out status
- Receive notifications
- View attendance reports

### 👦👧 Teen
- Access teen dashboard
- View personal information
- Check attendance history

---

## 🔌 API Documentation

**Base URL**: `http://localhost:5000/api` (or set via `VITE_API_BASE_URL`)

All endpoints (except login) require Bearer token in Authorization header.

### Main Endpoints

| Category | Endpoints |
|----------|-----------|
| **Authentication** | `/auth/login`, `/auth/verify-mfa`, `/auth/logout` |
| **Users** | `/users` (CRUD operations) |
| **Children** | `/children` (with approval workflow) |
| **Guardians** | `/guardians` (with authorization system) |
| **Check-In/Out** | `/checkin/*`, `/checkout/*` |
| **Attendance** | `/attendance`, `/attendance/submit` |
| **Groups** | `/groups` (management) |
| **Reports** | `/reports/attendance`, `/reports/export` |
| **Notifications** | `/notifications` |
| **Audit** | `/audit` (activity logs) |

For complete API documentation, see the [API Endpoints](#api-endpoints) section below.

---

## 🗄️ Database Schema

The system uses the following main tables:

- **churches** - Multi-tenant church information
- **users** - User accounts (Admin, Teacher, Parent, Teen)
- **groups** - Children's groups (Little Angels, Saints, Disciples, Trendsetters)
- **guardians** - Parent/guardian information
- **children** - Child registration and information
- **child_guardians** - Relationships between children and guardians
- **check_in_records** - Check-in/check-out tracking
- **attendance_summary** - Daily attendance summaries
- **notifications** - Email/SMS notifications
- **audit_logs** - System audit trail

See `database/README.md` for detailed database setup instructions.

---

## 🔐 Security Features

- ✅ Multi-Factor Authentication (MFA) with OTP
- ✅ JWT-based session management
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Secure invitation system for new users
- ✅ Comprehensive audit logging
- ✅ CORS protection
- ✅ SQL injection prevention

---

## 📦 Project Structure

```
r-kids-ministry/
├── backend/                 # Flask backend API
│   ├── app.py              # Main application
│   ├── config.py           # Configuration
│   ├── supabase_client.py  # Supabase integration
│   ├── utils/              # Utilities (audit logging, etc.)
│   ├── requirements.txt    # Python dependencies
│   └── DEPLOYMENT.md       # Deployment guide
├── src/                     # React frontend
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   └── config/             # Configuration
├── database/                # Database schemas
│   ├── supabase_schema.sql # Main schema
│   └── migrations/         # Database migrations
└── public/                  # Static assets
```

---

## 🚢 Deployment

### Backend Deployment (Render)

The backend is configured for deployment on Render. See `backend/DEPLOYMENT.md` for detailed instructions.

**Quick deploy:**
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy!

**Required Environment Variables:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `DATABASE_URL`
- `FLASK_ENV=production`

### Frontend Deployment

The frontend can be deployed on any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

Set `VITE_API_BASE_URL` environment variable to your backend URL.

---

## 📝 API Endpoints

<details>
<summary>Click to expand API endpoints documentation</summary>

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/verify-mfa` - Verify MFA code
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users` - List users (query: ?role=)
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/suspend` - Suspend user
- `POST /api/users/:id/activate` - Activate user
- `POST /api/users/resend-invitation` - Resend invitation
- `PUT /api/users/profile` - Update profile

### Parents
- `GET /api/parents` - List all parents
- `POST /api/parents` - Create parent
- `GET /api/parents/:id` - Get parent by ID
- `PUT /api/parents/:id` - Update parent
- `DELETE /api/parents/:id` - Delete parent

### Children
- `GET /api/children` - List children (query: ?parent_id=, ?group=)
- `POST /api/children` - Create child (pending approval)
- `GET /api/children/:id` - Get child by ID
- `PUT /api/children/:id` - Update child
- `DELETE /api/children/:id` - Delete child
- `GET /api/children/pending` - Get pending children
- `POST /api/children/:id/approve` - Approve child
- `POST /api/children/:id/reject` - Reject child

### Guardians
- `GET /api/guardians` - List guardians (query: ?child_id=)
- `POST /api/guardians` - Create guardian
- `GET /api/guardians/:id` - Get guardian by ID
- `PUT /api/guardians/:id` - Update guardian
- `DELETE /api/guardians/:id` - Delete guardian
- `POST /api/guardians/:id/renew` - Renew guardian

### Check-In/Check-Out
- `POST /api/checkin/scan-qr` - Scan QR code
- `POST /api/checkin/manual` - Manual check-in
- `POST /api/checkin/verify-otp` - Verify OTP
- `POST /api/checkin/generate-qr` - Generate QR code
- `GET /api/checkin/status/:childId` - Get check-in status
- `POST /api/checkout/notify/:childId` - Send pickup notification
- `POST /api/checkout/verify` - Verify pickup code
- `POST /api/checkout/pickup-code/:childId` - Generate pickup code
- `POST /api/checkout/release/:childId` - Release child

### Attendance
- `GET /api/attendance` - List attendance (query: ?child_id=, ?group=, ?date=)
- `POST /api/attendance` - Create attendance record
- `GET /api/attendance/:id` - Get attendance by ID
- `POST /api/attendance/submit` - Submit attendance

### Groups
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Get group by ID
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `GET /api/groups/:id/stats` - Get group statistics

### Reports
- `GET /api/reports/attendance` - Get attendance report (query: ?period=, ?group=)
- `GET /api/reports/export` - Export report (query: ?format=csv|excel)

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/:id` - Get notification by ID
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count

### Audit Log
- `GET /api/audit` - List audit logs (query: ?action=, ?user_id=, ?date_from=, ?date_to=)
- `GET /api/audit/:id` - Get audit log by ID
- `GET /api/audit/export` - Export audit log

</details>

---

## 🔧 Development

### Running Locally

**Frontend:**
```bash
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Environment Variables

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**Backend (backend/.env):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
FLASK_ENV=development
```

---

## 📚 Documentation

- [Backend Deployment Guide](backend/DEPLOYMENT.md) - Render deployment instructions
- [Database Setup](database/README.md) - Database schema and migration guide
- [API Documentation](#api-endpoints) - Complete API reference

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Contact & Support

**Ruach South Assembly**

For questions or support, please contact the development team.

---

<div align="center">

**Built with ❤️ for Ruach South Assembly**

*Growth Happens Here* 🌱

</div>

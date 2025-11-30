# Supabase Integration Guide

## Overview

The R-KIDS backend is now integrated with Supabase (PostgreSQL). This document explains how to set up and use the Supabase integration.

## Files Created

### Core Database Files
- `backend/database.py` - Database connection and initialization
- `backend/models/` - SQLAlchemy models for all database tables
  - `user.py` - User model
  - `church.py` - Church model
  - `group.py` - Group model
  - And more...

### Helper Files
- `backend/utils/db_helpers.py` - Database helper functions

## Setup Instructions

### 1. Configure Environment Variables

Update `backend/.env` with your Supabase credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT_REF.supabase.co:5432/postgres
```

**How to get your Supabase connection string:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (URI) or **Connection Pooling** URL
5. Replace `YOUR_PASSWORD` with your database password
6. Replace `YOUR_PROJECT_REF` with your project reference

### 2. Run Database Schema

Run the SQL schema file in Supabase SQL Editor:

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy contents from `database/supabase_schema.sql`
3. Paste and run in SQL Editor
4. This creates all tables, indexes, and triggers

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Test Connection

Start the Flask server:

```bash
python app.py
```

Check the health endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-29T..."
}
```

## Database Models

### User Model
- Stores user accounts (Admin, Teacher, Parent, Teen)
- Links to church, guardian, or child

### Church Model
- Multi-tenant support
- Each church has its own data

### Group Model
- Age-based groups
- Can be assigned a teacher

### Child Model
- Registered children
- Links to parent/guardian and group
- Status: active, pending, rejected

### Guardian Model
- Primary and secondary guardians
- Can have expiry dates

## API Endpoints Using Supabase

### Groups
- `GET /api/groups` - Lists groups from Supabase
- `PUT /api/groups/<name>` - Updates group (e.g., assign teacher)

### Users
- `GET /api/users?role=teacher` - Lists users filtered by role

### Health Check
- `GET /api/health` - Shows database connection status

## Database Helper Functions

Located in `backend/utils/db_helpers.py`:

- `get_church_by_id()` - Get church
- `get_user_by_email()` - Get user by email
- `get_users_by_role()` - Get users by role
- `get_groups()` - Get all groups
- `get_group_by_name()` - Get specific group
- `get_children()` - Get children with filters
- `test_db_connection()` - Test database connection

## Usage Example

```python
from utils.db_helpers import get_users_by_role, get_groups

# Get all teachers
teachers = get_users_by_role('Teacher')

# Get all groups
groups = get_groups()

# Get group by name
group = get_group_by_name('Little Angels')
```

## Troubleshooting

### Connection Issues

1. **Check DATABASE_URL format:**
   ```
   postgresql://postgres:PASSWORD@PROJECT_REF.supabase.co:5432/postgres
   ```

2. **Verify Supabase project is active**

3. **Check firewall/network settings**

4. **Test connection:**
   ```python
   from utils.db_helpers import test_db_connection
   print(test_db_connection())  # Should return True
   ```

### Import Errors

Make sure all dependencies are installed:
```bash
pip install flask-sqlalchemy psycopg2-binary
```

### Table Not Found Errors

Run the schema SQL file in Supabase SQL Editor to create tables.

## Next Steps

1. ✅ Database connection configured
2. ✅ Models created
3. ✅ Helper functions available
4. 🔄 Update more endpoints to use Supabase
5. 🔄 Add database migrations (Flask-Migrate)
6. 🔄 Add error handling and logging

## Notes

- The app falls back to in-memory storage if database connection fails
- All database operations are wrapped in try/except for error handling
- Database connection is tested on health check endpoint


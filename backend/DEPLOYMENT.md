# R-KIDS Backend Deployment Guide for Render

## 🚀 Quick Deploy to Render

### Prerequisites
1. GitHub repository with your code
2. Render account (free tier available)
3. Supabase project set up

### Step 1: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository: `r-kids-ministry`

### Step 2: Configure Service Settings

**Basic Settings:**
- **Name:** `r-kids-backend` (or your preferred name)
- **Region:** Choose closest to your users (Oregon recommended)
- **Branch:** `main` (or your default branch)
- **Root Directory:** `backend`
- **Environment:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn --bind 0.0.0.0:$PORT app:app --workers 2 --timeout 120 --worker-class gevent`

### Step 3: Environment Variables

Add these environment variables in Render dashboard:

**Required:**
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SECRET_KEY=<generate-random-string>
JWT_SECRET_KEY=<generate-random-string>
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
FLASK_ENV=production
PYTHON_VERSION=3.11.0
```

**Optional (for email/SMS features):**
```env
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
FRONTEND_URL=https://your-frontend-url.onrender.com
```

**Generate Secrets:**
```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Install dependencies
   - Build your application
   - Start the server

### Step 5: Verify Deployment

Once deployed, test the health endpoint:
```bash
curl https://your-service-name.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "supabase_api": "connected",
  "timestamp": "..."
}
```

## 🔐 Default Password for New Users

**Important:** When admins create new users, there is **NO default password**.

**User Creation Flow:**
1. Admin creates user via `/api/users` endpoint
2. System generates a secure **invitation token**
3. User status is set to `pending_password`
4. User receives invitation email with password setup link
5. User must set their own password before first login

**Password Setup:**
- Users access the invitation link: `/set-password?token=<invitation_token>`
- They set their own password
- Status changes from `pending_password` to `active`
- User can then login with email and new password

## 📝 Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous/public key |
| `SECRET_KEY` | ✅ Yes | Flask session secret (generate random) |
| `JWT_SECRET_KEY` | ✅ Yes | JWT token secret (generate random) |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `FLASK_ENV` | ✅ Yes | Set to `production` |
| `PYTHON_VERSION` | ✅ Yes | Python version (3.11.0 recommended) |
| `SENDGRID_API_KEY` | ❌ No | For email invitations |
| `TWILIO_*` | ❌ No | For SMS features |
| `FRONTEND_URL` | ❌ No | Your frontend URL for CORS |

## 🔍 Troubleshooting

### Build Fails
- Check Python version matches requirements
- Verify all dependencies in `requirements.txt`
- Check build logs for specific errors

### Runtime Errors
- Check environment variables are set correctly
- Verify Supabase connection (check health endpoint)
- Review application logs in Render dashboard

### Connection Issues
- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check Supabase project is active (not paused)
- Verify database tables exist (run schema migration)

## 📊 Health Check

The health endpoint at `/api/health` provides:
- Backend status
- Supabase connection status
- PostgreSQL connection status (if configured)

## 🔄 Auto-Deploy

Render automatically deploys when you push to your connected branch (usually `main`).

## 💰 Free Tier Limits

- **Free tier:** 750 hours/month
- **Sleep:** Free services sleep after 15 minutes of inactivity
- **Wake time:** First request after sleep takes ~30 seconds

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/latest/deploying/)

## 🎯 Quick Checklist

- [ ] Repository connected to Render
- [ ] All environment variables set
- [ ] Health endpoint responding
- [ ] Supabase connection working
- [ ] Can create users via API
- [ ] Frontend can connect to backend


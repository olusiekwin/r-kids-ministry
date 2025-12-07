# Vercel Deployment Setup

## Environment Variables

Set the following environment variable in your Vercel project settings:

### Required Environment Variable:

**Key:** `VITE_API_BASE_URL`  
**Value:** `https://r-kids-ministry.onrender.com/api`

### How to Set in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://r-kids-ministry.onrender.com/api`
   - **Environment:** Production, Preview, Development (or select as needed)
4. Click **Save**
5. Redeploy your application for changes to take effect

## Backend Configuration

Your backend is hosted on Render at: `https://r-kids-ministry.onrender.com`

Make sure your Render service has:
- **Start Command:** `cd backend && gunicorn --bind 0.0.0.0:$PORT wsgi:app`
- **Environment:** Python 3
- All required environment variables (Supabase keys, etc.)

## CORS Configuration

The backend already has CORS configured to allow all origins (`*`), so your Vercel frontend should be able to make requests without issues.


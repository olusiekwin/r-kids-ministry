# R-KIDS - Ruach South Assembly

**Growth Happens Here**

Children & Teens Ministry Management System for Ruach South Assembly

## ⚠️ Important: Static Data Removed

All static/mock data has been removed from the codebase. The application now uses API services located in `src/services/api.ts`. 

**To connect to your backend:**
1. Set `VITE_API_BASE_URL` in your `.env` file (defaults to `http://localhost:5000/api`)
2. Ensure your backend implements all endpoints listed below
3. The frontend will make API calls instead of using mock data

---

## Backend API Endpoints

**Base URL**: `http://localhost:5000/api` (or set via `VITE_API_BASE_URL`)

**Authentication**: All endpoints (except login) require Bearer token in Authorization header

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/verify-mfa` - Verify MFA code
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

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
- `POST /api/children/:id/reject` - Reject child (body: { reason })

### Guardians
- `GET /api/guardians` - List guardians (query: ?child_id=)
- `POST /api/guardians` - Create guardian
- `GET /api/guardians/:id` - Get guardian by ID
- `PUT /api/guardians/:id` - Update guardian
- `DELETE /api/guardians/:id` - Delete guardian
- `POST /api/guardians/:id/renew` - Renew guardian (body: { days })

### Check-In
- `POST /api/checkin/scan-qr` - Scan QR code (body: { qr_data })
- `POST /api/checkin/manual` - Manual check-in (body: { parent_id })
- `POST /api/checkin/verify-otp` - Verify OTP (body: { otp, parent_id })
- `POST /api/checkin/generate-qr` - Generate QR code (body: { child_id })
- `GET /api/checkin/status/:childId` - Get check-in status

### Check-Out
- `POST /api/checkout/notify/:childId` - Send pickup notification
- `POST /api/checkout/verify` - Verify pickup code (body: { childId, code?, qrData? })
- `POST /api/checkout/pickup-code/:childId` - Generate pickup code
- `POST /api/checkout/release/:childId` - Release child (body: { guardian_id, otp })

### Attendance
- `GET /api/attendance` - List attendance (query: ?child_id=, ?group=, ?date=)
- `POST /api/attendance` - Create attendance record
- `GET /api/attendance/:id` - Get attendance by ID
- `POST /api/attendance/submit` - Submit attendance (body: { date, group, children[], notes? })

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

### QR Codes
- `POST /api/qr/generate` - Generate QR code
- `POST /api/qr/validate` - Validate QR code
- `POST /api/qr/scan` - Scan QR code

---

## Project info

**URL**: https://lovable.dev/projects/17d53352-a7e0-4506-b104-ca83f406b604

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/17d53352-a7e0-4506-b104-ca83f406b604) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/17d53352-a7e0-4506-b104-ca83f406b604) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

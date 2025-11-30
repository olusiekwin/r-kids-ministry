# R KIDS Backend API

Simple Flask backend for R KIDS Ministry Management System.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (optional):
```bash
export SECRET_KEY=your-secret-key
export PORT=5000
```

3. Run the server:
```bash
python app.py
```

The API will be available at `http://localhost:5000/api`

## API Structure

All endpoints are prefixed with `/api`

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-mfa` - Verify MFA code
- `POST /api/auth/logout` - Logout

### Parents
- `GET /api/parents` - List parents
- `POST /api/parents` - Create parent
- `GET /api/parents/:id` - Get parent

### Children
- `GET /api/children` - List children (query: ?parent_id=, ?group=)
- `POST /api/children` - Create child
- `GET /api/children/pending` - Get pending children
- `POST /api/children/:id/approve` - Approve child
- `POST /api/children/:id/reject` - Reject child

### Check-In/Check-Out
- `POST /api/checkin/generate-qr` - Generate QR code
- `POST /api/checkin/scan-qr` - Scan QR code
- `POST /api/checkout/notify/:childId` - Send pickup notification

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count

### Groups
- `GET /api/groups` - List groups

## Development Notes

- Currently uses in-memory storage (replace with database)
- Authentication tokens are simplified (replace with JWT)
- MFA code is hardcoded to `123456` (replace with real MFA)


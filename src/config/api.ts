// Backend API Configuration
// In production, this should be set via VITE_API_BASE_URL environment variable
// For Vercel: Set VITE_API_BASE_URL=https://r-kids-ministry.onrender.com/api in project settings
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD 
    ? 'https://r-kids-ministry.onrender.com/api'
    : 'http://localhost:5000/api');

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    VERIFY_MFA: '/auth/verify-mfa',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    SET_PASSWORD: '/auth/set-password',
  },

  // Parents
  PARENTS: {
    LIST: '/parents',
    CREATE: '/parents',
    GET: (id: string) => `/parents/${id}`,
    UPDATE: (id: string) => `/parents/${id}`,
    DELETE: (id: string) => `/parents/${id}`,
    SEARCH: '/parents/search',
    DETAILS: (id: string) => `/parents/${id}/details`,
    UPLOAD_IMAGE: (id: string) => `/parents/${id}/upload-image`,
  },

  // Children
  CHILDREN: {
    LIST: '/children',
    CREATE: '/children',
    GET: (id: string) => `/children/${id}`,
    UPDATE: (id: string) => `/children/${id}`,
    DELETE: (id: string) => `/children/${id}`,
    BY_PARENT: (parentId: string) => `/children?parent_id=${parentId}`,
    BY_GROUP: (group: string) => `/children?group=${group}`,
    PENDING: '/children/pending',
    APPROVE: (id: string) => `/children/${id}/approve`,
    REJECT: (id: string) => `/children/${id}/reject`,
  },

  // Guardians
  GUARDIANS: {
    LIST: '/guardians',
    CREATE: '/guardians',
    GET: (id: string) => `/guardians/${id}`,
    UPDATE: (id: string) => `/guardians/${id}`,
    DELETE: (id: string) => `/guardians/${id}`,
    BY_CHILD: (childId: string) => `/guardians?child_id=${childId}`,
    RENEW: (id: string) => `/guardians/${id}/renew`,
  },

  // Check-In/Check-Out
  CHECKIN: {
    SCAN_QR: '/checkin/scan-qr',
    MANUAL: '/checkin/manual',
    VERIFY_OTP: '/checkin/verify-otp',
    GENERATE_QR: '/checkin/generate-qr',
    STATUS: (childId: string) => `/checkin/status/${childId}`,
    ACTIVE: '/checkin/active',
  },

  CHECKOUT: {
    SEND_NOTIFICATION: (childId: string) => `/checkout/notify/${childId}`,
    VERIFY_PICKUP: '/checkout/verify',
    GENERATE_PICKUP_CODE: (childId: string) => `/checkout/pickup-code/${childId}`,
    RELEASE: (childId: string) => `/checkout/release/${childId}`,
  },

  // Attendance
  ATTENDANCE: {
    LIST: '/attendance',
    CREATE: '/attendance',
    GET: (id: string) => `/attendance/${id}`,
    BY_CHILD: (childId: string) => `/attendance?child_id=${childId}`,
    BY_GROUP: (group: string) => `/attendance?group=${group}`,
    BY_DATE: (date: string) => `/attendance?date=${date}`,
    SUBMIT: '/attendance/submit',
  },

  // Groups
  GROUPS: {
    LIST: '/groups',
    CREATE: '/groups',
    GET: (id: string) => `/groups/${id}`,
    UPDATE: (id: string) => `/groups/${id}`,
    DELETE: (id: string) => `/groups/${id}`,
    STATS: (id: string) => `/groups/${id}/stats`,
  },

  // Reports
  REPORTS: {
    ATTENDANCE: '/reports/attendance',
    BY_PERIOD: (period: string) => `/reports/attendance?period=${period}`,
    BY_GROUP: (group: string) => `/reports/attendance?group=${group}`,
    EXPORT: (format: string) => `/reports/export?format=${format}`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    GET: (id: string) => `/notifications/${id}`,
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    UNREAD_COUNT: '/notifications/unread-count',
  },

  // Audit Log
  AUDIT: {
    LIST: '/audit',
    GET: (id: string) => `/audit/${id}`,
    EXPORT: '/audit/export',
  },

  // Analytics
  ANALYTICS: {
    GROUP: (groupName: string) => `/analytics/group/${groupName}`,
    TEACHER: '/analytics/teacher',
    ADMIN: '/analytics/admin',
    CHILD: (childId: string) => `/analytics/child/${childId}`,
  },

  // Users
  USERS: {
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    BY_ROLE: (role: string) => `/users?role=${role}`,
    SUSPEND: (id: string) => `/users/${id}/suspend`,
    ACTIVATE: (id: string) => `/users/${id}/activate`,
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },

  // QR Codes
  QR: {
    GENERATE: '/qr/generate',
    VALIDATE: '/qr/validate',
    SCAN: '/qr/scan',
  },

  // Sessions
  SESSIONS: {
    LIST: '/sessions',
    CREATE: '/sessions',
    GET: (id: string) => `/sessions/${id}`,
    UPDATE: (id: string) => `/sessions/${id}`,
    DELETE: (id: string) => `/sessions/${id}`,
  },

  // Session Bookings
  SESSION_BOOKINGS: {
    LIST_BY_SESSION: (sessionId: string) => `/sessions/${sessionId}/bookings`,
    BOOK: (sessionId: string) => `/sessions/${sessionId}/book`,
    GET: (bookingId: string) => `/bookings/${bookingId}`,
    CANCEL: (bookingId: string) => `/bookings/${bookingId}`,
    LIST_BY_CHILD: (childId: string) => `/children/${childId}/bookings`,
  },

  // Teachers
  TEACHERS: {
    GROUPS: '/teachers/groups',
    CHILDREN: '/teachers/children',
    CHECKINS: '/teachers/checkins',
    DASHBOARD: '/teachers/dashboard',
  },

  // Teens
  TEENS: {
    PROFILE: '/teens/profile',
    ATTENDANCE: '/teens/attendance',
    SUBMIT_ATTENDANCE: '/teens/attendance/submit',
    STATS: '/teens/stats',
    DASHBOARD: '/teens/dashboard',
  },
};


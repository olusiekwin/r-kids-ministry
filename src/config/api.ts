// Backend API Configuration

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    VERIFY_MFA: '/auth/verify-mfa',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  // Parents
  PARENTS: {
    LIST: '/parents',
    CREATE: '/parents',
    GET: (id: string) => `/parents/${id}`,
    UPDATE: (id: string) => `/parents/${id}`,
    DELETE: (id: string) => `/parents/${id}`,
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
  },

  // QR Codes
  QR: {
    GENERATE: '/qr/generate',
    VALIDATE: '/qr/validate',
    SCAN: '/qr/scan',
  },
};


import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { Child, Parent, AttendanceRecord, Guardian, Notification, User } from '@/types';

// Enable noisy API logging only in dev
const IS_DEV = import.meta.env.DEV;

// API Response Types
interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Helper to avoid logging sensitive fields in request bodies
const sanitizeBodyForLog = (body: unknown) => {
  try {
    if (typeof body === 'string') {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object') {
        const clone: any = { ...parsed };
        if ('password' in clone) delete clone.password;
        if ('invitation_token' in clone) delete clone.invitation_token;
        if ('invitationToken' in clone) delete clone.invitationToken;
        return clone;
      }
    }
  } catch {
    // ignore JSON parse errors for logging
  }
  return undefined;
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to handle API errors
const handleApiError = async (response: Response): Promise<never> => {
  const error: ApiError = {
    message: 'An error occurred',
    status: response.status,
  };

  try {
    const data = await response.json();
    error.message = data.message || error.message;
    error.errors = data.errors;
  } catch {
    error.message = response.statusText || error.message;
  }

  throw error;
};

// Base fetch wrapper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestInit: RequestInit = {
    ...options,
    headers,
    credentials: 'omit', // Explicitly omit credentials to avoid CORS issues
  };

  if (IS_DEV) {
    console.debug('[API request]', {
      method: requestInit.method || 'GET',
      url,
      body: sanitizeBodyForLog(requestInit.body),
    });
  }

  try {
    const response = await fetch(url, requestInit);

    if (IS_DEV) {
      console.debug('[API response]', {
        url,
        status: response.status,
        ok: response.ok,
      });
    }

    if (!response.ok) {
      if (IS_DEV) {
        const errorText = await response.clone().text().catch(() => '');
        console.error('[API error response]', {
          url,
          status: response.status,
          body: errorText,
        });
      }

      // Handle 401 specifically - clear invalid token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        const errorData = await response.json().catch(() => ({ message: 'Unauthorized. Please login again.' }));
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        throw new Error(errorData.message || 'Unauthorized. Please login again.');
      }
      await handleApiError(response);
    }

    const data: ApiResponse<T> = await response.json();

    if (IS_DEV) {
      console.debug('[API data]', {
        url,
        keys: data && typeof data === 'object' ? Object.keys(data) : undefined,
      });
    }

    return data.data;
  } catch (error: any) {
    if (IS_DEV) {
      console.error('[API exception]', {
        url,
        message: error?.message,
      });
    }
    // Handle network errors (backend not running, CORS, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError: ApiError = {
        message: 'Unable to connect to server. Please ensure the backend is running.',
        status: 0,
      };
      throw networkError;
    }
    throw error;
  }
};

// Authentication API
export const authApi = {
  login: async (email: string, password: string) => {
    return apiRequest<{ token: string; requiresMFA: boolean; otpCode?: string }>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  },

  verifyMFA: async (code: string, token?: string) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add token to Authorization header if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return apiRequest<{ token: string; user: any }>(
      API_ENDPOINTS.AUTH.VERIFY_MFA,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, token }),
      }
    );
  },

  logout: async () => {
    return apiRequest(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  },

  setPassword: async (email: string, password: string, invitationToken?: string) => {
    return apiRequest<{ token: string; requiresMFA: boolean; otpCode?: string; user: any }>(
      '/auth/set-password',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, invitation_token: invitationToken }),
      }
    );
  },
};

// Parents API
export const parentsApi = {
  list: async (): Promise<Parent[]> => {
    return apiRequest<Parent[]>(API_ENDPOINTS.PARENTS.LIST);
  },

  get: async (id: string): Promise<Parent> => {
    return apiRequest<Parent>(API_ENDPOINTS.PARENTS.GET(id));
  },

  create: async (data: Partial<Parent>): Promise<Parent> => {
    return apiRequest<Parent>(API_ENDPOINTS.PARENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Parent>): Promise<Parent> => {
    return apiRequest<Parent>(API_ENDPOINTS.PARENTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.PARENTS.DELETE(id), {
      method: 'DELETE',
    });
  },
};

// Children API
export const childrenApi = {
  list: async (params?: { parent_id?: string; group?: string }): Promise<Child[]> => {
    const query = new URLSearchParams();
    if (params?.parent_id) query.append('parent_id', params.parent_id);
    if (params?.group) query.append('group', params.group);
    
    const endpoint = query.toString() 
      ? `${API_ENDPOINTS.CHILDREN.LIST}?${query.toString()}`
      : API_ENDPOINTS.CHILDREN.LIST;
    
    return apiRequest<Child[]>(endpoint);
  },

  get: async (id: string): Promise<Child> => {
    return apiRequest<Child>(API_ENDPOINTS.CHILDREN.GET(id));
  },

  create: async (data: Partial<Child>): Promise<Child> => {
    return apiRequest<Child>(API_ENDPOINTS.CHILDREN.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Child>): Promise<Child> => {
    return apiRequest<Child>(API_ENDPOINTS.CHILDREN.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getPending: async (): Promise<Child[]> => {
    return apiRequest<Child[]>(API_ENDPOINTS.CHILDREN.PENDING);
  },

  approve: async (id: string): Promise<Child> => {
    return apiRequest<Child>(API_ENDPOINTS.CHILDREN.APPROVE(id), {
      method: 'POST',
    });
  },

  reject: async (id: string, reason: string): Promise<Child> => {
    return apiRequest<Child>(API_ENDPOINTS.CHILDREN.REJECT(id), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// Guardians API
export const guardiansApi = {
  list: async (childId?: string): Promise<Guardian[]> => {
    const endpoint = childId 
      ? API_ENDPOINTS.GUARDIANS.BY_CHILD(childId)
      : API_ENDPOINTS.GUARDIANS.LIST;
    
    return apiRequest<Guardian[]>(endpoint);
  },

  create: async (data: Partial<Guardian>): Promise<Guardian> => {
    return apiRequest<Guardian>(API_ENDPOINTS.GUARDIANS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  renew: async (id: string, days: number = 90): Promise<Guardian> => {
    return apiRequest<Guardian>(API_ENDPOINTS.GUARDIANS.RENEW(id), {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.GUARDIANS.DELETE(id), {
      method: 'DELETE',
    });
  },
};

// Check-In API
export const checkInApi = {
  scanQR: async (qrData: string) => {
    return apiRequest<{ child: Child; guardians: Guardian[] }>(
      API_ENDPOINTS.CHECKIN.SCAN_QR,
      {
        method: 'POST',
        body: JSON.stringify({ qr_data: qrData }),
      }
    );
  },

  manual: async (parentId: string) => {
    return apiRequest<{ otp_sent: boolean; expires_at: string }>(
      API_ENDPOINTS.CHECKIN.MANUAL,
      {
        method: 'POST',
        body: JSON.stringify({ parent_id: parentId }),
      }
    );
  },

  verifyOTP: async (otp: string, parentId: string) => {
    return apiRequest<{ child: Child; guardians: Guardian[] }>(
      API_ENDPOINTS.CHECKIN.VERIFY_OTP,
      {
        method: 'POST',
        body: JSON.stringify({ otp, parent_id: parentId }),
      }
    );
  },

  generateQR: async (childId: string) => {
    return apiRequest<{ qr_code: string; expires_at: string }>(
      API_ENDPOINTS.CHECKIN.GENERATE_QR,
      {
        method: 'POST',
        body: JSON.stringify({ child_id: childId }),
      }
    );
  },

  confirm: async (childId: string, method: 'qr' | 'otp' | 'manual') => {
    return apiRequest<{ success: boolean; check_in_time: string }>(
      API_ENDPOINTS.CHECKIN.SCAN_QR,
      {
        method: 'POST',
        body: JSON.stringify({ child_id: childId, method }),
      }
    );
  },
};

// Check-Out API
export const checkOutApi = {
  sendNotification: async (childId: string) => {
    return apiRequest<{
      teacher_qr: string;
      parent_qr: string;
      otp: string;
      expires_at: string;
    }>(API_ENDPOINTS.CHECKOUT.SEND_NOTIFICATION(childId), {
      method: 'POST',
    });
  },

  verifyPickup: async (data: {
    childId: string;
    code?: string;
    qrData?: string;
  }) => {
    return apiRequest<{ verified: boolean; guardian?: Guardian }>(
      API_ENDPOINTS.CHECKOUT.VERIFY_PICKUP,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  generatePickupCode: async (childId: string) => {
    return apiRequest<{ qr_code: string; otp: string; expires_at: string }>(
      API_ENDPOINTS.CHECKOUT.GENERATE_PICKUP_CODE(childId),
      {
        method: 'POST',
      }
    );
  },

  release: async (childId: string, guardianId: string, otp: string) => {
    return apiRequest<{ success: boolean; check_out_time: string }>(
      API_ENDPOINTS.CHECKOUT.RELEASE(childId),
      {
        method: 'POST',
        body: JSON.stringify({ guardian_id: guardianId, otp }),
      }
    );
  },
};

// Attendance API
export const attendanceApi = {
  list: async (params?: { child_id?: string; group?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.child_id) query.append('child_id', params.child_id);
    if (params?.group) query.append('group', params.group);
    if (params?.date) query.append('date', params.date);
    
    const endpoint = query.toString()
      ? `${API_ENDPOINTS.ATTENDANCE.LIST}?${query.toString()}`
      : API_ENDPOINTS.ATTENDANCE.LIST;
    
    return apiRequest<AttendanceRecord[]>(endpoint);
  },

  submit: async (data: {
    date: string;
    group: string;
    children: Array<{ child_id: string; present: boolean }>;
    notes?: string;
  }) => {
    return apiRequest<{ success: boolean }>(API_ENDPOINTS.ATTENDANCE.SUBMIT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Notifications API
export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    return apiRequest<Notification[]>(API_ENDPOINTS.NOTIFICATIONS.LIST);
  },

  getUnreadCount: async (): Promise<number> => {
    return apiRequest<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT).then(
      (res) => res.count
    );
  },

  markRead: async (id: string) => {
    return apiRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {
      method: 'POST',
    });
  },

  markAllRead: async () => {
    return apiRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
      method: 'POST',
    });
  },
};

// Groups API
export const groupsApi = {
  list: async () => {
    return apiRequest<string[]>(API_ENDPOINTS.GROUPS.LIST);
  },

  getStats: async (groupId: string) => {
    return apiRequest<{ count: number; attendance_rate: number }>(
      API_ENDPOINTS.GROUPS.STATS(groupId)
    );
  },
};

// Reports API
export const reportsApi = {
  getAttendance: async (params?: { period?: string; group?: string }) => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.group) query.append('group', params.group);
    
    const endpoint = query.toString()
      ? `${API_ENDPOINTS.REPORTS.ATTENDANCE}?${query.toString()}`
      : API_ENDPOINTS.REPORTS.ATTENDANCE;
    
    return apiRequest<any>(endpoint);
  },

  export: async (format: 'csv' | 'excel', params?: Record<string, string>) => {
    const query = new URLSearchParams({ format, ...params });
    const endpoint = `${API_ENDPOINTS.REPORTS.EXPORT(format)}?${query.toString()}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report.${format === 'csv' ? 'csv' : 'xlsx'}`;
    a.click();
  },
};

// Users API
export const usersApi = {
  listByRole: async (role: string): Promise<User[]> => {
    return apiRequest<User[]>(API_ENDPOINTS.USERS.BY_ROLE(role));
  },
  
  create: async (data: { 
    name: string; 
    email: string; 
    role: string;
    sendEmail?: boolean;
    customEmailMessage?: string;
  }): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.USERS.LIST, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  resendInvitation: async (email: string): Promise<void> => {
    return apiRequest<void>(`${API_ENDPOINTS.USERS.LIST}/resend-invitation`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  suspend: async (id: string): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.USERS.SUSPEND(id), {
      method: 'POST',
    });
  },
  
  activate: async (id: string): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.USERS.ACTIVATE(id), {
      method: 'POST',
    });
  },
  
  updateProfile: async (data: { 
    name?: string;
    phone?: string;
    address?: string;
  }): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.USERS.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  get: async (id: string): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.USERS.GET(id));
  },
  
  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.USERS.DELETE(id), {
      method: 'DELETE',
    });
  },
};

// Audit API
export const auditApi = {
  list: async (params?: { action?: string; user_id?: string; date_from?: string; date_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.user_id) query.append('user_id', params.user_id);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    
    const endpoint = query.toString()
      ? `${API_ENDPOINTS.AUDIT.LIST}?${query.toString()}`
      : API_ENDPOINTS.AUDIT.LIST;
    
    return apiRequest<any[]>(endpoint);
  },
};

// Analytics API
export const analyticsApi = {
  getGroupAnalytics: async (groupName: string) => {
    return apiRequest<{
      group_name: string;
      total_sessions: number;
      students_count: number;
      attendance_trend: Array<{
        week: string;
        present: number;
        absent: number;
        rate: number;
      }>;
      avg_attendance_rate: number;
      growth_metrics: {
        new_students_this_month: number;
        attendance_improvement: number;
      };
    }>(API_ENDPOINTS.ANALYTICS.GROUP(groupName));
  },

  getTeacherAnalytics: async () => {
    return apiRequest<Array<{
      group_name: string;
      group_id: string;
      students_count: number;
      total_sessions: number;
      avg_attendance_rate: number;
    }>>(API_ENDPOINTS.ANALYTICS.TEACHER);
  },

  getAdminAnalytics: async () => {
    return apiRequest<Array<{
      group_name: string;
      group_id: string;
      teacher_id: string | null;
      teacher_name: string;
      students_count: number;
      total_sessions: number;
      avg_attendance_rate: number;
    }>>(API_ENDPOINTS.ANALYTICS.ADMIN);
  },

  getChildAnalytics: async (childId: string) => {
    return apiRequest<{
      child_id: string;
      child_name: string;
      group: string;
      total_sessions: number;
      attendance_rate: number;
      attendance_trend: Array<{
        week: string;
        sessions_attended: number;
      }>;
      recent_sessions: any[];
    }>(API_ENDPOINTS.ANALYTICS.CHILD(childId));
  },
};

// Sessions/Events API
export const sessionsApi = {
  list: async (params?: { group_id?: string; date?: string; year?: number; month?: number }) => {
    const query = new URLSearchParams();
    if (params?.group_id) query.append('group_id', params.group_id);
    if (params?.date) query.append('date', params.date);
    if (params?.year) query.append('year', params.year.toString());
    if (params?.month) query.append('month', params.month.toString());
    
    const endpoint = query.toString()
      ? `${API_ENDPOINTS.SESSIONS.LIST}?${query.toString()}`
      : API_ENDPOINTS.SESSIONS.LIST;
    
    return apiRequest<any[]>(endpoint);
  },

  create: async (data: {
    title: string;
    description?: string;
    session_date: string;
    start_time?: string;
    end_time?: string;
    group_id?: string;
    teacher_id?: string;
    session_type?: 'Regular' | 'Special Event' | 'Holiday' | 'Outing';
    is_recurring?: boolean;
    recurrence_pattern?: string;
    location?: string;
  }) => {
    return apiRequest<any>(API_ENDPOINTS.SESSIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<any>) => {
    return apiRequest<any>(API_ENDPOINTS.SESSIONS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(API_ENDPOINTS.SESSIONS.DELETE(id), {
      method: 'DELETE',
    });
  },
};


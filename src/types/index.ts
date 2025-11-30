export type UserRole = 'admin' | 'teacher' | 'parent' | 'teen';

export type GroupName = 'Little Angels' | 'Saints' | 'Disciples' | 'Trendsetters';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  status?: 'active' | 'pending_password' | 'suspended' | 'inactive';
  phone?: string;
  address?: string;
  profileUpdated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Guardian {
  id: string;
  name: string;
  relationship: 'Primary' | 'Secondary';
  status: 'active' | 'expired';
  expiresAt?: string;
}

export interface Child {
  id: string;
  registrationId: string;
  name: string;
  age: number;
  dateOfBirth: string;
  group: GroupName;
  guardians: Guardian[];
  parentId: string;
  status: 'active' | 'pending' | 'rejected';
  photoUrl?: string;
  gender?: 'Male' | 'Female' | 'Other';
  submittedBy?: 'parent' | 'teacher';
  submittedAt?: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  childrenCount: number;
  status: 'active' | 'inactive';
}

export interface AttendanceRecord {
  id: string;
  date: string;
  group: GroupName;
  present: number;
  absent: number;
  teacher: string;
}

export interface CheckInRecord {
  childId: string;
  checkedInAt: string;
  checkedInBy: string;
  method: 'qr' | 'otp' | 'manual';
}

export interface Notification {
  id: string;
  type: 'approval' | 'checkin' | 'checkout' | 'pickup' | 'rejection' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

import { Child, Parent, AttendanceRecord, GroupName } from '@/types';

export const mockChildren: Child[] = [
  {
    id: '1',
    registrationId: 'RS073/01',
    name: 'Maria',
    age: 5,
    group: 'Little Angels',
    parentId: '3',
    guardians: [
      { id: 'g1', name: 'Ana', relationship: 'Primary', status: 'active' },
      { id: 'g2', name: 'John', relationship: 'Secondary', status: 'active', expiresAt: '2025-02-28' },
      { id: 'g3', name: 'Luis', relationship: 'Secondary', status: 'expired' },
    ]
  },
  {
    id: '2',
    registrationId: 'RS073/02',
    name: 'David',
    age: 8,
    group: 'Saints',
    parentId: '3',
    guardians: [
      { id: 'g1', name: 'Ana', relationship: 'Primary', status: 'active' },
      { id: 'g2', name: 'John', relationship: 'Secondary', status: 'active', expiresAt: '2025-02-28' },
    ]
  },
  {
    id: '3',
    registrationId: 'RS074/01',
    name: 'Emma',
    age: 12,
    group: 'Disciples',
    parentId: '5',
    guardians: [
      { id: 'g4', name: 'Sarah', relationship: 'Primary', status: 'active' },
    ]
  },
  {
    id: '4',
    registrationId: 'RS075/01',
    name: 'Lucas',
    age: 15,
    group: 'Trendsetters',
    parentId: '6',
    guardians: [
      { id: 'g5', name: 'Michael', relationship: 'Primary', status: 'active' },
      { id: 'g6', name: 'Jennifer', relationship: 'Secondary', status: 'active' },
    ]
  },
];

export const mockParents: Parent[] = [
  { id: '3', name: 'John Parent', email: 'john@example.com', childrenCount: 2, status: 'active' },
  { id: '5', name: 'Sarah Wilson', email: 'sarah@example.com', childrenCount: 1, status: 'active' },
  { id: '6', name: 'Michael Brown', email: 'michael@example.com', childrenCount: 1, status: 'active' },
  { id: '7', name: 'Emily Davis', email: 'emily@example.com', childrenCount: 3, status: 'inactive' },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: '1', date: '2025-01-26', group: 'Little Angels', present: 12, absent: 3, teacher: 'Sarah Teacher' },
  { id: '2', date: '2025-01-26', group: 'Saints', present: 15, absent: 2, teacher: 'Mark Wilson' },
  { id: '3', date: '2025-01-26', group: 'Disciples', present: 10, absent: 4, teacher: 'Lisa Brown' },
  { id: '4', date: '2025-01-26', group: 'Trendsetters', present: 8, absent: 1, teacher: 'David Lee' },
  { id: '5', date: '2025-01-19', group: 'Little Angels', present: 14, absent: 1, teacher: 'Sarah Teacher' },
  { id: '6', date: '2025-01-19', group: 'Saints', present: 13, absent: 4, teacher: 'Mark Wilson' },
  { id: '7', date: '2025-01-12', group: 'Little Angels', present: 11, absent: 4, teacher: 'Sarah Teacher' },
  { id: '8', date: '2025-01-12', group: 'Saints', present: 16, absent: 1, teacher: 'Mark Wilson' },
];

export const groups: GroupName[] = ['Little Angels', 'Saints', 'Disciples', 'Trendsetters'];

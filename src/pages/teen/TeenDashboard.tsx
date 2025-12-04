import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { TeenSidebar } from '@/components/TeenSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceApi } from '@/services/api';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent';
  checkInTime?: string;
}

export default function TeenDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendance();
  }, [user]);

  const loadAttendance = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Fetch attendance records for this teen user
      // Note: Teens are stored as children in the system, so we need to get their child record first
      // For now, fetch all attendance - in production, filter by user's linked_child_id
      const records = await attendanceApi.list();
      
      // Transform API data to component format
      const formattedRecords: AttendanceRecord[] = records.map((record: any) => ({
        date: record.date || record.created_at?.split('T')[0] || '',
        status: record.present ? 'present' : 'absent',
        checkInTime: record.check_in_time || record.checkInTime,
      }));
      
      setAttendance(formattedRecords);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const presentCount = attendance.filter(r => r.status === 'present').length;
  const totalCount = attendance.length;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <TeenSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Teen Dashboard</h1>
            <p className="text-muted-foreground">
          Welcome, {user?.name}. View your attendance record below.
        </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="border border-border rounded-md p-6 bg-background shadow-sm text-center">
              <p className="text-sm text-muted-foreground mb-2">Attendance Rate</p>
              <p className="text-3xl font-semibold">{Math.round((presentCount / totalCount) * 100)}%</p>
            </div>
            <div className="border border-border rounded-md p-6 bg-background shadow-sm text-center">
              <p className="text-sm text-muted-foreground mb-2">Sessions</p>
              <p className="text-3xl font-semibold">{presentCount}/{totalCount}</p>
          </div>
        </div>

          <div className="border border-border rounded-md p-6 mb-8 bg-background shadow-sm text-center">
            <p className="text-sm text-muted-foreground mb-2">Your Group</p>
            <p className="text-xl font-semibold mb-2">Trendsetters</p>
            <p className="text-sm text-muted-foreground">
            Sundays at 9:30 AM • Room 205
          </p>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Recent Attendance</h3>
            {loading ? (
              <div className="border border-border rounded-md p-12 text-center bg-background shadow-sm">
                <p className="text-muted-foreground">Loading attendance...</p>
              </div>
            ) : attendance.length === 0 ? (
              <div className="border border-border rounded-md p-12 text-center bg-background shadow-sm">
                <p className="text-muted-foreground">No attendance records yet</p>
              </div>
            ) : (
            <div className="border border-border rounded-md divide-y divide-border bg-background shadow-sm">
            {attendance.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                <div>
                    <p className="font-semibold">{record.date}</p>
                  {record.checkInTime !== '-' && (
                      <p className="text-sm text-muted-foreground mt-1">
                      Check-in: {record.checkInTime}
                    </p>
                  )}
                </div>
                <span className={`status-badge ${
                  record.status === 'present' 
                      ? 'bg-foreground text-background border border-foreground' 
                      : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
            </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

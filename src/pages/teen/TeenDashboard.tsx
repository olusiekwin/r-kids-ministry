import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';

const mockTeenAttendance = [
  { date: '2025-01-26', status: 'present', checkInTime: '09:30' },
  { date: '2025-01-19', status: 'present', checkInTime: '09:25' },
  { date: '2025-01-12', status: 'absent', checkInTime: '-' },
  { date: '2025-01-05', status: 'present', checkInTime: '09:35' },
  { date: '2024-12-29', status: 'present', checkInTime: '09:28' },
];

export default function TeenDashboard() {
  const { user } = useAuth();

  const presentCount = mockTeenAttendance.filter(r => r.status === 'present').length;
  const totalCount = mockTeenAttendance.length;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Teen Dashboard</h2>
        
        <p className="text-sm text-muted-foreground mb-6">
          Welcome, {user?.name}. View your attendance record below.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-border rounded-sm p-4">
            <p className="text-sm text-muted-foreground">Attendance Rate</p>
            <p className="text-3xl font-medium">{Math.round((presentCount / totalCount) * 100)}%</p>
          </div>
          <div className="border border-border rounded-sm p-4">
            <p className="text-sm text-muted-foreground">Sessions</p>
            <p className="text-3xl font-medium">{presentCount}/{totalCount}</p>
          </div>
        </div>

        <div className="border border-border rounded-sm p-4 mb-6">
          <p className="text-sm text-muted-foreground">Your Group</p>
          <p className="text-lg font-medium">Trendsetters</p>
          <p className="text-sm text-muted-foreground mt-2">
            Sundays at 9:30 AM • Room 205
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Recent Attendance</h3>
          <div className="border border-border rounded-sm divide-y divide-border">
            {mockTeenAttendance.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{record.date}</p>
                  {record.checkInTime !== '-' && (
                    <p className="text-sm text-muted-foreground">
                      Check-in: {record.checkInTime}
                    </p>
                  )}
                </div>
                <span className={`status-badge ${
                  record.status === 'present' 
                    ? 'bg-muted text-success' 
                    : 'bg-muted text-destructive'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

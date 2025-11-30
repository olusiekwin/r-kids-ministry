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
      
      <main className="container py-8">
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
            <div className="border border-border rounded-md divide-y divide-border bg-background shadow-sm">
            {mockTeenAttendance.map((record, index) => (
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
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

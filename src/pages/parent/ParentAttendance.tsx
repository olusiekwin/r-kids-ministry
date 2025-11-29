import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { mockChildren } from '@/data/mockData';

// Mock attendance history for parent's children
const mockChildAttendance = [
  { date: '2025-01-26', childId: 'RS073/01', childName: 'Maria', status: 'present', checkInTime: '09:15', checkOutTime: '11:30' },
  { date: '2025-01-26', childId: 'RS073/02', childName: 'David', status: 'present', checkInTime: '09:18', checkOutTime: '11:32' },
  { date: '2025-01-19', childId: 'RS073/01', childName: 'Maria', status: 'present', checkInTime: '09:22', checkOutTime: '11:28' },
  { date: '2025-01-19', childId: 'RS073/02', childName: 'David', status: 'absent', checkInTime: '-', checkOutTime: '-' },
  { date: '2025-01-12', childId: 'RS073/01', childName: 'Maria', status: 'present', checkInTime: '09:10', checkOutTime: '11:25' },
  { date: '2025-01-12', childId: 'RS073/02', childName: 'David', status: 'present', checkInTime: '09:12', checkOutTime: '11:27' },
];

export default function ParentAttendance() {
  const navigate = useNavigate();
  const myChildren = mockChildren.filter(child => child.parentId === '3');

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Attendance History</h2>
        
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {myChildren.map((child) => {
            const childRecords = mockChildAttendance.filter(r => r.childId === child.registrationId);
            const presentCount = childRecords.filter(r => r.status === 'present').length;
            const totalCount = childRecords.length;
            
            return (
              <div key={child.id} className="border border-border rounded-sm p-4">
                <p className="text-sm text-muted-foreground">{child.name}</p>
                <p className="text-2xl font-medium">{presentCount}/{totalCount}</p>
                <p className="text-xs text-muted-foreground">Sessions attended</p>
              </div>
            );
          })}
        </div>

        {/* Attendance Table */}
        <div className="border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Child</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Check-In</th>
                  <th className="table-header">Check-Out</th>
                </tr>
              </thead>
              <tbody>
                {mockChildAttendance.map((record, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="table-cell">{record.date}</td>
                    <td className="table-cell">
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {record.childId}
                      </span>
                      {record.childName}
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${
                        record.status === 'present' 
                          ? 'bg-muted text-success' 
                          : 'bg-muted text-destructive'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-sm">{record.checkInTime}</td>
                    <td className="table-cell font-mono text-sm">{record.checkOutTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button onClick={() => navigate('/parent')} className="btn-secondary mt-6">
          [Back to Dashboard]
        </button>
      </main>

      <MobileNav />
    </div>
  );
}

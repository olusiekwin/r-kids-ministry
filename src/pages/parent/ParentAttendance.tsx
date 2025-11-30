import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { childrenApi, attendanceApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Child } from '@/types';

export default function ParentAttendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [childrenData, attendanceData] = await Promise.all([
        childrenApi.list({ parent_id: user!.id }),
        attendanceApi.list({ child_id: user!.id }),
      ]);
      setChildren(childrenData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setChildren([]);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Attendance History</h1>
          <p className="text-muted-foreground">View your children's attendance records</p>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading attendance...</p>
          </div>
        ) : (
          <>
            {children.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {children.map((child) => {
                  const childRecords = attendance.filter((r: any) => r.childId === child.id);
                  const presentCount = childRecords.filter((r: any) => r.status === 'present').length;
            const totalCount = childRecords.length;
            
            return (
                    <div key={child.id} className="border border-border rounded-md p-4 bg-background shadow-sm">
                <p className="text-sm text-muted-foreground">{child.name}</p>
                      <p className="text-2xl font-semibold">{presentCount}/{totalCount}</p>
                <p className="text-xs text-muted-foreground">Sessions attended</p>
              </div>
            );
          })}
        </div>
            )}

            {attendance.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No attendance records found</p>
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden bg-background shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
                    <thead>
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Child</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Check-In</th>
                  <th className="table-header">Check-Out</th>
                </tr>
              </thead>
              <tbody>
                      {attendance.map((record: any, index: number) => (
                        <tr key={index} className="hover:bg-muted/30 transition-colors border-b border-border last:border-0">
                    <td className="table-cell">{record.date}</td>
                    <td className="table-cell">
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {record.childId}
                      </span>
                            {record.childName || 'N/A'}
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${
                        record.status === 'present' 
                                ? 'bg-foreground text-background border border-foreground' 
                                : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                          <td className="table-cell font-mono text-sm">{record.checkInTime || '-'}</td>
                          <td className="table-cell font-mono text-sm">{record.checkOutTime || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
            )}
          </>
        )}

        <button onClick={() => navigate('/parent')} className="btn-secondary mt-6">
          Back to Dashboard
        </button>
      </main>

      <MobileNav />
    </div>
  );
}

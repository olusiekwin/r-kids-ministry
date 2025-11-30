import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { childrenApi, attendanceApi } from '@/services/api';
import { Child, AttendanceRecord, GroupName } from '@/types';

interface CheckInStatus {
  childId: string;
  child: Child;
  checkedIn: boolean;
  checkedInAt?: string;
  checkedOut: boolean;
  checkedOutAt?: string;
  group: GroupName;
}

export default function CheckIns() {
  const navigate = useNavigate();
  const [checkIns, setCheckIns] = useState<CheckInStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterGroup, setFilterGroup] = useState<GroupName | 'all'>('all');
  const [viewMode, setViewMode] = useState<'all' | 'checked-in' | 'not-picked-up'>('all');

  useEffect(() => {
    loadCheckIns();
  }, [selectedDate, filterGroup]);

  const loadCheckIns = async () => {
    try {
      setLoading(true);
      
      // Get all children
      const children = await childrenApi.list().catch(() => []);
      
      // Get attendance records for selected date
      const attendance = await attendanceApi.list({ date: selectedDate }).catch(() => []);
      
      // Create check-in status map
      const statusMap: Record<string, CheckInStatus> = {};
      
      children.forEach(child => {
        statusMap[child.id] = {
          childId: child.id,
          child,
          checkedIn: false,
          checkedOut: false,
          group: child.group,
        };
      });

      // Update status from attendance records
      attendance.forEach(record => {
        // This is a simplified version - in production, you'd have actual check-in/check-out records
        // For now, we'll use attendance records to infer status
        if (record.present > 0) {
          // Assume child was checked in if present count > 0
          const childIds = Object.keys(statusMap);
          childIds.forEach(childId => {
            if (statusMap[childId].group === record.group) {
              statusMap[childId].checkedIn = true;
              statusMap[childId].checkedInAt = record.date;
            }
          });
        }
      });

      let checkInsList = Object.values(statusMap);

      // Apply group filter
      if (filterGroup !== 'all') {
        checkInsList = checkInsList.filter(item => item.group === filterGroup);
      }

      setCheckIns(checkInsList);
    } catch (error) {
      console.error('Failed to load check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCheckIns = checkIns.filter(item => {
    if (viewMode === 'checked-in') {
      return item.checkedIn && !item.checkedOut;
    }
    if (viewMode === 'not-picked-up') {
      return item.checkedIn && !item.checkedOut;
    }
    return true;
  });

  const stats = {
    total: checkIns.length,
    checkedIn: checkIns.filter(c => c.checkedIn && !c.checkedOut).length,
    checkedOut: checkIns.filter(c => c.checkedOut).length,
    notCheckedIn: checkIns.filter(c => !c.checkedIn).length,
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />

      <main className="md:ml-64 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Check-In & Check-Out Tracking</h1>
          <p className="text-muted-foreground">Track children received and yet to be picked up</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Total Children</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Checked In</p>
            <p className="text-2xl font-bold text-blue-600">{stats.checkedIn}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting pickup</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Checked Out</p>
            <p className="text-2xl font-bold text-green-600">{stats.checkedOut}</p>
            <p className="text-xs text-muted-foreground mt-1">Picked up</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Not Checked In</p>
            <p className="text-2xl font-bold text-gray-600">{stats.notCheckedIn}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field"
          />
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value as any)}
            className="input-field"
          >
            <option value="all">All Groups</option>
            <option value="Little Angels">Little Angels</option>
            <option value="Saints">Saints</option>
            <option value="Disciples">Disciples</option>
            <option value="Trendsetters">Trendsetters</option>
          </select>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="input-field"
          >
            <option value="all">All Children</option>
            <option value="checked-in">Checked In (Not Picked Up)</option>
            <option value="not-picked-up">Awaiting Pickup</option>
          </select>
        </div>

        {/* Check-In Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading check-in data...</p>
          </div>
        ) : filteredCheckIns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No check-in data found for this date</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Registration ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Group</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Check-In Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Checked In At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Check-Out Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Checked Out At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCheckIns.map((item) => (
                    <tr key={item.childId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-muted-foreground">
                        {item.child.registrationId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">{item.child.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.group}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.checkedIn ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            Not Checked In
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.checkedOut ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            Checked Out
                          </span>
                        ) : item.checkedIn ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Awaiting Pickup
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.checkedOutAt ? new Date(item.checkedOutAt).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/admin/child/${item.childId}`)}
                          className="px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}


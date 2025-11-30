import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { attendanceApi, groupsApi, reportsApi, usersApi } from '@/services/api';
import { GroupName } from '@/types';

type FilterPeriod = 'daily' | 'monthly' | 'quarterly' | 'annual';

export default function Reports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<FilterPeriod>('daily');
  const [selectedGroup, setSelectedGroup] = useState<GroupName | 'all'>('all');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [teenAttendance, setTeenAttendance] = useState<any[]>([]);
  const [groups, setGroups] = useState<GroupName[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeenAttendance, setShowTeenAttendance] = useState(false);

  useEffect(() => {
    loadGroups();
    loadAttendance();
  }, [period, selectedGroup]);

  const loadGroups = async () => {
    try {
      const data = await groupsApi.list();
      setGroups(data as GroupName[]);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups(['Little Angels', 'Saints', 'Disciples', 'Trendsetters']);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getAttendance({
        period,
        group: selectedGroup !== 'all' ? selectedGroup : undefined,
      });
      setAttendance(Array.isArray(data) ? data : []);
      
      // Load teen attendance
      const teenData = await attendanceApi.list({ group: 'Trendsetters' }).catch(() => []);
      setTeenAttendance(Array.isArray(teenData) ? teenData : []);
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setAttendance([]);
      setTeenAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      await reportsApi.export(format, {
        period,
        group: selectedGroup !== 'all' ? selectedGroup : undefined,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Attendance Reports</h1>
          <p className="text-muted-foreground">View and export attendance analytics for children and teens</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setShowTeenAttendance(false)}
            className={`px-4 py-2 font-medium transition-colors ${
              !showTeenAttendance
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Children Attendance
          </button>
          <button
            onClick={() => setShowTeenAttendance(true)}
            className={`px-4 py-2 font-medium transition-colors ${
              showTeenAttendance
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Teen Attendance
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as FilterPeriod)}
              className="input-field"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
        </div>

          <div>
            <label className="block text-sm font-medium mb-2">Group:</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as GroupName | 'all')}
              className="input-field"
          >
            <option value="all">All Groups</option>
            {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
            ))}
          </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => handleExport('csv')} className="btn-secondary">
            Export CSV
          </button>
          <button onClick={() => handleExport('excel')} className="btn-secondary">
            Export Excel
          </button>
          <button onClick={handlePrint} className="btn-secondary">
            Print Report
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        ) : showTeenAttendance ? (
          // Teen Attendance Section
          teenAttendance.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No teen attendance data found</p>
            </div>
          ) : (
            <div className="border border-border rounded-md overflow-hidden bg-background shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Date</th>
                      <th className="table-header">Teen Name</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Check-In Time</th>
                      <th className="table-header">Check-Out Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teenAttendance.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors border-b border-border last:border-0">
                        <td className="table-cell">{record.date}</td>
                        <td className="table-cell">{record.teenName || 'N/A'}</td>
                        <td className="table-cell">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.present
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {record.present ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td className="table-cell">{record.checkInTime || 'N/A'}</td>
                        <td className="table-cell">{record.checkOutTime || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : attendance.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No attendance data found</p>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden bg-background shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Group</th>
                    <th className="table-header">Present</th>
                    <th className="table-header">Absent</th>
                    <th className="table-header">Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors border-b border-border last:border-0">
                      <td className="table-cell">{record.date}</td>
                      <td className="table-cell">{record.group}</td>
                      <td className="table-cell">{record.present}</td>
                      <td className="table-cell">{record.absent}</td>
                      <td className="table-cell">{record.teacher}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/admin')} className="btn-secondary mt-6">
            Back to Dashboard
          </button>
      </main>

      <MobileNav />
    </div>
  );
}

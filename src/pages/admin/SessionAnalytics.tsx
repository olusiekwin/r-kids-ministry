import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { sessionsApi, sessionBookingsApi, groupsApi } from '@/services/api';
import { toast } from '@/components/ui/sonner';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  Filter,
  Download,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  group_name?: string;
  teacher_name?: string;
  session_type: string;
  status?: 'scheduled' | 'active' | 'ended' | 'cancelled';
  started_at?: string;
  ended_at?: string;
}

interface SessionAnalytics {
  session: Session;
  totalBookings: number;
  checkedIn: number;
  checkedOut: number;
  attendanceRate: number;
  averageCheckInTime?: string;
  averageCheckOutTime?: string;
  duration?: number; // in minutes
  bookings: any[];
}

export default function SessionAnalytics() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [analytics, setAnalytics] = useState<SessionAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ended' | 'all'>('ended');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionAnalytics | null>(null);

  useEffect(() => {
    loadGroups();
    loadSessions();
  }, [filterStatus, filterGroup, dateRange]);

  useEffect(() => {
    if (sessions.length > 0) {
      loadAnalytics();
    }
  }, [sessions]);

  const loadGroups = async () => {
    try {
      const data = await groupsApi.list();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filterGroup !== 'all') {
        params.group_id = filterGroup;
      }
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      params.year = startDate.getFullYear();
      params.month = startDate.getMonth() + 1;
      
      const data = await sessionsApi.list(params);
      let filtered = Array.isArray(data) ? data : [];
      
      // Filter by status
      if (filterStatus === 'ended') {
        filtered = filtered.filter(s => s.status === 'ended');
      }
      
      // Sort by date (most recent first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.session_date).getTime();
        const dateB = new Date(b.session_date).getTime();
        return dateB - dateA;
      });
      
      setSessions(filtered);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData: SessionAnalytics[] = [];
      
      for (const session of sessions) {
        try {
          const bookings = await sessionBookingsApi.listBySession(session.id);
          const bookingsArray = Array.isArray(bookings) ? bookings : [];
          
          const checkedIn = bookingsArray.filter(b => b.status === 'checked_in' || b.status === 'checked_out').length;
          const checkedOut = bookingsArray.filter(b => b.status === 'checked_out').length;
          const totalBookings = bookingsArray.length;
          const attendanceRate = totalBookings > 0 ? (checkedIn / totalBookings) * 100 : 0;
          
          // Calculate average check-in time
          const checkedInBookings = bookingsArray.filter(b => b.checked_in_at);
          let averageCheckInTime: string | undefined;
          if (checkedInBookings.length > 0 && session.start_time) {
            const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
            const totalDelay = checkedInBookings.reduce((sum, b) => {
              if (b.checked_in_at) {
                const checkInTime = new Date(b.checked_in_at);
                const delay = checkInTime.getTime() - sessionStart.getTime();
                return sum + delay;
              }
              return sum;
            }, 0);
            const avgDelay = totalDelay / checkedInBookings.length;
            const avgMinutes = Math.round(avgDelay / (1000 * 60));
            averageCheckInTime = avgMinutes > 0 ? `${avgMinutes} min late` : 'On time';
          }
          
          // Calculate average check-out time
          const checkedOutBookings = bookingsArray.filter(b => b.checked_out_at);
          let averageCheckOutTime: string | undefined;
          if (checkedOutBookings.length > 0 && session.end_time) {
            const sessionEnd = new Date(`${session.session_date}T${session.end_time}`);
            const totalDelay = checkedOutBookings.reduce((sum, b) => {
              if (b.checked_out_at) {
                const checkOutTime = new Date(b.checked_out_at);
                const delay = checkOutTime.getTime() - sessionEnd.getTime();
                return sum + delay;
              }
              return sum;
            }, 0);
            const avgDelay = totalDelay / checkedOutBookings.length;
            const avgMinutes = Math.round(avgDelay / (1000 * 60));
            averageCheckOutTime = avgMinutes > 0 ? `${avgMinutes} min late` : 'On time';
          }
          
          // Calculate session duration
          let duration: number | undefined;
          if (session.started_at && session.ended_at) {
            const start = new Date(session.started_at);
            const end = new Date(session.ended_at);
            duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
          } else if (session.start_time && session.end_time) {
            const start = new Date(`${session.session_date}T${session.start_time}`);
            const end = new Date(`${session.session_date}T${session.end_time}`);
            duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
          }
          
          analyticsData.push({
            session,
            totalBookings,
            checkedIn,
            checkedOut,
            attendanceRate,
            averageCheckInTime,
            averageCheckOutTime,
            duration,
            bookings: bookingsArray,
          });
        } catch (error) {
          console.error(`Failed to load analytics for session ${session.id}:`, error);
        }
      }
      
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Session', 'Date', 'Group', 'Total Bookings', 'Checked In', 'Checked Out', 'Attendance Rate', 'Duration (min)'];
    const rows = analytics.map(a => [
      a.session.title,
      new Date(a.session.session_date).toLocaleDateString(),
      a.session.group_name || '-',
      a.totalBookings.toString(),
      a.checkedIn.toString(),
      a.checkedOut.toString(),
      `${a.attendanceRate.toFixed(1)}%`,
      a.duration?.toString() || '-',
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Analytics exported successfully!');
  };

  const overallStats = analytics.reduce((acc, a) => {
    acc.totalSessions += 1;
    acc.totalBookings += a.totalBookings;
    acc.totalCheckedIn += a.checkedIn;
    acc.totalCheckedOut += a.checkedOut;
    acc.totalDuration += a.duration || 0;
    return acc;
  }, {
    totalSessions: 0,
    totalBookings: 0,
    totalCheckedIn: 0,
    totalCheckedOut: 0,
    totalDuration: 0,
  });

  const overallAttendanceRate = overallStats.totalBookings > 0
    ? (overallStats.totalCheckedIn / overallStats.totalBookings) * 100
    : 0;

  return (
    <div className="min-h-screen liquid-bg pb-16 md:pb-0 relative">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Session Analytics</h1>
            <p className="text-muted-foreground">Analyze finished sessions with detailed data and time metrics</p>
          </div>
          {analytics.length > 0 && (
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="glass border-2 border-border/50 rounded-xl p-4 mb-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'ended' | 'all')}
                className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="ended">Ended Sessions Only</option>
                <option value="all">All Sessions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Group</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id || group} value={group.id || group}>
                    {group.name || group}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="week">Last Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('ended');
                  setFilterGroup('all');
                  setDateRange('month');
                }}
                className="w-full px-4 py-2 glass border border-border/50 rounded-xl hover:shadow-lg transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        {analytics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="glass border-2 border-border/50 rounded-xl p-4 shadow-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Sessions</div>
              <div className="text-2xl font-bold">{overallStats.totalSessions}</div>
            </div>
            <div className="glass border-2 border-border/50 rounded-xl p-4 shadow-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Bookings</div>
              <div className="text-2xl font-bold">{overallStats.totalBookings}</div>
            </div>
            <div className="glass border-2 border-border/50 rounded-xl p-4 shadow-lg">
              <div className="text-sm text-muted-foreground mb-1">Checked In</div>
              <div className="text-2xl font-bold text-green-600">{overallStats.totalCheckedIn}</div>
            </div>
            <div className="glass border-2 border-border/50 rounded-xl p-4 shadow-lg">
              <div className="text-sm text-muted-foreground mb-1">Attendance Rate</div>
              <div className="text-2xl font-bold">{overallAttendanceRate.toFixed(1)}%</div>
            </div>
            <div className="glass border-2 border-border/50 rounded-xl p-4 shadow-lg">
              <div className="text-sm text-muted-foreground mb-1">Avg Duration</div>
              <div className="text-2xl font-bold">
                {overallStats.totalSessions > 0
                  ? Math.round(overallStats.totalDuration / overallStats.totalSessions)
                  : 0} min
              </div>
            </div>
          </div>
        )}

        {/* Analytics Table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : analytics.length === 0 ? (
          <div className="text-center py-12 glass border-2 border-border/50 rounded-xl">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No session data available for the selected filters</p>
          </div>
        ) : (
          <div className="glass border-2 border-border/50 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Session</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Group</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Bookings</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Checked In</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Checked Out</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Attendance</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {analytics.map((analyticsItem) => (
                    <tr key={analyticsItem.session.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{analyticsItem.session.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {analyticsItem.session.session_type}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(analyticsItem.session.session_date).toLocaleDateString()}</span>
                        </div>
                        {analyticsItem.session.start_time && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {analyticsItem.session.start_time}
                              {analyticsItem.session.end_time && ` - ${analyticsItem.session.end_time}`}
                            </span>
                          </div>
                        )}
                        {analyticsItem.session.started_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Started: {new Date(analyticsItem.session.started_at).toLocaleString()}
                          </div>
                        )}
                        {analyticsItem.session.ended_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Ended: {new Date(analyticsItem.session.ended_at).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {analyticsItem.session.group_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{analyticsItem.totalBookings}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">{analyticsItem.checkedIn}</span>
                        </div>
                        {analyticsItem.averageCheckInTime && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Avg: {analyticsItem.averageCheckInTime}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-blue-600">{analyticsItem.checkedOut}</span>
                        </div>
                        {analyticsItem.averageCheckOutTime && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Avg: {analyticsItem.averageCheckOutTime}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{analyticsItem.attendanceRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {analyticsItem.duration ? (
                          <div className="text-sm">
                            {Math.floor(analyticsItem.duration / 60)}h {analyticsItem.duration % 60}m
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedSession(analyticsItem);
                          }}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Session Details Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-strong border border-border/50 rounded-2xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{selectedSession.session.title}</h2>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass border border-border/50 rounded-xl p-4">
                  <div className="text-sm text-muted-foreground mb-1">Date</div>
                  <div className="font-semibold">
                    {new Date(selectedSession.session.session_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="glass border border-border/50 rounded-xl p-4">
                  <div className="text-sm text-muted-foreground mb-1">Time</div>
                  <div className="font-semibold">
                    {selectedSession.session.start_time || '-'}
                    {selectedSession.session.end_time && ` - ${selectedSession.session.end_time}`}
                  </div>
                </div>
                <div className="glass border border-border/50 rounded-xl p-4">
                  <div className="text-sm text-muted-foreground mb-1">Group</div>
                  <div className="font-semibold">{selectedSession.session.group_name || '-'}</div>
                </div>
                <div className="glass border border-border/50 rounded-xl p-4">
                  <div className="text-sm text-muted-foreground mb-1">Duration</div>
                  <div className="font-semibold">
                    {selectedSession.duration
                      ? `${Math.floor(selectedSession.duration / 60)}h ${selectedSession.duration % 60}m`
                      : '-'}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Bookings Details</h3>
                <div className="glass border border-border/50 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left">Child</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Checked In</th>
                          <th className="px-4 py-2 text-left">Checked Out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedSession.bookings.map((booking: any) => (
                          <tr key={booking.id}>
                            <td className="px-4 py-2">{booking.child_name || '-'}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                booking.status === 'checked_out' ? 'bg-blue-100 text-blue-800' :
                                booking.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {booking.checked_in_at
                                ? new Date(booking.checked_in_at).toLocaleString()
                                : '-'}
                            </td>
                            <td className="px-4 py-2">
                              {booking.checked_out_at
                                ? new Date(booking.checked_out_at).toLocaleString()
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

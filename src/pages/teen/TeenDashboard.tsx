import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { TeenSidebar } from '@/components/TeenSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceApi, teensApi, sessionsApi } from '@/services/api';
import { CheckCircle2, Clock, Calendar, TrendingUp, BarChart3, Users, Award, Target, ArrowRight, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent';
  checkInTime?: string;
}

interface Session {
  id: string;
  title: string;
  session_date: string;
  start_time?: string;
  group_name?: string;
}

export default function TeenDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAttendance();
    loadTodaySessions();
  }, [user]);

  const loadTodaySessions = async () => {
    if (!user?.id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await sessionsApi.list({ date: today });
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }

    if (!selectedSession) {
      toast.error('Please select a session');
      return;
    }

    setSubmitting(true);
    try {
      await teensApi.submitAttendance({
        userId: user.id,
        sessionId: selectedSession.id,
      });
      
      toast.success('Attendance submitted successfully!');
      setShowSubmitModal(false);
      setSelectedSession(null);
      // Reload attendance to show the new record
      await loadAttendance();
    } catch (error: any) {
      console.error('Failed to submit attendance:', error);
      toast.error('Failed to submit attendance', {
        description: error.message || 'An error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Try parsing as ISO string without T separator
        const date2 = new Date(dateString.replace(' ', 'T'));
        if (isNaN(date2.getTime())) {
          return '';
        }
        return date2.toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        const date2 = new Date(dateString.replace(' ', 'T'));
        if (isNaN(date2.getTime())) {
          return '';
        }
        return date2.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return '';
    }
  };

  const loadAttendance = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Use teens API to get teen-specific attendance
      const response = await teensApi.getAttendance(user.id);
      // Backend returns { data: [...] } format, but apiRequest already extracts .data
      // So response should be the array directly
      const records = Array.isArray(response) ? response : (response?.data || []);
      
      const formattedRecords: AttendanceRecord[] = records.map((record: any) => ({
        date: record.date || formatDate(record.timestampIn) || '',
        status: record.attended !== false ? 'present' : 'absent',
        checkInTime: record.timestampIn ? formatTime(record.timestampIn) : (record.checkInTime || ''),
      }));
      
      setAttendance(formattedRecords);
    } catch (error: any) {
      // If 404 with "Teen account not linked to a child", handle gracefully
      if (error?.status === 404) {
        // Extract error message - handleApiError already extracts it to error.message
        const errorMessage = error?.message || error?.body?.error || '';
        
        if (errorMessage.includes('not linked to a child') || errorMessage.includes('Teen account not linked')) {
          // This is expected - teen account needs to be linked to a child by admin
          // Silently handle this - don't show error to user, just show empty attendance
          setAttendance([]);
          setLoading(false);
          return; // Don't try fallback if account isn't properly set up
        }
        // Other 404 errors - try fallback
        console.warn('Teens attendance endpoint not found, using fallback');
      } else {
        // Only log non-404 errors
        console.error('Failed to load attendance:', error);
      }
      // Fallback to regular attendance API (filtered by user if possible)
      try {
        const records = await attendanceApi.list();
        // apiRequest extracts .data, so records should be array
        const recordsArray = Array.isArray(records) ? records : (records?.data || []);
        const formattedRecords: AttendanceRecord[] = recordsArray.map((record: any) => ({
          date: record.date || formatDate(record.timestampIn) || formatDate(record.created_at) || '',
          status: record.timestampIn ? 'present' : 'absent',
          checkInTime: record.timestampIn ? formatTime(record.timestampIn) : (record.check_in_time || ''),
        }));
        setAttendance(formattedRecords);
      } catch (fallbackError) {
        console.error('Failed to load attendance (fallback):', fallbackError);
        setAttendance([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const presentCount = attendance.filter(r => r.status === 'present').length;
  const totalCount = attendance.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const recentAttendance = attendance.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-16 md:pb-0">
      <Header />
      <TeenSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Teen'}!</h1>
            <p className="text-muted-foreground text-lg">Track your attendance and stay connected with your group</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold">{attendanceRate}%</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Sessions Attended</p>
              <p className="text-3xl font-bold">{presentCount}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
              <p className="text-3xl font-bold">{totalCount}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Award className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Streak</p>
              <p className="text-3xl font-bold">
                {attendance.length > 0 && attendance[0].status === 'present' ? '🔥' : '0'}
              </p>
            </div>
          </div>

          {/* Group Info & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Your Group</h3>
                  <p className="text-sm text-muted-foreground">Trendsetters</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Sundays at 9:30 AM</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Room 205</span>
                </div>
          </div>
        </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <Plus className="w-6 h-6 text-green-500" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Submit Attendance</h3>
                <p className="text-sm text-muted-foreground">Mark your attendance for today's session</p>
              </button>
              
              <button
                onClick={() => navigate('/teen/attendance')}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold mb-2">View Full Attendance</h3>
                <p className="text-sm text-muted-foreground">See your complete attendance history and progress</p>
              </button>
            </div>
        </div>

          {/* Recent Attendance */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Recent Attendance</h2>
            </div>
            {loading ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Loading attendance...</p>
              </div>
            ) : attendance.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No attendance records yet</p>
                <p className="text-sm text-muted-foreground mt-2">Your attendance will appear here once you start attending sessions</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentAttendance.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        record.status === 'present' 
                          ? 'bg-green-500/10' 
                          : 'bg-muted'
                      }`}>
                        {record.status === 'present' ? (
                          <CheckCircle2 className={`w-5 h-5 ${
                            record.status === 'present' ? 'text-green-500' : 'text-muted-foreground'
                          }`} />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                <div>
                        <p className="font-semibold text-lg">
                          {record.date ? (() => {
                            try {
                              const date = new Date(record.date);
                              if (isNaN(date.getTime())) {
                                const date2 = new Date(record.date.replace(' ', 'T'));
                                if (isNaN(date2.getTime())) {
                                  return 'Invalid date';
                                }
                                return date2.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                });
                              }
                              return date.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                            } catch (e) {
                              return 'Invalid date';
                            }
                          })() : 'No date'}
                        </p>
                        {record.checkInTime && record.checkInTime !== '-' && record.checkInTime !== '' && (
                      <p className="text-sm text-muted-foreground mt-1">
                      Check-in: {record.checkInTime}
                    </p>
                  )}
                </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  record.status === 'present' 
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                      : 'bg-muted text-muted-foreground border border-border'
                }`}>
                      {record.status === 'present' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Present
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          Absent
                        </>
                      )}
                </span>
              </div>
            ))}
                {attendance.length > 5 && (
                  <div className="p-4 text-center border-t border-border">
                    <button
                      onClick={() => navigate('/teen/attendance')}
                      className="text-sm text-primary hover:underline"
                    >
                      View all {attendance.length} records →
                    </button>
                  </div>
                )}
            </div>
            )}
          </div>
        </div>
      </main>

      {/* Submit Attendance Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Submit Attendance</h2>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedSession(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {sessions.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No sessions available today</p>
                <p className="text-sm text-muted-foreground">Check back later for upcoming sessions</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Session</label>
                  <select
                    value={selectedSession?.id || ''}
                    onChange={(e) => {
                      const session = sessions.find(s => s.id === e.target.value);
                      setSelectedSession(session || null);
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="">Choose a session...</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.title} - {new Date(session.session_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                        {session.start_time && ` at ${session.start_time}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedSession && (
                  <div className="p-4 bg-muted/30 rounded-md">
                    <p className="text-sm font-medium mb-1">{selectedSession.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedSession.session_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {selectedSession.start_time && ` • ${selectedSession.start_time}`}
                    </p>
                    {selectedSession.group_name && (
                      <p className="text-xs text-muted-foreground mt-1">Group: {selectedSession.group_name}</p>
                    )}
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={!selectedSession || submitting}
                    className="flex-1 px-4 py-2 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Attendance'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSubmitModal(false);
                      setSelectedSession(null);
                    }}
                    className="px-4 py-2 border border-border rounded-md font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}

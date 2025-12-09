import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { sessionsApi, sessionBookingsApi, checkInApi, checkOutApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  LogIn,
  LogOut,
  BarChart3,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  group_id?: string;
  group_name?: string;
  room?: string;
  teacher_id?: string;
  teacher_name?: string;
  session_type: string;
  location?: string;
  gender_restriction?: 'Male' | 'Female';
}

interface EligibleChild {
  id: string;
  registration_id: string;
  name: string;
  date_of_birth: string;
  gender?: 'Male' | 'Female' | 'Other';
  group_name?: string;
  parent_registration_id?: string;
  guardian_name?: string;
}

interface Booking {
  id: string;
  session_id: string;
  child_id: string;
  child_name: string;
  registration_id: string;
  guardian_id?: string;
  guardian_name?: string;
  status: 'booked' | 'checked_in' | 'checked_out' | 'cancelled';
  qr_code?: string;
  otp_code?: string;
  booked_at: string;
  checked_in_at?: string;
  checked_out_at?: string;
}

export default function SessionDetails() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [eligibleChildren, setEligibleChildren] = useState<EligibleChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails();
      loadBookings();
    }
  }, [sessionId]);

  useEffect(() => {
    if (session) {
      loadEligibleChildren();
    }
  }, [session]);

  const loadSessionDetails = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const data = await sessionsApi.get(sessionId);
      setSession(data);
    } catch (error: any) {
      console.error('Failed to load session:', error);
      toast.error('Failed to load session', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!sessionId) return;
    
    try {
      const data = await sessionBookingsApi.listBySession(sessionId);
      setBookings(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load bookings:', error);
      toast.error('Failed to load bookings', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const loadEligibleChildren = async () => {
    if (!sessionId) return;
    
    try {
      const data = await sessionsApi.getEligibleChildren(sessionId);
      setEligibleChildren(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load eligible children:', error);
      // Don't show toast, it's optional
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return `${age} years`;
    } catch {
      return 'N/A';
    }
  };

  const handleCheckIn = async (booking: Booking) => {
    if (!user?.id) {
      toast.error('Authentication required');
      return;
    }

    setActionLoading(booking.id);
    try {
      await checkInApi.manual(booking.child_id, sessionId!, user.id);
      await loadBookings();
      toast.success('Check-in successful', {
        description: `${booking.child_name} has been checked in.`,
      });
    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast.error('Check-in failed', {
        description: error.message || 'Failed to check in child.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (booking: Booking) => {
    if (!user?.id) {
      toast.error('Authentication required');
      return;
    }

    setActionLoading(booking.id);
    try {
      await checkOutApi.release(booking.child_id, booking.guardian_id || '', '');
      await loadBookings();
      toast.success('Check-out successful', {
        description: `${booking.child_name} has been checked out.`,
      });
    } catch (error: any) {
      console.error('Check-out failed:', error);
      toast.error('Check-out failed', {
        description: error.message || 'Failed to check out child.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate metrics
  const metrics = {
    totalBookings: bookings.length,
    checkedIn: bookings.filter(b => b.status === 'checked_in').length,
    checkedOut: bookings.filter(b => b.status === 'checked_out').length,
    booked: bookings.filter(b => b.status === 'booked').length,
    attendanceRate: bookings.length > 0 
      ? ((bookings.filter(b => b.status === 'checked_in' || b.status === 'checked_out').length / bookings.length) * 100).toFixed(1)
      : '0',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Header />
        <main className="container py-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading session details...</p>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Header />
        <main className="container py-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground mb-6">The session you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/calendar')}
              className="btn-primary"
            >
              Back to Calendar
            </button>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button
            onClick={() => navigate('/calendar')}
            className="hover:text-foreground transition-colors"
          >
            Sessions
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{session.title}</span>
        </nav>

        {/* Session Header */}
        <div className="bg-background border-2 border-border rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{session.title}</h1>
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1 bg-muted rounded-full text-sm font-medium">
                  {session.session_type}
                </span>
                {session.gender_restriction && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {session.gender_restriction} Only
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="font-semibold">{new Date(session.session_date).toLocaleDateString()}</div>
              </div>
            </div>
            
            {session.start_time && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="font-semibold">
                    {session.start_time}
                    {session.end_time && ` - ${session.end_time}`}
                  </div>
                </div>
              </div>
            )}

            {session.group_name && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Group</div>
                  <div className="font-semibold">{session.group_name}</div>
                </div>
              </div>
            )}

            {session.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-semibold">{session.location}</div>
                </div>
              </div>
            )}
          </div>

          {session.description && (
            <p className="text-muted-foreground mt-4">{session.description}</p>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-background border-2 border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Bookings</div>
                <div className="text-2xl font-bold">{metrics.totalBookings}</div>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-background border-2 border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Checked In</div>
                <div className="text-2xl font-bold text-green-600">{metrics.checkedIn}</div>
              </div>
              <LogIn className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-background border-2 border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Checked Out</div>
                <div className="text-2xl font-bold text-blue-600">{metrics.checkedOut}</div>
              </div>
              <LogOut className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-background border-2 border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Attendance Rate</div>
                <div className="text-2xl font-bold">{metrics.attendanceRate}%</div>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Eligible Children (Auto-fetched based on session preferences) */}
        {eligibleChildren.length > 0 && (
          <div className="bg-background border-2 border-border rounded-xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Eligible Children ({eligibleChildren.length})
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {session.group_name && `from ${session.group_name}`}
                {session.gender_restriction && ` • ${session.gender_restriction} only`}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eligibleChildren.map((child) => {
                const booking = bookings.find(b => b.child_id === child.id);
                const isBooked = booking && ['booked', 'checked_in'].includes(booking.status);
                
                return (
                  <div
                    key={child.id}
                    className={`border-2 rounded-lg p-4 ${
                      isBooked ? 'border-green-500/50 bg-green-50/50' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-mono text-xs text-muted-foreground mb-1">
                          {child.registration_id}
                        </p>
                        <h3 className="font-semibold">{child.name}</h3>
                        <div className="text-sm text-muted-foreground mt-2 space-y-1">
                          <p><span className="font-medium">Age:</span> {calculateAge(child.dateOfBirth)}</p>
                          {child.gender && (
                            <p><span className="font-medium">Gender:</span> {child.gender}</p>
                          )}
                        </div>
                      </div>
                      {isBooked && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          Booked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bookings List */}
        <div className="bg-background border-2 border-border rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bookings ({bookings.length})
          </h2>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No bookings for this session yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Child</th>
                    <th className="text-left py-3 px-4 font-semibold">Registration ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Guardian</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="font-medium">{booking.child_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {booking.registration_id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {booking.guardian_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            booking.status === 'checked_in'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'checked_out'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {booking.status === 'booked' && (
                            <button
                              onClick={() => handleCheckIn(booking)}
                              disabled={actionLoading === booking.id}
                              className="btn-primary btn-sm flex items-center gap-2"
                            >
                              {actionLoading === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <LogIn className="w-4 h-4" />
                              )}
                              Check In
                            </button>
                          )}
                          {booking.status === 'checked_in' && (
                            <button
                              onClick={() => handleCheckOut(booking)}
                              disabled={actionLoading === booking.id}
                              className="btn-secondary btn-sm flex items-center gap-2"
                            >
                              {actionLoading === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <LogOut className="w-4 h-4" />
                              )}
                              Check Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}


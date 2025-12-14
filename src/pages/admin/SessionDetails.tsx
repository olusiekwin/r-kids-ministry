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
  Mail,
  Phone,
  Calendar,
  Baby,
  List,
  Grid3x3,
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
  status?: 'scheduled' | 'active' | 'ended' | 'cancelled';
  started_at?: string;
  ended_at?: string;
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
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  group_id?: string;
  group_name?: string;
  guardian_id?: string;
  guardian_name?: string;
  guardian_email?: string;
  guardian_phone?: string;
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
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list'); // Default to list view

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

  const handleStartSession = async () => {
    if (!sessionId) return;
    
    try {
      setActionLoading('start');
      await sessionsApi.startSession(sessionId);
      await loadSessionDetails();
      toast.success('Session started successfully!', {
        description: 'Children can now check in to this session',
      });
    } catch (error: any) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to end this session? This will mark the session as completed.'
    );
    if (!confirmed) return;
    
    try {
      setActionLoading('end');
      await sessionsApi.endSession(sessionId);
      await loadSessionDetails();
      toast.success('Session ended successfully!', {
        description: 'Session has been marked as completed',
      });
    } catch (error: any) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setActionLoading(null);
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
      return age.toString(); // Just return the number
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
      // Refresh bookings to show updated status and button change
      await loadBookings();
      await loadEligibleChildren(); // Also refresh eligible children
      toast.success('Check-in successful', {
        description: `${booking.child_name} has been checked in. Button updated to Check Out.`,
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
      await loadEligibleChildren(); // Refresh eligible children too
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

  const handleCheckInEligibleChild = async (child: EligibleChild) => {
    if (!user?.id || !sessionId) {
      toast.error('Authentication required');
      return;
    }

    setActionLoading(child.id);
    try {
      // Check in the child - this will create a check-in record
      await checkInApi.manual(child.id, sessionId, user.id);
      
      // Refresh both bookings and eligible children to show updated status
      await loadBookings();
      await loadEligibleChildren();
      
      toast.success('Check-in successful', {
        description: `${child.name} has been checked in for this session.`,
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
      <div className="min-h-screen liquid-bg pb-16 md:pb-0 relative">
        <Header />
        <main className="container py-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
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
    <div className="min-h-screen liquid-bg pb-16 md:pb-0 relative">
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
        <div className="glass border-2 border-border/50 rounded-xl p-6 mb-6 shadow-lg relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{session.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block px-3 py-1 bg-muted rounded-full text-sm font-medium">
                  {session.session_type}
                </span>
                {session.gender_restriction && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {session.gender_restriction} Only
                  </span>
                )}
                {session.status && (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    session.status === 'active' 
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : session.status === 'ended'
                      ? 'bg-gray-100 text-gray-800 border border-gray-300'
                      : session.status === 'cancelled'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  }`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
            {/* Start/End Session Buttons */}
            {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'teacher') && (
              <div className="flex gap-2 ml-4">
                {session.status === 'scheduled' && (
                  <button
                    onClick={handleStartSession}
                    disabled={actionLoading === 'start'}
                    className="px-4 py-2 btn-success rounded-xl flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === 'start' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Start Session
                      </>
                    )}
                  </button>
                )}
                {session.status === 'active' && (
                  <button
                    onClick={handleEndSession}
                    disabled={actionLoading === 'end'}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {actionLoading === 'end' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ending...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        End Session
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
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
          <div className="glass border-2 border-border/50 rounded-xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Bookings</div>
                <div className="text-2xl font-bold">{metrics.totalBookings}</div>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          <div className="glass border-2 border-border/50 rounded-xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Checked In</div>
                <div className="text-2xl font-bold text-green-600">{metrics.checkedIn}</div>
              </div>
              <LogIn className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="glass border-2 border-border/50 rounded-xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Checked Out</div>
                <div className="text-2xl font-bold text-blue-600">{metrics.checkedOut}</div>
              </div>
              <LogOut className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="glass border-2 border-border/50 rounded-xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
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
          <div className="glass border-2 border-border/50 rounded-xl p-6 shadow-lg mb-6 relative z-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Eligible Children ({eligibleChildren.length})
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {session.group_name && `from ${session.group_name}`}
                {session.gender_restriction && ` • ${session.gender_restriction} only`}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{child.name}</h3>
                          <p className="font-mono text-xs text-muted-foreground mt-1">
                            {child.registration_id}
                          </p>
                        </div>
                        {isBooked && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Booked
                          </span>
                        )}
                      </div>

                      {/* Child Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Age:</span>
                          <p className="font-medium">{calculateAge(child.dateOfBirth)} years</p>
                        </div>
                        {child.gender && (
                          <div>
                            <span className="text-muted-foreground">Gender:</span>
                            <p className="font-medium">{child.gender}</p>
                          </div>
                        )}
                        {child.dateOfBirth && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Date of Birth:</span>
                            <p className="font-medium">
                              {new Date(child.dateOfBirth).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {child.group_name && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Group:</span>
                            <p className="font-medium">{child.group_name}</p>
                          </div>
                        )}
                      </div>

                      {/* Parent/Guardian Info */}
                      {child.guardian_name && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Parent/Guardian:</p>
                          <p className="font-medium text-sm">{child.guardian_name}</p>
                          {child.parent_registration_id && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {child.parent_registration_id}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Check-in Button for Eligible Children */}
                      {!isBooked && (
                        <div className="pt-3 border-t border-border/50">
                          <button
                            onClick={() => handleCheckInEligibleChild(child)}
                            disabled={actionLoading === child.id}
                            className="btn-primary w-full flex items-center justify-center gap-2 px-4 py-2 text-sm"
                          >
                            {actionLoading === child.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Checking In...
                              </>
                            ) : (
                              <>
                                <LogIn className="w-4 h-4" />
                                Check In Child
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bookings List with Full Child Details */}
        <div className="glass border-2 border-border/50 rounded-xl p-6 shadow-lg relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h2 className="text-xl font-bold">
                All Children ({bookings.length})
              </h2>
              <span className="text-sm font-normal text-muted-foreground">
                Check-in/Check-out functionality
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'card'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                title="Card View"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No bookings for this session yet.</p>
            </div>
          ) : viewMode === 'list' ? (
            /* Professional List/Table View */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/50">
                    <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide">Child</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide">Registration ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide">Age</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide">Gender</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide">Group</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide">Parent/Guardian</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide">Contact</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, index) => (
                    <tr
                      key={booking.id}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                        booking.status === 'checked_in' ? 'bg-green-50/30' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold">{booking.child_name}</div>
                        {booking.date_of_birth && (
                          <div className="text-xs text-muted-foreground mt-1">
                            DOB: {new Date(booking.date_of_birth).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {booking.registration_id}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium">
                          {booking.date_of_birth ? `${calculateAge(booking.date_of_birth)} years` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {booking.gender || 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        {booking.group_name ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {booking.group_name}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium">{booking.guardian_name || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm space-y-1">
                          {booking.guardian_email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              <span className="text-xs truncate max-w-[150px]">{booking.guardian_email}</span>
                            </div>
                          )}
                          {booking.guardian_phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span className="text-xs">{booking.guardian_phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
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
                        {booking.checked_in_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            In: {new Date(booking.checked_in_at).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {booking.status === 'booked' && (
                          <button
                            onClick={() => handleCheckIn(booking)}
                            disabled={actionLoading === booking.id}
                            className="btn-primary btn-sm flex items-center gap-2 whitespace-nowrap"
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
                            className="btn-secondary btn-sm flex items-center gap-2 whitespace-nowrap"
                          >
                            {actionLoading === booking.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOut className="w-4 h-4" />
                            )}
                            Check Out
                          </button>
                        )}
                        {(booking.status === 'checked_out' || booking.status === 'cancelled') && (
                          <span className="text-xs text-muted-foreground italic">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 gap-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`border-2 rounded-xl p-5 hover:shadow-lg hover:scale-[1.01] transition-all ${
                    booking.status === 'checked_in'
                      ? 'border-green-500/50 glass bg-green-50/20'
                      : booking.status === 'checked_out'
                      ? 'border-blue-500/50 glass bg-blue-50/20'
                      : 'border-border/50 glass'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Child Details Section */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Child Info - Comprehensive */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-bold text-xl">{booking.child_name}</h3>
                          </div>
                          <div className="flex items-center gap-2 text-sm mb-3">
                            <span className="font-mono text-xs bg-muted px-3 py-1.5 rounded">
                              {booking.registration_id}
                            </span>
                            {booking.group_name && (
                              <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                {booking.group_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Child Details Grid */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Child Details
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {booking.date_of_birth && (
                              <>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Age</p>
                                  <p className="font-semibold text-base">
                                    {calculateAge(booking.date_of_birth)} years
                                  </p>
                                </div>
                                {booking.gender && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Gender</p>
                                    <p className="font-semibold text-base">{booking.gender}</p>
                                  </div>
                                )}
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
                                  <p className="font-semibold text-base">
                                    {new Date(booking.date_of_birth).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Parent/Guardian Info - Comprehensive */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <h4 className="font-bold text-lg">Parent/Guardian</h4>
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Contact Information
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Name</p>
                              <p className="font-semibold text-base">
                                {booking.guardian_name || 'Not Available'}
                              </p>
                            </div>
                            {booking.guardian_email && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Email</p>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  <p className="font-medium text-sm">{booking.guardian_email}</p>
                                </div>
                              </div>
                            )}
                            {booking.guardian_phone && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <p className="font-medium text-sm">{booking.guardian_phone}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Timestamps */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-muted-foreground" />
                          <h4 className="font-semibold">Status & Times</h4>
                        </div>
                        <div className="space-y-1 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
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
                          {booking.booked_at && (
                            <p className="text-xs text-muted-foreground">
                              Booked: {new Date(booking.booked_at).toLocaleString()}
                            </p>
                          )}
                          {booking.checked_in_at && (
                            <p className="text-xs text-green-700 font-medium">
                              Checked in: {new Date(booking.checked_in_at).toLocaleString()}
                            </p>
                          )}
                          {booking.checked_out_at && (
                            <p className="text-xs text-blue-700 font-medium">
                              Checked out: {new Date(booking.checked_out_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 lg:flex-col lg:min-w-[140px]">
                      {booking.status === 'booked' && (
                        <button
                          onClick={() => handleCheckIn(booking)}
                          disabled={actionLoading === booking.id}
                          className="btn-primary flex items-center justify-center gap-2 w-full lg:w-auto px-4 py-2"
                        >
                          {actionLoading === booking.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <LogIn className="w-4 h-4" />
                              Check In
                            </>
                          )}
                        </button>
                      )}
                      {booking.status === 'checked_in' && (
                        <button
                          onClick={() => handleCheckOut(booking)}
                          disabled={actionLoading === booking.id}
                          className="btn-secondary flex items-center justify-center gap-2 w-full lg:w-auto px-4 py-2"
                        >
                          {actionLoading === booking.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <LogOut className="w-4 h-4" />
                              Check Out
                            </>
                          )}
                        </button>
                      )}
                      {(booking.status === 'checked_out' || booking.status === 'cancelled') && (
                        <span className="text-sm text-muted-foreground italic">
                          No action available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}


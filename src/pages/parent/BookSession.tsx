import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { ParentSidebar } from '@/components/ParentSidebar';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { sessionsApi, sessionBookingsApi, childrenApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Child } from '@/types';
import { Calendar, CheckCircle2, QrCode, Key, X } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  group_name?: string;
  room?: string;
  teacher_name?: string;
  session_type: string;
  location?: string;
}

interface Booking {
  id: string;
  session_id: string;
  child_id: string;
  child_name: string;
  registration_id: string;
  status: string;
  qr_code?: string;
  otp_code?: string;
  booked_at: string;
}

export default function BookSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myChildren, setMyChildren] = useState<Child[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState<Booking | null>(null);
  const sessionIdParam = searchParams.get('sessionId');

  useEffect(() => {
    loadSessions();
    loadChildren();
  }, []);

  useEffect(() => {
    if (sessionIdParam) {
      // Load specific session
      sessionsApi.get(sessionIdParam).then((session) => {
        setSelectedSession(session);
      }).catch(console.error);
    }
  }, [sessionIdParam]);

  useEffect(() => {
    if (selectedSession) {
      loadBookings();
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      // Load upcoming sessions (next 30 days)
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);
      
      const data = await sessionsApi.list({
        date: today.toISOString().split('T')[0],
      });
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async () => {
    if (!user?.id) return;
    
    try {
      const children = await childrenApi.list({ parent_id: user.id });
      setMyChildren(children);
    } catch (error) {
      console.error('Failed to load children:', error);
      setMyChildren([]);
    }
  };

  const loadBookings = async () => {
    if (!selectedSession) return;
    
    try {
      const data = await sessionBookingsApi.listBySession(selectedSession.id);
      // Filter to show only bookings for current user's children
      const myChildIds = myChildren.map(c => c.id);
      const myBookings = (Array.isArray(data) ? data : []).filter((b: Booking) =>
        myChildIds.includes(b.child_id)
      );
      setBookings(myBookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setBookings([]);
    }
  };

  const handleBook = async () => {
    if (!selectedSession || selectedChildren.length === 0) {
      alert('Please select at least one child');
      return;
    }

    try {
      setBookingLoading(true);
      const result = await sessionBookingsApi.book(selectedSession.id, {
        child_ids: selectedChildren,
        guardian_id: user?.id,
      });

      if (result.bookings && result.bookings.length > 0) {
        // Show booking details
        const booking = result.bookings[0];
        setShowBookingDetails(booking);
        await loadBookings();
        setSelectedChildren([]);
      } else {
        alert('Failed to create booking');
      }
    } catch (error: any) {
      console.error('Failed to book session:', error);
      alert(error?.message || 'Failed to book session. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleToggleChild = (childId: string) => {
    setSelectedChildren(prev =>
      prev.includes(childId)
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <ParentSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/parent')}
            className="btn-secondary mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-semibold mb-2">Book Session</h1>
          <p className="text-muted-foreground">Book your children for ministry sessions</p>
        </div>

        {/* Session Selection */}
        {!selectedSession ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select a Session</h2>
            {sessions.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-md bg-background">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming sessions found</p>
                <button
                  onClick={() => navigate('/calendar')}
                  className="btn-primary mt-4"
                >
                  View Calendar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-border rounded-md p-6 bg-background shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedSession(session)}
                  >
                    <h3 className="text-lg font-semibold mb-2">{session.title}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{new Date(session.session_date).toLocaleDateString()}</p>
                      {session.start_time && (
                        <p>{session.start_time}{session.end_time && ` - ${session.end_time}`}</p>
                      )}
                      {session.group_name && <p>Group: {session.group_name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Selected Session Info */}
            <div className="border border-border rounded-md p-6 mb-6 bg-background">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{selectedSession.title}</h2>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{new Date(selectedSession.session_date).toLocaleDateString()}</p>
                    {selectedSession.start_time && (
                      <p>{selectedSession.start_time}{selectedSession.end_time && ` - ${selectedSession.end_time}`}</p>
                    )}
                    {selectedSession.group_name && <p>Group: {selectedSession.group_name}</p>}
                    {selectedSession.location && <p>Location: {selectedSession.location}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="btn-ghost btn-sm"
                >
                  Change Session
                </button>
              </div>
            </div>

            {/* Select Children */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Select Children to Book</h3>
              {myChildren.length === 0 ? (
                <div className="border border-border rounded-md p-6 text-center bg-background">
                  <p className="text-muted-foreground mb-4">No children registered</p>
                  <button
                    onClick={() => navigate('/parent/add-child')}
                    className="btn-primary"
                  >
                    Add Child
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myChildren.map((child) => {
                    const isSelected = selectedChildren.includes(child.id);
                    const existingBooking = bookings.find(b => b.child_id === child.id);
                    
                    return (
                      <div
                        key={child.id}
                        className={`border rounded-md p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-foreground bg-muted/50'
                            : existingBooking
                            ? 'border-green-500 bg-green-50/10'
                            : 'border-border hover:shadow-md'
                        }`}
                        onClick={() => !existingBooking && handleToggleChild(child.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{child.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {child.registrationId} • {child.age} years • {child.group}
                            </p>
                          </div>
                          {existingBooking ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : isSelected ? (
                            <div className="w-5 h-5 border-2 border-foreground rounded-full bg-foreground" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-border rounded-full" />
                          )}
                        </div>
                        {existingBooking && (
                          <p className="text-xs text-green-600 mt-2">Already booked</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Book Button */}
            {selectedChildren.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={handleBook}
                  disabled={bookingLoading}
                  className="btn-primary w-full"
                >
                  {bookingLoading ? 'Booking...' : `Book ${selectedChildren.length} Child(ren)`}
                </button>
              </div>
            )}

            {/* Existing Bookings */}
            {bookings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Bookings</h3>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-border rounded-md p-6 bg-background"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold">{booking.child_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.registration_id} • Status: {booking.status}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowBookingDetails(booking)}
                          className="btn-secondary btn-sm"
                        >
                          View QR/OTP
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booking Details Modal */}
        {showBookingDetails && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-8 rounded-md max-w-md w-full border border-border shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Booking Confirmation</h3>
                <button
                  onClick={() => setShowBookingDetails(null)}
                  className="btn-ghost btn-sm p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Child</p>
                  <p className="font-semibold">{showBookingDetails.child_name}</p>
                </div>

                {showBookingDetails.qr_code && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">QR Code</p>
                    <div className="flex justify-center mb-4">
                      <QRCodeGenerator
                        value={showBookingDetails.qr_code}
                        size={200}
                        title={`Session Booking QR for ${showBookingDetails.child_name}`}
                      />
                    </div>
                  </div>
                )}

                {showBookingDetails.otp_code && (
                  <div className="border border-border rounded-md p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">OTP Code</p>
                    <p className="text-4xl font-mono font-bold tracking-widest mb-2">
                      {showBookingDetails.otp_code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Show this QR code or OTP to the teacher when checking in
                    </p>
                  </div>
                )}

                <div className="bg-muted border border-border rounded-md p-4">
                  <p className="text-sm font-semibold mb-2">Instructions:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Save this QR code or OTP code</li>
                    <li>• Show it to the teacher when you arrive</li>
                    <li>• The teacher will scan/verify to check in your child</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowBookingDetails(null)}
                  className="btn-primary w-full"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { sessionsApi, sessionBookingsApi, checkInApi } from '@/services/api';
import { Calendar, Users, CheckCircle2 } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  group_name?: string;
}

interface Booking {
  id: string;
  child_id: string;
  child_name: string;
  registration_id: string;
  status: string;
  qr_code?: string;
  otp_code?: string;
}

export default function CheckIn() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadBookings();
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const data = await sessionsApi.list({ date: today });
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!selectedSession) return;
    
    try {
      const data = await sessionBookingsApi.listBySession(selectedSession.id);
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setBookings([]);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (!selectedSession) {
      alert('Please select a session first');
      return;
    }

    try {
      setCheckingIn(decodedText);
      // Check in using QR code for this session
      await checkInApi.confirm(decodedText, 'qr', selectedSession.id);
      alert('Child checked in successfully!');
      await loadBookings();
      setScannedCode(null);
      setShowScanner(false);
    } catch (error: any) {
      console.error('Check-in failed:', error);
      alert(error?.message || 'Failed to check in. Please try again.');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleScanError = (error: string) => {
    alert(`Scanning error: ${error}`);
  };

  const handleManualCheckIn = async (booking: Booking) => {
    if (!selectedSession) return;
    
    try {
      setCheckingIn(booking.child_id);
      // Check in using OTP for this session
      if (booking.otp_code) {
        await checkInApi.verifyOTP(booking.child_id, booking.otp_code, selectedSession.id);
        alert(`${booking.child_name} checked in successfully!`);
        await loadBookings();
      } else {
        // Try manual check-in without OTP
        await checkInApi.manual(booking.child_id, selectedSession.id);
        alert(`${booking.child_name} checked in successfully!`);
        await loadBookings();
      }
    } catch (error: any) {
      console.error('Check-in failed:', error);
      alert(error?.message || 'Failed to check in. Please try again.');
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <TeacherSidebar />
        <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading sessions...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <TeacherSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate('/teacher')}
              className="btn-secondary mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-semibold mb-2">Session Check-In</h1>
            <p className="text-muted-foreground">Select a session and check in children</p>
          </div>
          
          {/* Session Selection */}
          {!selectedSession ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">Select a Session</h2>
              {sessions.length === 0 ? (
                <div className="text-center py-12 border border-border rounded-md bg-background">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No sessions found for today</p>
                  <button
                    onClick={() => navigate('/calendar')}
                    className="btn-primary"
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
              <div className="border border-border rounded-md p-4 mb-6 bg-background">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">{selectedSession.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedSession.session_date).toLocaleDateString()}
                      {selectedSession.start_time && ` • ${selectedSession.start_time}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="btn-ghost btn-sm"
                  >
                    Change Session
                  </button>
                </div>
              </div>

              {/* Bookings List */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Booked Children</h3>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 border border-border rounded-md bg-background">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No children booked for this session</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`border rounded-md p-4 ${
                          booking.status === 'checked_in'
                            ? 'border-green-500 bg-green-50/10'
                            : 'border-border bg-background'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{booking.child_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.registration_id} • Status: {booking.status}
                            </p>
                          </div>
                          {booking.status === 'checked_in' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <button
                              onClick={() => handleManualCheckIn(booking)}
                              disabled={checkingIn === booking.child_id}
                              className="btn-primary btn-sm"
                            >
                              {checkingIn === booking.child_id ? 'Checking in...' : 'Check In'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QR Scanner */}
              <div className="border border-border rounded-md p-6 bg-background">
                <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
                {showScanner ? (
            <QRCodeScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              onClose={() => setShowScanner(false)}
            />
          ) : (
                  <div className="text-center py-8">
              <button 
                onClick={() => setShowScanner(true)} 
                className="btn-primary px-8"
                      disabled={checkingIn !== null}
              >
                      {checkingIn ? 'Processing...' : 'Scan QR Code'}
              </button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Scan the parent's QR code to check in their child
                    </p>
                  </div>
                )}
              </div>

              {/* Manual OTP Check-In */}
              <div className="border border-border rounded-md p-6 bg-background mt-6">
                <h3 className="text-lg font-semibold mb-4">Manual Check-In (OTP)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Enter OTP Code</label>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full px-4 py-2 border border-border rounded-md bg-background"
                      onChange={(e) => {
                        const otp = e.target.value.replace(/\D/g, '').slice(0, 6);
                        e.target.value = otp;
                        if (otp.length === 6) {
                          // Auto-verify when 6 digits entered
                          const booking = bookings.find(b => b.otp_code === otp);
                          if (booking && booking.status !== 'checked_in') {
                            handleManualCheckIn(booking);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter the OTP code provided by the parent
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="fixed-bottom-action md:hidden">
        <button onClick={() => navigate('/teacher')} className="btn-secondary w-full">
          Back to Dashboard
        </button>
      </div>

      <MobileNav />
    </div>
  );
}


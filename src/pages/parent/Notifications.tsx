import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { ParentSidebar } from '@/components/ParentSidebar';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { Bell, CheckCircle2, Clock, X } from 'lucide-react';
import { notificationsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'pickup' | 'checkin' | 'birthday' | 'reminder' | 'approval';
  title: string;
  message: string;
  childId?: string;
  childName?: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  pickupQR?: string;
  pickupOTP?: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [method, setMethod] = useState<'scan' | 'receive' | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Pass user_id to get notifications for this specific user
      const data = await notificationsApi.list({ user_id: user.id });
      // Map backend response to frontend format
      const mapped = data.map((n: any) => {
        // Extract timestamp - handle various formats
        let timestamp = n.timestamp || n.createdAt || n.created_at;
        if (!timestamp) {
          timestamp = new Date().toISOString();
        } else if (typeof timestamp === 'string') {
          // Ensure it's a valid ISO string
          const date = new Date(timestamp);
          if (isNaN(date.getTime())) {
            // If invalid, use current time
            timestamp = new Date().toISOString();
          } else {
            timestamp = date.toISOString();
          }
        }
        
        return {
          id: n.id || n.notification_id,
          type: n.type?.toLowerCase() || 'reminder',
          title: n.title || n.content?.split('\n')[0] || 'Notification',
          message: n.message || n.content || '',
          childId: n.childId || n.child_id,
          childName: n.childName,
          timestamp: timestamp,
          read: n.read || false,
          actionRequired: n.actionRequired || (n.type?.toLowerCase() === 'checkout' || n.type?.toLowerCase() === 'pickup'),
          pickupQR: n.pickupQR,
          pickupOTP: n.pickupOTP,
        };
      });
      setNotifications(mapped);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePickupAction = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowQR(false);
    setShowScanner(false);
    setMethod(null);
  };

  const handleScanQR = () => {
    setMethod('scan');
    setShowScanner(true);
  };

  const handleReceiveCode = () => {
    setMethod('receive');
    setShowQR(true);
  };

  const handleScanSuccess = (decodedText: string) => {
    try {
      const qrData = JSON.parse(decodedText);
      if (qrData.type === 'pickup' && qrData.childId === selectedNotification?.childId) {
        alert(`QR code verified! ${selectedNotification?.childName} will be released to you.`);
        // Mark notification as read
        setNotifications(notifications.map(n => 
          n.id === selectedNotification?.id ? { ...n, read: true, actionRequired: false } : n
        ));
        setShowScanner(false);
        setSelectedNotification(null);
        setMethod(null);
      } else {
        alert('Invalid QR code. Please scan the pickup QR code provided by the teacher.');
      }
    } catch (err) {
      alert('Invalid QR code format.');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const formatTime = (timestamp: string | Date) => {
    if (!timestamp) return 'Just now';
    
    // Handle various date formats
    let date: Date;
    
    // If already a Date object
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      // Try parsing the string
      date = new Date(timestamp);
      
      // If invalid, try common formats
      if (isNaN(date.getTime())) {
        // Try replacing space with T for ISO format
        date = new Date(timestamp.replace(' ', 'T'));
      }
      
      // If still invalid, try other formats
      if (isNaN(date.getTime())) {
        // Try parsing as timestamp (milliseconds)
        const numTimestamp = parseInt(timestamp, 10);
        if (!isNaN(numTimestamp)) {
          date = new Date(numTimestamp);
        }
      }
      
      // If still invalid, return fallback
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp format:', timestamp);
        return 'Recently';
      }
    } else {
      return 'Recently';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Handle future dates
    if (diffMs < 0) {
      return 'Just now';
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // For older dates, show formatted date
    try {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    } catch (e) {
      return 'Recently';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const pickupNotifications = notifications.filter(n => n.type === 'pickup' && n.actionRequired);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <ParentSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Notifications</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 bg-foreground text-background text-sm rounded-full mt-2">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Active Pickup Notifications */}
          {pickupNotifications.length > 0 && (
            <div className="bg-muted border-2 border-foreground/20 rounded-md p-8 mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Bell className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Ready for Pickup!</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {pickupNotifications.length} child(ren) ready to be picked up
              </p>
              <div className="space-y-4">
                {pickupNotifications.map((notification) => (
                  <div key={notification.id} className="p-6 bg-background rounded-md border border-border">
                    <p className="font-semibold mb-2">{notification.childName}</p>
                    <p className="text-sm text-muted-foreground mb-4">{notification.message}</p>
                    <button
                      onClick={() => handlePickupAction(notification)}
                      className="btn-primary"
                    >
                      Pick Up Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pickup Action Modal */}
          {selectedNotification && !showScanner && !showQR && (
            <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background p-8 rounded-md max-w-md w-full border border-border shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Pickup {selectedNotification.childName}</h3>
                  <button
                    onClick={() => {
                      setSelectedNotification(null);
                      setMethod(null);
                    }}
                    className="btn-ghost btn-sm p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-8 text-center">
                  Choose how you'd like to verify pickup:
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleScanQR}
                    className="btn-primary w-full py-4"
                  >
                    <div className="text-center">
                      <p className="font-semibold mb-1">Scan Teacher's QR Code</p>
                      <p className="text-sm text-muted-foreground">
                        Scan the QR code displayed by the teacher
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={handleReceiveCode}
                    className="btn-secondary w-full py-4"
                  >
                    <div className="text-center">
                      <p className="font-semibold mb-1">Receive Pickup Code</p>
                      <p className="text-sm text-muted-foreground">
                        Get QR code or OTP to show teacher
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* QR Scanner */}
        {showScanner && selectedNotification && (
          <QRCodeScanner
            onScanSuccess={handleScanSuccess}
            onScanError={(error) => alert(`Scanning error: ${error}`)}
            onClose={() => {
              setShowScanner(false);
              setSelectedNotification(null);
              setMethod(null);
            }}
          />
        )}

          {/* Receive Code Display */}
          {showQR && selectedNotification && (
            <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background p-8 rounded-md max-w-md w-full border border-border shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Pickup Code</h3>
                  <button
                    onClick={() => {
                      setShowQR(false);
                      setSelectedNotification(null);
                      setMethod(null);
                    }}
                    className="btn-ghost btn-sm p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedNotification.pickupQR && (
                  <div className="mb-6 flex justify-center">
                    <QRCodeGenerator
                      value={selectedNotification.pickupQR}
                      size={250}
                      title={`Pickup QR for ${selectedNotification.childName}`}
                    />
                  </div>
                )}

                {selectedNotification.pickupOTP && (
                  <div className="border border-border rounded-md p-6 text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-3">Your Pickup OTP</p>
                    <p className="text-4xl font-mono font-bold tracking-widest mb-2">
                      {selectedNotification.pickupOTP}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Valid for 15 minutes
                    </p>
                  </div>
                )}

                <div className="bg-muted border border-border rounded-md p-5">
                  <p className="text-sm font-semibold mb-3 text-center">
                    Instructions:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 text-center">
                    <li>Show this QR code or OTP to the teacher</li>
                    <li>Teacher will verify and release {selectedNotification.childName}</li>
                    <li>You'll receive a confirmation notification</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* All Notifications List */}
          {loading ? (
            <div className="border border-border rounded-md p-12 text-center bg-background shadow-sm">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="border border-border rounded-md p-12 text-center bg-background shadow-sm">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                    if (notification.type === 'pickup' && notification.actionRequired) {
                      handlePickupAction(notification);
                    }
                  }}
                  className={`border rounded-md p-6 cursor-pointer transition-colors bg-background shadow-sm ${
                    notification.read 
                      ? 'border-border' 
                      : 'border-foreground/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {notification.type === 'pickup' && (
                        <Bell className={`w-5 h-5 ${notification.actionRequired ? 'text-foreground' : 'text-muted-foreground'}`} />
                      )}
                      {notification.type === 'checkin' && (
                        <CheckCircle2 className="w-5 h-5 text-foreground" />
                      )}
                      {notification.type === 'approval' && (
                        <CheckCircle2 className="w-5 h-5 text-foreground" />
                      )}
                      {notification.type === 'reminder' && (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{notification.title}</h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-foreground rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      {notification.childName && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Child: {notification.childName} ({notification.childId})
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mb-3">
                        {formatTime(notification.timestamp)}
                      </p>
                      {notification.actionRequired && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePickupAction(notification);
                          }}
                          className="btn-primary btn-sm"
                        >
                          Take Action
                        </button>
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



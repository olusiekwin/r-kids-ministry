import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { notificationsApi } from '@/services/api';
import { Bell, X } from 'lucide-react';

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
}

export function Header() {
  const { user, logout, showIdleWarning } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await notificationsApi.list();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Idle Warning Banner */}
      {showIdleWarning && user && (
        <div className="bg-yellow-500 text-black text-center py-2 px-4 sticky top-0 z-50">
          <p className="text-sm font-medium">
            ⚠️ Your session will expire in 1 minute due to inactivity. 
            <button 
              onClick={(e) => {
                e.preventDefault();
                // Any click will reset the timer via the activity listeners
                // This button just provides a clear action
                window.dispatchEvent(new Event('mousedown'));
              }}
              className="ml-2 underline font-semibold hover:text-yellow-800"
            >
              Stay logged in
            </button>
          </p>
        </div>
      )}
      
      <header className="border-b border-border bg-background sticky top-0 z-50 backdrop-blur-sm bg-background/95">
        <div className="container flex items-center justify-between py-3">
          {/* Left side: Logo and Role */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">R-KIDS</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Ruach South Assembly</p>
              </div>
            </div>
            {user && (
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            )}
          </div>
          
          {/* Right side: Notifications, User info and Logout */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-foreground hover:bg-muted rounded-md transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="overflow-y-auto flex-1">
                        {loading ? (
                          <div className="p-8 text-center text-muted-foreground">
                            Loading...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            No notifications
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() => {
                                  if (!notification.read) markAsRead(notification.id);
                                  if (notification.type === 'pickup' && notification.actionRequired) {
                                    navigate('/notifications');
                                  }
                                }}
                                className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                                  !notification.read ? 'bg-muted/50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="font-semibold text-sm text-foreground">
                                        {notification.title}
                                      </h4>
                                      {!notification.read && (
                                        <span className="w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {notification.message}
                                    </p>
                                    {notification.childName && (
                                      <p className="text-xs text-muted-foreground">
                                        {notification.childName}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(notification.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {notifications.length > 0 && (
                        <div className="p-2 border-t border-border">
                          <button
                            onClick={() => {
                              navigate('/notifications');
                              setShowNotifications(false);
                            }}
                            className="w-full text-sm text-center text-foreground hover:bg-muted py-2 rounded"
                          >
                            View All Notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-muted transition-colors bg-background whitespace-nowrap"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

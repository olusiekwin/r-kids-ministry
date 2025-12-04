import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { ParentSidebar } from '@/components/ParentSidebar';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { childrenApi, checkInApi, analyticsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Child } from '@/types';
import { CheckCircle2, Clock, Bell, X, BarChart3, Calendar, TrendingUp } from 'lucide-react';

type ChildStatus = 'not_checked_in' | 'checked_in' | 'ready_for_pickup' | 'checked_out';

interface ChildWithStatus {
  id: string;
  registrationId: string;
  name: string;
  age: number;
  group: string;
  status: ChildStatus;
  checkInTime?: string;
  parentId: string;
  childStatus: 'active' | 'pending' | 'rejected'; // Original child status
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showQRModal, setShowQRModal] = useState<{ childId: string; qrData: string } | null>(null);
  const [myChildren, setMyChildren] = useState<ChildWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [childAnalytics, setChildAnalytics] = useState<Record<string, any>>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    loadChildren();
  }, [user]);

  useEffect(() => {
    if (myChildren.length > 0) {
      loadChildAnalytics();
    }
  }, [myChildren]);

  const loadChildren = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const children = await childrenApi.list({ parent_id: user.id });
      
      // Map children with status (simplified - in real app, get from check-in API)
      const childrenWithStatus: ChildWithStatus[] = children.map(child => ({
        id: child.id,
        registrationId: child.registrationId,
        name: child.name,
        age: child.age,
        group: child.group,
        parentId: child.parentId,
        childStatus: child.status,
        status: child.status === 'pending' 
          ? 'not_checked_in' as ChildStatus
          : 'not_checked_in' as ChildStatus, // Default status
        checkInTime: undefined,
      }));
      
      setMyChildren(childrenWithStatus);
    } catch (error: any) {
      console.error('Failed to load children:', error);
      // Set empty array if backend is not available
      setMyChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChildAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const analytics: Record<string, any> = {};
      for (const child of myChildren) {
        try {
          const data = await analyticsApi.getChildAnalytics(child.id);
          analytics[child.id] = data;
        } catch (error) {
          console.error(`Failed to load analytics for child ${child.id}:`, error);
        }
      }
      setChildAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load child analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handlePreCheckIn = async (childId: string, registrationId: string) => {
    try {
      const response = await checkInApi.generateQR(childId);
      setShowQRModal({ childId, qrData: response.qr_code });
      
      // In real app: Send QR code via email/SMS
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    }
  };

  const getStatusBadge = (status: ChildStatus) => {
    switch (status) {
      case 'checked_in':
        return (
          <span className="status-badge bg-muted text-foreground border border-border flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Checked In
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="status-badge bg-foreground text-background border border-foreground flex items-center gap-1">
            <Bell className="w-3 h-3" />
            Ready for Pickup
          </span>
        );
      case 'checked_out':
        return (
          <span className="status-badge bg-muted text-muted-foreground border border-border flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Checked Out
          </span>
        );
      default:
        return null;
    }
  };

  const pendingCount = myChildren.filter(c => c.childStatus === 'pending').length;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <ParentSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Parent Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.name}. Manage your children's check-in and attendance.</p>
          </div>
          
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => navigate('/parent/notifications')}
              className="btn-secondary relative"
            >
              Notifications
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-foreground text-background">
                0
              </span>
            </button>
            <button
              onClick={() => navigate('/parent/add-child')}
              className="btn-primary"
            >
              Add Child
            </button>
          </div>

          {/* Pending Children */}
          {pendingCount > 0 && (
            <div className="bg-muted border border-border rounded-md p-5 mb-8 text-center">
              <p className="text-sm font-semibold mb-2">Pending Approvals</p>
              <p className="text-xs text-muted-foreground">
                You have {pendingCount} child(ren) waiting for admin approval.
              </p>
            </div>
          )}

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-6 rounded-md max-w-md w-full border border-border shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pre-Check-In QR Code</h3>
                <button
                  onClick={() => setShowQRModal(null)}
                  className="btn-ghost btn-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-center mb-4">
                <QRCodeGenerator value={showQRModal.qrData} size={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Show this QR code to the teacher at check-in. Valid for 15 minutes.
              </p>
              <button
                onClick={() => setShowQRModal(null)}
                className="btn-primary w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}

          {/* Children List */}
          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading children...</p>
            </div>
          ) : myChildren.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-6">No children registered yet.</p>
              <button
                onClick={() => navigate('/parent/add-child')}
                className="btn-primary"
              >
                Add Your First Child
              </button>
            </div>
          ) : (
            <div className="space-y-6">
          {myChildren.map((child) => {
              const isPending = child.childStatus === 'pending';
            
            return (
                <div key={child.id} className={`border rounded-md shadow-sm ${
                  isPending ? 'border-border bg-muted/30' : 
                  child.status === 'ready_for_pickup' ? 'border-foreground/20 bg-muted/50' :
                  child.status === 'checked_in' ? 'border-border bg-muted/20' :
                  'border-border bg-background'
                }`}>
                  <div className="flex items-start gap-6 p-6">
                  <PhotoPlaceholder size="lg" />
                  <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {child.registrationId}
                    </p>
                    <p className="text-lg font-medium">
                      {child.name} ({child.age})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Group: {child.group}
                    </p>
                          {child.checkInTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Checked in at {child.checkInTime}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(child.status)}
                      </div>
                      
                      {isPending && (
                        <span className="inline-block mt-2 status-badge bg-muted text-foreground border border-border">
                          Pending Approval
                        </span>
                      )}

                      {/* Child Progress Analytics */}
                      {!isPending && childAnalytics[child.id] && (
                        <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-border">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs">Sessions</span>
                            </div>
                            <p className="text-lg font-semibold text-foreground">
                              {childAnalytics[child.id].total_sessions || 0}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <BarChart3 className="w-4 h-4" />
                              <span className="text-xs">Attendance</span>
                            </div>
                            <p className="text-lg font-semibold text-foreground">
                              {childAnalytics[child.id].attendance_rate?.toFixed(0) || 0}%
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs">Progress</span>
                            </div>
                            <p className="text-lg font-semibold text-foreground">
                              {childAnalytics[child.id].attendance_trend?.length > 0 
                                ? childAnalytics[child.id].attendance_trend[childAnalytics[child.id].attendance_trend.length - 1].sessions_attended || 0
                                : 0}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
                
                  <div className="flex flex-wrap justify-center gap-3 p-6 pt-0 border-t border-border mt-6">
                    {isPending ? (
                      <p className="text-sm text-muted-foreground">
                        Waiting for admin approval...
                      </p>
                    ) : (
                      <>
                        {child.status === 'not_checked_in' && (
                    <button
                            onClick={() => handlePreCheckIn(child.id, child.registrationId)}
                            className="btn-primary"
                    >
                      Pre-Check-In
                    </button>
                  )}
                        
                        {child.status === 'checked_in' && (
                          <p className="text-sm text-muted-foreground">
                            Child is checked in. You'll be notified when ready for pickup.
                          </p>
                        )}
                        
                        {child.status === 'ready_for_pickup' && (
                          <button
                            onClick={() => navigate('/parent/notifications')}
                            className="btn-primary flex-1"
                          >
                            <Bell className="w-4 h-4 inline mr-2" />
                            Pick Up Now
                          </button>
                        )}
                        
                  <button
                          onClick={() => navigate(`/parent/child/${child.id}`)}
                          className="btn-secondary"
                  >
                    View Profile
                  </button>
                        <button
                          onClick={() => navigate(`/parent/child/${child.id}/checkout`)}
                          className="btn-secondary"
                        >
                          Pre-Check-Out
                        </button>
                  <button
                    onClick={() => navigate('/parent/attendance')}
                          className="btn-secondary"
                  >
                    Attendance
                  </button>
                      </>
                    )}
                  </div>
              </div>
            );
          })}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

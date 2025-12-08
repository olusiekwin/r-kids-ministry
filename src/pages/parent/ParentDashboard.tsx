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
import { toast } from '@/components/ui/sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, Clock, Bell, X, BarChart3, Calendar, TrendingUp, Users, QrCode, ArrowRight, BookOpen, Plus, Edit, Loader2 } from 'lucide-react';

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
  childStatus: 'active' | 'pending' | 'rejected';
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showQRModal, setShowQRModal] = useState<{ childId: string; qrData: string } | null>(null);
  const [myChildren, setMyChildren] = useState<ChildWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [childAnalytics, setChildAnalytics] = useState<Record<string, any>>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Edit child modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildWithStatus | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '' as 'Male' | 'Female' | 'Other' | '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

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
          : 'not_checked_in' as ChildStatus,
        checkInTime: undefined,
        gender: child.gender,
        dateOfBirth: child.dateOfBirth,
      }));
      
      setMyChildren(childrenWithStatus);
    } catch (error: any) {
      console.error('Failed to load children:', error);
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
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    }
  };
  
  const handleEditChild = (child: ChildWithStatus) => {
    setSelectedChild(child);
    setEditFormData({
      name: child.name,
      dateOfBirth: child.dateOfBirth || '',
      gender: child.gender || '',
    });
    setEditError('');
    setShowEditModal(true);
  };
  
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const handleSaveEdit = async () => {
    if (!selectedChild) return;
    
    setEditError('');
    
    // Validation
    if (!editFormData.name.trim()) {
      setEditError('Child name is required');
      return;
    }
    if (!editFormData.dateOfBirth) {
      setEditError('Date of birth is required');
      return;
    }
    const age = calculateAge(editFormData.dateOfBirth);
    if (age < 0 || age > 19) {
      setEditError('Child must be between 0 and 19 years old');
      return;
    }
    if (!editFormData.gender) {
      setEditError('Gender is required');
      return;
    }
    
    setEditLoading(true);
    try {
      await childrenApi.update(selectedChild.id, {
        name: editFormData.name,
        dateOfBirth: editFormData.dateOfBirth,
        gender: editFormData.gender,
      });
      
      await loadChildren();
      setShowEditModal(false);
      setSelectedChild(null);
      toast.success('Child updated successfully', {
        description: `${editFormData.name}'s details have been updated.`,
      });
    } catch (error: any) {
      console.error('Failed to update child:', error);
      setEditError(error.message || 'Failed to update child. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusBadge = (status: ChildStatus) => {
    switch (status) {
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Checked In
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <Bell className="w-3.5 h-3.5" />
            Ready for Pickup
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Checked Out
          </span>
        );
      default:
        return null;
    }
  };

  const pendingCount = myChildren.filter(c => c.childStatus === 'pending').length;
  const activeCount = myChildren.filter(c => c.childStatus === 'active').length;
  const checkedInCount = myChildren.filter(c => c.status === 'checked_in').length;
  const totalSessions = Object.values(childAnalytics).reduce((sum, a) => sum + (a?.attendanceCount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-16 md:pb-0">
      <Header />
      <ParentSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Parent'}!</h1>
            <p className="text-muted-foreground text-lg">Manage your children's check-in, attendance, and more</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Children</p>
              <p className="text-3xl font-bold">{myChildren.length}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Active Children</p>
              <p className="text-3xl font-bold">{activeCount}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
              <p className="text-3xl font-bold">{totalSessions}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Checked In Today</p>
              <p className="text-3xl font-bold">{checkedInCount}</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => navigate('/parent/book-session')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Book Session</h3>
              <p className="text-sm text-muted-foreground">Register your children for upcoming sessions</p>
            </button>

            <button
              onClick={() => navigate('/parent/attendance')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold mb-2">View Attendance</h3>
              <p className="text-sm text-muted-foreground">Track your children's attendance history</p>
            </button>

            <button
              onClick={() => navigate('/parent/add-child')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Plus className="w-6 h-6 text-green-500" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Add Child</h3>
              <p className="text-sm text-muted-foreground">Register a new child to the ministry</p>
            </button>
          </div>

          {/* Pending Approvals Alert */}
          {pendingCount > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Pending Approvals</h3>
                  <p className="text-sm text-muted-foreground">
                You have {pendingCount} child(ren) waiting for admin approval.
              </p>
                </div>
              </div>
            </div>
          )}

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
              <div className="bg-card p-8 rounded-xl max-w-md w-full border border-border shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Pre-Check-In QR Code</h3>
                <button
                  onClick={() => setShowQRModal(null)}
                  className="btn-ghost btn-sm"
                >
                    <X className="w-5 h-5" />
                </button>
              </div>
                <div className="flex justify-center mb-6 bg-background p-4 rounded-lg">
                <QRCodeGenerator value={showQRModal.qrData} size={200} />
              </div>
                <p className="text-sm text-muted-foreground text-center mb-6">
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
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">Loading children...</p>
            </div>
          ) : myChildren.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No children registered yet</h3>
              <p className="text-muted-foreground mb-6">Get started by adding your first child</p>
              <button
                onClick={() => navigate('/parent/add-child')}
                className="btn-primary"
              >
                Add Your First Child
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">My Children</h2>
          {myChildren.map((child) => {
              const isPending = child.childStatus === 'pending';
                const analytics = childAnalytics[child.id] || {};
            
            return (
                  <div key={child.id} className={`bg-card border rounded-xl shadow-sm overflow-hidden ${
                    isPending ? 'border-orange-500/20' : 
                    child.status === 'ready_for_pickup' ? 'border-primary/20' :
                    child.status === 'checked_in' ? 'border-green-500/20' :
                    'border-border'
                  }`}>
                    <div className="p-6">
                      <div className="flex items-start gap-6">
                  <PhotoPlaceholder size="lg" />
                  <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                        <div>
                              <p className="font-mono text-xs text-muted-foreground mb-1">
                      {child.registrationId}
                    </p>
                              <h3 className="text-xl font-semibold mb-1">
                                {child.name} <span className="text-muted-foreground font-normal">({child.age})</span>
                              </h3>
                    <p className="text-sm text-muted-foreground">
                      Group: {child.group}
                    </p>
                    {child.gender && (
                      <p className="text-sm text-muted-foreground">
                        Gender: {child.gender}
                      </p>
                    )}
                          {child.checkInTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Checked in at {child.checkInTime}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(child.status)}
                      </div>
                      
                      {isPending && (
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                              <Clock className="w-3.5 h-3.5" />
                          Pending Approval
                            </div>
                          )}

                          {/* Child Analytics */}
                          {!isPending && Object.keys(analytics).length > 0 && (
                            <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-border">
                          <div className="text-center">
                                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
                              <Calendar className="w-4 h-4" />
                                  <span className="text-xs font-medium">Sessions</span>
                            </div>
                                <p className="text-2xl font-bold">
                                  {analytics.attendanceCount || 0}
                            </p>
                          </div>
                          <div className="text-center">
                                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
                              <BarChart3 className="w-4 h-4" />
                                  <span className="text-xs font-medium">Attendance</span>
                            </div>
                                <p className="text-2xl font-bold">
                                  {analytics.attendanceRate?.toFixed(0) || 0}%
                            </p>
                          </div>
                          <div className="text-center">
                                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
                              <TrendingUp className="w-4 h-4" />
                                  <span className="text-xs font-medium">Progress</span>
                            </div>
                                <p className="text-2xl font-bold">
                                  {analytics.recentCheckIns?.length || 0}
                            </p>
                          </div>
                        </div>
                      )}
                        </div>
                    </div>
                </div>
                
                    {!isPending && (
                      <div className="px-6 py-4 bg-muted/30 border-t border-border flex flex-wrap gap-3">
                        {child.status === 'not_checked_in' && (
                    <button
                            onClick={() => handlePreCheckIn(child.id, child.registrationId)}
                            className="btn-primary"
                    >
                            <QrCode className="w-4 h-4 inline mr-2" />
                      Pre-Check-In
                    </button>
                  )}
                        
                        {child.status === 'checked_in' && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Child is checked in. You'll be notified when ready for pickup.
                          </p>
                        )}
                        
                        {child.status === 'ready_for_pickup' && (
                          <button
                            onClick={() => navigate('/parent/notifications')}
                            className="btn-primary"
                          >
                            <Bell className="w-4 h-4 inline mr-2" />
                            Pick Up Now
                          </button>
                        )}
                        
                  <button
                          onClick={() => navigate(`/parent/child/${child.id}`)}
                          className="btn-secondary"
                  >
                          <BookOpen className="w-4 h-4 inline mr-2" />
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
                  <button
                    onClick={() => handleEditChild(child)}
                    className="btn-secondary"
                  >
                    <Edit className="w-4 h-4 inline mr-2" />
                    Edit Details
                  </button>
                      </div>
                    )}
              </div>
            );
          })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Child Modal */}
      <AlertDialog open={showEditModal} onOpenChange={(open) => {
        setShowEditModal(open);
        if (!open) {
          setSelectedChild(null);
          setEditError('');
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Child Details</AlertDialogTitle>
            <AlertDialogDescription>
              Update information for <strong>{selectedChild?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-4">
            {editError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-800 dark:text-red-200">
                {editError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                placeholder="Child's full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                value={editFormData.dateOfBirth}
                onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                max={new Date().toISOString().split('T')[0]}
              />
              {editFormData.dateOfBirth && (
                <p className="text-xs text-muted-foreground mt-1">
                  Age: {calculateAge(editFormData.dateOfBirth)} years old
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={editFormData.gender}
                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveEdit}
              disabled={editLoading}
              className="bg-foreground text-background"
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileNav />
    </div>
  );
}

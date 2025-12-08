import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { checkInApi, checkOutApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Users, Clock, LogOut, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
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

interface ActiveCheckIn {
  recordId: string;
  childId: string;
  childName: string;
  registrationId?: string;
  groupName?: string;
  guardianName?: string;
  parentId?: string;
  timestampIn: string;
  method: string;
}

export default function ActiveCheckIns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCheckIns, setActiveCheckIns] = useState<ActiveCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [checkoutDialog, setCheckoutDialog] = useState<{ open: boolean; checkIn: ActiveCheckIn | null }>({
    open: false,
    checkIn: null,
  });

  useEffect(() => {
    loadActiveCheckIns();
    // Refresh every 30 seconds
    const interval = setInterval(loadActiveCheckIns, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveCheckIns = async () => {
    try {
      setLoading(true);
      const response = await checkInApi.getActive();
      const data = Array.isArray(response) ? response : (response?.data || []);
      setActiveCheckIns(data);
    } catch (error: any) {
      console.error('Failed to load active check-ins:', error);
      toast.error('Failed to load active check-ins', {
        description: error?.message || 'Please try again later.',
      });
      setActiveCheckIns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!checkoutDialog.checkIn || !user?.id) {
      return;
    }

    const checkIn = checkoutDialog.checkIn;
    setCheckingOut(checkIn.recordId);

    try {
      // Use the release endpoint with guardian_id
      const guardianId = checkIn.parentId || checkIn.guardianName || '';
      await checkOutApi.release(checkIn.childId, guardianId, '');
      
      toast.success('Check-out successful', {
        description: `${checkIn.childName} has been checked out.`,
      });
      
      setCheckoutDialog({ open: false, checkIn: null });
      await loadActiveCheckIns();
    } catch (error: any) {
      console.error('Check-out failed:', error);
      toast.error('Check-out failed', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setCheckingOut(null);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timestamp;
    }
  };

  const getTimeInSession = (timestamp: string) => {
    try {
      const checkInTime = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - checkInTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins}m`;
      }
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    } catch {
      return '-';
    }
  };

  if (loading && activeCheckIns.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <TeacherSidebar />
        <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
            <span className="ml-2 text-muted-foreground">Loading active check-ins...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <TeacherSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate('/teacher')}
                className="btn-secondary mb-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-semibold mb-2">Active Check-Ins</h1>
              <p className="text-muted-foreground">
                View and manage children currently in session
              </p>
            </div>
            <button
              onClick={loadActiveCheckIns}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {activeCheckIns.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-md bg-background">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No children currently checked in</p>
              <button
                onClick={() => navigate('/teacher/checkin')}
                className="btn-primary"
              >
                Go to Check-In
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">
                    {activeCheckIns.length} {activeCheckIns.length === 1 ? 'child' : 'children'} currently in session
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                {activeCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.recordId}
                    className="border border-border rounded-md p-6 bg-background shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{checkIn.childName}</h3>
                          {checkIn.registrationId && (
                            <span className="text-sm text-muted-foreground font-mono">
                              {checkIn.registrationId}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                          {checkIn.groupName && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{checkIn.groupName}</span>
                            </div>
                          )}
                          {checkIn.guardianName && (
                            <div className="flex items-center gap-2">
                              <span>Parent: {checkIn.guardianName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Checked in: {formatTime(checkIn.timestampIn)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Time in session: {getTimeInSession(checkIn.timestampIn)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Method: {checkIn.method}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setCheckoutDialog({ open: true, checkIn })}
                        disabled={checkingOut === checkIn.recordId}
                        className="btn-destructive flex items-center gap-2 ml-4"
                      >
                        <LogOut className="w-4 h-4" />
                        {checkingOut === checkIn.recordId ? 'Checking out...' : 'Check Out'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <div className="fixed-bottom-action md:hidden">
        <button onClick={() => navigate('/teacher')} className="btn-secondary w-full">
          Back to Dashboard
        </button>
      </div>

      <MobileNav />

      {/* Check-Out Confirmation Dialog */}
      <AlertDialog open={checkoutDialog.open} onOpenChange={(open) => 
        setCheckoutDialog({ open, checkIn: checkoutDialog.checkIn })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check-Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out <strong>{checkoutDialog.checkIn?.childName}</strong>?
              This will mark them as checked out and notify their parent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={checkingOut !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCheckOut}
              disabled={checkingOut !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {checkingOut ? 'Checking out...' : 'Confirm Check-Out'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


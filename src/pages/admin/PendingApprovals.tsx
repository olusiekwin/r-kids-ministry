import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { childrenApi, groupsApi } from '@/services/api';
import { Child, GroupName } from '@/types';
import { toast } from '@/components/ui/sonner';

export default function PendingApprovals() {
  const navigate = useNavigate();
  const [pendingChildren, setPendingChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedGroupForApproval, setSelectedGroupForApproval] = useState<Record<string, GroupName>>({});
  const [groups, setGroups] = useState<GroupName[]>([]);

  useEffect(() => {
    loadPendingChildren();
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const groupList = await groupsApi.list();
      setGroups(groupList as GroupName[]);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups(['Little Angels', 'Saints', 'Disciples', 'Trendsetters']);
    }
  };

  const loadPendingChildren = async () => {
    try {
      setInitialLoading(true);
      const children = await childrenApi.list();
      const pending = children.filter(c => c.status === 'pending');
      setPendingChildren(pending);
    } catch (error) {
      console.error('Failed to load pending children:', error);
      setPendingChildren([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleApprove = async (childId: string) => {
    const assignedGroup = selectedGroupForApproval[childId];
    if (!assignedGroup) {
      toast.error('Group selection required', {
        description: 'Please select a group for this child before approving.',
      });
      return;
    }
    
    setLoading(childId);
    
    try {
      // Approve child and assign to group
      await childrenApi.update(childId, {
        status: 'active',
        group: assignedGroup,
      });
      
      // Reload pending children
      await loadPendingChildren();
      toast.success('Child approved successfully!', {
        description: 'Child has been assigned to group and parent has been notified.',
      });
    } catch (error: any) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (childId: string, reason: string) => {
    setLoading(childId);
    
    try {
      await childrenApi.reject(childId, reason);
      // Reload pending children
      await loadPendingChildren();
      toast.success('Child registration rejected', {
        description: 'Parent has been notified.',
      });
    } catch (error: any) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Pending Approvals</h1>
            <p className="text-muted-foreground">
              {pendingChildren.length} child(ren) waiting for approval
            </p>
          </div>

          {initialLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading pending approvals...</p>
            </div>
          ) : pendingChildren.length === 0 ? (
            <div className="border border-border rounded-md p-12 text-center bg-background shadow-sm">
              <p className="text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingChildren.map((child) => (
                <div key={child.id} className="border border-border rounded-md bg-background shadow-sm">
                  <div className="p-8">
                    <div className="flex items-start gap-6 mb-6">
                    <PhotoPlaceholder size="lg" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{child.name}</h3>
                        <span className="status-badge bg-muted text-foreground border border-border">
                          Pending
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Registration ID: <span className="font-mono">{child.registrationId}</span></p>
                        <p>Age: {child.age} years • Gender: {child.gender}</p>
                        <p>Group: {child.group}</p>
                        <p>Date of Birth: {new Date(child.dateOfBirth).toLocaleDateString()}</p>
                        <p>Submitted by: {child.submittedBy === 'parent' ? 'Parent' : 'Teacher'}</p>
                        <p>Submitted: {child.submittedAt ? formatDate(child.submittedAt) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Info Preview */}
                  <div className="bg-muted border border-border rounded-sm p-4 mb-4">
                    <p className="text-sm font-medium mb-2">Medical Information</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Allergies: None reported</p>
                      <p>Medications: None</p>
                      <p>Special Needs: None</p>
                    </div>
                  </div>

                  {/* Group Assignment */}
                  <div className="mb-4 p-4 bg-muted/50 border border-border rounded-md">
                    <label className="block text-sm font-medium mb-2">Assign to Group *</label>
                    <select
                      value={selectedGroupForApproval[child.id] || ''}
                      onChange={(e) => {
                        setSelectedGroupForApproval({
                          ...selectedGroupForApproval,
                          [child.id]: e.target.value as GroupName,
                        });
                      }}
                      className="input-field w-full max-w-xs"
                      disabled={loading === child.id}
                    >
                      <option value="">Select group...</option>
                      {groups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Admin must assign child to appropriate group before approval
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApprove(child.id)}
                      disabled={loading === child.id || !selectedGroupForApproval[child.id]}
                      className="btn-success"
                    >
                      {loading === child.id ? 'Processing...' : '✓ Approve & Assign Group'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason (optional):');
                        if (reason !== null) {
                          handleReject(child.id, reason);
                        }
                      }}
                      disabled={loading === child.id}
                      className="btn-destructive"
                    >
                      ✗ Reject
                    </button>
                    <button
                      onClick={() => navigate(`/admin/child/${child.id}`)}
                      className="btn-secondary"
                    >
                      View Details
                    </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="btn-secondary mt-6"
        >
          Back to Dashboard
        </button>
      </main>

      <MobileNav />
    </div>
  );
}


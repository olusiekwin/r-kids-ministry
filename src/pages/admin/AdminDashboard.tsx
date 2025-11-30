import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { parentsApi, usersApi } from '@/services/api';
import { Parent, User } from '@/types';

type SortField = 'id' | 'name' | 'childrenCount' | 'status';
type SortOrder = 'asc' | 'desc';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    parents: 0,
    teachers: 0,
    teens: 0,
    children: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [parentsData, teachersData, teensData] = await Promise.all([
        parentsApi.list().catch(() => []),
        usersApi.listByRole('teacher').catch(() => []),
        usersApi.listByRole('teen').catch(() => []),
      ]);
      
      setStats({
        parents: parentsData.length,
        teachers: teachersData.length,
        teens: teensData.length,
        children: 0, // Will be loaded separately
        pendingApprovals: 0, // Will be loaded separately
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your ministry management</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="border border-border rounded-lg p-6 bg-background">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Parents</p>
                    <p className="text-2xl font-bold text-foreground">{stats.parents}</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/manage-users?tab=parent')}
                    className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-90"
                  >
                    Manage
                  </button>
                </div>
              </div>
              <div className="border border-border rounded-lg p-6 bg-background">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Teachers</p>
                    <p className="text-2xl font-bold text-foreground">{stats.teachers}</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/manage-users?tab=teacher')}
                    className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-90"
                  >
                    Manage
                  </button>
                </div>
              </div>
              <div className="border border-border rounded-lg p-6 bg-background">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Teens</p>
                    <p className="text-2xl font-bold text-foreground">{stats.teens}</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/manage-users?tab=teen')}
                    className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-90"
                  >
                    Manage
                  </button>
                </div>
              </div>
              <div className="border border-border rounded-lg p-6 bg-background">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingApprovals}</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/pending-approvals')}
                    className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-90"
                  >
                    Review
                  </button>
                </div>
              </div>
          </div>

            {/* Quick Actions */}
            <div className="border border-border rounded-lg p-6 bg-background">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/admin/manage-users')}
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <p className="font-medium mb-1">Manage Users</p>
                  <p className="text-sm text-muted-foreground">Create teachers, teens, and parents</p>
                </button>
                <button
                  onClick={() => navigate('/admin/children')}
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <p className="font-medium mb-1">All Children</p>
                  <p className="text-sm text-muted-foreground">View all children added by parents</p>
                </button>
                <button
                  onClick={() => navigate('/admin/check-ins')}
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <p className="font-medium mb-1">Check-Ins & Check-Outs</p>
                  <p className="text-sm text-muted-foreground">Track children received and pickup status</p>
                </button>
                <button
                  onClick={() => navigate('/admin/groups')}
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <p className="font-medium mb-1">Manage Groups</p>
                  <p className="text-sm text-muted-foreground">Assign teachers to groups</p>
                </button>
              <button
                  onClick={() => navigate('/admin/guardians')}
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
              >
                  <p className="font-medium mb-1">Manage Guardians</p>
                  <p className="text-sm text-muted-foreground">View and manage all guardians</p>
              </button>
              <button
                  onClick={() => navigate('/admin/reports')}
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
              >
                  <p className="font-medium mb-1">View Reports</p>
                  <p className="text-sm text-muted-foreground">Attendance and analytics</p>
              </button>
              <button
                  onClick={() => navigate('/admin/user-activity')}
                  className="p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
              >
                  <p className="font-medium mb-1">User Activity Tracking</p>
                  <p className="text-sm text-muted-foreground">Monitor user activities and actions</p>
              </button>
            </div>
          </div>
          </>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

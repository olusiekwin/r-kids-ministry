import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { parentsApi, usersApi, analyticsApi } from '@/services/api';
import { Parent, User } from '@/types';
import { Users, Calendar, BarChart3, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    loadStats();
    loadAnalytics();
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

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await analyticsApi.getAdminAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      setAnalytics([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };


  return (
    <div className="min-h-screen liquid-bg pb-16 md:pb-0 relative">
      <div className="absolute inset-0 z-0">
        {/* Liquid morphing background effect */}
      </div>
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8 relative z-10">
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
              <div className="glass border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Parents</p>
                    <p className="text-2xl font-bold text-foreground">{stats.parents}</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/manage-users?tab=parent')}
                    className="px-3 py-1.5 text-xs font-medium btn-primary rounded-lg"
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
                    className="px-3 py-1.5 text-xs font-medium btn-primary rounded-lg"
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
                    className="px-3 py-1.5 text-xs font-medium btn-primary rounded-lg"
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
                    className="px-3 py-1.5 text-xs font-medium btn-primary rounded-lg"
                  >
                    Review
                  </button>
                </div>
              </div>
          </div>

            {/* Quick Actions */}
            <div className="glass border border-border/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/admin/manage-users')}
                  className="p-4 glass border border-border/50 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left"
                >
                  <p className="font-medium mb-1">Manage Users</p>
                  <p className="text-sm text-muted-foreground">Create teachers, teens, and parents</p>
                </button>
                <button
                  onClick={() => navigate('/admin/children')}
                  className="p-4 glass border border-border/50 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left"
                >
                  <p className="font-medium mb-1">All Children</p>
                  <p className="text-sm text-muted-foreground">View all children added by parents</p>
                </button>
                <button
                  onClick={() => navigate('/admin/check-ins')}
                  className="p-4 glass border border-border/50 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left"
                >
                  <p className="font-medium mb-1">Check-Ins & Check-Outs</p>
                  <p className="text-sm text-muted-foreground">Track children received and pickup status</p>
                </button>
                <button
                  onClick={() => navigate('/admin/groups')}
                  className="p-4 glass border border-border/50 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left"
                >
                  <p className="font-medium mb-1">Manage Groups</p>
                  <p className="text-sm text-muted-foreground">Assign teachers to groups</p>
                </button>
              <button
                  onClick={() => navigate('/admin/guardians')}
                  className="p-4 glass border border-border/50 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left"
                >
                  <p className="font-medium mb-1">Manage Guardians</p>
                  <p className="text-sm text-muted-foreground">View and manage all guardians</p>
              </button>
              <button
                  onClick={() => navigate('/admin/reports')}
                  className="p-4 glass border border-border/50 rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left"
              >
                  <p className="font-medium mb-1">View Reports</p>
                  <p className="text-sm text-muted-foreground">Attendance and analytics</p>
              </button>
            </div>
          </div>

            {/* All Groups & Teachers Analytics */}
            {!analyticsLoading && analytics.length > 0 && (
              <div className="glass border border-border/50 rounded-xl p-6 shadow-lg mt-8">
                <h2 className="text-lg font-semibold mb-4">Groups & Teachers Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.map((group) => (
                    <div key={group.group_id} className="glass border border-border/50 rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{group.group_name}</h3>
                        <span className="text-xs text-muted-foreground">{group.teacher_name || 'Unassigned'}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>Students</span>
                          </div>
                          <span className="font-semibold text-foreground">{group.students_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Sessions</span>
                          </div>
                          <span className="font-semibold text-foreground">{group.total_sessions}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <BarChart3 className="w-4 h-4" />
                            <span>Avg Attendance</span>
                          </div>
                          <span className="font-semibold text-foreground">{group.avg_attendance_rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

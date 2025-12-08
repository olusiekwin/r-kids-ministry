import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { useAuth } from '@/contexts/AuthContext';
import { childrenApi, groupsApi, analyticsApi, teachersApi } from '@/services/api';
import { Child, GroupName } from '@/types';
import { TrendingUp, Users, Calendar, BarChart3, CheckCircle2, Clock, ArrowRight, QrCode, Send, Shield } from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<GroupName | null>(null);
  const [assignedGroups, setAssignedGroups] = useState<GroupName[]>([]);
  const [groupChildren, setGroupChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAssignedGroup, setHasAssignedGroup] = useState(false);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [todayStats, setTodayStats] = useState({ checkedIn: 0, total: 0 });

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup && hasAssignedGroup) {
      loadGroupChildren();
    }
  }, [selectedGroup, hasAssignedGroup]);

  useEffect(() => {
    if (hasAssignedGroup) {
      loadAnalytics();
    }
  }, [hasAssignedGroup]);

  const loadGroups = async () => {
    if (!user?.id) {
      setHasAssignedGroup(false);
      setAssignedGroups([]);
      setSelectedGroup(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use teacher-specific API that filters by teacher_id
      const teacherGroupsData = await teachersApi.getGroups(user.id);
      const teacherGroups = (teacherGroupsData || []).map((g: any) => g.name || g).filter(Boolean) as GroupName[];
      
      if (teacherGroups && teacherGroups.length > 0) {
        setAssignedGroups(teacherGroups);
        setHasAssignedGroup(true);
        setSelectedGroup(teacherGroups[0] as GroupName);
      } else {
        setHasAssignedGroup(false);
        setAssignedGroups([]);
        setSelectedGroup(null);
      }
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      setHasAssignedGroup(false);
      setAssignedGroups([]);
      setSelectedGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupChildren = async () => {
    if (!user?.id || !selectedGroup) {
      setGroupChildren([]);
      return;
    }

    try {
      setLoading(true);
      // Find the group ID from the assigned groups data
      const teacherGroupsData = await teachersApi.getGroups(user.id);
      const selectedGroupData = (teacherGroupsData || []).find((g: any) => (g.name || g) === selectedGroup);
      const groupId = selectedGroupData?.id;
      
      if (groupId) {
        // Use teacher-specific API that filters by teacher_id and group_id
        const children = await teachersApi.getChildren(user.id, groupId);
        setGroupChildren(children || []);
        setTodayStats({ checkedIn: 0, total: (children || []).length }); // TODO: Get actual check-in stats
      } else {
        // Fallback to regular children API if group ID not found
      const children = await childrenApi.list({ group: selectedGroup });
        setGroupChildren(children || []);
        setTodayStats({ checkedIn: 0, total: (children || []).length });
      }
    } catch (error: any) {
      console.error('Failed to load children:', error);
      setGroupChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!user?.id) return;
    try {
      setAnalyticsLoading(true);
      const data = await analyticsApi.getTeacherAnalytics(user.id);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      setAnalytics([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Show waiting message if no groups assigned or still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-16 md:pb-0">
        <Header />
        <TeacherSidebar />
        <main className="md:ml-64 container py-12 px-4 md:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!hasAssignedGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-16 md:pb-0">
        <Header />
        <TeacherSidebar />
        <main className="md:ml-64 container py-12 px-4 md:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <Clock className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name || 'Teacher'}!</h1>
              <p className="text-muted-foreground text-lg">Your profile is ready</p>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-xl p-12 bg-card shadow-sm text-center">
              <h2 className="text-xl font-semibold mb-3">Waiting for Group Assignment</h2>
              <p className="text-muted-foreground mb-6">
                  Your profile has been completed successfully! Please wait for an administrator to assign you to a group.
                </p>
                <p className="text-sm text-muted-foreground">
                  Once assigned, you'll be able to check in children and manage your group.
                </p>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  const attendanceRate = todayStats.total > 0 ? Math.round((todayStats.checkedIn / todayStats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-16 md:pb-0">
      <Header />
      <TeacherSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Teacher'}!</h1>
            <p className="text-muted-foreground text-lg">Here's what's happening with your groups today</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Students</p>
              <p className="text-3xl font-bold">{groupChildren.length}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Checked In Today</p>
              <p className="text-3xl font-bold">{todayStats.checkedIn}</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold">{attendanceRate}%</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Active Groups</p>
              <p className="text-3xl font-bold">{assignedGroups.length}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => navigate('/teacher/checkin')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Check-In Children</h3>
              <p className="text-sm text-muted-foreground">Scan QR codes or enter OTP to check in children for today's session</p>
            </button>

            <button
              onClick={() => navigate('/calendar')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold mb-2">View Calendar</h3>
              <p className="text-sm text-muted-foreground">See upcoming sessions and manage your schedule</p>
            </button>

            <button
              onClick={() => navigate('/teacher/send-pickup')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Send className="w-6 h-6 text-green-500" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Send Pickup</h3>
              <p className="text-sm text-muted-foreground">Notify parents when children are ready for pickup</p>
            </button>

            <button
              onClick={() => navigate('/teacher/active-checkins')}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <CheckCircle2 className="w-6 h-6 text-blue-500" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Active Check-Ins</h3>
              <p className="text-sm text-muted-foreground">View and manage children currently in session</p>
            </button>
        </div>

          {/* Group Selection */}
          {assignedGroups.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Select Group:</label>
              <div className="flex flex-wrap gap-3">
                {assignedGroups.map((group) => {
                  const groupName = typeof group === 'string' ? group : (group as any)?.name || String(group);
                  return (
                    <button
                      key={groupName}
                      onClick={() => setSelectedGroup(groupName as GroupName)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedGroup === groupName
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {groupName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group Analytics */}
        {!analyticsLoading && analytics.length > 0 && (
          <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Group Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.map((group) => (
                  <div key={group.group_id} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">{group.group_name}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                          <span className="text-sm">Students</span>
                      </div>
                        <span className="font-semibold">{group.students_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                          <span className="text-sm">Sessions</span>
                      </div>
                        <span className="font-semibold">{group.total_sessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BarChart3 className="w-4 h-4" />
                          <span className="text-sm">Avg Attendance</span>
                      </div>
                        <span className="font-semibold">{group.avg_attendance_rate?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
          {/* Children List */}
        {loading ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">Loading children...</p>
          </div>
        ) : !selectedGroup ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">Please select a group</p>
          </div>
        ) : groupChildren.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No children in this group yet</p>
          </div>
        ) : (
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold">
                  {selectedGroup} <span className="text-muted-foreground font-normal">({groupChildren.length} children)</span>
            </h2>
              </div>
              <div className="divide-y divide-border">
              {groupChildren.map((child) => (
                  <div key={child.id} className="flex items-center gap-4 p-6 hover:bg-muted/30 transition-colors">
                  <PhotoPlaceholder size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-muted-foreground mb-1">
                      {child.registrationId}
                    </p>
                      <p className="font-semibold text-lg mb-1">
                        {child.name} <span className="text-muted-foreground font-normal">({child.age})</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {child.guardians?.filter(g => g.status === 'active').map(g => g.name).join(', ') || 'No guardians'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => navigate('/teacher/checkin')}
                        className="btn-primary btn-sm"
                      >
                        Check In
                      </button>
                      <button 
                        onClick={() => navigate(`/teacher/guardian-authorize/${child.id}`)}
                        className="btn-secondary btn-sm"
                        title="Authorize Guardian"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

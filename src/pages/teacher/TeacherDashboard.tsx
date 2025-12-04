import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { useAuth } from '@/contexts/AuthContext';
import { childrenApi, groupsApi, analyticsApi } from '@/services/api';
import { Child, GroupName } from '@/types';
import { TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';

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
    try {
      setLoading(true);
      // Try to fetch groups assigned to this teacher
      const allGroups = await groupsApi.list();
      
      // Check if teacher has assigned groups (for now, check if any groups exist)
      // In production, you'd filter by teacher_id
      const teacherGroups = allGroups as GroupName[];
      
      if (teacherGroups && teacherGroups.length > 0) {
        setAssignedGroups(teacherGroups);
        setHasAssignedGroup(true);
        setSelectedGroup(teacherGroups[0] as GroupName);
      } else {
        // No groups assigned - show waiting message
        setHasAssignedGroup(false);
        setAssignedGroups([]);
        setSelectedGroup(null);
      }
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      // If error, assume no groups assigned yet
      setHasAssignedGroup(false);
      setAssignedGroups([]);
      setSelectedGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupChildren = async () => {
    try {
      setLoading(true);
      const children = await childrenApi.list({ group: selectedGroup });
      setGroupChildren(children);
    } catch (error: any) {
      console.error('Failed to load children:', error);
      // Set empty array if backend is not available
      setGroupChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await analyticsApi.getTeacherAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      setAnalytics([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Show waiting message if no groups assigned
  if (!loading && !hasAssignedGroup) {
    return (
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Header />
        
        <main className="container py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold mb-2">Teacher Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {user?.name || 'Teacher'}!</p>
            </div>
            
            <div className="border-2 border-border rounded-lg p-12 bg-muted/30 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground/10 mb-4">
                  <svg className="w-8 h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Waiting for Group Assignment</h2>
                <p className="text-muted-foreground mb-4">
                  Your profile has been completed successfully! Please wait for an administrator to assign you to a group.
                </p>
                <p className="text-sm text-muted-foreground">
                  Once assigned, you'll be able to check in children and manage your group.
                </p>
              </div>
              
              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  If you have questions, please contact your administrator.
                </p>
              </div>
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <TeacherSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Check in children and manage your group</p>
        </div>

        {/* Analytics Section */}
        {!analyticsLoading && analytics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Group Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {analytics.map((group) => (
                <div key={group.group_id} className="border border-border rounded-lg p-4 bg-background">
                  <h3 className="font-semibold text-sm mb-3 text-foreground">{group.group_name}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">Students</span>
                      </div>
                      <span className="font-semibold text-foreground">{group.students_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs">Sessions</span>
                      </div>
                      <span className="font-semibold text-foreground">{group.total_sessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs">Avg Attendance</span>
                      </div>
                      <span className="font-semibold text-foreground">{group.avg_attendance_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {assignedGroups.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-foreground">Select Group:</label>
            <div className="flex flex-wrap gap-2">
              {assignedGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={selectedGroup === group ? 'btn-primary' : 'btn-secondary'}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => navigate('/teacher/checkin')}
            className="btn-primary"
          >
            Scan QR Code
          </button>
          <button 
            onClick={() => navigate('/teacher/manual-checkin')}
            className="btn-secondary"
          >
            Manual Check-in
          </button>
          <button 
            onClick={() => navigate('/teacher/add-child')}
            className="btn-secondary"
          >
            Add Child to Group
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : !selectedGroup ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No group selected</p>
          </div>
        ) : groupChildren.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No children in this group</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {selectedGroup} ({groupChildren.length} children)
            </h2>
            <div className="border border-border rounded-md divide-y divide-border bg-background shadow-sm">
              {groupChildren.map((child) => (
                <div key={child.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <PhotoPlaceholder size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-muted-foreground mb-1">
                      {child.registrationId}
                    </p>
                    <p className="font-semibold text-foreground mb-1">
                      {child.name} ({child.age})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Guardians: {child.guardians?.filter(g => g.status === 'active').map(g => g.name).join(', ') || 'None'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary btn-sm">Check-in</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

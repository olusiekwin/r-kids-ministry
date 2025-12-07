import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { childrenApi, groupsApi, usersApi } from '@/services/api';
import { Child, GroupName, User } from '@/types';

interface GroupWithTeacher {
  name: GroupName;
  count: number;
  ageRange: string;
  schedule: string;
  room: string;
  teacherId?: string;
  teacherName?: string;
  groupId?: string; // Store group ID for updates
}

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupName[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupName | null>(null);
  const [groupStats, setGroupStats] = useState<GroupWithTeacher[]>([]);
  const [selectedGroupChildren, setSelectedGroupChildren] = useState<Child[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningTeacher, setAssigningTeacher] = useState<string | null>(null);

  useEffect(() => {
    loadTeachers();
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupChildren();
    }
  }, [selectedGroup]);

  const loadTeachers = async () => {
    try {
      const teachersList = await usersApi.listByRole('teacher');
      setTeachers(teachersList);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      setTeachers([]);
    }
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      // Use groupsApi to get full group objects with teacher info
      const groupsWithDetails = await groupsApi.list();
      const groupsData = groupsWithDetails.map((g: any) => g.name) as GroupName[];
      
      setGroups(groupsData);
      
      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0]);
      }

      // Load stats for each group with teacher info
      const statsPromises = groupsData.map(async (group) => {
        // Find group details from API response
        const groupDetails = groupsWithDetails.find((g: any) => g.name === group);
        const children = await childrenApi.list({ group });
        
        // Get teacher info from group details or teachers list
        let teacherId = groupDetails?.teacherId;
        let teacherName = groupDetails?.teacherName;
        if (teacherId && teachers.length > 0 && !teacherName) {
          const teacher = teachers.find(t => t.id === teacherId);
          teacherName = teacher?.name;
        }
        
        return {
          name: group,
          count: children.length,
          ageRange: groupDetails 
            ? `${groupDetails.ageRangeMin}-${groupDetails.ageRangeMax}`
            : (group === 'Little Angels' ? '3-5' : 
               group === 'Saints' ? '6-9' : 
               group === 'Disciples' ? '10-12' : '13-19'),
          schedule: groupDetails?.schedule || 'Sundays 9:30 AM',
          room: groupDetails?.room || 
                (group === 'Little Angels' ? 'Room 101' : 
                 group === 'Saints' ? 'Room 102' : 
                 group === 'Disciples' ? 'Room 201' : 'Room 205'),
          teacherId,
          teacherName,
          groupId: groupDetails?.id, // Store group ID for updates
        };
      });

      const stats = await Promise.all(statsPromises);
      setGroupStats(stats);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups(['Little Angels', 'Saints', 'Disciples', 'Trendsetters']);
    } finally {
      setLoading(false);
    }
  };

  const assignTeacher = async (groupName: GroupName, teacherId: string | null) => {
    try {
      setAssigningTeacher(groupName);
      // Find group ID from groupStats
      const groupStat = groupStats.find(s => s.name === groupName);
      if (!groupStat || !groupStat.groupId) {
        // If not found, fetch groups to get ID
        const groupsList = await groupsApi.list();
        const groupDetails = groupsList.find((g: any) => g.name === groupName);
        if (!groupDetails || !groupDetails.id) {
          throw new Error('Group not found');
        }
        await groupsApi.update(groupDetails.id, { teacherId: teacherId || null });
      } else {
        await groupsApi.update(groupStat.groupId, { teacherId: teacherId || null });
      }
      
      // Reload groups to get fresh data from backend
      await loadGroups();
    } catch (error: any) {
      console.error('Failed to assign teacher:', error);
      alert(error?.message || 'Failed to assign teacher. Please try again.');
    } finally {
      setAssigningTeacher(null);
    }
  };

  const loadGroupChildren = async () => {
    if (!selectedGroup) return;
    
    try {
      const children = await childrenApi.list({ group: selectedGroup });
      setSelectedGroupChildren(children);
    } catch (error) {
      console.error('Failed to load children:', error);
      setSelectedGroupChildren([]);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Groups Management</h1>
          <p className="text-muted-foreground">View and manage children by group</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading groups...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {groupStats.map((stat) => (
                <div
                  key={stat.name}
                  className={`border rounded-md p-4 cursor-pointer transition-all ${
                    selectedGroup === stat.name
                      ? 'border-foreground bg-muted/50'
                      : 'border-border hover:shadow-md'
                  }`}
                  onClick={() => setSelectedGroup(stat.name)}
                >
                  <h3 className="font-semibold mb-2">{stat.name}</h3>
                  <p className="text-2xl font-bold mb-1">{stat.count}</p>
                  <p className="text-sm text-muted-foreground mb-3">Children</p>
                  <p className="text-xs text-muted-foreground mb-1">Ages {stat.ageRange}</p>
                  <p className="text-xs text-muted-foreground mb-3">{stat.room}</p>
                  
                  <div className="mt-3 pt-3 border-t border-border">
                    <label className="text-xs font-medium text-foreground mb-1 block">Teacher</label>
                    <select
                      value={stat.teacherId || ''}
                      onChange={(e) => assignTeacher(stat.name, e.target.value || null)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={assigningTeacher === stat.name}
                      className="w-full text-xs px-2 py-1 border border-border rounded bg-background text-foreground"
                    >
                      <option value="">No teacher assigned</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                    {stat.teacherName && (
                      <p className="text-xs text-muted-foreground mt-1">{stat.teacherName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedGroup && (
                  <div>
                <h2 className="text-lg font-semibold mb-4">
                  {selectedGroup} - {selectedGroupChildren.length} children
                </h2>
                {selectedGroupChildren.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No children in this group</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-md divide-y divide-border bg-background shadow-sm">
                    {selectedGroupChildren.map((child) => (
                      <div key={child.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex-1">
                          <p className="font-mono text-xs text-muted-foreground">{child.registrationId}</p>
                          <p className="font-semibold">{child.name} ({child.age})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
            )}
          </>
        )}

        <button onClick={() => navigate('/admin')} className="btn-secondary mt-6">
          Back to Dashboard
        </button>
      </main>

      <MobileNav />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { childrenApi, groupsApi } from '@/services/api';
import { Child, GroupName, User } from '@/types';

interface GroupWithTeacher {
  name: GroupName;
  count: number;
  ageRange: string;
  schedule: string;
  room: string;
  teacherId?: string;
  teacherName?: string;
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
      // Fetch teachers from API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/users?role=teacher`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.data || data || []);
      }
    } catch (error) {
      console.error('Failed to load teachers:', error);
      // Fallback empty array
      setTeachers([]);
    }
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      const groupList = await groupsApi.list();
      const groupsData = groupList as GroupName[];
      setGroups(groupsData);
      
      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0]);
      }

      // Load stats for each group with teacher info
      const statsPromises = groupsData.map(async (group) => {
        const children = await childrenApi.list({ group });
        // Fetch group details including teacher
        try {
          const groupDetailsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/groups?name=${encodeURIComponent(group)}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          });
          let teacherId, teacherName;
          if (groupDetailsResponse.ok) {
            const groupData = await groupDetailsResponse.json();
            teacherId = groupData.data?.teacher_id || groupData.teacher_id;
            if (teacherId && teachers.length > 0) {
              const teacher = teachers.find(t => t.id === teacherId);
              teacherName = teacher?.name;
            }
          }
          return {
            name: group,
            count: children.length,
            ageRange: group === 'Little Angels' ? '3-5' : 
                      group === 'Saints' ? '6-9' : 
                      group === 'Disciples' ? '10-12' : '13-19',
            schedule: 'Sundays 9:30 AM',
            room: group === 'Little Angels' ? 'Room 101' : 
                  group === 'Saints' ? 'Room 102' : 
                  group === 'Disciples' ? 'Room 201' : 'Room 205',
            teacherId,
            teacherName,
          };
        } catch (error) {
          return {
    name: group,
            count: children.length,
    ageRange: group === 'Little Angels' ? '3-5' : 
              group === 'Saints' ? '6-9' : 
                      group === 'Disciples' ? '10-12' : '13-19',
    schedule: 'Sundays 9:30 AM',
    room: group === 'Little Angels' ? 'Room 101' : 
          group === 'Saints' ? 'Room 102' : 
          group === 'Disciples' ? 'Room 201' : 'Room 205',
          };
        }
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/groups/${encodeURIComponent(groupName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ teacher_id: teacherId || null }),
      });
      
      if (response.ok) {
        // Update local state immediately
        setGroupStats(prev => prev.map(stat => 
          stat.name === groupName 
            ? { ...stat, teacherId: teacherId || undefined, teacherName: teacherId ? teachers.find(t => t.id === teacherId)?.name : undefined }
            : stat
        ));
        // Optionally reload groups
        // await loadGroups();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to assign teacher' }));
        alert(errorData.message || 'Failed to assign teacher');
      }
    } catch (error) {
      console.error('Failed to assign teacher:', error);
      alert('Failed to assign teacher. Please try again.');
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
                          <p className="text-sm text-muted-foreground">Status: {child.status}</p>
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

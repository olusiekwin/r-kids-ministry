import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { childrenApi, groupsApi } from '@/services/api';
import { Child, GroupName } from '@/types';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<GroupName>('Little Angels');
  const [groups, setGroups] = useState<GroupName[]>([]);
  const [groupChildren, setGroupChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupChildren();
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const data = await groupsApi.list();
      setGroups(data as GroupName[]);
      if (data.length > 0) {
        setSelectedGroup(data[0] as GroupName);
      }
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      // Fallback to default groups if backend is not available
      const defaultGroups: GroupName[] = ['Little Angels', 'Saints', 'Disciples', 'Trendsetters'];
      setGroups(defaultGroups);
      setSelectedGroup(defaultGroups[0]);
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

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Check in children and manage your group</p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-foreground">Select Group:</label>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
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
            <p className="text-muted-foreground">Loading children...</p>
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

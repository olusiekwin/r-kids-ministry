import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { mockChildren, groups } from '@/data/mockData';
import { GroupName } from '@/types';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<GroupName>('Little Angels');

  const groupChildren = mockChildren.filter(child => child.group === selectedGroup);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Teacher Dashboard</h2>
        
        <div className="mb-6">
          <label className="block text-sm mb-2">Select Group:</label>
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
            Scan QR
          </button>
          <button 
            onClick={() => navigate('/teacher/manual-checkin')}
            className="btn-secondary"
          >
            Manual Check-in
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">{selectedGroup} — {groupChildren.length} children</h3>
          
          {groupChildren.length === 0 ? (
            <p className="text-sm text-muted-foreground">No children in this group.</p>
          ) : (
            <div className="border border-border rounded-sm divide-y divide-border">
              {groupChildren.map((child) => (
                <div key={child.id} className="flex items-center gap-4 p-4">
                  <PhotoPlaceholder size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-muted-foreground">
                      {child.registrationId}
                    </p>
                    <p className="font-medium">
                      {child.name} ({child.age})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Guardians: {child.guardians.filter(g => g.status === 'active').map(g => g.name).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-ghost btn-sm">Check-in</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

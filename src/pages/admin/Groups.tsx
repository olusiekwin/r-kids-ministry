import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { mockChildren, groups } from '@/data/mockData';

export default function Groups() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState(groups[0]);

  const groupStats = groups.map(group => ({
    name: group,
    count: mockChildren.filter(c => c.group === group).length,
    ageRange: group === 'Little Angels' ? '3-5' : 
              group === 'Saints' ? '6-9' : 
              group === 'Disciples' ? '10-12' : '13-17',
    schedule: 'Sundays 9:30 AM',
    room: group === 'Little Angels' ? 'Room 101' : 
          group === 'Saints' ? 'Room 102' : 
          group === 'Disciples' ? 'Room 201' : 'Room 205',
  }));

  const selectedGroupChildren = mockChildren.filter(c => c.group === selectedGroup);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Groups Management</h2>
        
        {/* Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {groupStats.map((group) => (
            <button
              key={group.name}
              onClick={() => setSelectedGroup(group.name as typeof selectedGroup)}
              className={`text-left p-4 border rounded-sm transition-colors ${
                selectedGroup === group.name 
                  ? 'border-foreground bg-muted' 
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <h3 className="font-medium mb-2">{group.name}</h3>
              <p className="text-2xl font-medium mb-1">{group.count}</p>
              <p className="text-xs text-muted-foreground">children enrolled</p>
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
                <p>Ages: {group.ageRange}</p>
                <p>{group.room}</p>
                <p>{group.schedule}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Group Children */}
        <div className="border border-border rounded-sm">
          <div className="p-4 border-b border-border bg-muted">
            <h3 className="font-medium">{selectedGroup} — Enrolled Children</h3>
          </div>
          <div className="divide-y divide-border">
            {selectedGroupChildren.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No children in this group.</p>
            ) : (
              selectedGroupChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{child.registrationId}</p>
                    <p className="font-medium">{child.name} ({child.age})</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-ghost btn-sm">View</button>
                    <button className="btn-ghost btn-sm">Move</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button onClick={() => navigate('/admin')} className="btn-secondary mt-6">
          Back to Dashboard
        </button>
      </main>

      <MobileNav />
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { mockChildren } from '@/data/mockData';

export default function ManageGuardians() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten all guardians from all children
  const allGuardians = mockChildren.flatMap(child => 
    child.guardians.map(g => ({
      ...g,
      childName: child.name,
      childId: child.registrationId,
    }))
  );

  const filteredGuardians = allGuardians.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.childName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Manage Guardians</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button className="btn-primary">Add Guardian</button>
          <button className="btn-secondary">Export List</button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search guardians or children..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-sm"
          />
        </div>

        <div className="border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="table-header">Guardian</th>
                  <th className="table-header">Child</th>
                  <th className="table-header">Relationship</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Expires</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuardians.map((guardian, index) => (
                  <tr key={`${guardian.id}-${index}`} className="hover:bg-muted/50">
                    <td className="table-cell font-medium">{guardian.name}</td>
                    <td className="table-cell">
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {guardian.childId}
                      </span>
                      {guardian.childName}
                    </td>
                    <td className="table-cell">{guardian.relationship}</td>
                    <td className="table-cell">
                      <span className={`status-badge ${
                        guardian.status === 'active' 
                          ? 'bg-muted text-success' 
                          : 'bg-muted text-destructive'
                      }`}>
                        {guardian.status}
                      </span>
                    </td>
                    <td className="table-cell text-sm">
                      {guardian.expiresAt || '—'}
                    </td>
                    <td className="table-cell">
                      <button className="btn-ghost btn-sm">Edit</button>
                      {guardian.status === 'expired' && (
                        <button className="btn-ghost btn-sm">Renew</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

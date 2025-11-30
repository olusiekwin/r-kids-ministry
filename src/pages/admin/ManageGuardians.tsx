import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { childrenApi, guardiansApi } from '@/services/api';
import { Child, Guardian } from '@/types';

interface GuardianWithChild extends Guardian {
  childName: string;
  childId: string;
}

export default function ManageGuardians() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [guardians, setGuardians] = useState<GuardianWithChild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuardians();
  }, []);

  const loadGuardians = async () => {
    try {
      setLoading(true);
      // Get all children first
      const children = await childrenApi.list();
      
      // Get guardians for each child and flatten
      const allGuardians: GuardianWithChild[] = [];
      
      for (const child of children) {
        if (child.guardians && child.guardians.length > 0) {
          const guardiansWithChild = child.guardians.map(g => ({
      ...g,
      childName: child.name,
      childId: child.registrationId,
          }));
          allGuardians.push(...guardiansWithChild);
        }
      }
      
      setGuardians(allGuardians);
    } catch (error) {
      console.error('Failed to load guardians:', error);
      setGuardians([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuardians = guardians.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.childName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Manage Guardians</h1>
          <p className="text-muted-foreground">View and manage all guardians</p>
        </div>
        
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading guardians...</p>
          </div>
        ) : filteredGuardians.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No guardians found</p>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden bg-background shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
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
                    <tr key={`${guardian.id}-${index}`} className="hover:bg-muted/30 transition-colors border-b border-border last:border-0">
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
                            ? 'bg-foreground text-background border border-foreground' 
                            : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {guardian.status}
                      </span>
                    </td>
                    <td className="table-cell text-sm">
                      {guardian.expiresAt || '—'}
                    </td>
                    <td className="table-cell">
                        <div className="flex gap-2">
                      <button className="btn-ghost btn-sm">Edit</button>
                      {guardian.status === 'expired' && (
                        <button className="btn-ghost btn-sm">Renew</button>
                      )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        <button onClick={() => navigate('/admin')} className="btn-secondary mt-6">
          Back to Dashboard
        </button>
      </main>

      <MobileNav />
    </div>
  );
}

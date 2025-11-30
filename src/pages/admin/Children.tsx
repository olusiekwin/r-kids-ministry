import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { childrenApi, parentsApi } from '@/services/api';
import { Child, Parent, GroupName } from '@/types';

export default function Children() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<Record<string, Parent>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');
  const [filterGroup, setFilterGroup] = useState<GroupName | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [childrenData, parentsData] = await Promise.all([
        childrenApi.list().catch(() => []),
        parentsApi.list().catch(() => []),
      ]);

      setChildren(childrenData);
      
      // Create parents lookup
      const parentsMap: Record<string, Parent> = {};
      parentsData.forEach(parent => {
        parentsMap[parent.id] = parent;
      });
      setParents(parentsMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = children.filter(child => {
    // Status filter
    if (filterStatus !== 'all' && child.status !== filterStatus) {
      return false;
    }

    // Group filter
    if (filterGroup !== 'all' && child.group !== filterGroup) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        child.name.toLowerCase().includes(term) ||
        child.registrationId?.toLowerCase().includes(term) ||
        parents[child.parentId]?.name.toLowerCase().includes(term) ||
        parents[child.parentId]?.email.toLowerCase().includes(term)
      );
    }

    return true;
  });

  const stats = {
    total: children.length,
    active: children.filter(c => c.status === 'active').length,
    pending: children.filter(c => c.status === 'pending').length,
    rejected: children.filter(c => c.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />

      <main className="md:ml-64 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">All Children</h1>
          <p className="text-muted-foreground">View and manage all children registered by parents</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Total Children</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-background">
            <p className="text-sm text-muted-foreground mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, ID, or parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field flex-1 min-w-[200px]"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value as any)}
            className="input-field"
          >
            <option value="all">All Groups</option>
            <option value="Little Angels">Little Angels</option>
            <option value="Saints">Saints</option>
            <option value="Disciples">Disciples</option>
            <option value="Trendsetters">Trendsetters</option>
          </select>
        </div>

        {/* Children Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading children...</p>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No children found</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Registration ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Age</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Group</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Parent</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Guardians</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredChildren.map((child) => (
                    <tr key={child.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-muted-foreground">
                        {child.registrationId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">{child.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{child.age} years</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{child.group}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {parents[child.parentId]?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          child.status === 'active'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : child.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {child.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {child.guardians?.length || 0} guardian(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/child/${child.id}`)}
                            className="px-3 py-1.5 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition-colors"
                          >
                            View
                          </button>
                          {child.status === 'pending' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await childrenApi.approve(child.id);
                                    alert('Child approved successfully!');
                                    loadData();
                                  } catch (error) {
                                    alert('Failed to approve child');
                                  }
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors border border-green-200"
                              >
                                Approve
                              </button>
                            </>
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
      </main>

      <MobileNav />
    </div>
  );
}


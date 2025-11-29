import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { mockParents } from '@/data/mockData';

type SortField = 'id' | 'name' | 'childrenCount' | 'status';
type SortOrder = 'asc' | 'desc';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedParents = [...mockParents].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const order = sortOrder === 'asc' ? 1 : -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * order;
    }
    return ((aVal as number) - (bVal as number)) * order;
  });

  const totalPages = Math.ceil(sortedParents.length / itemsPerPage);
  const paginatedParents = sortedParents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Admin Dashboard</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => navigate('/admin/create-parent')} className="btn-primary">
            Create Parent
          </button>
          <button onClick={() => navigate('/admin/guardians')} className="btn-secondary">
            Manage Guardians
          </button>
          <button onClick={() => navigate('/admin/groups')} className="btn-secondary">
            Groups
          </button>
          <button onClick={() => navigate('/admin/reports')} className="btn-secondary">
            Reports
          </button>
          <button onClick={() => navigate('/admin/audit-log')} className="btn-secondary">
            Audit Log
          </button>
        </div>

        <div className="border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th 
                    className="table-header cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('id')}
                  >
                    ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="table-header cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="table-header cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('childrenCount')}
                  >
                    Children {sortField === 'childrenCount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="table-header cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParents.map((parent) => (
                  <tr key={parent.id} className="hover:bg-muted/50">
                    <td className="table-cell font-mono text-sm">{parent.id}</td>
                    <td className="table-cell">{parent.name}</td>
                    <td className="table-cell">{parent.childrenCount}</td>
                    <td className="table-cell">
                      <span className={`status-badge ${
                        parent.status === 'active' 
                          ? 'bg-muted text-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {parent.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button className="btn-ghost btn-sm">View</button>
                      <button className="btn-ghost btn-sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-ghost btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-ghost btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';

const mockAuditLogs = [
  { id: '1', timestamp: '2025-01-26 10:32:15', user: 'admin@rkids.church', action: 'LOGIN', details: 'Successful login', ip: '192.168.1.100' },
  { id: '2', timestamp: '2025-01-26 10:35:22', user: 'admin@rkids.church', action: 'CREATE', details: 'Created parent: John Doe', ip: '192.168.1.100' },
  { id: '3', timestamp: '2025-01-26 09:15:00', user: 'teacher@rkids.church', action: 'CHECK_IN', details: 'Checked in RS073/01 (Maria)', ip: '192.168.1.101' },
  { id: '4', timestamp: '2025-01-26 09:18:33', user: 'teacher@rkids.church', action: 'CHECK_IN', details: 'Checked in RS073/02 (David)', ip: '192.168.1.101' },
  { id: '5', timestamp: '2025-01-26 11:30:00', user: 'teacher@rkids.church', action: 'CHECK_OUT', details: 'Released RS073/01 to Ana (Primary)', ip: '192.168.1.101' },
  { id: '6', timestamp: '2025-01-25 14:22:00', user: 'parent@rkids.church', action: 'PRE_CHECK_IN', details: 'Generated QR for RS073/01', ip: '192.168.1.102' },
  { id: '7', timestamp: '2025-01-25 10:00:00', user: 'admin@rkids.church', action: 'UPDATE', details: 'Updated guardian expiry for John', ip: '192.168.1.100' },
  { id: '8', timestamp: '2025-01-24 16:45:00', user: 'admin@rkids.church', action: 'DELETE', details: 'Removed expired guardian Luis', ip: '192.168.1.100' },
];

type ActionFilter = 'ALL' | 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'CHECK_IN' | 'CHECK_OUT' | 'PRE_CHECK_IN';

export default function AuditLog() {
  const navigate = useNavigate();
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = mockAuditLogs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchTerm && !log.details.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !log.user.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Audit Log</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm mb-1">Filter by Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
              className="input-field"
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="CHECK_IN">Check In</option>
              <option value="CHECK_OUT">Check Out</option>
              <option value="PRE_CHECK_IN">Pre Check-In</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by user or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Log Table */}
        <div className="border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="table-header">Timestamp</th>
                  <th className="table-header">User</th>
                  <th className="table-header">Action</th>
                  <th className="table-header">Details</th>
                  <th className="table-header">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="table-cell font-mono text-xs">{log.timestamp}</td>
                    <td className="table-cell text-sm">{log.user}</td>
                    <td className="table-cell">
                      <span className={`status-badge ${
                        log.action === 'DELETE' ? 'bg-destructive/10 text-destructive' :
                        log.action === 'CREATE' ? 'bg-success/10 text-success' :
                        'bg-muted text-foreground'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="table-cell text-sm">{log.details}</td>
                    <td className="table-cell font-mono text-xs text-muted-foreground">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button className="btn-secondary">Export Log</button>
          <button onClick={() => navigate('/admin')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

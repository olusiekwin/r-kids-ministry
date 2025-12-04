import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { auditApi } from '@/services/api';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string | object | null | undefined;
  ip?: string;
}

// Helper function to format details for display
const formatDetails = (details: string | object | null | undefined): string => {
  if (!details) return '-';
  
  if (typeof details === 'string') {
    try {
      // Try to parse if it's a JSON string
      const parsed = JSON.parse(details);
      return formatDetailsObject(parsed);
    } catch {
      // If not JSON, return as is
      return details || '-';
    }
  }
  
  if (typeof details === 'object') {
    return formatDetailsObject(details);
  }
  
  return String(details);
};

const formatDetailsObject = (obj: any): string => {
  if (!obj || typeof obj !== 'object') return '-';
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => formatDetailsObject(item)).join(', ');
  }
  
  // Remove internal fields
  const { _user_id_string, ...cleanObj } = obj;
  
  // Format as key-value pairs, but skip if it's an empty object
  const parts: string[] = [];
  for (const [key, value] of Object.entries(cleanObj)) {
    if (value !== null && value !== undefined && value !== '') {
      // Don't render nested objects directly - convert to string
      if (typeof value === 'object') {
        parts.push(`${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${JSON.stringify(value)}`);
      } else {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        parts.push(`${formattedKey}: ${value}`);
      }
    }
  }
  
  return parts.length > 0 ? parts.join(', ') : '-';
};

type ActionFilter = 'ALL' | 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'CHECK_IN' | 'CHECK_OUT' | 'PRE_CHECK_IN';

export default function AuditLog() {
  const navigate = useNavigate();
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const logs = await auditApi.list();
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const detailsStr = formatDetails(log.details).toLowerCase();
      if (!detailsStr.includes(searchLower) && 
          !log.user.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Audit Log</h1>
            <p className="text-muted-foreground">View all system activity and security logs</p>
          </div>
        
        {/* Filters */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Filter by Action</label>
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
            <div className="space-y-2 min-w-[250px]">
              <label className="block text-sm font-medium text-foreground">Search</label>
            <input
              type="text"
              placeholder="Search by user or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full"
            />
          </div>
        </div>

        {/* Log Table */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No logs found</p>
            </div>
          ) : (
            <div className="border border-border rounded-md overflow-hidden bg-background shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
                  <thead>
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
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors border-b border-border last:border-0">
                    <td className="table-cell font-mono text-xs">{log.timestamp}</td>
                    <td className="table-cell text-sm">{log.user}</td>
                    <td className="table-cell">
                      <span className={`status-badge ${
                            log.action === 'DELETE' ? 'bg-foreground text-background border border-foreground' :
                            log.action === 'CREATE' ? 'bg-muted text-foreground border border-border' :
                            'bg-muted text-foreground border border-border'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="table-cell text-sm">{formatDetails(log.details)}</td>
                    <td className="table-cell font-mono text-xs text-muted-foreground">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )}

          <div className="flex justify-center gap-4 mt-8">
          <button className="btn-secondary">Export Log</button>
          <button onClick={() => navigate('/admin')} className="btn-secondary">
            Back to Dashboard
          </button>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

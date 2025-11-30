import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { auditApi, usersApi } from '@/services/api';
import { toast } from '@/components/ui/sonner';

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  ip?: string;
  user_agent?: string;
}

type ActionFilter = 'ALL' | 'LOGIN' | 'CREATE_USER' | 'CREATE_CHILD' | 'APPROVE_CHILD' | 'REJECT_CHILD' | 'SUSPEND_USER' | 'ACTIVATE_USER' | 'CHECK_IN' | 'CHECK_OUT';
type UserFilter = 'ALL' | string;

export default function UserActivity() {
  const navigate = useNavigate();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
  const [userFilter, setUserFilter] = useState<UserFilter>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
    loadActivityLogs();
  }, []);

  useEffect(() => {
    loadActivityLogs();
  }, [actionFilter, userFilter, dateFrom, dateTo]);

  const loadUsers = async () => {
    try {
      // Load all users for filter dropdown
      const [teachers, teens] = await Promise.all([
        usersApi.listByRole('teacher').catch(() => []),
        usersApi.listByRole('teen').catch(() => []),
      ]);
      
      const allUsers = [
        ...teachers.map((u: any) => ({ id: u.id, name: u.name || u.email, email: u.email })),
        ...teens.map((u: any) => ({ id: u.id, name: u.name || u.email, email: u.email })),
      ];
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (actionFilter !== 'ALL') {
        params.action = actionFilter;
      }
      if (userFilter !== 'ALL') {
        params.user_id = userFilter;
      }
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      if (dateTo) {
        params.date_to = dateTo;
      }
      
      const logs = await auditApi.list(params);
      setActivityLogs(logs || []);
    } catch (error: any) {
      console.error('Failed to load activity logs:', error);
      toast.error('Failed to load activity logs', {
        description: error.message || 'An error occurred',
      });
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800 border-green-200';
    if (action.includes('DELETE') || action.includes('REJECT') || action.includes('SUSPEND')) return 'bg-red-100 text-red-800 border-red-200';
    if (action.includes('UPDATE') || action.includes('APPROVE') || action.includes('ACTIVATE')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const getActionDescription = (log: ActivityLog) => {
    const details = log.details || {};
    switch (log.action) {
      case 'LOGIN':
        return `Logged in as ${log.user_email || log.user}`;
      case 'LOGIN_ATTEMPT':
        return `Login attempt for ${log.user_email || log.user}`;
      case 'CREATE_USER':
        return `Created user: ${details.created_user_name || details.created_user_email || 'Unknown'}`;
      case 'CREATE_CHILD':
        return `Created child: ${details.child_name || 'Unknown'}`;
      case 'APPROVE_CHILD':
        return `Approved child: ${details.child_name || 'Unknown'}`;
      case 'REJECT_CHILD':
        return `Rejected child: ${details.child_name || 'Unknown'}${details.rejection_reason ? ` - ${details.rejection_reason}` : ''}`;
      case 'SUSPEND_USER':
        return `Suspended user: ${details.suspended_user_name || details.suspended_user_email || 'Unknown'}`;
      case 'ACTIVATE_USER':
        return `Activated user: ${details.activated_user_name || details.activated_user_email || 'Unknown'}`;
      default:
        return log.action.replace(/_/g, ' ');
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.user.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">User Activity Tracking</h1>
          <p className="text-muted-foreground">Monitor and track all user activities in the system</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE_USER">Create User</option>
              <option value="CREATE_CHILD">Create Child</option>
              <option value="APPROVE_CHILD">Approve Child</option>
              <option value="REJECT_CHILD">Reject Child</option>
              <option value="SUSPEND_USER">Suspend User</option>
              <option value="ACTIVATE_USER">Activate User</option>
              <option value="CHECK_IN">Check In</option>
              <option value="CHECK_OUT">Check Out</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Filter by User</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value as UserFilter)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="ALL">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            />
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Search</label>
          <input
            type="text"
            placeholder="Search by user, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          />
        </div>

        {/* Activity Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted-foreground">No activity logs found</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-foreground">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-foreground">
                        <div>
                          <p className="font-medium">{log.user}</p>
                          {log.user_email && (
                            <p className="text-xs text-muted-foreground">{log.user_email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground text-sm max-w-md">
                        {getActionDescription(log)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {log.ip || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {filteredLogs.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-border rounded-lg p-4 bg-background">
              <p className="text-sm text-muted-foreground mb-1">Total Activities</p>
              <p className="text-2xl font-bold text-foreground">{filteredLogs.length}</p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-background">
              <p className="text-sm text-muted-foreground mb-1">Unique Users</p>
              <p className="text-2xl font-bold text-foreground">
                {new Set(filteredLogs.map(log => log.user_id || log.user_email || log.user)).size}
              </p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-background">
              <p className="text-sm text-muted-foreground mb-1">Logins</p>
              <p className="text-2xl font-bold text-foreground">
                {filteredLogs.filter(log => log.action === 'LOGIN').length}
              </p>
            </div>
            <div className="border border-border rounded-lg p-4 bg-background">
              <p className="text-sm text-muted-foreground mb-1">User Creations</p>
              <p className="text-2xl font-bold text-foreground">
                {filteredLogs.filter(log => log.action === 'CREATE_USER').length}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 border border-border rounded-md font-medium hover:bg-muted transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={loadActivityLogs}
            className="px-4 py-2 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            Refresh
          </button>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}


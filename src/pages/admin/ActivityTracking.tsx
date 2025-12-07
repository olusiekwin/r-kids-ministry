import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { parentsApi } from '@/services/api';
import { 
  Search, 
  Calendar, 
  User, 
  Users, 
  Clock, 
  Download, 
  Filter,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  TrendingUp,
  Activity,
  Printer
} from 'lucide-react';

interface CheckInRecord {
  recordId: string;
  childId: string;
  childName: string;
  childRegistrationId: string;
  parentId: string;
  parentName: string;
  timestampIn: string;
  timestampOut: string | null;
  method: string;
  teacherName: string;
  duration: number | null; // in minutes
}

interface ParentActivity {
  parentId: string;
  parentName: string;
  email: string;
  phone: string;
  totalCheckIns: number;
  totalCheckOuts: number;
  lastActivity: string;
  children: {
    id: string;
    name: string;
    registrationId: string;
    checkIns: number;
    checkOuts: number;
  }[];
}

export default function ActivityTracking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([]);
  const [parentActivities, setParentActivities] = useState<ParentActivity[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<CheckInRecord[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'checked-in' | 'checked-out'>('all');
  const [currentView, setCurrentView] = useState<'timeline' | 'parents' | 'summary'>('timeline');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadActivityData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [checkInRecords, searchQuery, dateFrom, dateTo, selectedParentId, selectedStatus]);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      // Load all parents to get their activity
      const parents = await parentsApi.list();
      
      // Load detailed check-in records for all parents
      const allRecords: CheckInRecord[] = [];
      const parentActivityMap: Map<string, ParentActivity> = new Map();

      for (const parent of parents) {
        try {
          const details = await parentsApi.getDetails(parent.id);
          
          // Build parent activity
          const activity: ParentActivity = {
            parentId: details.parentId,
            parentName: details.name,
            email: details.email || '',
            phone: details.phone || '',
            totalCheckIns: 0,
            totalCheckOuts: 0,
            lastActivity: '',
            children: details.children.map(child => ({
              id: child.id,
              name: child.name,
              registrationId: child.registrationId,
              checkIns: 0,
              checkOuts: 0,
            })),
          };

          // Process check-in records
          if (details.recentCheckIns && details.recentCheckIns.length > 0) {
            for (const record of details.recentCheckIns) {
              const timestampIn = record.timestampIn ? new Date(record.timestampIn) : null;
              const timestampOut = record.timestampOut ? new Date(record.timestampOut) : null;
              
              let duration = null;
              if (timestampIn && timestampOut) {
                duration = Math.round((timestampOut.getTime() - timestampIn.getTime()) / (1000 * 60));
              }

              const checkInRecord: CheckInRecord = {
                recordId: record.recordId || '',
                childId: '', // Will be filled if available
                childName: record.childName || '',
                childRegistrationId: record.childRegistrationId || '',
                parentId: details.parentId,
                parentName: details.name,
                timestampIn: record.timestampIn || '',
                timestampOut: record.timestampOut || null,
                method: record.method || '',
                teacherName: record.teacherName || '',
                duration,
              };

              allRecords.push(checkInRecord);

              // Update activity stats
              activity.totalCheckIns++;
              if (timestampOut) {
                activity.totalCheckOuts++;
              }

              // Update child stats
              const child = activity.children.find(c => c.name === record.childName);
              if (child) {
                child.checkIns++;
                if (timestampOut) {
                  child.checkOuts++;
                }
              }
            }

            // Set last activity
            if (details.recentCheckIns.length > 0) {
              const latest = details.recentCheckIns[0];
              activity.lastActivity = latest.timestampIn || '';
            }
          }

          parentActivityMap.set(details.parentId, activity);
        } catch (error) {
          console.error(`Failed to load details for parent ${parent.id}:`, error);
        }
      }

      // Sort records by timestamp (newest first)
      allRecords.sort((a, b) => {
        const dateA = new Date(a.timestampIn).getTime();
        const dateB = new Date(b.timestampIn).getTime();
        return dateB - dateA;
      });

      setCheckInRecords(allRecords);
      setParentActivities(Array.from(parentActivityMap.values()));
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...checkInRecords];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.childName.toLowerCase().includes(query) ||
        record.parentName.toLowerCase().includes(query) ||
        record.childRegistrationId.toLowerCase().includes(query) ||
        record.parentId.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestampIn);
        return recordDate >= new Date(dateFrom);
      });
    }

    if (dateTo) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestampIn);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        return recordDate <= toDate;
      });
    }

    // Parent filter
    if (selectedParentId !== 'all') {
      filtered = filtered.filter(record => record.parentId === selectedParentId);
    }

    // Status filter
    if (selectedStatus === 'checked-in') {
      filtered = filtered.filter(record => !record.timestampOut);
    } else if (selectedStatus === 'checked-out') {
      filtered = filtered.filter(record => !!record.timestampOut);
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Statistics
  const totalRecords = filteredRecords.length;
  const checkedInNow = filteredRecords.filter(r => !r.timestampOut).length;
  const checkedOutToday = filteredRecords.filter(r => {
    if (!r.timestampOut) return false;
    const today = new Date();
    const checkoutDate = new Date(r.timestampOut);
    return checkoutDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
                Activity Tracking & Reports
              </h1>
              <p className="text-base text-muted-foreground">
                Track parent activity and children check-in/check-out history
              </p>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="btn-ghost flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Activities</p>
                  <p className="text-3xl font-bold text-foreground">{totalRecords}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>
            <div className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Currently Checked In</p>
                  <p className="text-3xl font-bold text-green-600">{checkedInNow}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Checked Out Today</p>
                  <p className="text-3xl font-bold text-blue-600">{checkedOutToday}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 mb-6 border-b-2 border-border/60 print:hidden">
            <button
              onClick={() => setCurrentView('timeline')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 -mb-0.5 ${
                currentView === 'timeline'
                  ? 'text-foreground border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Timeline View
            </button>
            <button
              onClick={() => setCurrentView('parents')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 -mb-0.5 ${
                currentView === 'parents'
                  ? 'text-foreground border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Parent Activity
            </button>
            <button
              onClick={() => setCurrentView('summary')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 -mb-0.5 ${
                currentView === 'summary'
                  ? 'text-foreground border-foreground'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Summary
            </button>
            {(selectedParentId !== 'all' || filteredRecords.length > 0) && (
              <button
                onClick={() => window.print()}
                className="ml-auto btn-secondary flex items-center gap-2 px-4 py-2"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
            )}
          </div>

          {/* Print Header */}
          {selectedParentId !== 'all' && (
            <div className="hidden print:block print-header mb-4">
              <div className="print-title">
                Parent Attendance Report
                {selectedParentId !== 'all' && (
                  <> - {parentActivities.find(p => p.parentId === selectedParentId)?.parentName || selectedParentId}</>
                )}
              </div>
              <div className="print-subtitle">
                {dateFrom || dateTo
                  ? `Period: ${dateFrom || 'Start'} to ${dateTo || 'End'}`
                  : 'All Time'}
              </div>
              <div className="text-sm text-muted-foreground">
                Generated on {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="border-2 border-border/80 rounded-xl p-6 bg-muted/30 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ID..."
                    className="input-field w-full pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="input-field w-full"
                >
                  <option value="all">All Status</option>
                  <option value="checked-in">Checked In</option>
                  <option value="checked-out">Checked Out</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">Parent</label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="input-field w-full max-w-md"
              >
                <option value="all">All Parents</option>
                {parentActivities.map(parent => (
                  <option key={parent.parentId} value={parent.parentId}>
                    {parent.parentName} ({parent.parentId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : currentView === 'timeline' ? (
          <>
            {/* Timeline Table */}
            <div className="border-2 border-border/80 rounded-xl overflow-hidden bg-background shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b-2 border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Date/Time</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Parent</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Child</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Method</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Check-In</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Check-Out</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Duration</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Teacher</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-muted-foreground">
                          No activity records found
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((record) => (
                        <tr
                          key={record.recordId}
                          className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-foreground">
                              {formatDate(record.timestampIn).split(',')[0]}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(record.timestampIn).split(',')[1]}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-foreground">{record.parentName}</div>
                            <div className="text-xs text-muted-foreground font-mono">{record.parentId}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-foreground">{record.childName}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {record.childRegistrationId}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground">
                              {record.method || 'Manual'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {formatDate(record.timestampIn)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {record.timestampOut ? formatDate(record.timestampOut) : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {formatDuration(record.duration)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {record.teacherName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {record.timestampOut ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Checked Out
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Checked In
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 text-sm font-semibold border-2 border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="px-4 py-2.5 text-sm font-medium text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 text-sm font-semibold border-2 border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : currentView === 'parents' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parentActivities.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No parent activity data found
              </div>
            ) : (
              parentActivities.map((parent) => (
                <div
                  key={parent.parentId}
                  className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{parent.parentName}</h3>
                      <p className="text-xs font-mono text-muted-foreground mb-2">{parent.parentId}</p>
                      {parent.email && (
                        <p className="text-sm text-muted-foreground">{parent.email}</p>
                      )}
                      {parent.phone && (
                        <p className="text-sm text-muted-foreground">{parent.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Check-Ins</p>
                      <p className="text-2xl font-bold text-foreground">{parent.totalCheckIns}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Check-Outs</p>
                      <p className="text-2xl font-bold text-foreground">{parent.totalCheckOuts}</p>
                    </div>
                  </div>
                  {parent.lastActivity && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Last Activity</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(parent.lastActivity)}</p>
                    </div>
                  )}
                  {parent.children.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Children:</p>
                      <div className="space-y-2">
                        {parent.children.map((child) => (
                          <div key={child.id} className="p-2 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium text-foreground">{child.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {child.checkIns} check-ins, {child.checkOuts} check-outs
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="border-2 border-border/80 rounded-xl p-8 bg-background shadow-lg">
            <h2 className="text-2xl font-bold text-foreground mb-6">Activity Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Parents</span>
                    <span className="text-lg font-bold text-foreground">{parentActivities.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Check-Ins</span>
                    <span className="text-lg font-bold text-foreground">
                      {parentActivities.reduce((sum, p) => sum + p.totalCheckIns, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Check-Outs</span>
                    <span className="text-lg font-bold text-foreground">
                      {parentActivities.reduce((sum, p) => sum + p.totalCheckOuts, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Average Check-Ins per Parent</span>
                    <span className="text-lg font-bold text-foreground">
                      {parentActivities.length > 0
                        ? Math.round(
                            parentActivities.reduce((sum, p) => sum + p.totalCheckIns, 0) /
                              parentActivities.length
                          )
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Most Active Parents</h3>
                <div className="space-y-2">
                  {[...parentActivities]
                    .sort((a, b) => b.totalCheckIns - a.totalCheckIns)
                    .slice(0, 5)
                    .map((parent, index) => (
                      <div key={parent.parentId} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-foreground mr-2">
                            {index + 1}. {parent.parentName}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            ({parent.parentId})
                          </span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{parent.totalCheckIns}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { sessionsApi, groupsApi, usersApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Play,
  Square,
  Filter,
  Search,
  Loader2,
  Eye,
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time?: string;
  end_time?: string;
  group_id?: string;
  group_name?: string;
  room?: string;
  teacher_id?: string;
  teacher_name?: string;
  session_type: string;
  location?: string;
  status?: 'scheduled' | 'active' | 'ended' | 'cancelled';
  started_at?: string;
  ended_at?: string;
}

export default function SessionManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    loadGroups();
    loadTeachers();
  }, [filterStatus, filterGroup]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filterGroup !== 'all') {
        params.group_id = filterGroup;
      }
      
      const data = await sessionsApi.list(params);
      let filtered = Array.isArray(data) ? data : [];
      
      // Filter by status
      if (filterStatus !== 'all') {
        filtered = filtered.filter(s => s.status === filterStatus);
      }
      
      // Filter by search query
      if (searchQuery) {
        filtered = filtered.filter(s => 
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setSessions(filtered);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error('Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await groupsApi.list();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await usersApi.listByRole('teacher');
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load teachers:', error);
      setTeachers([]);
    }
  };

  const handleCreateSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sessionData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      session_date: formData.get('session_date') as string,
      start_time: formData.get('start_time') as string || undefined,
      end_time: formData.get('end_time') as string || undefined,
      group_id: formData.get('group_id') as string || undefined,
      teacher_id: formData.get('teacher_id') as string || undefined,
      session_type: (formData.get('session_type') as string) || 'Regular',
      location: formData.get('location') as string || undefined,
    };

    try {
      await sessionsApi.create(sessionData);
      setShowCreateModal(false);
      toast.success('Session created successfully!');
      loadSessions();
    } catch (error: any) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleUpdateSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSession) return;

    const formData = new FormData(e.currentTarget);
    const sessionData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      session_date: formData.get('session_date') as string,
      start_time: formData.get('start_time') as string || undefined,
      end_time: formData.get('end_time') as string || undefined,
      group_id: formData.get('group_id') as string || undefined,
      teacher_id: formData.get('teacher_id') as string || undefined,
      session_type: (formData.get('session_type') as string) || 'Regular',
      location: formData.get('location') as string || undefined,
    };

    try {
      await sessionsApi.update(editingSession.id, sessionData);
      setShowEditModal(false);
      setEditingSession(null);
      toast.success('Session updated successfully!');
      loadSessions();
    } catch (error: any) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session', {
        description: error.message || 'Please try again.',
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this session? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setActionLoading(sessionId);
      await sessionsApi.delete(sessionId);
      toast.success('Session deleted successfully!');
      loadSessions();
    } catch (error: any) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      setActionLoading(sessionId);
      await sessionsApi.startSession(sessionId);
      toast.success('Session started successfully!');
      loadSessions();
    } catch (error: any) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    const confirmed = window.confirm('Are you sure you want to end this session?');
    if (!confirmed) return;

    try {
      setActionLoading(sessionId);
      await sessionsApi.endSession(sessionId);
      toast.success('Session ended successfully!');
      loadSessions();
    } catch (error: any) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  useEffect(() => {
    if (searchQuery !== undefined) {
      const timeout = setTimeout(() => {
        loadSessions();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery]);

  return (
    <div className="min-h-screen liquid-bg pb-16 md:pb-0 relative">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Session Management</h1>
            <p className="text-muted-foreground">Create, manage, and monitor ministry sessions</p>
          </div>
          <button
            onClick={() => {
              setEditingSession(null);
              setShowCreateModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Session
          </button>
        </div>

        {/* Filters */}
        <div className="glass border-2 border-border/50 rounded-xl p-4 mb-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sessions..."
                  className="w-full pl-10 pr-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Group</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id || group} value={group.id || group}>
                    {group.name || group}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterGroup('all');
                  setSearchQuery('');
                }}
                className="w-full px-4 py-2 glass border border-border/50 rounded-xl hover:shadow-lg transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 glass border-2 border-border/50 rounded-xl">
            <p className="text-muted-foreground">No sessions found</p>
          </div>
        ) : (
          <div className="glass border-2 border-border/50 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Group</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Teacher</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{session.title}</div>
                        {session.description && (
                          <div className="text-sm text-muted-foreground mt-1 truncate max-w-xs">
                            {session.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(session.session_date).toLocaleDateString()}</span>
                        </div>
                        {session.start_time && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {session.start_time}
                              {session.end_time && ` - ${session.end_time}`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {session.group_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {session.teacher_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                          {session.status ? session.status.charAt(0).toUpperCase() + session.status.slice(1) : 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/sessions/${session.id}`)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {session.status === 'scheduled' && (
                            <button
                              onClick={() => handleStartSession(session.id)}
                              disabled={actionLoading === session.id}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600 disabled:opacity-50"
                              title="Start Session"
                            >
                              {actionLoading === session.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {session.status === 'active' && (
                            <button
                              onClick={() => handleEndSession(session.id)}
                              disabled={actionLoading === session.id}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                              title="End Session"
                            >
                              {actionLoading === session.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingSession(session);
                              setShowEditModal(true);
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            disabled={actionLoading === session.id}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                            title="Delete"
                          >
                            {actionLoading === session.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-strong border border-border/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Session title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Session description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date *</label>
                    <input
                      type="date"
                      name="session_date"
                      required
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      name="session_type"
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Special Event">Special Event</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Outing">Outing</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <input
                      type="time"
                      name="start_time"
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Time</label>
                    <input
                      type="time"
                      name="end_time"
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Group</label>
                    <select
                      name="group_id"
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Group</option>
                      {groups.map((group) => (
                        <option key={group.id || group} value={group.id || group}>
                          {group.name || group}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Teacher</label>
                    <select
                      name="teacher_id"
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Session location"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 glass border border-border/50 rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingSession && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-strong border border-border/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Edit Session</h2>
              <form onSubmit={handleUpdateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingSession.title}
                    required
                    className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingSession.description}
                    className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date *</label>
                    <input
                      type="date"
                      name="session_date"
                      defaultValue={editingSession.session_date}
                      required
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      name="session_type"
                      defaultValue={editingSession.session_type}
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Special Event">Special Event</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Outing">Outing</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Time</label>
                    <input
                      type="time"
                      name="start_time"
                      defaultValue={editingSession.start_time}
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Time</label>
                    <input
                      type="time"
                      name="end_time"
                      defaultValue={editingSession.end_time}
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Group</label>
                    <select
                      name="group_id"
                      defaultValue={editingSession.group_id}
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Group</option>
                      {groups.map((group) => (
                        <option key={group.id || group} value={group.id || group}>
                          {group.name || group}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Teacher</label>
                    <select
                      name="teacher_id"
                      defaultValue={editingSession.teacher_id}
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingSession.location}
                    className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Update Session
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSession(null);
                    }}
                    className="px-4 py-2 glass border border-border/50 rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { ParentSidebar } from '@/components/ParentSidebar';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { sessionsApi, groupsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users } from 'lucide-react';

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
  created_by?: string;
  created_by_name?: string;
  session_type: string;
  location?: string;
}

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('week');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');

  useEffect(() => {
    loadSessions();
    loadGroups();
  }, [selectedDate, filterGroup, dateRange]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      // Load sessions based on date range
      if (dateRange === 'day') {
        params.date = selectedDate;
      } else if (dateRange === 'week') {
        // Load current week (7 days from selected date)
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 7);
        // Backend will handle this, but for now just use selected date
        params.date = selectedDate;
      } else if (dateRange === 'month') {
        // Load current month
        const year = new Date(selectedDate).getFullYear();
        const month = new Date(selectedDate).getMonth() + 1;
        params.year = year;
        params.month = month;
      }
      
      if (filterGroup !== 'all') {
        params.group_id = filterGroup;
      }
      
      // Load all sessions (not filtered by creator) - admin and teachers can see all
      const data = await sessionsApi.list(params);
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
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

  const handleCreateSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sessionData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      session_date: formData.get('session_date') as string,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      group_id: formData.get('group_id') as string || undefined,
      session_type: (formData.get('session_type') as string) || 'Regular',
      location: formData.get('location') as string || undefined,
    };

    try {
      await sessionsApi.create(sessionData);
      setShowCreateModal(false);
      loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  const getSidebar = () => {
    if (user?.role === 'admin') return <AdminSidebar />;
    if (user?.role === 'teacher') return <TeacherSidebar />;
    if (user?.role === 'parent') return <ParentSidebar />;
    return null;
  };

  const canCreateSession = user?.role === 'admin' || user?.role === 'teacher';

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      {getSidebar()}
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Sessions Calendar</h1>
            <p className="text-muted-foreground">View and manage ministry sessions</p>
          </div>
          {canCreateSession && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Session
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">View:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'day' | 'week' | 'month')}
              className="input-field"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Group:</label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="input-field"
            >
              <option value="all">All Groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-md bg-background">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No sessions found for this date</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-border rounded-md p-6 bg-background shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (user?.role === 'parent') {
                    navigate(`/parent/book-session?sessionId=${session.id}`);
                  } else {
                    // Admin/Teacher can view session details
                    navigate(`/sessions/${session.id}`);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">{session.title}</h3>
                  <span className="text-xs px-2 py-1 bg-muted rounded">
                    {session.session_type}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{new Date(session.session_date).toLocaleDateString()}</span>
                  </div>
                  
                  {session.start_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {session.start_time}
                        {session.end_time && ` - ${session.end_time}`}
                      </span>
                    </div>
                  )}
                  
                  {session.group_name && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{session.group_name}</span>
                      {session.room && <span className="text-xs">({session.room})</span>}
                    </div>
                  )}
                  
                  {session.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{session.location}</span>
                    </div>
                  )}
                  
                  {session.teacher_name && (
                    <p className="text-xs">Teacher: {session.teacher_name}</p>
                  )}
                  {session.created_by_name && (user?.role === 'admin' || user?.role === 'teacher') && (
                    <p className="text-xs text-muted-foreground">Created by: {session.created_by_name}</p>
                  )}
                </div>

                {session.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {session.description}
                  </p>
                )}

                {user?.role === 'parent' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/parent/book-session?sessionId=${session.id}`);
                    }}
                    className="btn-primary w-full mt-4"
                  >
                    Book Child
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Session Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background p-8 rounded-md max-w-2xl w-full border border-border shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Create New Session</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost btn-sm p-1"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="input-field w-full"
                    placeholder="e.g., Sunday Service"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="input-field w-full"
                    placeholder="Session description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date *</label>
                    <input
                      type="date"
                      name="session_date"
                      required
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Type *</label>
                    <select name="session_type" required className="input-field w-full">
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
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">End Time</label>
                    <input
                      type="time"
                      name="end_time"
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Group</label>
                  <select name="group_id" className="input-field w-full">
                    <option value="">No specific group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    className="input-field w-full"
                    placeholder="e.g., Main Hall, Room 101"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
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


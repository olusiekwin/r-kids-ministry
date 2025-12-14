import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { usersApi, parentsApi } from '@/services/api';
import { User, Parent } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

type UserType = 'teacher' | 'teen' | 'parent' | 'admin';

export default function ManageUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<UserType>('teacher');
  const [teachers, setTeachers] = useState<User[]>([]);
  const [teens, setTeens] = useState<User[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'teacher' as UserType,
    sendEmail: true,
    customEmailMessage: '',
  });

  useEffect(() => {
    loadUsers();
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      if (activeTab === 'parent') {
        const data = await parentsApi.list();
        setParents(data);
      } else if (activeTab === 'admin') {
        // Load both admin and super_admin roles
        const adminData = await usersApi.listByRole('admin');
        const superAdminData = await usersApi.listByRole('super_admin');
        setAdmins([...adminData, ...superAdminData]);
      } else {
        const data = await usersApi.listByRole(activeTab);
        if (activeTab === 'teacher') {
          setTeachers(data);
        } else {
          setTeens(data);
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      if (activeTab === 'teacher') setTeachers([]);
      else if (activeTab === 'teen') setTeens([]);
      else if (activeTab === 'admin') setAdmins([]);
      else setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Please provide both first and last name');
      return;
    }
    
    // Authorization check: Only super admins can create admins
    if (formData.role === 'admin' && !isSuperAdmin) {
      toast.error('Insufficient permissions', {
        description: 'Only super admins can create admin users',
      });
      return;
    }
    
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      
      if (formData.role === 'parent') {
        await parentsApi.create({
          name: fullName,
          email: formData.email,
        });
      } else {
        // Create user with invitation
        await usersApi.create({
          name: fullName,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email,
          role: formData.role,
          sendEmail: formData.sendEmail,
          customEmailMessage: formData.customEmailMessage || undefined,
        });
      }
      setShowAddModal(false);
      setFormData({ firstName: '', lastName: '', email: '', role: activeTab, sendEmail: true, customEmailMessage: '' });
      await loadUsers();
      const emailStatus = formData.sendEmail ? 'Invitation sent' : 'User created (no email sent)';
      toast.success(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} created successfully!`, {
        description: emailStatus,
      });
    } catch (error: any) {
      const errorMessage = error.body?.message || error.message || 'An error occurred';
      toast.error('Failed to create user', {
        description: errorMessage,
      });
    }
  };

  const handleSuspend = async (userId: string) => {
    const user = currentUsers.find((u: any) => u.id === userId);
    if (!user) return;
    
    // Use a custom confirmation dialog instead of browser confirm
    const confirmed = window.confirm(`Are you sure you want to suspend ${user.name}?`);
    if (!confirmed) return;
    
    try {
      await usersApi.suspend(userId);
      await loadUsers();
      toast.success('User suspended successfully', {
        description: `${user.name} has been suspended`,
      });
    } catch (error: any) {
      toast.error('Failed to suspend user', {
        description: error.message || 'An error occurred',
      });
    }
  };

  const handleActivate = async (userId: string) => {
    const user = currentUsers.find((u: any) => u.id === userId);
    if (!user) return;
    
    try {
      await usersApi.activate(userId);
      await loadUsers();
      toast.success('User activated successfully', {
        description: `${user.name} has been activated`,
      });
    } catch (error: any) {
      toast.error('Failed to activate user', {
        description: error.message || 'An error occurred',
      });
    }
  };

  const handleDelete = async (userId: string) => {
    const user = currentUsers.find((u: any) => u.id === userId);
    if (!user) return;
    
    // Confirmation dialog
    const confirmed = window.confirm(
      `⚠️ WARNING: Are you sure you want to DELETE ${user.name}?\n\n` +
      `This action cannot be undone. All data associated with this user will be permanently removed.`
    );
    if (!confirmed) return;
    
    try {
      await usersApi.delete(userId);
      await loadUsers();
      toast.success('User deleted successfully', {
        description: `${user.name} has been permanently deleted`,
      });
    } catch (error: any) {
      toast.error('Failed to delete user', {
        description: error.message || 'An error occurred',
      });
    }
  };

  const handleResendInvitation = async (email: string) => {
    try {
      await usersApi.resendInvitation(email);
      toast.success('Invitation resent successfully!', {
        description: `Invitation sent to ${email}`,
      });
    } catch (error: any) {
      toast.error('Failed to resend invitation', {
        description: error.message || 'An error occurred',
      });
    }
  };

  const currentUsers = activeTab === 'teacher' ? teachers 
    : activeTab === 'teen' ? teens 
    : activeTab === 'admin' ? admins 
    : parents;

  return (
    <div className="min-h-screen liquid-bg pb-16 md:pb-0 relative">
      <div className="absolute inset-0 z-0">
        {/* Liquid morphing background effect */}
      </div>
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Manage Users</h1>
          <p className="text-muted-foreground">Create and manage teacher, teen, and parent accounts</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'admin'
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Admins
            </button>
          )}
          <button
            onClick={() => setActiveTab('teacher')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'teacher'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Teacher
          </button>
          <button
            onClick={() => setActiveTab('teen')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'teen'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Teens
          </button>
          <button
            onClick={() => setActiveTab('parent')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'parent'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Parents
          </button>
        </div>

        {/* Add Button */}
        <div className="mb-4 flex justify-end">
          {activeTab === 'admin' && !isSuperAdmin ? (
            <div className="text-sm text-muted-foreground italic">
              Only super admins can add admin users
            </div>
          ) : (
            <button
              onClick={() => {
                setFormData({ firstName: '', lastName: '', email: '', role: activeTab, sendEmail: true, customEmailMessage: '' });
                setShowAddModal(true);
              }}
              className="px-4 py-2 btn-primary text-sm font-medium"
            >
              + Add {activeTab === 'admin' ? 'Admin' : activeTab === 'teacher' ? 'Teacher' : activeTab === 'teen' ? 'Teen' : 'Parent'}
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : currentUsers.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted-foreground">No {activeTab}s found</p>
          </div>
        ) : (
          <div className="border border-border/50 rounded-xl overflow-hidden glass shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Phone
                    </th>
                    {activeTab === 'parent' && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Children
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Profile
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-foreground">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-foreground text-sm">
                        {user.phone || '-'}
                      </td>
                      {activeTab === 'parent' && (
                        <td className="px-6 py-4 whitespace-nowrap text-foreground">
                          {user.childrenCount || 0}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : user.status === 'suspended'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : user.status === 'pending_password'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {user.status === 'active' ? 'Active' 
                            : user.status === 'suspended' ? 'Suspended'
                            : user.status === 'pending_password' ? 'Pending Password'
                            : user.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.profileUpdated || user.profile_updated
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {user.profileUpdated || user.profile_updated ? 'Updated' : 'Pending'}
                        </span>
                        {user.address && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate" title={user.address}>
                            {user.address}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {activeTab !== 'parent' && user.status !== 'suspended' && (
                            <button
                              onClick={() => handleResendInvitation(user.email)}
                              className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                            >
                              Resend Invitation
                            </button>
                          )}
                          {user.status === 'suspended' ? (
                            <button
                              onClick={() => handleActivate(user.id)}
                              className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-md transition-colors border border-green-200"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(user.id)}
                              className="px-3 py-1.5 text-xs font-medium text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors border border-yellow-200"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200"
                            title="Permanently delete this user"
                          >
                            Delete
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

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-strong border border-border/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-semibold mb-4">
                Add {activeTab === 'admin' ? 'Admin' : activeTab === 'teacher' ? 'Teacher' : activeTab === 'teen' ? 'Teen' : 'Parent'}
              </h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email (Username)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    placeholder="user@rkids.church"
                  />
                  <p className="text-xs text-muted-foreground mt-1">This will be their login username</p>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sendEmail}
                      onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-sm font-medium">Send invitation email</span>
                  </label>
                </div>
                {formData.sendEmail && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Email Message (Optional)</label>
                    <textarea
                      value={formData.customEmailMessage}
                      onChange={(e) => setFormData({ ...formData, customEmailMessage: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 glass border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Leave blank to use default invitation message..."
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
                  >
                    {formData.sendEmail ? 'Create & Send Invitation' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 glass border border-border/50 rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
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


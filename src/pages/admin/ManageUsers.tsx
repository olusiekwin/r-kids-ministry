import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { usersApi, parentsApi } from '@/services/api';
import { User, Parent } from '@/types';

type UserType = 'teacher' | 'teen' | 'parent';

export default function ManageUsers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<UserType>('teacher');
  const [teachers, setTeachers] = useState<User[]>([]);
  const [teens, setTeens] = useState<User[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'teacher' as UserType,
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
      else setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.role === 'parent') {
        await parentsApi.create({
          name: formData.name,
          email: formData.email,
        });
      } else {
        // Create user with invitation
        await usersApi.create({
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
      }
      setShowAddModal(false);
      setFormData({ name: '', email: '', role: activeTab });
      await loadUsers();
      alert(`${formData.role} created successfully! Invitation sent to ${formData.email}`);
    } catch (error: any) {
      alert(error.message || 'Failed to create user');
    }
  };

  const handleResendInvitation = async (email: string) => {
    try {
      await usersApi.resendInvitation(email);
      alert('Invitation resent successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to resend invitation');
    }
  };

  const currentUsers = activeTab === 'teacher' ? teachers : activeTab === 'teen' ? teens : parents;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Manage Users</h1>
          <p className="text-muted-foreground">Create and manage teachers, teens, and parents</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('teacher')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'teacher'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Teachers
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
          <button
            onClick={() => {
              setFormData({ name: '', email: '', role: activeTab });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add {activeTab === 'teacher' ? 'Teacher' : activeTab === 'teen' ? 'Teen' : 'Parent'}
          </button>
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
          <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
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
                    {activeTab === 'parent' && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                        Children
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Status
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
                      {activeTab === 'parent' && (
                        <td className="px-6 py-4 whitespace-nowrap text-foreground">
                          {user.childrenCount || 0}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          {user.status === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {activeTab !== 'parent' && (
                            <button
                              onClick={() => handleResendInvitation(user.email)}
                              className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                            >
                              Resend Invitation
                            </button>
                          )}
                          <button className="px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-md transition-colors border border-border">
                            Edit
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">
                Add {activeTab === 'teacher' ? 'Teacher' : activeTab === 'teen' ? 'Teen' : 'Parent'}
              </h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-opacity"
                  >
                    Create & Send Invitation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-border rounded-md font-medium hover:bg-muted transition-colors"
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


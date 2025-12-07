import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder';
import { childrenApi, groupsApi, guardiansApi } from '@/services/api';
import { Child, GroupName, Guardian } from '@/types';
import { toast } from '@/components/ui/sonner';
import { Edit2, Save, X, Plus, Trash2, UserPlus } from 'lucide-react';

interface ChildWithGuardians extends Child {
  guardians?: Guardian[];
}

export default function PendingApprovals() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<ChildWithGuardians[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [editingGuardians, setEditingGuardians] = useState<string | null>(null);
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  
  // Edit form state
  const [editForm, setEditForm] = useState<Record<string, {
    name: string;
    dateOfBirth: string;
    gender: string;
    group: string;
  }>>({});
  
  // Guardian edit state
  const [guardianForms, setGuardianForms] = useState<Record<string, Guardian[]>>({});
  const [newGuardian, setNewGuardian] = useState<Record<string, Partial<Guardian>>>({});

  useEffect(() => {
    loadChildren();
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const groupList = await groupsApi.list();
      // groupsApi.list() returns Group[] with id and name
      setGroups(Array.isArray(groupList) ? groupList.map((g: any) => ({
        id: g.id || g.groupId || '',
        name: g.name || g.groupName || ''
      })) : []);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  };

  const loadChildren = async () => {
    try {
      setInitialLoading(true);
      const allChildren = await childrenApi.list();
      
      // Load guardians for each child
      const childrenWithGuardians = await Promise.all(
        (allChildren || []).map(async (child: Child) => {
          try {
            const guardians = await guardiansApi.list(child.id);
            return { ...child, guardians: guardians || [] };
          } catch (error) {
            console.error(`Failed to load guardians for child ${child.id}:`, error);
            return { ...child, guardians: [] };
          }
        })
      );
      
      setChildren(childrenWithGuardians);
    } catch (error) {
      console.error('Failed to load children:', error);
      setChildren([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const startEdit = (child: ChildWithGuardians) => {
    setEditingChild(child.id);
    setEditForm({
      [child.id]: {
        name: child.name || '',
        dateOfBirth: child.dateOfBirth || '',
        gender: child.gender || '',
        group: child.group || '',
      }
    });
    // Load guardians for editing
    setGuardianForms({
      [child.id]: child.guardians || []
    });
  };

  const cancelEdit = () => {
    setEditingChild(null);
    setEditingGuardians(null);
    setEditForm({});
    setGuardianForms({});
    setNewGuardian({});
  };

  const handleSaveChild = async (childId: string) => {
    const formData = editForm[childId];
    if (!formData) return;

    setLoading(childId);
    
    try {
      await childrenApi.update(childId, {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        group: formData.group,
      });
      
      toast.success('Child updated successfully!');
      await loadChildren();
      cancelEdit();
    } catch (error: any) {
      console.error('Failed to update child:', error);
      toast.error('Failed to update child', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child? This action cannot be undone.')) {
      return;
    }
    
    setLoading(childId);
    
    try {
      await childrenApi.delete(childId);
      toast.success('Child deleted successfully');
      await loadChildren();
    } catch (error: any) {
      console.error('Failed to delete child:', error);
      toast.error('Failed to delete child', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleAddGuardian = async (childId: string) => {
    const guardian = newGuardian[childId];
    if (!guardian.name || !guardian.phone) {
      toast.error('Name and phone are required');
      return;
    }

    setLoading(childId);
    
    try {
      await guardiansApi.create({
        name: guardian.name,
        email: guardian.email,
        phone: guardian.phone,
        relationship: guardian.relationship || 'Secondary',
        childId: childId,
      });
      
      toast.success('Guardian added successfully!');
      await loadChildren();
      setNewGuardian({ ...newGuardian, [childId]: {} });
    } catch (error: any) {
      console.error('Failed to add guardian:', error);
      toast.error('Failed to add guardian', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteGuardian = async (childId: string, guardianId: string) => {
    if (!confirm('Are you sure you want to remove this guardian?')) {
      return;
    }

    setLoading(childId);
    
    try {
      await guardiansApi.delete(guardianId);
      toast.success('Guardian removed successfully');
      await loadChildren();
    } catch (error: any) {
      console.error('Failed to delete guardian:', error);
      toast.error('Failed to remove guardian', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Child Registration Management</h1>
            <p className="text-muted-foreground text-lg">
              Review, edit, and approve child registrations submitted by parents
            </p>
          </div>

          {initialLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading children...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="border border-border rounded-xl p-12 text-center bg-card shadow-sm">
              <p className="text-muted-foreground text-lg">No children registered yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {children.map((child) => {
                const isEditing = editingChild === child.id;
                const formData = editForm[child.id] || {
                  name: child.name || '',
                  dateOfBirth: child.dateOfBirth || '',
                  gender: child.gender || '',
                  group: child.group || '',
                };
                const guardians = child.guardians || [];
                const newGuardianData = newGuardian[child.id] || {};

                return (
                  <div key={child.id} className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
                    <div className="p-6">
                    <div className="flex items-start gap-6 mb-6">
                    <PhotoPlaceholder size="lg" />
                    <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                  type="text"
                                  value={formData.name}
                                  onChange={(e) => setEditForm({
                                    ...editForm,
                                    [child.id]: { ...formData, name: e.target.value }
                                  })}
                                  className="input-field w-full"
                                  disabled={loading === child.id}
                                />
                      </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                                  <input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setEditForm({
                                      ...editForm,
                                      [child.id]: { ...formData, dateOfBirth: e.target.value }
                                    })}
                                    className="input-field w-full"
                                    disabled={loading === child.id}
                                  />
                      </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Gender</label>
                                  <select
                                    value={formData.gender}
                                    onChange={(e) => setEditForm({
                                      ...editForm,
                                      [child.id]: { ...formData, gender: e.target.value }
                                    })}
                                    className="input-field w-full"
                                    disabled={loading === child.id}
                                  >
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                  </select>
                    </div>
                  </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Group</label>
                    <select
                                  value={formData.group}
                                  onChange={(e) => setEditForm({
                                    ...editForm,
                                    [child.id]: { ...formData, group: e.target.value }
                                  })}
                                  className="input-field w-full"
                      disabled={loading === child.id}
                    >
                                  <option value="">No group assigned</option>
                      {groups.map((group) => (
                                    <option key={group.id} value={group.name}>
                                      {group.name}
                        </option>
                      ))}
                    </select>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-semibold">{child.name}</h3>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Registration ID: <span className="font-mono text-foreground">{child.registrationId || 'N/A'}</span></p>
                                <p>Age: {child.age || 'N/A'} years • Gender: {child.gender || 'N/A'}</p>
                                <p>Group: <span className="text-foreground font-medium">{child.group || 'Not assigned'}</span></p>
                                <p>Date of Birth: {formatDate(child.dateOfBirth)}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Guardians Section */}
                      <div className="border-t border-border pt-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold">Guardians</h4>
                          {isEditing && (
                            <button
                              onClick={() => setEditingGuardians(editingGuardians === child.id ? null : child.id)}
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <UserPlus className="w-4 h-4" />
                              Add Guardian
                            </button>
                          )}
                        </div>

                        {guardians.length > 0 ? (
                          <div className="space-y-3 mb-4">
                            {guardians.map((guardian) => (
                              <div key={guardian.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                <div>
                                  <p className="font-medium">{guardian.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {guardian.email || 'No email'} • {guardian.phone || 'No phone'}
                                  </p>
                    <p className="text-xs text-muted-foreground mt-1">
                                    {guardian.relationship || 'Secondary'}
                    </p>
                  </div>
                                {isEditing && (
                                  <button
                                    onClick={() => handleDeleteGuardian(child.id, guardian.id)}
                                    disabled={loading === child.id}
                                    className="text-destructive hover:text-destructive/80 p-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mb-4">No guardians added yet</p>
                        )}

                        {/* Add Guardian Form */}
                        {isEditing && editingGuardians === child.id && (
                          <div className="border border-border rounded-md p-4 bg-muted/30 mb-4">
                            <h5 className="font-medium mb-3">Add New Guardian</h5>
                            <div className="space-y-3">
                              <input
                                type="text"
                                placeholder="Name *"
                                value={newGuardianData.name || ''}
                                onChange={(e) => setNewGuardian({
                                  ...newGuardian,
                                  [child.id]: { ...newGuardianData, name: e.target.value }
                                })}
                                className="input-field w-full"
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                value={newGuardianData.email || ''}
                                onChange={(e) => setNewGuardian({
                                  ...newGuardian,
                                  [child.id]: { ...newGuardianData, email: e.target.value }
                                })}
                                className="input-field w-full"
                              />
                              <input
                                type="tel"
                                placeholder="Phone *"
                                value={newGuardianData.phone || ''}
                                onChange={(e) => setNewGuardian({
                                  ...newGuardian,
                                  [child.id]: { ...newGuardianData, phone: e.target.value }
                                })}
                                className="input-field w-full"
                              />
                              <select
                                value={newGuardianData.relationship || 'Secondary'}
                                onChange={(e) => setNewGuardian({
                                  ...newGuardian,
                                  [child.id]: { ...newGuardianData, relationship: e.target.value }
                                })}
                                className="input-field w-full"
                              >
                                <option value="Primary">Primary</option>
                                <option value="Secondary">Secondary</option>
                              </select>
                              <div className="flex gap-2">
                    <button
                                  onClick={() => handleAddGuardian(child.id)}
                                  disabled={loading === child.id}
                                  className="btn-primary text-sm"
                                >
                                  Add Guardian
                    </button>
                    <button
                      onClick={() => {
                                    setEditingGuardians(null);
                                    setNewGuardian({ ...newGuardian, [child.id]: {} });
                                  }}
                                  className="btn-secondary text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveChild(child.id)}
                              disabled={loading === child.id}
                              className="btn-success flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save Changes
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={loading === child.id}
                              className="btn-secondary flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(child)}
                      disabled={loading === child.id}
                              className="btn-primary flex items-center gap-2"
                    >
                              <Edit2 className="w-4 h-4" />
                              Edit Details
                    </button>
                    <button
                              onClick={() => handleDeleteChild(child.id)}
                              disabled={loading === child.id}
                              className="btn-destructive flex items-center gap-2"
                    >
                              <Trash2 className="w-4 h-4" />
                              Delete
                    </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

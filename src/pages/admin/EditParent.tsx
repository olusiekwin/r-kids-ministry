import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { ParentImageUpload } from '@/components/ParentImageUpload';
import { parentsApi, childrenApi, groupsApi, guardiansApi } from '@/services/api';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  AlertCircle, 
  Loader2,
  Users,
  Baby,
  UserPlus,
  Edit,
  Trash2,
  Plus,
  X,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ChildData {
  id: string;
  name: string;
  registrationId: string;
  dateOfBirth: string;
  gender: string;
  group: { id: string; name: string } | null;
  photoUrl?: string;
}

interface GuardianData {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  isAuthorized: boolean;
  expiresAt?: string;
}

interface Group {
  id: string;
  name: string;
  ageRangeMin: number;
  ageRangeMax: number;
}

type Tab = 'bio' | 'children' | 'guardians';

export default function EditParent() {
  const { parentId } = useParams<{ parentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('bio');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Parent bio data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
    photoUrl: null as string | null,
  });

  // Children data
  const [children, setChildren] = useState<ChildData[]>([]);
  const [editingChild, setEditingChild] = useState<ChildData | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  // Guardians data
  const [guardians, setGuardians] = useState<GuardianData[]>([]);
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [newGuardian, setNewGuardian] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
  });

  useEffect(() => {
    if (parentId) {
      loadParentData();
      loadGroups();
    }
  }, [parentId]);

  const loadParentData = async () => {
    if (!parentId) return;
    
    setLoading(true);
    setError('');
    try {
      const details = await parentsApi.getDetails(parentId);
      
      // Set parent bio data
      setFormData({
        name: details.name || '',
        email: details.email || '',
        phone: details.phone || '',
        address: '', // Not in current schema, but ready for future
        city: '',
        state: '',
        zipCode: '',
        emergencyContact: '',
        emergencyPhone: '',
        emergencyRelationship: '',
        status: details.status === 'active' ? 'active' : 'inactive',
        notes: '',
        photoUrl: details.photoUrl || null,
      });

      // Set children data
      const childrenData: ChildData[] = [];
      if (details.children) {
        for (const child of details.children) {
          childrenData.push({
            id: child.id,
            name: child.name,
            registrationId: child.registrationId,
            dateOfBirth: child.dateOfBirth,
            gender: child.gender || '',
            group: child.group,
            photoUrl: child.photoUrl,
          });
        }
        setChildren(childrenData);

        // Load guardians (secondary guardians for children)
        try {
          const allGuardians: GuardianData[] = [];
          for (const child of childrenData) {
            try {
              const childGuardians = await guardiansApi.list(child.id);
              for (const g of childGuardians) {
                // Avoid duplicates
                if (!allGuardians.find(existing => existing.id === g.id)) {
                  allGuardians.push({
                    id: g.id,
                    name: g.name || '',
                    email: g.email || '',
                    phone: g.phone || '',
                    relationship: g.relationship || '',
                    isAuthorized: g.isAuthorized !== false,
                    expiresAt: g.expiresAt,
                  });
                }
              }
            } catch (err) {
              console.error(`Failed to load guardians for child ${child.id}:`, err);
            }
          }
          setGuardians(allGuardians);
        } catch (error) {
          console.error('Failed to load guardians:', error);
          setGuardians([]);
        }
      } else {
        setChildren([]);
        setGuardians([]);
      }
    } catch (error: any) {
      console.error('Failed to load parent data:', error);
      setError(error.message || 'Failed to load parent data');
      toast.error('Error', { description: 'Failed to load parent data' });
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await groupsApi.list();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleImageUpload = async (file: File) => {
    if (!parentId) return;
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await parentsApi.uploadImage(parentId, base64data);
        setFormData(prev => ({ ...prev, photoUrl: base64data }));
        toast.success('Image uploaded successfully');
      };
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast.error('Error', { description: 'Failed to upload image' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = async () => {
    if (!parentId) return;
    setUploadingImage(true);
    try {
      await parentsApi.removeImage(parentId);
      setFormData(prev => ({ ...prev, photoUrl: null }));
      toast.success('Image removed successfully');
    } catch (error: any) {
      console.error('Failed to remove image:', error);
      toast.error('Error', { description: 'Failed to remove image' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId) return;
    
    setSaving(true);
    setError('');
    
    try {
      await parentsApi.update(parentId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        photoUrl: formData.photoUrl,
      });
      
      toast.success('Parent information updated successfully!');
      navigate(`/admin/parents/${parentId}`);
    } catch (error: any) {
      console.error('Failed to update parent:', error);
      const errorMsg = error.message || 'Failed to update parent. Please try again.';
      setError(errorMsg);
      toast.error('Error', { description: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleEditChild = (child: ChildData) => {
    setEditingChild({ ...child });
  };

  const handleSaveChild = async () => {
    if (!editingChild || !parentId) return;
    
    try {
      await childrenApi.update(editingChild.id, {
        name: editingChild.name,
        dateOfBirth: editingChild.dateOfBirth,
        gender: editingChild.gender,
        groupId: editingChild.group?.id,
      });
      
      toast.success('Child updated successfully!');
      setEditingChild(null);
      await loadParentData();
    } catch (error: any) {
      console.error('Failed to update child:', error);
      toast.error('Error', { description: error.message || 'Failed to update child' });
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child? This action cannot be undone.')) {
      return;
    }
    
    try {
      await childrenApi.delete(childId);
      toast.success('Child deleted successfully!');
      await loadParentData();
    } catch (error: any) {
      console.error('Failed to delete child:', error);
      toast.error('Error', { description: error.message || 'Failed to delete child' });
    }
  };

  const handleAddGuardian = async () => {
    if (!newGuardian.name || !newGuardian.relationship) {
      toast.error('Error', { description: 'Name and relationship are required' });
      return;
    }

    if (!parentId || children.length === 0) {
      toast.error('Error', { description: 'Cannot add guardian: No children found. Add a child first.' });
      return;
    }

    try {
      // For now, link guardian to the first child
      // In future, allow selecting which child(ren) to link
      const firstChild = children[0];
      
      await guardiansApi.create({
        childId: firstChild.id,
        name: newGuardian.name,
        email: newGuardian.email || undefined,
        phone: newGuardian.phone || undefined,
        relationship: newGuardian.relationship,
      });
      
      toast.success('Guardian added successfully!');
      setShowAddGuardian(false);
      setNewGuardian({ name: '', email: '', phone: '', relationship: '' });
      await loadParentData(); // Reload to get updated guardian list
    } catch (error: any) {
      console.error('Failed to add guardian:', error);
      toast.error('Error', { description: error.message || 'Failed to add guardian' });
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/admin/parents/${parentId}`)}
          className="btn-ghost mb-8 flex items-center gap-2 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Edit Parent Information
          </h1>
          <p className="text-base text-muted-foreground">
            Update parent details, manage children, and add guardians
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 border-l-4 border-red-500 rounded-lg shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b-2 border-border/60">
          <button
            onClick={() => setActiveTab('bio')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 -mb-0.5 ${
              activeTab === 'bio'
                ? 'text-foreground border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Bio Information
          </button>
          <button
            onClick={() => setActiveTab('children')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 -mb-0.5 ${
              activeTab === 'children'
                ? 'text-foreground border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <Baby className="w-4 h-4 inline mr-2" />
            Children ({children.length})
          </button>
          <button
            onClick={() => setActiveTab('guardians')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 -mb-0.5 ${
              activeTab === 'guardians'
                ? 'text-foreground border-foreground'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Guardians ({guardians.length})
          </button>
        </div>

        {/* Bio Information Tab */}
        {activeTab === 'bio' && (
          <form onSubmit={handleSaveParent} className="space-y-6">
            {/* Photo Upload Section */}
            <div className="border-2 border-border/80 rounded-xl p-8 bg-background shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Profile Photo</h2>
                  <p className="text-muted-foreground">Upload or update parent's profile image</p>
                </div>
              </div>
              <div className="flex justify-center">
                <ParentImageUpload
                  currentImageUrl={formData.photoUrl}
                  parentName={formData.name}
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                  disabled={uploadingImage}
                  size={150}
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="border-2 border-border/80 rounded-xl p-8 bg-background shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Basic Information</h2>
                  <p className="text-muted-foreground">Update parent's basic details</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input-field w-full pl-12"
                        placeholder="john.doe@example.com"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Must be unique within the church</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="input-field w-full pl-12"
                        placeholder="+1234567890"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Must be unique within the church</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input-field w-full"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="border-2 border-border/80 rounded-xl p-8 bg-background shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Address Information</h2>
                  <p className="text-muted-foreground">Update contact address</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">Street Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="input-field w-full"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-2 border-border/80 rounded-xl p-8 bg-background shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Emergency Contact</h2>
                  <p className="text-muted-foreground">Emergency contact information</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">Contact Phone</label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">Relationship</label>
                  <select
                    name="emergencyRelationship"
                    value={formData.emergencyRelationship}
                    onChange={handleChange}
                    className="input-field w-full"
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="border-2 border-border/80 rounded-xl p-8 bg-background shadow-lg">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="input-field w-full"
                  placeholder="Any additional notes about this parent..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/admin/parents/${parentId}`)}
                className="btn-secondary px-6"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-6 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Manage Children</h2>
                <p className="text-muted-foreground">Edit children details or add new children</p>
              </div>
              <button
                onClick={() => navigate(`/admin/parents/${parentId}/add-child`)}
                className="btn-primary flex items-center gap-2 px-6 py-3"
              >
                <Plus className="w-5 h-5" />
                Add New Child
              </button>
            </div>

            {children.length === 0 ? (
              <div className="border-2 border-dashed border-border/60 rounded-xl p-16 text-center bg-muted/20">
                <Baby className="w-16 h-16 mx-auto mb-6 text-muted-foreground/60" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No children registered</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add a child to get started
                </p>
                <button
                  onClick={() => navigate(`/admin/parents/${parentId}/add-child`)}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3"
                >
                  <Plus className="w-5 h-5" />
                  Add Child
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg"
                  >
                    {editingChild?.id === child.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">Name</label>
                            <input
                              type="text"
                              value={editingChild.name}
                              onChange={(e) => setEditingChild({ ...editingChild, name: e.target.value })}
                              className="input-field w-full"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">Date of Birth</label>
                            <input
                              type="date"
                              value={editingChild.dateOfBirth}
                              onChange={(e) => setEditingChild({ ...editingChild, dateOfBirth: e.target.value })}
                              className="input-field w-full"
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">Gender</label>
                            <select
                              value={editingChild.gender}
                              onChange={(e) => setEditingChild({ ...editingChild, gender: e.target.value })}
                              className="input-field w-full"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-foreground">Group</label>
                            <select
                              value={editingChild.group?.id || ''}
                              onChange={(e) => {
                                const selectedGroup = groups.find(g => g.id === e.target.value);
                                setEditingChild({
                                  ...editingChild,
                                  group: selectedGroup ? { id: selectedGroup.id, name: selectedGroup.name } : null,
                                });
                              }}
                              className="input-field w-full"
                            >
                              <option value="">No Group</option>
                              {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name} ({group.ageRangeMin}-{group.ageRangeMax} years)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                          <button
                            onClick={() => setEditingChild(null)}
                            className="btn-secondary px-4"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveChild}
                            className="btn-primary px-4 flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-foreground">{child.name}</h3>
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {child.registrationId}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Age:</span>
                              <p className="font-medium text-foreground">{calculateAge(child.dateOfBirth)} years</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">DOB:</span>
                              <p className="font-medium text-foreground">
                                {new Date(child.dateOfBirth).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Gender:</span>
                              <p className="font-medium text-foreground">{child.gender || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Group:</span>
                              <p className="font-medium text-foreground">{child.group?.name || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditChild(child)}
                            className="btn-secondary px-4 py-2 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteChild(child.id)}
                            className="btn-destructive px-4 py-2 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guardians Tab */}
        {activeTab === 'guardians' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Manage Guardians</h2>
                <p className="text-muted-foreground">Add secondary guardians for children</p>
              </div>
              <button
                onClick={() => setShowAddGuardian(true)}
                className="btn-primary flex items-center gap-2 px-6 py-3"
              >
                <UserPlus className="w-5 h-5" />
                Add Guardian
              </button>
            </div>

            {/* Add Guardian Form */}
            {showAddGuardian && (
              <div className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Add New Guardian</h3>
                  <button
                    onClick={() => {
                      setShowAddGuardian(false);
                      setNewGuardian({ name: '', email: '', phone: '', relationship: '' });
                    }}
                    className="btn-ghost p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newGuardian.name}
                      onChange={(e) => setNewGuardian({ ...newGuardian, name: e.target.value })}
                      className="input-field w-full"
                      placeholder="Guardian name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                      Relationship <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newGuardian.relationship}
                      onChange={(e) => setNewGuardian({ ...newGuardian, relationship: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">Select relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Aunt/Uncle">Aunt/Uncle</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">Email</label>
                    <input
                      type="email"
                      value={newGuardian.email}
                      onChange={(e) => setNewGuardian({ ...newGuardian, email: e.target.value })}
                      className="input-field w-full"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-foreground">Phone</label>
                    <input
                      type="tel"
                      value={newGuardian.phone}
                      onChange={(e) => setNewGuardian({ ...newGuardian, phone: e.target.value })}
                      className="input-field w-full"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      setShowAddGuardian(false);
                      setNewGuardian({ name: '', email: '', phone: '', relationship: '' });
                    }}
                    className="btn-secondary px-4"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddGuardian}
                    className="btn-primary px-4 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Add Guardian
                  </button>
                </div>
              </div>
            )}

            {/* Guardians List */}
            {guardians.length === 0 ? (
              <div className="border-2 border-dashed border-border/60 rounded-xl p-16 text-center bg-muted/20">
                <UserPlus className="w-16 h-16 mx-auto mb-6 text-muted-foreground/60" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No guardians added</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add secondary guardians who can pick up children
                </p>
                <button
                  onClick={() => setShowAddGuardian(true)}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Guardian
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {guardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="border-2 border-border/80 rounded-xl p-6 bg-background shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-2">{guardian.name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Relationship:</span>
                            <p className="font-medium text-foreground">{guardian.relationship}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <p className="font-medium text-foreground">{guardian.email || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <p className="font-medium text-foreground">{guardian.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <p className="font-medium text-foreground">
                              {guardian.isAuthorized ? (
                                <span className="text-green-600">Authorized</span>
                              ) : (
                                <span className="text-red-600">Not Authorized</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button className="btn-secondary px-4 py-2 flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button className="btn-destructive px-4 py-2 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

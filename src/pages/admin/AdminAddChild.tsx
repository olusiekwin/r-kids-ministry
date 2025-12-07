import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { childrenApi, groupsApi, parentsApi } from '@/services/api';
import { GroupName } from '@/types';
import { ArrowLeft, Save, User, Calendar, AlertCircle, Loader2, Users } from 'lucide-react';

export default function AdminAddChild() {
  const { parentId } = useParams<{ parentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingParent, setLoadingParent] = useState(true);
  const [error, setError] = useState('');
  const [parent, setParent] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '' as 'Male' | 'Female' | 'Other' | '',
    groupId: '',
  });

  useEffect(() => {
    if (parentId) {
      loadParentData();
      loadGroups();
    }
  }, [parentId]);

  const loadParentData = async () => {
    if (!parentId) return;
    setLoadingParent(true);
    try {
      const details = await parentsApi.getDetails(parentId);
      setParent(details);
    } catch (error: any) {
      setError(error.message || 'Failed to load parent data');
    } finally {
      setLoadingParent(false);
    }
  };

  const loadGroups = async () => {
    try {
      const groupsData = await groupsApi.list();
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Child name is required');
      return;
    }
    if (!formData.dateOfBirth) {
      setError('Date of birth is required');
      return;
    }
    const age = calculateAge(formData.dateOfBirth);
    if (age < 0 || age > 19) {
      setError('Child must be between 0 and 19 years old');
      return;
    }
    if (!formData.gender) {
      setError('Gender is required');
      return;
    }

    setLoading(true);
    try {
      await childrenApi.create({
        parentId: parentId!,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        groupId: formData.groupId || undefined,
      });
      
      alert('Child added successfully!');
      navigate(`/admin/parents/${parentId}`);
    } catch (error: any) {
      console.error('Failed to create child:', error);
      setError(error.message || 'Failed to create child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingParent) {
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
      
      <main className="flex-1 container py-8 mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/admin/parents/${parentId}`)}
          className="btn-ghost mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Parent Profile
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Child</h1>
          {parent && (
            <p className="text-muted-foreground">
              Adding child for <span className="font-semibold text-foreground">{parent.name}</span> ({parent.parentId})
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-border rounded-xl p-8 bg-background shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Child Information</h2>
                <p className="text-muted-foreground">Enter the child's details</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Child's Full Name <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium text-foreground">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className="input-field w-full pl-10"
                    />
                  </div>
                  {formData.dateOfBirth && (
                    <p className="text-xs text-muted-foreground">
                      Age: {calculateAge(formData.dateOfBirth)} years
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Group (Optional)
                </label>
                <select
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">No group assigned (will be assigned later)</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} {group.ageRangeMin && group.ageRangeMax ? `(${group.ageRangeMin}-${group.ageRangeMax} years)` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  You can assign a group now or later. Groups are assigned based on age.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/admin/parents/${parentId}`)}
              className="btn-secondary px-6 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Add Child
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}


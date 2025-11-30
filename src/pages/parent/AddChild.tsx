import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { PhotoUpload } from '@/components/PhotoUpload';
import { GroupName } from '@/types';

export default function AddChild() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '' as 'Male' | 'Female' | 'Other' | '',
    group: '' as GroupName | '',
    medicalInfo: '',
    allergies: '',
    medications: '',
    specialNeeds: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groups: { name: GroupName; ageRange: string }[] = [
    { name: 'Little Angels', ageRange: '3-5 years' },
    { name: 'Saints', ageRange: '6-9 years' },
    { name: 'Disciples', ageRange: '10-12 years' },
    { name: 'Trendsetters', ageRange: '13-19 years' },
  ];

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Child name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 3 || age > 19) {
        newErrors.dateOfBirth = 'Child must be between 3 and 19 years old';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.group) {
      newErrors.group = 'Please select a group';
    } else {
      // Validate age matches group
      const age = calculateAge(formData.dateOfBirth);
      const groupAges: Record<GroupName, { min: number; max: number }> = {
        'Little Angels': { min: 3, max: 5 },
        'Saints': { min: 6, max: 9 },
        'Disciples': { min: 10, max: 12 },
        'Trendsetters': { min: 13, max: 19 },
      };

      const selectedGroup = groupAges[formData.group];
      if (age < selectedGroup.min || age > selectedGroup.max) {
        newErrors.group = `Child age (${age}) does not match selected group age range`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app, this would:
      // 1. Upload photo if provided
      // 2. Submit child data with status: 'pending'
      // 3. Notify admin of pending approval
      
      alert('Child registration submitted! Admin will review and approve your request.');
      navigate('/parent');
    } catch (error) {
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handlePhotoUpload = (file: File) => {
    setPhotoFile(file);
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Add Child</h1>
            <p className="text-muted-foreground">Register a new child for approval</p>
          </div>
          
          <div className="bg-muted border border-border rounded-md p-5 mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Your child registration will be reviewed by an admin before approval. 
              You'll receive a notification once approved.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="border border-border rounded-md p-8 bg-background shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Basic Information</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Child's Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                    placeholder="Enter child's full name"
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().split('T')[0]}
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 19)).toISOString().split('T')[0]}
                      className="input-field w-full"
                    />
                    {errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{errors.dateOfBirth}</p>}
                    {formData.dateOfBirth && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Age: {calculateAge(formData.dateOfBirth)} years
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Gender *</label>
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
                    {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Group *</label>
                  <select
                    name="group"
                    value={formData.group}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                  >
                    <option value="">Select group</option>
                    {groups.map((group) => (
                      <option key={group.name} value={group.name}>
                        {group.name} ({group.ageRange})
                      </option>
                    ))}
                  </select>
                  {errors.group && <p className="text-sm text-destructive mt-1">{errors.group}</p>}
                  {formData.dateOfBirth && formData.group && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {calculateAge(formData.dateOfBirth) >= 3 && calculateAge(formData.dateOfBirth) <= 19 
                        ? '✓ Age matches group requirements'
                        : '⚠ Age does not match group requirements'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Child's Photo</label>
                  <PhotoUpload
                    onUpload={handlePhotoUpload}
                    maxSize={5 * 1024 * 1024}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a clear photo of your child (optional but recommended)
                  </p>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="border border-border rounded-md p-8 bg-background shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Medical Information</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Allergies</label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="List any allergies (e.g., Peanuts, Dairy)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Medications</label>
                  <input
                    type="text"
                    name="medications"
                    value={formData.medications}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="List any current medications"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Special Needs or Medical Conditions</label>
                  <textarea
                    name="specialNeeds"
                    value={formData.specialNeeds}
                    onChange={handleChange}
                    rows={4}
                    className="input-field w-full"
                    placeholder="Any special needs or medical conditions we should be aware of"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-8"
              >
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/parent')}
                className="btn-secondary px-8"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}


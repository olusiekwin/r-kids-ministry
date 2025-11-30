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
    group: '' as GroupName | '', // Suggested group based on age, admin will assign
    medicalInfo: '',
    allergies: '',
    medications: '',
    specialNeeds: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Guardians state (max 2 primary, max 2 secondary)
  const [primaryGuardians, setPrimaryGuardians] = useState<Array<{
    name: string;
    email: string;
    phone: string;
    photo?: File | null;
  }>>([{ name: '', email: '', phone: '', photo: null }]);
  
  const [secondaryGuardians, setSecondaryGuardians] = useState<Array<{
    name: string;
    email: string;
    phone: string;
    relationship: string;
    photo?: File | null;
  }>>([]);

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

    // Validate guardians
    if (primaryGuardians.length === 0 || primaryGuardians.some(g => !g.name || !g.email || !g.phone)) {
      newErrors.guardians = 'At least one primary guardian with name, email, and phone is required';
    }
    
    if (primaryGuardians.length > 2) {
      newErrors.guardians = 'Maximum 2 primary guardians allowed';
    }
    
    if (secondaryGuardians.length > 2) {
      newErrors.guardians = 'Maximum 2 secondary guardians allowed';
    }
    
    // Validate secondary guardians have required fields
    secondaryGuardians.forEach((guardian, index) => {
      if (!guardian.name || !guardian.phone || !guardian.relationship) {
        newErrors[`secondaryGuardian${index}`] = 'Secondary guardian must have name, phone, and relationship';
      }
    });

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
      // Import API
      const { childrenApi, guardiansApi } = await import('@/services/api');
      
      // 1. Create child with status: 'pending' (group will be assigned by admin)
      const childData = {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        group: formData.group as GroupName, // Suggested group, admin will reassign
        status: 'pending' as const,
        submittedBy: 'parent' as const,
        // Medical info would be stored separately
      };
      
      const child = await childrenApi.create(childData);
      
      // 2. Create primary guardians
      for (const guardian of primaryGuardians) {
        if (guardian.name && guardian.email && guardian.phone) {
          await guardiansApi.create({
            name: guardian.name,
            email: guardian.email,
            phone: guardian.phone,
            relationship: 'Primary' as const,
            childId: child.id,
          });
        }
      }
      
      // 3. Create secondary guardians
      for (const guardian of secondaryGuardians) {
        if (guardian.name && guardian.phone && guardian.relationship) {
          await guardiansApi.create({
            name: guardian.name,
            email: guardian.email || undefined,
            phone: guardian.phone,
            relationship: 'Secondary' as const,
            childId: child.id,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          });
        }
      }
      
      alert('Child and guardians registration submitted! Admin will review and approve your request.');
      navigate('/parent');
    } catch (error: any) {
      console.error('Failed to submit:', error);
      alert(error.message || 'Failed to submit. Please try again.');
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
                  <label className="block text-sm font-medium text-foreground">Suggested Group (Admin will assign final group)</label>
                  <select
                    name="group"
                    value={formData.group}
                    onChange={handleChange}
                    className="input-field w-full"
                    disabled
                  >
                    <option value="">Select group</option>
                    {groups.map((group) => {
                      const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : 0;
                      const groupAges: Record<GroupName, { min: number; max: number }> = {
                        'Little Angels': { min: 3, max: 5 },
                        'Saints': { min: 6, max: 9 },
                        'Disciples': { min: 10, max: 12 },
                        'Trendsetters': { min: 13, max: 19 },
                      };
                      const suggested = Object.entries(groupAges).find(([_, range]) => 
                        age >= range.min && age <= range.max
                      )?.[0] as GroupName | undefined;
                      
                      return (
                        <option key={group.name} value={group.name}>
                          {group.name} ({group.ageRange}) {suggested === group.name ? '← Suggested' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {formData.dateOfBirth && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Admin will assign your child to the appropriate group based on age ({calculateAge(formData.dateOfBirth)} years)
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

            {/* Guardians Information */}
            <div className="border border-border rounded-md p-8 bg-background shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Authorized Guardians</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Add up to 2 primary guardians (parents) and up to 2 secondary guardians (e.g., grandparents, aunts/uncles)
              </p>
              
              {/* Primary Guardians */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-foreground">Primary Guardians (Max 2)</h4>
                {primaryGuardians.map((guardian, index) => (
                  <div key={index} className="border border-border rounded-md p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <input
                          type="text"
                          value={guardian.name}
                          onChange={(e) => {
                            const updated = [...primaryGuardians];
                            updated[index].name = e.target.value;
                            setPrimaryGuardians(updated);
                          }}
                          className="input-field w-full"
                          placeholder="Full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <input
                          type="email"
                          value={guardian.email}
                          onChange={(e) => {
                            const updated = [...primaryGuardians];
                            updated[index].email = e.target.value;
                            setPrimaryGuardians(updated);
                          }}
                          className="input-field w-full"
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={guardian.phone}
                          onChange={(e) => {
                            const updated = [...primaryGuardians];
                            updated[index].phone = e.target.value;
                            setPrimaryGuardians(updated);
                          }}
                          className="input-field w-full"
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                    </div>
                    {primaryGuardians.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPrimaryGuardians(primaryGuardians.filter((_, i) => i !== index))}
                        className="text-sm text-destructive hover:underline"
                      >
                        Remove Guardian
                      </button>
                    )}
                  </div>
                ))}
                {primaryGuardians.length < 2 && (
                  <button
                    type="button"
                    onClick={() => setPrimaryGuardians([...primaryGuardians, { name: '', email: '', phone: '', photo: null }])}
                    className="text-sm text-primary hover:underline"
                  >
                    + Add Primary Guardian
                  </button>
                )}
              </div>

              {/* Secondary Guardians */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Secondary Guardians (Max 2, Optional)</h4>
                {secondaryGuardians.map((guardian, index) => (
                  <div key={index} className="border border-border rounded-md p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <input
                          type="text"
                          value={guardian.name}
                          onChange={(e) => {
                            const updated = [...secondaryGuardians];
                            updated[index].name = e.target.value;
                            setSecondaryGuardians(updated);
                          }}
                          className="input-field w-full"
                          placeholder="Full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Relationship *</label>
                        <input
                          type="text"
                          value={guardian.relationship}
                          onChange={(e) => {
                            const updated = [...secondaryGuardians];
                            updated[index].relationship = e.target.value;
                            setSecondaryGuardians(updated);
                          }}
                          className="input-field w-full"
                          placeholder="e.g., Grandmother, Aunt"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          value={guardian.email}
                          onChange={(e) => {
                            const updated = [...secondaryGuardians];
                            updated[index].email = e.target.value;
                            setSecondaryGuardians(updated);
                          }}
                          className="input-field w-full"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={guardian.phone}
                          onChange={(e) => {
                            const updated = [...secondaryGuardians];
                            updated[index].phone = e.target.value;
                            setSecondaryGuardians(updated);
                          }}
                          className="input-field w-full"
                          placeholder="+1234567890"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecondaryGuardians(secondaryGuardians.filter((_, i) => i !== index))}
                      className="text-sm text-destructive hover:underline"
                    >
                      Remove Guardian
                    </button>
                  </div>
                ))}
                {secondaryGuardians.length < 2 && (
                  <button
                    type="button"
                    onClick={() => setSecondaryGuardians([...secondaryGuardians, { name: '', email: '', phone: '', relationship: '', photo: null }])}
                    className="text-sm text-primary hover:underline"
                  >
                    + Add Secondary Guardian
                  </button>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Secondary guardians have temporary access (90 days) and can be renewed by admin upon request.
                </p>
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


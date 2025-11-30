import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { GroupName } from '@/types';
import { toast } from '@/components/ui/sonner';

export default function AddChildToGroup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    parentId: '',
    childName: '',
    dateOfBirth: '',
    gender: '' as 'Male' | 'Female' | 'Other' | '',
    group: '' as GroupName | '',
    reason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groups: { name: GroupName; ageRange: string }[] = [
    { name: 'Little Angels', ageRange: '3-5 years' },
    { name: 'Saints', ageRange: '6-9 years' },
    { name: 'Disciples', ageRange: '10-12 years' },
    { name: 'Trendsetters', ageRange: '13-19 years' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Child added to group!', {
        description: 'Admin will review and approve your request.',
      });
      setTimeout(() => navigate('/teacher'), 1000);
    } catch (error) {
      toast.error('Failed to submit', {
        description: 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Add Child to Group</h1>
            <p className="text-muted-foreground">Add a new child to a group (pending approval)</p>
          </div>
          
          <div className="bg-muted border border-border rounded-md p-5 mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Adding a child to a group requires admin approval. 
              This is useful for walk-ins or new families.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="border border-border rounded-md p-8 bg-background shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Child Information</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Parent ID *</label>
                  <input
                    type="text"
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                    required
                    className="input-field font-mono w-full"
                    placeholder="e.g., RS073"
                    pattern="[A-Z]{2}[0-9]{3}"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the parent's registration ID
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Child's Name *</label>
                  <input
                    type="text"
                    name="childName"
                    value={formData.childName}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                    placeholder="Enter child's full name"
                  />
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
                      className="input-field w-full"
                    />
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
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Assign to Group *</label>
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
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Reason for Adding *</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="input-field w-full"
                    placeholder="e.g., Walk-in family, New registration, Temporary assignment"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Explain why this child is being added to the group
                  </p>
                </div>
              </div>
            </div>

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
                onClick={() => navigate('/teacher')}
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

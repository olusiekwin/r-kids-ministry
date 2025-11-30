import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AdminSidebar } from '@/components/AdminSidebar';
import { parentsApi } from '@/services/api';

export default function CreateParent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await parentsApi.create({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
      });
      
      alert('Parent created successfully!');
      navigate('/admin');
    } catch (error: any) {
      console.error('Failed to create parent:', error);
      setError(error.message || 'Failed to create parent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <AdminSidebar />
      
      <main className="md:ml-64 container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold mb-2">Create Parent</h1>
            <p className="text-muted-foreground">Add a new parent account to the system</p>
          </div>
        
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="border border-border rounded-md p-8 bg-background shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Parent Information</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                      className="input-field w-full"
              />
            </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                      className="input-field w-full"
              />
            </div>
          </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
                    className="input-field w-full"
            />
          </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
                    className="input-field w-full"
            />
          </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
                    rows={3}
                    className="input-field w-full"
            />
                </div>
              </div>
          </div>

            <div className="border border-border rounded-md p-8 bg-background shadow-sm">
              <h3 className="text-lg font-semibold mb-6">Emergency Contact</h3>
            
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Contact Name</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                    className="input-field w-full"
                />
              </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                    className="input-field w-full"
                />
              </div>
            </div>
          </div>

            <div className="flex justify-center gap-4 pt-4">
              <button type="submit" disabled={loading} className="btn-primary px-8">
              {loading ? 'Creating...' : 'Create Parent'}
            </button>
              <button type="button" onClick={() => navigate('/admin')} className="btn-secondary px-8">
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

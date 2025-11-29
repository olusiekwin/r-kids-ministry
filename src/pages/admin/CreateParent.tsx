import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';

export default function CreateParent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert('Parent created successfully!');
    navigate('/admin');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      <main className="container py-6">
        <h2 className="text-xl font-medium mb-6">Create Parent</h2>
        
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="input-field"
            />
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Contact Name</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Parent'}
            </button>
            <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </main>

      <MobileNav />
    </div>
  );
}

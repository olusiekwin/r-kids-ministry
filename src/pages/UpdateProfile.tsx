import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/services/api';
import { Logo } from '@/components/Logo';
import { toast } from '@/components/ui/sonner';

export default function UpdateProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      await usersApi.updateProfile({
        name: formData.name,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });
      
      toast.success('Profile updated successfully!', {
        description: 'Your profile information has been saved',
      });
      
      // Redirect to user's dashboard after a short delay
      setTimeout(() => {
        navigate(`/${user?.role || 'login'}`, { replace: true });
      }, 1000);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/Rice farm stock video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Portal Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Portal Card */}
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size={80} className="rounded-full" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
              <p className="text-white/80 text-sm">
                Please update your profile information before proceeding.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:bg-white/30 transition-all resize-none"
                  placeholder="Enter your address"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm text-white">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="w-full bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Updating Profile...' : 'Update Profile & Continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

